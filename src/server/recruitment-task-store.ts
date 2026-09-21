import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import {
  TaskError,
  object,
  fields,
  text,
  uuid,
  choice,
  validateTaskDraft,
  TASK_STATES,
  type RecruitmentTask,
  type TaskDraft,
  type TaskState,
} from "../shared/recruitment-task-contract.ts";

export const TASK_SCHEMA = `
CREATE TABLE IF NOT EXISTS recruitment_tasks(id TEXT PRIMARY KEY,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS task_sources(actionId TEXT PRIMARY KEY,taskId TEXT NOT NULL,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS task_history(seq INTEGER PRIMARY KEY AUTOINCREMENT,taskId TEXT NOT NULL,data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS task_history_target ON task_history(taskId,seq);
CREATE TABLE IF NOT EXISTS task_receipts(id TEXT PRIMARY KEY,hash TEXT NOT NULL,result TEXT NOT NULL);`;
export function schemaBackup(db: DatabaseSync, path: string, version: number) {
  const target = `${path}.pre-v${version}-${randomUUID()}.db`;
  db.prepare("VACUUM INTO ?").run(target);
  const check = new DatabaseSync(target, { readOnly: true });
  try {
    if (check.prepare("PRAGMA integrity_check").get()!.integrity_check !== "ok")
      throw new Error("Migration backup integrity failure");
  } finally {
    check.close();
  }
}
export function digest(value: unknown): string {
  const stable = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(stable)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, x]) => [k, stable(x)]),
          )
        : v;
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex");
}
export interface TaskSource {
  actionId: string;
  mailId: string;
  analysisRevision: number;
  sourceVersion: string;
  evidence: { field: string; quote: string }[];
}
interface Operation {
  action: "create" | "edit" | "state" | "delete" | "restore" | "link";
  id?: string;
  expectedRevision?: number;
  draft?: TaskDraft;
  state?: TaskState;
  source?: TaskSource;
}
export interface TaskCommit {
  requestId: string;
  items: RecruitmentTask[];
}

export class RecruitmentTaskStore {
  private db: DatabaseSync;
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  get(id: string): RecruitmentTask {
    uuid(id);
    const row = this.db
      .prepare("SELECT data FROM recruitment_tasks WHERE id=?")
      .get(id);
    if (!row) throw new TaskError("NOT_FOUND", "任务不存在。", 404);
    return JSON.parse(String(row.data));
  }
  list(
    query: {
      state?: string;
      kind?: string;
      q?: string;
      cursor?: number;
      limit?: number;
      deleted?: boolean;
    } = {},
  ) {
    const cursor = query.cursor ?? 0,
      limit = query.limit ?? 50;
    if (
      !Number.isSafeInteger(cursor) ||
      cursor < 0 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      throw new TaskError("VALIDATION", "分页参数无效。");
    const items = (
      this.db
        .prepare("SELECT data FROM recruitment_tasks ORDER BY id")
        .all()
        .map((r) => JSON.parse(String(r.data))) as RecruitmentTask[]
    ).filter(
      (t) =>
        Boolean(t.deletedAt) === Boolean(query.deleted) &&
        (!query.state || t.state === query.state) &&
        (!query.kind || t.kind === query.kind) &&
        (!query.q ||
          [t.title, t.company, t.role, t.round]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query.q.toLocaleLowerCase())),
    );
    return {
      items: items.slice(cursor, cursor + limit),
      total: items.length,
      nextCursor: cursor + limit < items.length ? cursor + limit : null,
    };
  }
  all(): RecruitmentTask[] {
    return this.db
      .prepare("SELECT data FROM recruitment_tasks ORDER BY id")
      .all()
      .map((r) => JSON.parse(String(r.data)))
      .filter((t) => !t.deletedAt);
  }
  history(id: string) {
    this.get(id);
    return this.db
      .prepare(
        "SELECT data FROM task_history WHERE taskId=? ORDER BY seq DESC LIMIT 100",
      )
      .all(id)
      .map((r) => JSON.parse(String(r.data)));
  }
  sources(id: string): TaskSource[] {
    this.get(id);
    return this.db
      .prepare("SELECT data FROM task_sources WHERE taskId=?")
      .all(id)
      .map((r) => JSON.parse(String(r.data)));
  }
  receipt(id: string): TaskCommit | null {
    const r = this.db
      .prepare("SELECT result FROM task_receipts WHERE id=?")
      .get(uuid(id));
    return r ? JSON.parse(String(r.result)) : null;
  }
  commit(value: unknown, trustedSource = false): TaskCommit {
    const v = object(value);
    fields(v, ["requestId", "operations"]);
    const requestId = uuid(v.requestId);
    if (
      !Array.isArray(v.operations) ||
      !v.operations.length ||
      v.operations.length > 8
    )
      throw new TaskError("VALIDATION", "一次可保存 1～8 项操作。");
    const ops = v.operations.map((raw) => this.operation(raw, trustedSource));
    const targets = ops.filter((o) => o.id).map((o) => o.id);
    if (new Set(targets).size !== targets.length)
      throw new TaskError("VALIDATION", "同一批次不能重复修改一个任务。");
    const hash = digest(ops),
      now = new Date().toISOString();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const receipt = this.db
        .prepare("SELECT hash,result FROM task_receipts WHERE id=?")
        .get(requestId);
      if (receipt) {
        if (receipt.hash !== hash)
          throw new TaskError(
            "REVISION_CONFLICT",
            "重试内容不一致，请核对。",
            409,
          );
        this.db.exec("COMMIT");
        return JSON.parse(String(receipt.result));
      }
      const items: RecruitmentTask[] = [];
      for (const op of ops) {
        if (
          op.source &&
          this.db
            .prepare("SELECT taskId FROM task_sources WHERE actionId=?")
            .get(op.source.actionId)
        )
          throw new TaskError(
            "ALREADY_DECIDED",
            "此邮件事项已经确认，请刷新核对。",
            409,
          );
        const previous = op.action === "create" ? null : this.get(op.id!);
        if (previous && previous.revision !== op.expectedRevision)
          throw new TaskError(
            "REVISION_CONFLICT",
            "任务已被其他窗口更新，请保留输入并刷新核对。",
            409,
          );
        if (previous?.deletedAt && op.action !== "restore")
          throw new TaskError(
            "REVISION_CONFLICT",
            "任务已删除，可在回收列表恢复。",
            409,
          );
        if (op.action === "restore" && !previous?.deletedAt)
          throw new TaskError("REVISION_CONFLICT", "任务没有被删除。", 409);
        if (
          op.action === "create" &&
          Number(
            this.db.prepare("SELECT count(*) n FROM recruitment_tasks").get()!
              .n,
          ) >= 2000
        )
          throw new TaskError("CAPACITY", "任务已达 2000 项，请先导出整理。");
        const item: RecruitmentTask = previous
          ? { ...previous, revision: previous.revision + 1, updatedAt: now }
          : {
              ...op.draft!,
              id: randomUUID(),
              revision: 1,
              state: "pending",
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            };
        if (op.action === "edit") Object.assign(item, op.draft);
        if (op.action === "state") item.state = op.state!;
        if (op.action === "delete") item.deletedAt = now;
        if (op.action === "restore") item.deletedAt = null;
        this.db
          .prepare(
            "INSERT INTO recruitment_tasks VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
          )
          .run(item.id, JSON.stringify(item));
        if (op.source)
          this.db
            .prepare("INSERT INTO task_sources VALUES(?,?,?)")
            .run(op.source.actionId, item.id, JSON.stringify(op.source));
        this.db
          .prepare("INSERT INTO task_history(taskId,data) VALUES(?,?)")
          .run(
            item.id,
            JSON.stringify({
              requestId,
              action: op.action,
              at: now,
              before: previous,
              after: item,
            }),
          );
        items.push(item);
      }
      const result = { requestId, items };
      this.db
        .prepare("INSERT INTO task_receipts VALUES(?,?,?)")
        .run(requestId, hash, JSON.stringify(result));
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      if (this.db.isTransaction) this.db.exec("ROLLBACK");
      throw e;
    }
  }
  private operation(raw: unknown, trustedSource: boolean): Operation {
    const v = object(raw);
    fields(v, ["action", "id", "expectedRevision", "draft", "state", "source"]);
    const action = choice(v.action, [
        "create",
        "edit",
        "state",
        "delete",
        "restore",
        "link",
      ] as const),
      op: Operation = { action };
    if (action === "link" && (!trustedSource || !v.source))
      throw new TaskError("VALIDATION", "关联来源只能由邮件确认流程创建。");
    if (action !== "create") {
      op.id = uuid(v.id);
      if (
        !Number.isSafeInteger(v.expectedRevision) ||
        Number(v.expectedRevision) < 1
      )
        throw new TaskError("VALIDATION", "任务修订号无效。");
      op.expectedRevision = Number(v.expectedRevision);
    } else if (v.id !== undefined || v.expectedRevision !== undefined)
      throw new TaskError("VALIDATION", "新任务标识由服务端生成。");
    if (action === "create" || action === "edit")
      op.draft = validateTaskDraft(v.draft);
    else if (v.draft !== undefined)
      throw new TaskError("VALIDATION", "此操作不接受任务内容。");
    if (action === "state")
      op.state = choice(v.state, Object.keys(TASK_STATES) as TaskState[]);
    else if (v.state !== undefined)
      throw new TaskError("VALIDATION", "请通过明确的状态操作修改状态。");
    if (v.source !== undefined) {
      if (!trustedSource)
        throw new TaskError("VALIDATION", "来源只能由邮件确认流程绑定。");
      const s = object(v.source);
      fields(s, [
        "actionId",
        "mailId",
        "analysisRevision",
        "sourceVersion",
        "evidence",
      ]);
      if (
        !Number.isSafeInteger(s.analysisRevision) ||
        Number(s.analysisRevision) < 1 ||
        !Array.isArray(s.evidence) ||
        s.evidence.length > 30
      )
        throw new TaskError("VALIDATION", "来源版本或证据无效。");
      op.source = {
        actionId: uuid(s.actionId),
        mailId: uuid(s.mailId),
        analysisRevision: Number(s.analysisRevision),
        sourceVersion: text(s.sourceVersion, 100, true),
        evidence: s.evidence.map((raw) => {
          const e = object(raw);
          return {
            field: text(e.field, 100, true),
            quote: text(e.quote, 1000, true),
          };
        }),
      };
    }
    return op;
  }
}
