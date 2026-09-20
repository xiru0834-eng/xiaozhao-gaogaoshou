import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import {
  validateSchedule,
  wallTime,
  dateKey,
} from "../src/shared/schedule-contract.ts";
import { ScheduleStore } from "../src/server/schedule-store.ts";
import { startServer } from "../src/server/http.ts";
import { writeFile } from "node:fs/promises";

const draft = () => ({
  id: randomUUID(),
  company: "示例公司",
  role: "Agent 开发",
  kind: "interview",
  round: "一面",
  date: "2026-10-05",
  time: "14:00",
  endTime: "15:00",
  zone: "Asia/Shanghai",
  status: "planned",
  location: "线上",
  url: "https://example.com/meeting",
  notes: "准备项目介绍",
  review: "",
  tasks: [{ text: "复习 RAG", done: false }],
});
test("calendar conversion handles Sydney DST, cross-day and invalid wall times", () => {
  assert.equal(
    wallTime("2026-10-05", "14:00", "Asia/Shanghai"),
    "2026-10-05T06:00:00.000Z",
  );
  assert.equal(
    dateKey("2026-10-04T15:00:00Z", "Australia/Sydney"),
    "2026-10-05",
  );
  assert.equal(
    wallTime("2026-10-05", "17:00", "Australia/Sydney"),
    "2026-10-05T06:00:00.000Z",
  );
  assert.equal(
    wallTime("2026-09-20", "16:00", "Australia/Sydney"),
    "2026-09-20T06:00:00.000Z",
  );
  assert.throws(() => wallTime("2026-10-04", "02:30", "Australia/Sydney"));
  assert.throws(() => wallTime("2026-04-05", "02:30", "Australia/Sydney"));
  assert.throws(() => wallTime("2026-02-29", "12:00", "Asia/Shanghai"));
  assert.ok(wallTime("2028-02-29", "12:00", "Asia/Shanghai"));
});

test("schedule HTTP requires token/profile and preserves application records", async () => {
  const dir = await mkdtemp(join(tmpdir(), "schedule-http-"));
  await writeFile(
    join(dir, "index.html"),
    '<meta name="app-token" content="__APP_TOKEN__">',
  );
  const app = await startServer({ port: 0, dataDir: dir, webDir: dir });
  try {
    const health = await (await fetch(app.url + "/health")).json();
    const html = await (await fetch(app.url)).text(),
      token = html.match(/content="([a-f0-9]{64})"/)![1];
    const headers = {
      "X-App-Token": token,
      "X-Profile-Id": health.profileId,
      "Content-Type": "application/json",
    };
    assert.equal((await fetch(app.url + "/api/schedules")).status, 403);
    assert.equal(
      (
        await fetch(app.url + "/api/schedules", {
          headers: { ...headers, Origin: "https://evil.test" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(app.url + "/api/schedules", {
          headers: { ...headers, "X-Profile-Id": randomUUID() },
        })
      ).status,
      409,
    );
    const before = await (await fetch(app.url + "/api/status")).json();
    const payload = {
      action: "save",
      expectedRevision: 0,
      requestId: randomUUID(),
      item: draft(),
    };
    const send = (body: unknown) =>
      fetch(app.url + "/api/schedules", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    assert.equal((await send(payload)).status, 200);
    assert.equal(
      (await send({ ...payload, requestId: randomUUID() })).status,
      409,
    );
    assert.equal(
      (
        await send({
          ...payload,
          item: { ...payload.item, url: "javascript:alert(1)" },
        })
      ).status,
      400,
    );
    assert.equal(
      (await (await fetch(app.url + "/api/schedules", { headers })).json())
        .items.length,
      1,
    );
    assert.deepEqual(
      await (await fetch(app.url + "/api/status")).json(),
      before,
    );
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
test("schedule validation rejects unsafe links, wrong duration and malformed inputs; allows unscheduled", () => {
  assert.throws(() =>
    validateSchedule({ ...draft(), url: "javascript:alert(1)" }),
  );
  assert.throws(() => validateSchedule({ ...draft(), endTime: "13:00" }));
  assert.throws(() =>
    validateSchedule({ ...draft(), date: "", time: "14:00" }),
  );
  assert.throws(() => validateSchedule({ ...draft(), status: "已投" }));
  assert.equal(
    validateSchedule({ ...draft(), date: "", time: "", endTime: "" }).start,
    null,
  );
  assert.equal(
    validateSchedule({ ...draft(), time: "", endTime: "" }).start,
    null,
  );
});
test("schedule store durable CRUD, idempotency, conflict, backup and invalid-write protection", async () => {
  const dir = await mkdtemp(join(tmpdir(), "schedule-test-"));
  let s = new ScheduleStore(join(dir, "schedules.db"));
  try {
    const item = draft(),
      request = {
        requestId: randomUUID(),
        expectedRevision: 0,
        action: "save",
        item,
      };
    s.mutate(request);
    assert.equal(s.snapshot().items.length, 1);
    s.mutate(request);
    assert.equal(s.snapshot().revision, 1);
    assert.throws(() =>
      s.mutate({
        ...request,
        requestId: randomUUID(),
        item: { ...item, company: "覆盖" },
      }),
    );
    assert.throws(() =>
      s.mutate({ ...request, item: { ...item, company: "改写重试" } }),
    );
    s.close();
    s = new ScheduleStore(join(dir, "schedules.db"));
    assert.equal(s.snapshot().items[0].company, "示例公司");
    s.mutate({
      requestId: randomUUID(),
      expectedRevision: 1,
      action: "save",
      item: { ...item, status: "completed" },
    });
    await s.backup(join(dir, "copy.db"));
    const copy = new ScheduleStore(join(dir, "copy.db"));
    assert.equal(copy.snapshot().items[0].status, "completed");
    copy.close();
    s.mutate({
      requestId: randomUUID(),
      expectedRevision: 2,
      action: "delete",
      id: item.id,
    });
    assert.equal(s.snapshot().items.length, 0);
    assert.equal(s.integrity(), "ok");
  } finally {
    s.close();
    await rm(dir, { recursive: true, force: true });
  }
});
