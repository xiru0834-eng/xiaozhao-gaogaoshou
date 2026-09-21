import { ModelError, object, revision } from "../shared/model-contract.ts";
import { ModelSettings } from "./model-settings.ts";
import { generateText, type ModelTransport } from "./model-client.ts";
import { searchDeepSeek, type SearchTransport } from "./search-deepseek.ts";

export class ModelService {
  readonly settings: ModelSettings;
  private readonly transport?: ModelTransport;
  private readonly searchTransport?: SearchTransport;
  private active: AbortController | null = null;
  private saving = false;
  private disposed = false;
  private calls: number[] = [];
  constructor(settings: ModelSettings, transport?: ModelTransport, searchTransport?: SearchTransport) { this.settings = settings; this.transport = transport; this.searchTransport = searchTransport; }
  async save(input: unknown) {
    if (this.disposed) throw new ModelError("CANCELLED");
    if (this.active || this.saving) throw new ModelError("BUSY");
    this.saving = true;
    try { return await this.settings.save(input); } finally { this.saving = false; }
  }
  dispose() { this.disposed = true; this.active?.abort(); }
  async run(input: unknown, test: boolean, signal: AbortSignal) {
    const value = object(input);
    const expectedRevision = revision(value.expectedRevision);
    if (Object.keys(value).some(k => !["expectedRevision", ...(test ? [] : ["prompt"])].includes(k))) throw new ModelError("VALIDATION");
    if (!test && (typeof value.prompt !== "string" || !value.prompt.trim() || value.prompt.length > 2000)) throw new ModelError("VALIDATION");
    return this.invoke(test ? "这是一条连接测试，请只回复：连接成功。" : (value.prompt as string).trim(), expectedRevision, test, signal);
  }
  /** Internal public-page extraction only. Never exposed as an arbitrary HTTP prompt endpoint. */
  async extract(prompt: string, expectedRevision: number, signal: AbortSignal) {
    if (!prompt.trim() || prompt.length > 20000) throw new ModelError("VALIDATION");
    return this.invoke(prompt, revision(expectedRevision), false, signal);
  }
  /** Private mail boundary: caller must verify endpoint-specific user consent first. */
  async analyzeMail(prompt: string, expectedRevision: number, signal: AbortSignal) {
    if (!prompt.trim() || prompt.length > 20000) throw new ModelError("VALIDATION");
    return this.invoke(prompt, revision(expectedRevision), false, signal);
  }
  private async invoke(prompt: string, expectedRevision: number, test: boolean, signal: AbortSignal) {
    return this.withProvider(expectedRevision, signal, ({config,apiKey}, combined) => generateText(
      { ...config, maxTokens: test ? Math.min(config.maxTokens, 64) : config.maxTokens }, apiKey, prompt, combined, this.transport,
    ));
  }
  /** Public search shares the existing model concurrency/rate gate; no credential is returned to callers. */
  async searchPublic(query: string, expectedRevision: number, signal: AbortSignal) {
    return this.withProvider(expectedRevision, signal, ({config,apiKey}, combined) => searchDeepSeek(config,apiKey,query,combined,this.searchTransport));
  }
  private async withProvider<T>(expectedRevision: number, signal: AbortSignal, work: (credentials: Awaited<ReturnType<ModelSettings['credentials']>>, signal: AbortSignal) => Promise<T>): Promise<T> {
    if (this.disposed) throw new ModelError("CANCELLED");
    if (this.active || this.saving) throw new ModelError("BUSY");
    const controller = new AbortController();
    this.active = controller;
    try {
      const { config, apiKey } = await this.settings.credentials(expectedRevision);
      const now = Date.now();
      this.calls = this.calls.filter(time => now - time < 60000);
      if (this.calls.length >= 6) throw new ModelError("LOCAL_LIMIT");
      const combined = AbortSignal.any([signal, controller.signal]);
      if (combined.aborted) throw new ModelError("CANCELLED");
      this.calls.push(now);
      return await work({config,apiKey},combined);
    } finally { this.active = null; }
  }
}
