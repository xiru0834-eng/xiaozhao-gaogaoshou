import { ModelError, object, revision } from "../shared/model-contract.ts";
import { ModelSettings } from "./model-settings.ts";
import { generateText, type ModelTransport } from "./model-client.ts";

export class ModelService {
  readonly settings: ModelSettings;
  private readonly transport?: ModelTransport;
  private active: AbortController | null = null;
  private saving = false;
  private calls: number[] = [];
  constructor(settings: ModelSettings, transport?: ModelTransport) { this.settings = settings; this.transport = transport; }
  async save(input: unknown) {
    if (this.active || this.saving) throw new ModelError("BUSY");
    this.saving = true;
    try { return await this.settings.save(input); } finally { this.saving = false; }
  }
  dispose() { this.active?.abort(); }
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
  private async invoke(prompt: string, expectedRevision: number, test: boolean, signal: AbortSignal) {
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
      return await generateText(
        { ...config, maxTokens: test ? Math.min(config.maxTokens, 64) : config.maxTokens }, apiKey,
        prompt, combined, this.transport,
      );
    } finally { this.active = null; }
  }
}
