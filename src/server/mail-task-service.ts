import { MailStore } from "./mail-store.ts";
import {
  RecruitmentTaskStore,
  digest,
  type TaskCommit,
} from "./recruitment-task-store.ts";
import { ModelService } from "./model-service.ts";
import { prepareTaskMail, validateMailTasks } from "./mail-task-analysis.ts";
import { MailError } from "../shared/mail-contract.ts";
import {
  TaskError,
  object,
  fields,
  uuid,
  choice,
  validateTaskDraft,
  type TaskDraft,
} from "../shared/recruitment-task-contract.ts";
import type { MailTaskBatch } from "../shared/mail-task-contract.ts";

export class MailTaskService {
  private mail: MailStore;
  private tasks: RecruitmentTaskStore;
  private model: ModelService;
  private active = false;
  private controller = new AbortController();
  constructor(
    mail: MailStore,
    tasks: RecruitmentTaskStore,
    model: ModelService,
  ) {
    this.mail = mail;
    this.tasks = tasks;
    this.model = model;
  }
  private editable(id: string) {
    const c = this.mail.get(id),
      a = this.mail.taskAnalysis(id);
    if (
      ["confirmed", "ignored", "confirming"].includes(c.state) ||
      a?.actions.some((a) => ["confirmed", "confirming"].includes(a.state))
    )
      throw new MailError(
        "已有已确认或正在保存的事项，不能重新分析覆盖。",
        409,
      );
  }
  async analyze(id: string) {
    if (this.active) throw new MailError("正在分析，请稍后。", 409);
    this.editable(id);
    this.active = true;
    try {
      const settings = await this.model.settings.read(),
        consent = this.mail.preferences();
      if (
        !consent.enabled ||
        !settings.config ||
        consent.endpoint !== settings.config.baseUrl
      )
        throw new MailError("请先配置模型并授权分析招聘邮件。", 422);
      const prepared = prepareTaskMail(await this.mail.source(id));
      this.mail.spend();
      const result = await this.model.analyzeMail(
        prepared.prompt,
        settings.revision,
        this.controller.signal,
      );
      if (result.truncated)
        throw new MailError(
          "模型输出被截断，未创建任务，请手动整理或调整输出限制。",
        );
      this.editable(id);
      return this.mail.saveTaskAnalysis(
        id,
        prepared.sourceVersion,
        validateMailTasks(result.text, prepared),
        "model",
      );
    } catch (e) {
      const message =
        e instanceof MailError || e instanceof TaskError
          ? e.message
          : "模型分析失败，请检查服务设置后重试；未创建任务。";
      if (
        !this.mail
          .taskAnalysis(id)
          ?.actions.some((a) => ["confirmed", "confirming"].includes(a.state))
      )
        this.mail.state(id, "failed", message);
      throw new MailError(message, e instanceof MailError ? e.status : 502);
    } finally {
      this.active = false;
    }
  }
  async manual(id: string, draft: unknown) {
    if (this.active) throw new MailError("请等待当前分析结束。", 409);
    this.editable(id);
    this.active = true;
    try {
      const valid = validateTaskDraft(draft),
        source = await this.mail.source(id);
      this.editable(id);
      if (this.mail.taskAnalysis(id)?.actions.length)
        throw new MailError(
          "这封邮件已有分析结果，请核对已有事项；不覆盖已有候选。",
          409,
        );
      return this.mail.saveTaskAnalysis(
        id,
        digest(source),
        [{ mutation: "create", draft: valid, evidence: [] }],
        "manual",
      );
    } finally {
      this.active = false;
    }
  }
  async confirm(value: unknown): Promise<TaskCommit> {
    const v = object(value);
    fields(v, [
      "requestId",
      "mailId",
      "analysisRevision",
      "sourceVersion",
      "decisions",
    ]);
    const requestId = uuid(v.requestId),
      mailId = uuid(v.mailId),
      hash = digest(v),
      previous = this.mail.taskBatch(requestId);
    if (previous) {
      if (previous.hash !== hash)
        throw new MailError("相同确认编号不能用于不同内容。", 409);
      if (previous.state === "conflict")
        throw new MailError(previous.error, 409);
      return this.commit(previous);
    }
    if (this.active) throw new MailError("请等待模型分析结束再确认。", 409);
    const source = await this.mail.source(mailId),
      analysis = this.mail.taskAnalysis(mailId);
    if (this.active) throw new MailError("请等待模型分析结束再确认。", 409);
    const raced = this.mail.taskBatch(requestId);
    if (raced) {
      if (raced.hash !== hash)
        throw new MailError("相同确认编号不能用于不同内容。", 409);
      if (raced.state === "conflict") throw new MailError(raced.error, 409);
      return this.commit(raced);
    }
    if (this.mail.get(mailId).state === "ignored")
      throw new MailError("邮件已在其他窗口忽略，请刷新核对，不能继续确认旧事项。", 409);
    // Recheck after awaiting encrypted source, before any durable intent is written.
    if (
      !analysis ||
      analysis.revision !== v.analysisRevision ||
      analysis.sourceVersion !== v.sourceVersion ||
      digest(source) !== analysis.sourceVersion
    )
      throw new MailError("邮件或分析版本已变化，请重新核对。", 409);
    if (
      !Array.isArray(v.decisions) ||
      v.decisions.length < 1 ||
      v.decisions.length > 8
    )
      throw new MailError("一次确认 1～8 项。");
    const actionIds: string[] = [],
      operations: Record<string, unknown>[] = [],
      creations = new Set<string>();
    for (const raw of v.decisions) {
      const d = object(raw);
      fields(d, ["actionId", "mode", "draft", "targetId", "expectedRevision"]);
      const actionId = uuid(d.actionId),
        action = analysis.actions.find((a) => a.id === actionId),
        mode = choice(d.mode, ["create", "edit", "cancel", "link"] as const);
      if (actionIds.includes(actionId))
        throw new MailError("不能重复确认同一事项。");
      if (!action || action.state !== "review")
        throw new MailError("邮件事项已经处理或正在保存，请刷新核对。", 409);
      if (
        (action.mutation === "update" && mode !== "edit") ||
        (action.mutation === "cancel" && mode !== "cancel") ||
        (action.mutation === "create" && !["create", "link"].includes(mode))
      )
        throw new MailError("改期／取消必须明确处理原任务，不能新建代替。");
      const evidence = action.evidence,
        sourceRef = {
          actionId,
          mailId,
          analysisRevision: analysis.revision,
          sourceVersion: analysis.sourceVersion,
          evidence,
        };
      let draft: TaskDraft | undefined;
      if (mode === "create" || mode === "edit")
        draft = validateTaskDraft(d.draft);
      else if (d.draft !== undefined)
        throw new MailError("关联或取消操作不能带入替换内容。");
      if (mode === "create") {
        if (d.targetId !== undefined || d.expectedRevision !== undefined)
          throw new MailError("新建事项不接受已有任务标识。");
        const duplicate = this.tasks
          .all()
          .find(
            (t) =>
              t.state !== "cancelled" &&
              t.company &&
              t.company.replace(/\s/g, "").toLowerCase() ===
                draft!.company.replace(/\s/g, "").toLowerCase() &&
              t.kind === draft!.kind &&
              t.action === draft!.action &&
              t.role === draft!.role &&
              t.round === draft!.round &&
              digest(t.timing) === digest(draft!.timing),
          );
        if (duplicate)
          throw new MailError(
            "已有同公司、同类型和时间的任务。请选“关联已有任务”，不要重复创建。",
            409,
          );
        const identity = digest([
          draft!.company.replace(/\s/g, "").toLowerCase(),
          draft!.kind,
          draft!.action,
          draft!.role,
          draft!.round,
          draft!.timing,
        ]);
        if (creations.has(identity))
          throw new MailError(
            "本次勾选包含疑似重复事项，请逐项核对后确认。",
            409,
          );
        creations.add(identity);
        operations.push({ action: "create", draft, source: sourceRef });
      } else {
        const targetId = uuid(d.targetId),
          target = this.tasks.get(targetId);
        if (target.deletedAt || target.revision !== d.expectedRevision)
          throw new MailError("目标任务已变化或删除，请重新核对。", 409);
        operations.push({
          action: mode === "cancel" ? "state" : mode,
          id: targetId,
          expectedRevision: d.expectedRevision,
          ...(mode === "cancel"
            ? { state: "cancelled" }
            : mode === "edit"
              ? { draft }
              : {}),
          source: sourceRef,
        });
      }
      actionIds.push(actionId);
    }
    const batch: MailTaskBatch = {
      requestId,
      mailId,
      hash,
      command: { requestId, operations },
      actionIds,
      state: "pending",
      error: "",
    };
    this.mail.beginTaskBatch(batch);
    return this.commit(batch);
  }
  private commit(batch: MailTaskBatch) {
    let result: TaskCommit;
    try {
      result = this.tasks.commit(batch.command, true);
    } catch (e) {
      if (
        e instanceof TaskError &&
        e.status < 500 &&
        !this.tasks.receipt(batch.requestId)
      )
        this.mail.finishTaskBatch(batch, [], e.message);
      throw e;
    }
    if (batch.state !== "committed")
      this.mail.finishTaskBatch(
        batch,
        result.items.map((i) => i.id),
      );
    return result;
  }
  recover() {
    for (const b of this.mail.pendingTaskBatches())
      try {
        this.commit(b);
      } catch {
        /* Durable intent remains retryable; conflicts are retained explicitly. */
      }
  }
  close() {
    this.controller.abort();
  }
}
