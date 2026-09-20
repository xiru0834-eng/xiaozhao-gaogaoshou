import { test } from "node:test";
import assert from "node:assert/strict";
import { Progress, type ProgressApi } from "../src/client/progress.ts";
import type { StatusMap } from "../src/shared/types.ts";

test("failed write keeps edits; newer edit wins; connection refresh cannot discard pending changes", async () => {
  let fail = true;
  let saved: StatusMap = {};
  const api: ProgressApi = {
    read: async () => ({}),
    write: async (batch) => {
      if (fail) throw new Error("offline");
      saved = { ...saved, ...batch };
    },
  };
  const progress = new Progress(api, () => {}, 100000);
  try {
    await progress.connect();
    progress.set("A", "已投");
    await progress.flush();
    assert.equal(progress.dirty, true);
    progress.set("A", "面试");
    await progress.connect();
    assert.equal(progress.state.A, "面试");
    fail = false;
    await progress.flush();
    assert.equal(saved.A, "面试");
    assert.equal(progress.dirty, false);
  } finally {
    progress.dispose();
  }
});
test("read completing after edit does not overwrite it", async () => {
  let release: (value: StatusMap) => void = () => {};
  let reads = 0;
  const p = new Progress(
    {
      read: () =>
        ++reads === 1
          ? Promise.resolve({ A: "未投" })
          : new Promise((done) => {
              release = done;
            }),
      write: async () => {},
    },
    () => {},
    100000,
  );
  try {
    await p.connect();
    const refresh = p.refresh();
    p.set("A", "面试");
    release({ A: "未投" });
    await refresh;
    assert.equal(p.state.A, "面试");
    assert.equal(p.dirty, true);
  } finally {
    p.dispose();
  }
});
test("editing is blocked until connected", () => {
  const p = new Progress(
    { read: async () => ({}), write: async () => {} },
    () => {},
    100000,
  );
  try {
    assert.throws(() => p.set("A", "已投"));
  } finally {
    p.dispose();
  }
});
