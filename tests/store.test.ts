import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../src/server/store.ts";
import { parseStatuses } from "../src/shared/types.ts";

test("unknown status and malformed maps are rejected", () => {
  for (const bad of [null, [], { A: "bogus" }, { "": "未投" }, { '   ': '未投' }, { A: {} }]) {
    assert.throws(() => parseStatuses(bad));
  }
});
test("SQLite statuses survive restart; backup is an independent consistent snapshot", async () => {
  const dir = await mkdtemp(join(tmpdir(), "xiaozhao-store-"));
  const path = join(dir, "qiuzhao.db");
  let store = new Store(path);
  try {
    assert.deepEqual({ ...store.statuses() }, {});
    store.save({ 测试公司: "面试", "quote';--": "无合适岗位" });
    const snapshot = join(dir, "backup.db");
    await store.backup(snapshot);
    store.close();
    store = new Store(path);
    assert.equal(store.statuses()["测试公司"], "面试");
    assert.equal(store.integrity(), "ok");
    store.save({ 测试公司: "Offer" });
    const backup = new Store(snapshot);
    try {
      assert.equal(backup.statuses()["测试公司"], "面试");
    } finally {
      backup.close();
    }
  } finally {
    store.close();
    await rm(dir, { recursive: true, force: true });
  }
});
