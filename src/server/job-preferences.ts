import { open, readFile, rename, rm, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { CollectionError, exactKeys, integer, parsePreferences, record, type PreferencesView } from "../shared/collection-contract.ts";
import { safeFile } from "./runtime-config.ts";

export class PreferencesStore {
  private readonly directory: string;
  private saving = false;
  constructor(directory: string) { this.directory = directory; }
  async read(): Promise<PreferencesView> {
    try {
      const path = safeFile(this.directory, "job-preferences.json");
      if ((await stat(path)).size > 65536) throw new Error("size");
      const value = record(JSON.parse(await readFile(path, "utf8")));
      exactKeys(value, ["revision", "preferences"]);
      return { revision: integer(value.revision, 1), preferences: parsePreferences(value.preferences) };
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return { revision: 0, preferences: null };
      throw new CollectionError("PREFERENCES_CORRUPT", "求职偏好文件损坏，未覆盖原文件。", 409);
    }
  }
  async save(input: unknown): Promise<PreferencesView> {
    if (this.saving) throw new CollectionError("CONFLICT", "偏好已更新，请刷新后重试。", 409);
    this.saving = true;
    let temp: string | undefined;
    try {
      const value = record(input); exactKeys(value, ["expectedRevision", "preferences"]);
      const preferences = parsePreferences(value.preferences), previous = await this.read();
      if (integer(value.expectedRevision) !== previous.revision) throw new CollectionError("CONFLICT", "偏好已更新，请刷新后重试。", 409);
      const next = { revision: previous.revision + 1, preferences };
      temp = safeFile(this.directory, `job-preferences-${randomUUID()}.tmp`);
      const file = await open(temp, "wx", 0o600);
      try { await file.writeFile(JSON.stringify(next)); await file.sync(); } finally { await file.close(); }
      await rename(temp, safeFile(this.directory, "job-preferences.json"));
      return next;
    } finally {
      this.saving = false;
      if (temp) await rm(temp, { force: true }).catch(() => {});
    }
  }
}
