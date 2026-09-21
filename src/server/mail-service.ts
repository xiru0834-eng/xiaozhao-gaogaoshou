import { randomUUID } from "node:crypto";
import { MailStore } from "./mail-store.ts";
import { ScheduleStore } from "./schedule-store.ts";
import { ModelService } from "./model-service.ts";
import { mailPrompt, validateExtraction } from "./mail-analysis.ts";
import { MailError } from "../shared/mail-contract.ts";
import {
  validateSchedule,
  ScheduleError,
} from "../shared/schedule-contract.ts";

export class MailService {
  private store: MailStore;
  private schedules: ScheduleStore;
  private model: ModelService;
  private controller = new AbortController();
  private active = false;
  constructor(store: MailStore, schedules: ScheduleStore, model: ModelService) {
    this.store = store;
    this.schedules = schedules;
    this.model = model;
  }
  async analyze(id: string) {
    if (this.active) throw new MailError("正在分析另一封邮件，请稍后。", 409);
    const candidate = this.store.get(id);
    if (["confirmed", "ignored", "confirming"].includes(candidate.state))
      throw new MailError("这封邮件已处理，未重复分析。", 409);
    const settings = await this.model.settings.read(),
      consent = this.store.preferences();
    if (
      !consent.enabled ||
      !settings.config ||
      consent.endpoint !== settings.config.baseUrl
    )
      throw new MailError(
        "请先配置模型，并授权将招聘邮件正文发送给当前模型服务。",
        422,
      );
    this.active = true;
    try {
      const source = await this.store.source(id);
      this.store.spend();
      const response = await this.model.analyzeMail(
        mailPrompt(source),
        settings.revision,
        this.controller.signal,
      );
      if (response.truncated)
        throw new MailError(
          "模型输出达到长度上限，未写入日历。请调高输出限制后重试。",
        );
      const extraction = validateExtraction(response.text, source);
      this.store.finish(id, extraction);
      return this.store.get(id);
    } catch (e) {
      const message =
        e instanceof MailError || e instanceof ScheduleError
          ? e.message
          : "模型分析失败（可能未配置、限流或网络错误），未写入日历。请核对模型设置后重试。";
      this.store.state(id, "failed", message);
      throw new MailError(message, 502);
    } finally {
      this.active = false;
    }
  }
  async confirm(value: any) {
    if (!value || typeof value.id !== "string")
      throw new MailError("确认请求无效。");
    const c = this.store.get(value.id);
    if (c.state === "confirmed") return this.schedules.snapshot();
    if (c.intent) return this.commit(c.id, c.intent);
    if (c.state !== "review" || !c.extraction?.relevant)
      throw new MailError("请先分析并核对邮件。");
    if (c.extraction.action !== "create" || c.extraction.purpose !== "event")
      throw new MailError(
        "改期、取消、截止或窗口通知需到日历手动处理，未新增重复日程。",
      );
    const item = validateSchedule(value.item);
    if (!item.date || !item.time)
      throw new MailError("请核实具体日期和时间，不能将待定时间直接入历。");
    if (!Number.isSafeInteger(value.expectedRevision))
      throw new MailError("日程版本无效。");
    if (this.schedules.snapshot().items.some((x) => x.id === item.id))
      throw new MailError("新增邮件日程不能覆盖已有日程。", 409);
    if (
      this.schedules
        .snapshot()
        .items.some(
          (x) =>
            x.company.replace(/\s/g, "").toLowerCase() ===
              item.company.replace(/\s/g, "").toLowerCase() &&
            x.kind === item.kind &&
            x.start === item.start &&
            x.status !== "cancelled",
        )
    )
      throw new MailError(
        "日历已有同公司、同类型、同一时间的安排。请在日历核对原记录，避免重复创建。",
        409,
      );
    const intent = {
      action: "save",
      requestId: randomUUID(),
      expectedRevision: value.expectedRevision,
      item,
    };
    this.store.intent(c.id, intent);
    return this.commit(c.id, intent);
  }
  private commit(id: string, intent: unknown) {
    try {
      const snapshot = this.schedules.mutate(intent);
      this.store.state(id, "confirmed");
      return snapshot;
    } catch (e) {
      if (e instanceof ScheduleError && e.status === 409)
        this.store.resetIntent(id);
      throw e;
    }
  }
  recover() {
    for (const c of this.store.list())
      if (c.state === "confirming" && c.intent) {
        try {
          this.commit(c.id, c.intent);
        } catch {
          /* Remains review or confirming; never drop intent on an unknown failure. */
        }
      }
  }
  close() {
    this.controller.abort();
  }
}
