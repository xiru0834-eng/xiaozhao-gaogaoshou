import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { MailStore } from "./mail-store.ts";
import { MailService } from "./mail-service.ts";
import {MailTaskService} from './mail-task-service.ts';
import { MailProviders } from "./mail-providers.ts";
import { ModelService } from "./model-service.ts";
import { ScheduleStore } from "./schedule-store.ts";
import { MailError } from "../shared/mail-contract.ts";
import { ModelError, type ModelSettingsView } from "../shared/model-contract.ts";
import type { SecretProtector } from "./model-secrets.ts";

export class MailAPI {
  readonly store: MailStore;
  readonly service: MailService;
  readonly tasks: MailTaskService;
  readonly providers: MailProviders;
  private model: ModelService;
  private timer: ReturnType<typeof setInterval>;
  private running: Promise<void> | null = null;
  private closed = false;
  private job = {
    state: "idle",
    message: "尚未同步。",
    scanned: 0,
    added: 0,
    analyzed: 0,
  };
  constructor(
    dir: string,
    schedules: ScheduleStore,
    model: ModelService,
    secrets?: SecretProtector,
  ) {
    this.store = new MailStore(join(dir, "mail.db"), secrets);
    this.model = model;
    this.service = new MailService(this.store, schedules, model);
    this.tasks = new MailTaskService(this.store,schedules.recruitment,model);
    this.providers = new MailProviders(this.store);
    this.service.recover();
    this.tasks.recover();
    this.timer = setInterval(() => {
      if (!this.closed && !this.running && this.store.preferences().automatic)
        this.begin(() => this.sync());
    }, 600000);
    this.timer.unref();
  }
  private begin(work: () => Promise<void>) {
    if (this.running) throw new MailError("正在同步或分析，请稍后。", 409);
    this.job = {
      state: "running",
      message: "正在处理，结果会保留在待确认列表。",
      scanned: 0,
      added: 0,
      analyzed: 0,
    };
    this.running = work()
      .then(() => {
        if (this.job.state === "running") this.job.state = "done";
      })
      .catch((e) => {
        this.job.state = "failed";
        this.job.message =
          e instanceof MailError
            ? e.message
            : "处理未完成，请检查邮箱或模型设置。未自动写入日历。";
      })
      .finally(() => {
        this.running = null;
      });
  }
  private async sync() {
    const accounts = this.store.accounts();
    if (!accounts.length)
      throw new MailError("请先连接邮箱，或粘贴邮件进行分析。");
    let capped = false;
    const errors: string[] = [];
    for (const account of accounts) {
      if (this.closed) break;
      try {
        const result = await this.providers.fetch(account.id);
        this.job.scanned += result.scanned;
        capped ||= result.capped;
        for (const m of result.messages) {
          if (this.closed) break;
          const before = this.store.list().length;
          await this.store.ingest(account.id, m);
          this.job.added += this.store.list().length - before;
        }
      } catch (e) {
        errors.push(e instanceof MailError ? e.message : "邮箱读取失败");
      }
    }
    if (this.store.preferences().enabled) {
      for (const c of this.store
        .list()
        .filter((c) => c.state === "queued")
        .slice(0, 3)) {
        if (this.closed) break;
        try {
          await this.tasks.analyze(c.id);
          this.job.analyzed++;
        } catch (e) {
          errors.push(e instanceof Error ? e.message : "模型分析失败");
          break;
        }
      }
    }
    this.job.message = `检查 ${this.job.scanned} 封，新增 ${this.job.added} 封，分析 ${this.job.analyzed} 封。${capped ? "本轮达到最近 100 封上限，可能有遗漏；请结合原邮箱检查。" : ""}${errors.join("；")}${!this.store.preferences().enabled ? "尚未授权模型分析，邮件保留在待分析列表。" : ""}`;
    if (errors.length) this.job.state = "partial";
  }
  async read() {
    let model: ModelSettingsView | null = null;
    let modelError = "";
    try { model = await this.model.settings.read(); }
    catch (error) {
      if (!(error instanceof ModelError)) throw error;
      // A damaged optional model config must not lock access to local mail/tasks.
      modelError = error.message;
    }
    return {
      taskVersion: 2,
      accounts: this.store.accounts(),
      candidates: this.store.list().map(({ intent, ...c }) => ({...c,taskAnalysis:this.store.taskAnalysis(c.id)})),
      preferences: this.store.preferences(),
      model: {
        configured: !!model?.config && model.hasKey,
        endpoint: model?.config?.baseUrl ?? "",
        name: model?.config?.model ?? "",
        error: modelError,
      },
      auth: this.providers.authStatus(),
      job: this.job,
    };
  }
  async act(v: any) {
    if (!v || typeof v.action !== "string")
      throw new MailError("邮件请求无效。");
    switch (v.action) {
      case 'analyzeTasks':
        this.begin(async()=>{await this.tasks.analyze(String(v.id));this.job.analyzed=1;this.job.message='事项提取完成，请逐项核对；尚未创建正式任务。';});
        break;
      case 'manualTask':
        if(this.running)throw new MailError('请等待分析结束。',409);
        return {analysis:await this.tasks.manual(String(v.id),v.draft)};
      case 'confirmTasks':
        if(this.running)throw new MailError('请等待分析结束。',409);
        return {result:await this.tasks.confirm(v.batch)};
      case 'recoverTasks':
        this.tasks.recover();break;
      case 'ignoreTask':
        if(this.running)throw new MailError('请等待分析结束。',409);
        this.store.ignoreTask(String(v.id),String(v.actionId),Number(v.revision));break;
      case "consent": {
        if (typeof v.enabled !== "boolean" || typeof v.automatic !== "boolean")
          throw new MailError("授权选项无效。");
        if (this.running)
          throw new MailError("请等待当前处理结束后修改授权。", 409);
        if (!v.enabled) {
          // Revocation does not need a readable or configured model provider.
          this.store.consent("", false, false);
          break;
        }
        const s = await this.model.settings.read();
        if (
          v.enabled &&
          (!s.config || !s.hasKey || v.endpoint !== s.config.baseUrl)
        )
          throw new MailError(
            "模型地址已变化或尚未配置，请重新核对授权。",
            409,
          );
        this.store.consent(s.config?.baseUrl ?? "", v.enabled, v.automatic);
        break;
      }
      case "qq":
        if (this.running) throw new MailError("请等待当前同步完成。", 409);
        await this.providers.connectQQ(
          String(v.email ?? ""),
          String(v.password ?? ""),
        );
        break;
      case "outlook":
        this.providers.startOutlook(
          String(v.clientId ?? ""),
          String(v.kind ?? ""),
        );
        break;
      case "cancelAuth":
        this.providers.cancelAuth();
        break;
      case "disconnect":
        if (this.running)
          throw new MailError("请等待当前同步结束后断开邮箱。", 409);
        this.store.disconnect(String(v.id));
        break;
      case "sync":
        this.begin(() => this.sync());
        break;
      case "analyze":
        if(this.store.taskAnalysis(String(v.id)))throw new MailError('此邮件已使用任务分析流程，请从任务核对界面处理。',409);
        this.begin(async () => {
          await this.service.analyze(String(v.id));
          this.job.analyzed = 1;
          this.job.message = "分析完成，请核对原文后确认。";
        });
        break;
      case "paste": {
        const id = await this.store.ingest("manual", {
          key: randomUUID(),
          subject: v.subject,
          sender: "手动粘贴",
          receivedAt: v.receivedAt,
          text: v.text,
          attachment: false,
        });
        return { id };
      }
      case "source":
        return { source: await this.store.source(String(v.id)) };
      case "confirm":
        if(this.store.taskAnalysis(String(v.id)))throw new MailError('请逐项确认任务，不能重复写入旧日历。',409);
        return { snapshot: await this.service.confirm(v) };
      case "ignore":
        if (this.running) throw new MailError("请等待分析结束。", 409);
        if (
          ["confirmed", "confirming"].includes(
            this.store.get(String(v.id)).state,
          )
        )
          throw new MailError("已入历记录不能忽略。");
        if(this.store.taskAnalysis(String(v.id))?.actions.some(a=>['confirmed','confirming'].includes(a.state)))throw new MailError('部分事项已确认，请逐项处理剩余事项。',409);
        this.store.state(String(v.id), "ignored");
        break;
      case "purge":
        if (this.running) throw new MailError("请等待处理结束。", 409);
        this.store.purge();
        break;
      default:
        throw new MailError("未知的邮件操作。");
    }
    return this.read();
  }
  async close() {
    this.closed = true;
    clearInterval(this.timer);
    this.service.close();
    this.tasks.close();
    const providersClosed = this.providers.close();
    await this.running;
    await providersClosed;
    this.store.close();
  }
}
