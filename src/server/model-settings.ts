import { open, readFile, rename, rm, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { ModelError, object, parseModelConfig, revision, type ModelConfig, type ModelSettingsView } from "../shared/model-contract.ts";
import { safeFile } from "./runtime-config.ts";
import { windowsSecrets, type SecretProtector } from "./model-secrets.ts";

interface StoredSettings { version: 1; revision: number; config: ModelConfig; encryptedKey: string | null; updatedAt: string }
export class ModelSettings {
  private readonly directory: string;
  private readonly secrets: SecretProtector;
  private saving = false;
  constructor(directory: string, secrets: SecretProtector = windowsSecrets) { this.directory = directory; this.secrets = secrets; }
  private async load(): Promise<StoredSettings | null> {
    try {
      const path = safeFile(this.directory, "model-settings.json");
      if ((await stat(path)).size > 65536) throw new Error("size");
      const raw = object(JSON.parse(await readFile(path, "utf8")));
      if (raw.version !== 1 || typeof raw.updatedAt !== "string" || !Number.isFinite(Date.parse(raw.updatedAt)) || !(raw.encryptedKey === null || (typeof raw.encryptedKey === "string" && /^[A-Za-z0-9+/=]{1,16384}$/.test(raw.encryptedKey)))) throw new Error("shape");
      return { version: 1, revision: revision(raw.revision), config: parseModelConfig(raw.config), encryptedKey: raw.encryptedKey as string | null, updatedAt: raw.updatedAt };
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
      throw new ModelError("SETTINGS_CORRUPT");
    }
  }
  private view(stored: StoredSettings | null): ModelSettingsView {
    return { revision: stored?.revision ?? 0, config: stored?.config ?? null, hasKey: !!stored?.encryptedKey, updatedAt: stored?.updatedAt ?? null };
  }
  async read(): Promise<ModelSettingsView> { return this.view(await this.load()); }
  async credentials(expectedRevision: number) {
    const stored = await this.load();
    if ((stored?.revision ?? 0) !== revision(expectedRevision)) throw new ModelError("CONFLICT");
    if (!stored?.encryptedKey) throw new ModelError("NOT_CONFIGURED");
    try { return { config: stored.config, apiKey: await this.secrets.unprotect(stored.encryptedKey) }; }
    catch { throw new ModelError("SECRET_STORAGE"); }
  }
  async save(input: unknown): Promise<ModelSettingsView> {
    if (this.saving) throw new ModelError("CONFLICT");
    this.saving = true;
    try {
      const value = object(input);
      if (Object.keys(value).some(k => !["expectedRevision", "config", "keyAction", "apiKey"].includes(k))) throw new ModelError("VALIDATION");
      const config = parseModelConfig(value.config);
      const stored = await this.load();
      if (revision(value.expectedRevision) !== (stored?.revision ?? 0)) throw new ModelError("CONFLICT");
      if (!["keep", "replace", "clear"].includes(value.keyAction as string)) throw new ModelError("VALIDATION");
      if (value.keyAction !== "replace" && value.apiKey !== undefined) throw new ModelError("VALIDATION");
      if (value.keyAction === "keep" && stored?.encryptedKey && stored.config.baseUrl !== config.baseUrl) throw new ModelError("KEY_REENTRY");
      let encryptedKey = value.keyAction === "clear" ? null : stored?.encryptedKey ?? null;
      if (value.keyAction === "replace") {
        if (typeof value.apiKey !== "string" || !value.apiKey.trim() || value.apiKey.length > 4096 || /[^\x21-\x7e]/.test(value.apiKey)) throw new ModelError("VALIDATION");
        try { encryptedKey = await this.secrets.protect(value.apiKey); } catch { throw new ModelError("SECRET_STORAGE"); }
      }
      const next: StoredSettings = { version: 1, revision: (stored?.revision ?? 0) + 1, config, encryptedKey, updatedAt: new Date().toISOString() };
      const temp = safeFile(this.directory, `model-settings-${randomUUID()}.tmp`);
      try {
        const file = await open(temp, "wx", 0o600);
        try { await file.writeFile(JSON.stringify(next)); await file.sync(); } finally { await file.close(); }
        await rename(temp, safeFile(this.directory, "model-settings.json"));
      } catch { throw new ModelError("SAVE_FAILED"); }
      finally { await rm(temp, { force: true }).catch(() => {}); }
      return this.view(next);
    } finally { this.saving = false; }
  }
}
