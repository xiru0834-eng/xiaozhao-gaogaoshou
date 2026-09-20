import { randomUUID } from "node:crypto";
import { CollectionError, jobIdentity, parseRunInput, type RunView, type SourceDefinition } from "../shared/collection-contract.ts";
import { ModelError } from "../shared/model-contract.ts";
import type { CollectionStore } from "./collection-store.ts";
import type { PreferencesStore } from "./job-preferences.ts";
import type { ModelService } from "./model-service.ts";
import { SourceReader } from "./source-fetch.ts";
import { extractJob } from "./job-extract.ts";
import { assessJob } from "./job-rules.ts";

export class CollectionService {
  readonly store: CollectionStore;
  readonly preferences: PreferencesStore;
  readonly sources: SourceDefinition[];
  private readonly model: ModelService;
  private readonly reader: SourceReader;
  private storageFailed = false;
  private failedRun: RunView | null = null;
  private active: { id: string; controller: AbortController; finished?: Promise<void> } | null = null;
  constructor(store: CollectionStore, preferences: PreferencesStore, sources: SourceDefinition[], model: ModelService, reader: SourceReader) {
    this.store = store; this.preferences = preferences; this.sources = sources; this.model = model; this.reader = reader;
  }
  async start(value: unknown): Promise<RunView> {
    if (this.storageFailed) throw new CollectionError("STORAGE", "上次采集记录未能保存。请检查磁盘后重启；不会自动继续请求。", 503);
    const input = parseRunInput(value), existing = this.store.findRequest(input.requestId);
    if (existing) {
      if (JSON.stringify(input) !== JSON.stringify(existing.input)) throw new CollectionError("CONFLICT", "重复请求内容不同，请重新确认。", 409);
      return existing;
    }
    if (this.active) throw new CollectionError("BUSY", "已有采集正在运行，请等待或取消。", 409);
    if (input.sourceIds.some(id => !this.sources.some(source => source.id === id))) throw new CollectionError("VALIDATION", "存在未登记来源，未发起请求。");
    this.store.checkCapacity();
    const active = { id: randomUUID(), controller: new AbortController(), finished: undefined as Promise<void> | undefined };
    this.active = active;
    try {
      const prefs = input.mode === "extract" ? await this.preferences.read() : { revision: 0, preferences: null };
      if (input.mode === "extract") {
        if (!prefs.preferences || prefs.revision !== input.expectedPreferenceRevision) throw new CollectionError("CONFLICT", "请先确认当前求职偏好。", 409);
        const settings = await this.model.settings.read();
        if (!settings.hasKey) throw new CollectionError("NOT_CONFIGURED", "请先设置模型并完成连接测试。", 422);
        if (settings.revision !== input.expectedModelRevision) throw new CollectionError("CONFLICT", "模型设置已变化，请刷新后重新确认。", 409);
      }
      const run: RunView = { id: active.id, input, state: "queued", startedAt: new Date().toISOString(), finishedAt: null, modelCalls: 0, documents: [], errors: [], candidates: 0, usage: { input: null, output: null }, preferenceRevision: prefs.revision };
      this.store.saveRun(run);
      active.finished = this.execute(run, prefs.preferences, AbortSignal.any([active.controller.signal, AbortSignal.timeout(300000)]))
        .catch(() => {
          this.storageFailed = true;
          this.failedRun = { ...run, state: "failed", finishedAt: new Date().toISOString(), errors: [...run.errors, "运行结果未能写入本机。请检查磁盘后重启，后台请求已停止。"] };
        })
        .finally(() => { if (this.active === active) this.active = null; });
      return run;
    } catch (error) { this.active = null; throw error; }
  }
  private async execute(run: RunView, preferences: Awaited<ReturnType<PreferencesStore["read"]>>["preferences"], signal: AbortSignal) {
    const budget = { requests: 0 };
    try {
      run.state = "running"; this.store.saveRun(run);
      for (const id of run.input.sourceIds) {
        if (signal.aborted) break;
        const source = this.sources.find(s => s.id === id)!;
        const doc = await this.reader.read(source, signal, budget);
        run.documents.push(doc); this.store.saveRun(run);
        const evidenceId = randomUUID(); this.store.saveEvidence(evidenceId, doc);
        if (doc.state !== "readable") { run.errors.push(`${source.name}：${doc.message}`); continue; }
        if (run.input.mode === "source_only") continue;
        if (source.kind !== "detail") { run.errors.push(`${source.name}：只检查了招聘入口；尚无已登记的详情适配，未生成岗位。`); continue; }
        if (run.modelCalls >= run.input.maxModelCalls) { run.errors.push(`${source.name}：达到模型调用上限，跳过提取。`); continue; }
        if (signal.aborted) break;
        run.modelCalls++; this.store.saveRun(run);
        try {
          const { fields, applicationUrl, result } = await extractJob(source, doc, this.model, run.input.expectedModelRevision!, signal);
          for (const side of ["input", "output"] as const) run.usage[side] = result.usage[side] === null || (run.modelCalls > 1 && run.usage[side] === null) ? null : (run.usage[side] ?? 0) + result.usage[side]!;
          this.store.propose(run.id, { key: jobIdentity(source.id, source.entryUrl), sourceId: source.id, company: source.company, url: source.entryUrl, applicationUrl, fields, assessment: assessJob(fields, preferences!, applicationUrl !== null, doc.text), firstSeenAt: doc.checkedAt, lastVerifiedAt: doc.checkedAt, evidenceId, extraction: "model" });
          run.candidates++;
        } catch (error) {
          run.usage = { input: null, output: null };
          run.errors.push(`${source.name}：${error instanceof CollectionError || error instanceof ModelError ? error.message : "提取失败，未重试、未入库。"}`);
        }
        this.store.saveRun(run);
      }
      const succeeded = run.input.mode === "source_only" ? run.documents.some(doc => doc.state === "readable") : run.candidates > 0;
      run.state = signal.aborted ? "cancelled" : run.errors.length ? succeeded ? "partial" : "failed" : "completed";
      if (signal.aborted) run.errors.push("任务已停止；未发送的请求不会继续。已生成的候选尚未入库。");
    } catch { run.state = "failed"; run.errors.push("本地采集执行失败，未自动重试。请检查日志和磁盘空间。"); }
    finally { run.finishedAt = new Date().toISOString(); this.store.saveRun(run); }
  }
  cancel(id: string) {
    const run = this.store.run(id);
    if (this.active?.id === id) this.active.controller.abort();
    return run;
  }
  viewRun(run: RunView) { return this.failedRun?.id === run.id ? this.failedRun : run; }
  async close() { this.active?.controller.abort(); await this.active?.finished; }
}
