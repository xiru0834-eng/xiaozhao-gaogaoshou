import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { get } from "node:http";
import { startServer } from "../src/server/http.ts";

test(
  "startup failure releases the database handle on Windows",
  { skip: process.platform !== "win32" },
  async () => {
    const dir = await mkdtemp(join(tmpdir(), "xiaozhao-startup-"));
    await writeFile(join(dir, "backups"), "not a directory");
    try {
      await assert.rejects(startServer({ dataDir: dir, webDir: dir, port: 0 }));
      // Windows refuses to remove a database whose failed startup still holds it open.
      await rm(join(dir, "qiuzhao.db"));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);

test("HTTP status contract, guards, catalog, backup and static isolation", async () => {
  const dir = await mkdtemp(join(tmpdir(), "xiaozhao-http-"));
  await mkdir(join(dir, "web"));
  await writeFile(
    join(dir, "web", "index.html"),
    '<meta name="app-token" content="__APP_TOKEN__">',
  );
  const app = await startServer({
    dataDir: dir,
    webDir: join(dir, "web"),
    port: 0,
  });
  try {
    const page = await (await fetch(app.url)).text();
    const token = page.match(/content="([a-f0-9]{64})"/)?.[1];
    assert.ok(token);
    const write = (headers: Record<string, string>, updates: unknown) =>
      fetch(app.url + "/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ updates }),
      });
    assert.equal((await write({}, { A: "已投" })).status, 403);
    assert.equal(
      (await write({ "X-App-Token": token, Origin: "https://example.org" }, {}))
        .status,
      403,
    );
    const headers = { "X-App-Token": token, Origin: app.url };
    assert.equal((await write(headers, { A: "bad" })).status, 400);
    assert.equal((await write(headers, { A: "已投" })).status, 200);
    assert.deepEqual(await (await fetch(app.url + "/api/status")).json(), {
      statuses: { A: "已投" },
    });
    // fetch rewrites Host; use HTTP directly to send the adversarial header.
    const invalidHost = await new Promise<number | undefined>(
      (done, reject) => {
        get(
          app.url + "/api/status",
          { headers: { Host: "attacker.example" } },
          (res) => {
            res.resume();
            res.on("end", () => done(res.statusCode));
          },
        ).on("error", reject);
      },
    );
    assert.equal(invalidHost, 403);
    assert.equal((await fetch(app.url + "/qiuzhao.db")).status, 404);
    assert.equal((await fetch(app.url + "/api/catalog")).status, 200);
    const backup = await fetch(app.url + "/api/backup");
    assert.match(
      Buffer.from(await backup.arrayBuffer())
        .subarray(0, 15)
        .toString(),
      /SQLite format 3/,
    );
    assert.equal(
      (await fetch(app.url + "/health")).headers.get("x-frame-options"),
      "DENY",
    );
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
