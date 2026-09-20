import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { STATUSES } from "../src/shared/types.ts";
import { Store } from "../src/server/store.ts";
import { importProfile } from "../src/server/profile-migration.ts";
import { acquireProfile } from "../src/server/runtime-config.ts";
import { spawn } from "node:child_process";
import { once } from "node:events";

function fixture(path: string, wal = false) {
  const db = new DatabaseSync(path);
  if (wal) db.exec("PRAGMA journal_mode=WAL");
  db.exec(
    "CREATE TABLE applications(name TEXT PRIMARY KEY,status TEXT NOT NULL,updated_at TEXT NOT NULL)",
  );
  const rows = STATUSES.map((status, i) => ({
    name: `${i}中文公司'😀`,
    status,
    updated_at: `2026-09-${11 + i} 12:34:56`,
  }));
  for (const r of rows)
    db.prepare("INSERT INTO applications VALUES (?,?,?)").run(
      r.name,
      r.status,
      r.updated_at,
    );
  return { db, rows };
}
test("all seven statuses and exact timestamps import without changing source; duplicate import refuses", async () => {
  const root = await mkdtemp(join(tmpdir(), "xiaozhao-import-"));
  try {
    const source = join(root, "old.db");
    const { db, rows } = fixture(source);
    db.close();
    const before = await readFile(source);
    const target = join(root, "new");
    const report = await importProfile(source, target);
    assert.equal(report.count, 7);
    const result = new Store(join(target, "qiuzhao.db"));
    try {
      assert.deepEqual(result.records(), rows);
      assert.equal(result.integrity(), "ok");
    } finally {
      result.close();
    }
    assert.deepEqual(await readFile(source), before);
    await assert.rejects(
      importProfile(source, target),
      /not empty|already imported/,
    );
    assert.deepEqual(await readFile(source), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("SQLite snapshot includes committed WAL rows with an open source connection", async () => {
  const root = await mkdtemp(join(tmpdir(), "xiaozhao-wal-"));
  const source = join(root, "old.db");
  const { db, rows } = fixture(source, true);
  try {
    await importProfile(source, join(root, "new"));
    const result = new Store(join(root, "new", "qiuzhao.db"));
    try {
      assert.deepEqual(result.records(), rows);
    } finally {
      result.close();
    }
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM applications").get()?.n,
      7,
    );
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
});
test("failed insertion rolls back every row and allows a verified retry", async () => {
  const root = await mkdtemp(join(tmpdir(), "xiaozhao-rollback-"));
  const source = join(root, "old.db");
  const { db } = fixture(source);
  db.close();
  const target = join(root, "new");
  const store = new Store(join(target, "qiuzhao.db"));
  store.close();
  const injected = new DatabaseSync(join(target, "qiuzhao.db"));
  injected.exec(
    "CREATE TRIGGER fail_import BEFORE INSERT ON applications WHEN NEW.status='面试' BEGIN SELECT RAISE(ABORT,'simulated disk write failure'); END",
  );
  injected.close();
  try {
    await assert.rejects(importProfile(source, target), /simulated/);
    const check = new Store(join(target, "qiuzhao.db"));
    try {
      assert.equal(check.records().length, 0);
      assert.equal(check.integrity(), "ok");
    } finally {
      check.close();
    }
    const repair = new DatabaseSync(join(target, "qiuzhao.db"));
    repair.exec("DROP TRIGGER fail_import");
    repair.close();
    assert.equal((await importProfile(source, target)).count, 7);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("bad source, active target and future schema are refused without overwriting", async () => {
  const root = await mkdtemp(join(tmpdir(), "xiaozhao-reject-"));
  try {
    const bad = join(root, "bad.db");
    await writeFile(bad, "not sqlite");
    await assert.rejects(importProfile(bad, join(root, "new")));
    const active = acquireProfile(join(root, "active"));
    try {
      await assert.rejects(
        importProfile(bad, active.dataDir),
        /already in use/,
      );
    } finally {
      active.close();
    }
    const future = join(root, "future.db");
    const db = new DatabaseSync(future);
    db.exec("PRAGMA user_version=99");
    db.close();
    const bytes = await readFile(future);
    assert.throws(() => new Store(future), /version/);
    assert.deepEqual(await readFile(future), bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test(
  "killing the real importer mid-transaction leaves no partial progress or receipt",
  { timeout: 15000 },
  async (t) => {
    const root = await mkdtemp(join(tmpdir(), "xiaozhao-import-crash-"));
    const source = join(root, "old.db"),
      target = join(root, "new");
    const { db, rows } = fixture(source);
    db.close();
    const original = await readFile(source);
    const moduleUrl = new URL(
      "../src/server/profile-migration.ts",
      import.meta.url,
    ).href;
    // Test-only fault injection pauses after the third actual INSERT, before COMMIT.
    const code = `import {DatabaseSync} from 'node:sqlite'; import {writeSync} from 'node:fs';
    import {importProfile} from ${JSON.stringify(moduleUrl)};
    const prepare=DatabaseSync.prototype.prepare;let count=0;
    DatabaseSync.prototype.prepare=function(sql){const statement=prepare.call(this,sql);if(sql!=='INSERT INTO applications VALUES (?,?,?)')return statement;
      return new Proxy(statement,{get(target,key){if(key==='run')return (...args)=>{const result=target.run(...args);if(++count===3){writeSync(1,'MID-IMPORT');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);}return result;};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});};
    await importProfile(${JSON.stringify(source)},${JSON.stringify(target)});`;
    const child = spawn(
      process.execPath,
      ["--experimental-strip-types", "--input-type=module", "-e", code],
      { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
    );
    try {
      const [chunk] = await once(child.stdout!, "data", { signal: t.signal });
      assert.equal(String(chunk), "MID-IMPORT");
      const exited = once(child, "exit");
      child.kill("SIGKILL");
      await exited;
      const recovered = new Store(join(target, "qiuzhao.db"));
      try {
        assert.deepEqual(recovered.records(), []);
        recovered.assertImportable();
        assert.equal(recovered.integrity(), "ok");
      } finally {
        recovered.close();
      }
      assert.deepEqual(await readFile(source), original);
      assert.equal((await importProfile(source, target)).count, 7);
      const complete = new Store(join(target, "qiuzhao.db"));
      try {
        assert.deepEqual(complete.records(), rows);
      } finally {
        complete.close();
      }
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = once(child, "exit");
        child.kill();
        await exited;
      }
      await rm(root, { recursive: true, force: true });
    }
  },
);
