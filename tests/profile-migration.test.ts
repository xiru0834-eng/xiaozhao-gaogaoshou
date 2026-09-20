import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { STATUSES } from '../src/shared/types.ts';
import { Store } from '../src/server/store.ts';
import { importProfile } from '../src/server/profile-migration.ts';
import { acquireProfile } from '../src/server/runtime-config.ts';

function fixture(path: string, wal = false) {
  const db = new DatabaseSync(path);
  if (wal) db.exec('PRAGMA journal_mode=WAL');
  db.exec('CREATE TABLE applications(name TEXT PRIMARY KEY,status TEXT NOT NULL,updated_at TEXT NOT NULL)');
  const rows = STATUSES.map((status, i) => ({name: `${i}中文公司'😀`, status, updated_at: `2026-09-${11 + i} 12:34:56`}));
  for (const r of rows) db.prepare('INSERT INTO applications VALUES (?,?,?)').run(r.name,r.status,r.updated_at);
  return { db, rows };
}
test('all seven statuses and exact timestamps import without changing source; duplicate import refuses', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xiaozhao-import-'));
  try {
    const source = join(root,'old.db'); const {db,rows} = fixture(source); db.close();
    const before = await readFile(source); const target = join(root,'new');
    const report = await importProfile(source,target); assert.equal(report.count,7);
    const result = new Store(join(target,'qiuzhao.db'));
    try { assert.deepEqual(result.records(),rows); assert.equal(result.integrity(),'ok'); } finally { result.close(); }
    assert.deepEqual(await readFile(source),before);
    await assert.rejects(importProfile(source,target), /not empty|already imported/);
    assert.deepEqual(await readFile(source),before);
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('SQLite snapshot includes committed WAL rows with an open source connection', async () => {
  const root = await mkdtemp(join(tmpdir(),'xiaozhao-wal-'));
  const source = join(root,'old.db'); const {db,rows} = fixture(source,true);
  try {
    await importProfile(source,join(root,'new'));
    const result = new Store(join(root,'new','qiuzhao.db'));
    try { assert.deepEqual(result.records(),rows); } finally { result.close(); }
    assert.equal(db.prepare('SELECT count(*) AS n FROM applications').get()?.n,7);
  } finally { db.close(); await rm(root,{recursive:true,force:true}); }
});
test('failed insertion rolls back every row and allows a verified retry', async () => {
  const root = await mkdtemp(join(tmpdir(),'xiaozhao-rollback-')); const source = join(root,'old.db');
  const {db} = fixture(source); db.close(); const target=join(root,'new');
  const store = new Store(join(target,'qiuzhao.db')); store.close();
  const injected = new DatabaseSync(join(target,'qiuzhao.db'));
  injected.exec("CREATE TRIGGER fail_import BEFORE INSERT ON applications WHEN NEW.status='面试' BEGIN SELECT RAISE(ABORT,'simulated disk write failure'); END"); injected.close();
  try {
    await assert.rejects(importProfile(source,target), /simulated/);
    const check=new Store(join(target,'qiuzhao.db'));
    try { assert.equal(check.records().length,0); assert.equal(check.integrity(),'ok'); } finally { check.close(); }
    const repair=new DatabaseSync(join(target,'qiuzhao.db')); repair.exec('DROP TRIGGER fail_import'); repair.close();
    assert.equal((await importProfile(source,target)).count,7);
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('bad source, active target and future schema are refused without overwriting', async () => {
  const root = await mkdtemp(join(tmpdir(),'xiaozhao-reject-'));
  try {
    const bad=join(root,'bad.db'); await writeFile(bad,'not sqlite');
    await assert.rejects(importProfile(bad,join(root,'new')));
    const active=acquireProfile(join(root,'active'));
    try { await assert.rejects(importProfile(bad,active.dataDir), /already in use/); } finally { active.close(); }
    const future=join(root,'future.db'); const db=new DatabaseSync(future); db.exec('PRAGMA user_version=99'); db.close();
    const bytes=await readFile(future); assert.throws(()=>new Store(future), /version/);
    assert.deepEqual(await readFile(future),bytes);
  } finally { await rm(root,{recursive:true,force:true}); }
});
