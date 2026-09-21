import { DatabaseSync, backup } from "node:sqlite";
import { createHash } from "node:crypto";
import { RecruitmentTaskStore, TASK_SCHEMA, schemaBackup } from './recruitment-task-store.ts';
import {
  validateSchedule,
  ScheduleError,
  type Schedule,
  type ScheduleSnapshot,
} from "../shared/schedule-contract.ts";

export class ScheduleStore {
  private db: DatabaseSync;
  readonly recruitment: RecruitmentTaskStore;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    try {
      const version = Number(
        this.db.prepare("PRAGMA user_version").get()!.user_version,
      );
      if (version > 2) throw new Error("Unsupported schedule schema");
      if (version === 1) schemaBackup(this.db, path, 2);
      this.db.exec(
        "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000; BEGIN IMMEDIATE; CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS meta(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL); INSERT OR IGNORE INTO meta VALUES(1,0); CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY, hash TEXT NOT NULL);" + TASK_SCHEMA + "PRAGMA user_version=2; COMMIT;",
      );
      this.recruitment = new RecruitmentTaskStore(this.db);
    } catch (e) {
      if (this.db.isTransaction) this.db.exec('ROLLBACK');
      this.db.close();
      throw e;
    }
  }
  snapshot(): ScheduleSnapshot {
    return {
      revision: Number(
        this.db.prepare("SELECT revision FROM meta").get()!.revision,
      ),
      items: this.db
        .prepare("SELECT data FROM events ORDER BY id")
        .all()
        .map((r) => validateSchedule(JSON.parse(String(r.data)))),
    };
  }
  mutate(value: unknown): ScheduleSnapshot {
    if (!value || typeof value !== "object")
      throw new ScheduleError("请求格式无效。");
    const v = value as Record<string, unknown>;
    if (
      typeof v.requestId !== "string" ||
      !/^[a-f0-9-]{36}$/.test(v.requestId) ||
      !Number.isSafeInteger(v.expectedRevision) ||
      Number(v.expectedRevision) < 0 ||
      !["save", "delete"].includes(v.action as string)
    )
      throw new ScheduleError("请求标识或版本无效。");
    const item = v.action === "save" ? validateSchedule(v.item) : null,
      id = item?.id ?? v.id;
    if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id))
      throw new ScheduleError("日程标识无效。");
    const hash = createHash("sha256")
      .update(
        JSON.stringify({
          action: v.action,
          id,
          item,
          revision: v.expectedRevision,
        }),
      )
      .digest("hex");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const receipt = this.db
        .prepare("SELECT hash FROM receipts WHERE id=?")
        .get(v.requestId);
      if (receipt) {
        if (receipt.hash !== hash)
          throw new ScheduleError("重试内容不一致，请重新读取。", 409);
        this.db.exec("COMMIT");
        return this.snapshot();
      }
      if (
        Number(this.db.prepare("SELECT revision FROM meta").get()!.revision) !==
        v.expectedRevision
      )
        throw new ScheduleError(
          "日程已被其他窗口更新。请保留当前内容，关闭编辑后刷新再修改。",
          409,
        );
      if (item) {
        if (
          (this.db.prepare("SELECT count(*) n FROM events").get()!
            .n as number) >= 2000 &&
          !this.db.prepare("SELECT id FROM events WHERE id=?").get(id)
        )
          throw new ScheduleError("日程数量已达 2000，请先导出并整理历史。");
        this.db
          .prepare(
            "INSERT INTO events VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
          )
          .run(id, JSON.stringify(item));
      } else this.db.prepare("DELETE FROM events WHERE id=?").run(id);
      this.db.prepare("UPDATE meta SET revision=revision+1").run();
      this.db
        .prepare("INSERT INTO receipts VALUES(?,?)")
        .run(v.requestId, hash);
      this.db.exec("COMMIT");
      return this.snapshot();
    } catch (e) {
      if (this.db.isTransaction) this.db.exec("ROLLBACK");
      throw e;
    }
  }
  integrity() {
    return this.db.prepare("PRAGMA integrity_check").get()!.integrity_check;
  }
  schemaVersion() { return Number(this.db.prepare('PRAGMA user_version').get()!.user_version); }
  async backup(path: string) {
    await backup(this.db, path);
  }
  close() {
    this.db.close();
  }
}
