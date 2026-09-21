import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  prepareTaskMail,
  validateMailTasks,
} from "../src/server/mail-task-analysis.ts";
import { MailTaskService } from "../src/server/mail-task-service.ts";
import { MailStore } from "../src/server/mail-store.ts";
import { ScheduleStore } from "../src/server/schedule-store.ts";
import { emptyTaskDraft } from "../src/shared/recruitment-task-contract.ts";
const message = {
  key: "fixture",
  subject: "示例公司面试与测评",
  sender: "hr@example.test",
  receivedAt: "2026-09-21T00:00:00Z",
  text: "示例公司：请在2026-10-02前预约面试。测评于2026-10-03开放，2026-10-07截止，限时60分钟。",
  attachment: false,
};
const answer = () => ({
  version: 2,
  actions: [
    {
      mutation: "create",
      draft: {
        ...emptyTaskDraft(),
        title: "预约面试",
        company: "示例公司",
        action: "book",
        timing: {
          mode: "deadline",
          due: { precision: "date", date: "2026-10-02", zone: null },
          boundary: "unspecified",
        },
      },
      linkRef: null,
      evidence: [
        { field: "company", quote: "示例公司" },
        { field: "timing", quote: "2026-10-02前预约面试" },
      ],
    },
    {
      mutation: "create",
      draft: {
        ...emptyTaskDraft(),
        title: "完成测评",
        company: "示例公司",
        kind: "assessment",
        action: "complete",
        timing: {
          mode: "window",
          opens: { precision: "date", date: "2026-10-03", zone: null },
          closes: { precision: "date", date: "2026-10-07", zone: null },
          durationMinutes: 60,
          cutoffRule: "unknown",
        },
      },
      linkRef: null,
      evidence: [
        { field: "company", quote: "示例公司" },
        {
          field: "timing",
          quote: "测评于2026-10-03开放，2026-10-07截止，限时60分钟",
        },
      ],
    },
  ],
});
const secrets = {
  protect: async (s: string) => Buffer.from(s).toString("base64"),
  unprotect: async (s: string) => Buffer.from(s, "base64").toString(),
};
test("multi-action parser keeps deadlines, assessments, literal evidence and removes secret URLs", () => {
  const prepared = prepareTaskMail({
    ...message,
    text:
      message.text +
      " 登录 https://example.test/exam?token=secret-value 邮箱 person@example.test 手机 13912345678",
  });
  assert.ok(!prepared.prompt.includes("secret-value"));
  assert.ok(!prepared.prompt.includes("person@example.test"));
  assert.ok(!prepared.prompt.includes("13912345678"));
  const actions = validateMailTasks(JSON.stringify(answer()), prepared);
  assert.equal(actions.length, 2);
  assert.equal(actions[1].draft.kind, "assessment");
  assert.equal(actions[0].draft.timing.mode, "deadline");
  const invalid = answer();
  invalid.actions[0].evidence[0].quote = "凭空编造";
  assert.throws(() => validateMailTasks(JSON.stringify(invalid), prepared));
  const unsafe = answer();
  unsafe.actions[0].draft.url = "https://evil.test";
  assert.throws(() => validateMailTasks(JSON.stringify(unsafe), prepared));
  const tooMany = { version: 2, actions: Array(9).fill(answer().actions[0]) };
  assert.throws(() => validateMailTasks(JSON.stringify(tooMany), prepared));
  assert.throws(() => validateMailTasks("not-json", prepared));
  assert.deepEqual(
    validateMailTasks('{"version":2,"actions":[]}', prepared),
    [],
  );
});
test("mail tasks require consent, support partial confirmation and atomic idempotent recovery", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mail-tasks-")),
    mail = new MailStore(join(dir, "mail.db"), secrets),
    schedule = new ScheduleStore(join(dir, "schedules.db"));
  let calls = 0;
  const model = {
    settings: {
      read: async () => ({
        revision: 1,
        config: { baseUrl: "https://fixture.test/v1" },
      }),
    },
    analyzeMail: async () => {
      calls++;
      return { text: JSON.stringify(answer()) };
    },
  };
  const service = new MailTaskService(
    mail,
    schedule.recruitment,
    model as never,
  );
  try {
    const id = await mail.ingest("manual", message);
    await assert.rejects(service.analyze(id), /授权/);
    assert.equal(calls, 0);
    mail.consent("https://fixture.test/v1", true, false);
    await service.analyze(id);
    const analysis = mail.taskAnalysis(id)!;
    assert.equal(analysis.actions.length, 2);
    assert.equal(schedule.recruitment.all().length, 0);
    const a = analysis.actions[0],
      b = analysis.actions[1];
    const request = {
      requestId: randomUUID(),
      mailId: id,
      analysisRevision: analysis.revision,
      sourceVersion: analysis.sourceVersion,
      decisions: [{ actionId: a.id, mode: "create", draft: a.draft }],
    };
    const result = await service.confirm(request);
    assert.equal(result.items.length, 1);
    assert.equal(mail.get(id).state, "review");
    assert.equal(mail.taskAnalysis(id)!.actions[0].state, "confirmed");
    await service.confirm(request);
    assert.equal(schedule.recruitment.all().length, 1);
    await assert.rejects(
      service.confirm({ ...request, requestId: randomUUID() }),
      /已经处理/,
    );
    await assert.rejects(service.analyze(id), /已确认/);
    const bad = {
      ...request,
      requestId: randomUUID(),
      decisions: [
        { actionId: b.id, mode: "create", draft: b.draft },
        { actionId: b.id, mode: "create", draft: b.draft },
      ],
    };
    await assert.rejects(service.confirm(bad));
    assert.equal(schedule.recruitment.all().length, 1);
    const final = {
      ...request,
      requestId: randomUUID(),
      decisions: [{ actionId: b.id, mode: "create", draft: b.draft }],
    };
    const ack = mail.finishTaskBatch.bind(mail);
    mail.finishTaskBatch = () => {
      throw Error("simulated acknowledgement crash");
    };
    await assert.rejects(service.confirm(final));
    assert.equal(schedule.recruitment.all().length, 2);
    const task = schedule.recruitment
      .all()
      .find((t) => t.kind === "assessment")!;
    schedule.recruitment.commit({
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
    mail.finishTaskBatch = ack;
    service.recover();
    assert.equal(mail.get(id).state, "confirmed");
    assert.equal(schedule.recruitment.get(task.id).state, "completed");
    assert.equal(schedule.snapshot().items.length, 0);
    assert.equal(mail.integrity(), "ok");
    assert.equal(schedule.recruitment.sources(task.id).length, 1);
  } finally {
    service.close();
    mail.close();
    schedule.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("change notifications require explicit targets and revisions; link preserves content; cancellation is audited", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mail-tasks-change-")),
    mail = new MailStore(join(dir, "mail.db"), secrets),
    schedule = new ScheduleStore(join(dir, "schedules.db"));
  const service = new MailTaskService(mail, schedule.recruitment, {} as never);
  try {
    const id = await mail.ingest("manual", message),
      source = prepareTaskMail(message),
      draft = validateMailTasks(JSON.stringify(answer()), source)[0].draft;
    const task = schedule.recruitment.commit({
      requestId: randomUUID(),
      operations: [{ action: "create", draft }],
    }).items[0];
    let analysis = mail.saveTaskAnalysis(
      id,
      source.sourceVersion,
      [
        {
          mutation: "update",
          draft: { ...draft, title: "改期后的预约" },
          evidence: [],
        },
      ],
      "manual",
    );
    const batch = (mode: string, extra: Record<string, unknown> = {}) => ({
      requestId: randomUUID(),
      mailId: id,
      analysisRevision: analysis.revision,
      sourceVersion: analysis.sourceVersion,
      decisions: [{ actionId: analysis.actions[0].id, mode, ...extra }],
    });
    await assert.rejects(service.confirm(batch("create", { draft })), /原任务/);
    await assert.rejects(
      service.confirm(
        batch("edit", { draft, targetId: task.id, expectedRevision: 99 }),
      ),
      /变化/,
    );
    await assert.rejects(
      service.confirm({
        ...batch("edit", { draft, targetId: task.id, expectedRevision: 1 }),
        sourceVersion: "stale",
      }),
      /版本/,
    );
    assert.equal(schedule.recruitment.get(task.id).revision, 1);
    await service.confirm(
      batch("edit", {
        draft: { ...draft, title: "核对后的改期" },
        targetId: task.id,
        expectedRevision: 1,
      }),
    );
    assert.equal(schedule.recruitment.get(task.id).title, "核对后的改期");
    const id2 = await mail.ingest("manual", {
      ...message,
      key: "cancellation",
    });
    const a2 = mail.saveTaskAnalysis(
      id2,
      prepareTaskMail({ ...message, key: "cancellation" }).sourceVersion,
      [{ mutation: "cancel", draft, evidence: [] }],
      "manual",
    );
    await service.confirm({
      requestId: randomUUID(),
      mailId: id2,
      analysisRevision: 1,
      sourceVersion: a2.sourceVersion,
      decisions: [
        {
          actionId: a2.actions[0].id,
          mode: "cancel",
          targetId: task.id,
          expectedRevision: 2,
        },
      ],
    });
    assert.equal(schedule.recruitment.get(task.id).state, "cancelled");
    assert.equal(schedule.recruitment.history(task.id).length, 3);
    const id3 = await mail.ingest("manual", { ...message, key: "duplicate" }),
      a3 = mail.saveTaskAnalysis(
        id3,
        prepareTaskMail({ ...message, key: "duplicate" }).sourceVersion,
        [{ mutation: "create", draft, evidence: [] }],
        "manual",
      );
    await service.confirm({
      requestId: randomUUID(),
      mailId: id3,
      analysisRevision: 1,
      sourceVersion: a3.sourceVersion,
      decisions: [
        {
          actionId: a3.actions[0].id,
          mode: "link",
          targetId: task.id,
          expectedRevision: 3,
        },
      ],
    });
    assert.equal(schedule.recruitment.all().length, 1);
    assert.equal(schedule.recruitment.get(task.id).state, "cancelled");
    assert.equal(schedule.recruitment.get(task.id).title, "核对后的改期");
    assert.equal(schedule.recruitment.sources(task.id).length, 3);
  } finally {
    service.close();
    mail.close();
    schedule.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("concurrent confirmations replay one receipt; duplicate batch items and reanalysis revisions cannot commit", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mail-tasks-concurrency-")),
    mail = new MailStore(join(dir, "mail.db"), secrets),
    schedule = new ScheduleStore(join(dir, "schedules.db"));
  const service = new MailTaskService(mail, schedule.recruitment, {} as never);
  try {
    const id = await mail.ingest("manual", message),
      prepared = prepareTaskMail(message),
      items = validateMailTasks(JSON.stringify(answer()), prepared);
    const a = mail.saveTaskAnalysis(
      id,
      prepared.sourceVersion,
      [items[0], items[0]],
      "manual",
    );
    const batch = {
      requestId: randomUUID(),
      mailId: id,
      analysisRevision: a.revision,
      sourceVersion: a.sourceVersion,
      decisions: a.actions.map((i) => ({
        actionId: i.id,
        mode: "create",
        draft: i.draft,
      })),
    };
    await assert.rejects(service.confirm(batch), /重复事项/);
    assert.equal(schedule.recruitment.all().length, 0);
    const a2 = mail.saveTaskAnalysis(
      id,
      prepared.sourceVersion,
      items,
      "manual",
    );
    await assert.rejects(
      service.confirm({ ...batch, requestId: randomUUID() }),
      /版本/,
    );
    const request = {
      ...batch,
      requestId: randomUUID(),
      analysisRevision: a2.revision,
      decisions: [
        {
          actionId: a2.actions[0].id,
          mode: "create",
          draft: a2.actions[0].draft,
        },
      ],
    };
    const [first, second] = await Promise.all([
      service.confirm(request),
      service.confirm(request),
    ]);
    assert.equal(first.items[0].id, second.items[0].id);
    assert.equal(schedule.recruitment.all().length, 1);
    mail.ignoreTask(id, a2.actions[1].id, a2.revision);
    assert.equal(mail.get(id).state, "confirmed");
  } finally {
    service.close();
    mail.close();
    schedule.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("analysis lock is acquired before awaiting settings; invalid and truncated output do not create tasks", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mail-tasks-lock-")),
    mail = new MailStore(join(dir, "mail.db"), secrets),
    schedule = new ScheduleStore(join(dir, "schedules.db"));
  let release!: () => void,
    calls = 0,
    output = { text: '{"version":2,"actions":[]}', truncated: true };
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const model = {
    settings: {
      read: async () => {
        await gate;
        return { revision: 1, config: { baseUrl: "https://fixture.test/v1" } };
      },
    },
    analyzeMail: async () => {
      calls++;
      return output;
    },
  };
  const service = new MailTaskService(
    mail,
    schedule.recruitment,
    model as never,
  );
  try {
    const id = await mail.ingest("manual", message);
    mail.consent("https://fixture.test/v1", true, false);
    const first = service.analyze(id);
    await assert.rejects(service.analyze(id), /正在分析/);
    release();
    await assert.rejects(first, /截断/);
    assert.equal(calls, 1);
    assert.equal(mail.taskAnalysis(id), null);
    assert.equal(schedule.recruitment.all().length, 0);
    output = { text: "not-json", truncated: false };
    await assert.rejects(service.analyze(id), /JSON/);
    assert.equal(mail.get(id).state, "failed");
    assert.equal(schedule.recruitment.all().length, 0);
  } finally {
    release();
    service.close();
    mail.close();
    schedule.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("mail v1 upgrade snapshots before migration, keeps legacy rows, and refuses newer schemas", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mail-tasks-migration-")),
    path = join(dir, "mail.db");
  let mail: MailStore | null = new MailStore(path, secrets);
  try {
    const id = await mail.ingest("manual", message);
    mail.consent("https://fixture.test/v1", false, false);
    mail.close();
    mail = null;
    const old = new DatabaseSync(path);
    old.exec(
      "DROP TABLE task_batches; DROP TABLE task_analyses; PRAGMA user_version=1;",
    );
    const before = old.prepare("SELECT * FROM mail").all();
    old.close();
    mail = new MailStore(path, secrets);
    assert.equal(mail.get(id).subject, message.subject);
    assert.equal(mail.preferences().enabled, false);
    mail.close();
    mail = null;
    const check = new DatabaseSync(path);
    try {
      assert.deepEqual(check.prepare("SELECT * FROM mail").all(), before);
      assert.equal(check.prepare("PRAGMA user_version").get()!.user_version, 2);
      assert.equal(
        check.prepare("PRAGMA integrity_check").get()!.integrity_check,
        "ok",
      );
    } finally {
      check.close();
    }
    const backups = (await readdir(dir)).filter((n) => n.includes(".pre-v2-"));
    assert.equal(backups.length, 1);
    const backup = new DatabaseSync(join(dir, backups[0]), { readOnly: true });
    try {
      assert.equal(
        backup.prepare("PRAGMA user_version").get()!.user_version,
        1,
      );
      assert.deepEqual(backup.prepare("SELECT * FROM mail").all(), before);
    } finally {
      backup.close();
    }
    const future = new DatabaseSync(path);
    future.exec("PRAGMA user_version=99");
    future.close();
    assert.throws(() => new MailStore(path, secrets), /更高版本/);
  } finally {
    mail?.close();
    await rm(dir, { recursive: true, force: true });
  }
});
