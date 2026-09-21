import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { ScheduleStore } from "../src/server/schedule-store.ts";
import { emptyTaskDraft } from "../src/shared/recruitment-task-contract.ts";
const draft = () => ({ ...emptyTaskDraft(), title: "预约一面" });

test("task commands persist, replay once, protect revisions and preserve legacy schedules", () => {
  const dir = mkdtempSync(join(tmpdir(), "task-store-")),
    path = join(dir, "schedules.db");
  let s = new ScheduleStore(path);
  try {
    const before = s.snapshot();
    const input = {
      requestId: randomUUID(),
      operations: [{ action: "create", draft: draft() }],
    };
    const result = s.recruitment.commit(input),
      task = result.items[0];
    assert.equal(task.state, "pending");
    assert.equal(task.revision, 1);
    assert.deepEqual(s.recruitment.commit(input), result);
    assert.throws(
      () =>
        s.recruitment.commit({
          ...input,
          operations: [
            { action: "create", draft: { ...draft(), title: "不同内容" } },
          ],
        }),
      /重试/,
    );
    s.recruitment.commit({
      requestId: randomUUID(),
      operations: [
        {
          action: "state",
          id: task.id,
          expectedRevision: 1,
          state: "completed",
        },
      ],
    });
    assert.throws(
      () =>
        s.recruitment.commit({
          requestId: randomUUID(),
          operations: [
            {
              action: "edit",
              id: task.id,
              expectedRevision: 1,
              draft: draft(),
            },
          ],
        }),
      /更新/,
    );
    s.recruitment.commit(input);
    assert.equal(s.recruitment.get(task.id).state, "completed");
    assert.deepEqual(s.snapshot(), before);
    assert.equal(s.integrity(), "ok");
    s.close();
    s = new ScheduleStore(path);
    assert.equal(s.recruitment.get(task.id).revision, 2);
    s.recruitment.commit({
      requestId: randomUUID(),
      operations: [{ action: "delete", id: task.id, expectedRevision: 2 }],
    });
    assert.equal(s.recruitment.list().items.length, 0);
    s.recruitment.commit({
      requestId: randomUUID(),
      operations: [{ action: "restore", id: task.id, expectedRevision: 3 }],
    });
    assert.equal(s.recruitment.list().items.length, 1);
    assert.equal(s.recruitment.history(task.id).length, 4);
  } finally {
    s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("batch is atomic, stable source identity prevents duplicates across different requests", () => {
  const dir = mkdtempSync(join(tmpdir(), "task-batch-")),
    s = new ScheduleStore(join(dir, "schedules.db"));
  try {
    const source = {
      actionId: randomUUID(),
      mailId: randomUUID(),
      analysisRevision: 1,
      sourceVersion: "abc",
      evidence: [{ field: "title", quote: "预约一面" }],
    };
    const op = { action: "create", draft: draft(), source };
    s.recruitment.commit({ requestId: randomUUID(), operations: [op] }, true);
    assert.throws(
      () =>
        s.recruitment.commit(
          { requestId: randomUUID(), operations: [op] },
          true,
        ),
      /确认/,
    );
    assert.throws(() =>
      s.recruitment.commit({
        requestId: randomUUID(),
        operations: [
          { action: "create", draft: draft() },
          {
            action: "edit",
            id: randomUUID(),
            expectedRevision: 1,
            draft: draft(),
          },
        ],
      }),
    );
    assert.equal(s.recruitment.list().total, 1);
    assert.throws(
      () => s.recruitment.commit({ requestId: randomUUID(), operations: [op] }),
      /来源/,
    );
  } finally {
    s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("v1 migration backs up before changing schema and preserves old event bytes", () => {
  const dir = mkdtempSync(join(tmpdir(), "task-migrate-")),
    path = join(dir, "schedules.db");
  const db = new DatabaseSync(path);
  db.exec(
    "CREATE TABLE events(id TEXT PRIMARY KEY,data TEXT NOT NULL); PRAGMA user_version=1;",
  );
  db.prepare("INSERT INTO events VALUES(?,?)").run(
    "legacy",
    '{"untouched": true}',
  );
  db.close();
  const s = new ScheduleStore(path);
  try {
    const check = new DatabaseSync(path, { readOnly: true });
    try {
      assert.equal(
        check.prepare("SELECT data FROM events").get()!.data,
        '{"untouched": true}',
      );
      assert.equal(check.prepare("PRAGMA user_version").get()!.user_version, 2);
    } finally {
      check.close();
    }
    assert.ok(
      readdirSync(dir).some((n) => n.startsWith("schedules.db.pre-v2-")),
    );
  } finally {
    s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
