import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile, chmod } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseModelConfig, ModelError } from "../src/shared/model-contract.ts";
import { ModelSettings } from "../src/server/model-settings.ts";
import { windowsSecrets } from "../src/server/model-secrets.ts";

export const config = {
  baseUrl: "https://models.example.com/v1", model: "example-chat",
  timeoutSeconds: 30, maxTokens: 512, tokenField: "max_tokens",
};
const fakeSecrets = {
  async protect(value: string) { return Buffer.from(value).toString("base64"); },
  async unprotect(value: string) { return Buffer.from(value, "base64").toString(); },
};
const code = (expected: string) => (error: unknown) => error instanceof ModelError && error.code === expected;

test("model configuration normalizes endpoint and rejects unsafe/ambiguous fields", () => {
  assert.equal(parseModelConfig({ ...config, baseUrl: config.baseUrl + "/chat/completions/" }).baseUrl, config.baseUrl);
  for (const baseUrl of ["http://example.com/v1", "https://user:pass@example.com", "https://example.com/?api_key=secret", "https://example.com/#key", "https://example.com/%2e%2e/v1"]) {
    assert.throws(() => parseModelConfig({ ...config, baseUrl }), code("VALIDATION"));
  }
  for (const value of [{ ...config, model: "" }, { ...config, maxTokens: 99999 }, { ...config, timeoutSeconds: 0 }, { ...config, apiKey: "accidental" }]) {
    assert.throws(() => parseModelConfig(value), code("VALIDATION"));
  }
});

test("settings restart, key retention/replacement/clear, revision and endpoint binding", async () => {
  const dir = await mkdtemp(join(tmpdir(), "model-settings-"));
  try {
    const store = new ModelSettings(dir, fakeSecrets);
    assert.equal((await store.read()).revision, 0);
    const saved = await store.save({ expectedRevision: 0, config, keyAction: "replace", apiKey: "synthetic-key-only" });
    assert.equal(saved.hasKey, true);
    assert.equal(JSON.stringify(saved).includes("synthetic-key-only"), false);
    assert.equal((await readFile(join(dir, "model-settings.json"), "utf8")).includes("synthetic-key-only"), false);
    const reopened = new ModelSettings(dir, fakeSecrets);
    assert.equal((await reopened.credentials(1)).apiKey, "synthetic-key-only");
    await assert.rejects(reopened.save({ expectedRevision: 0, config, keyAction: "keep" }), code("CONFLICT"));
    await assert.rejects(reopened.save({ expectedRevision: 1, config: { ...config, baseUrl: "https://other.example.com/v1" }, keyAction: "keep" }), code("KEY_REENTRY"));
    await reopened.save({ expectedRevision: 1, config: { ...config, model: "second" }, keyAction: "keep" });
    assert.equal((await reopened.credentials(2)).apiKey, "synthetic-key-only");
    await reopened.save({ expectedRevision: 2, config, keyAction: "replace", apiKey: "replacement-test-key" });
    assert.equal((await reopened.credentials(3)).apiKey, "replacement-test-key");
    await reopened.save({ expectedRevision: 3, config, keyAction: "clear" });
    await assert.rejects(reopened.credentials(4), code("NOT_CONFIGURED"));
    assert.equal((await reopened.read()).hasKey, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("failed protection preserves previous bytes and concurrent saves cannot both win", async () => {
  const dir = await mkdtemp(join(tmpdir(), "model-atomic-"));
  try {
    const store = new ModelSettings(dir, fakeSecrets);
    await store.save({ expectedRevision: 0, config, keyAction: "replace", apiKey: "test-key" });
    const before = await readFile(join(dir, "model-settings.json"));
    const broken = new ModelSettings(dir, { ...fakeSecrets, async protect() { throw new Error("secret internal"); } });
    await assert.rejects(broken.save({ expectedRevision: 1, config, keyAction: "replace", apiKey: "new" }), code("SECRET_STORAGE"));
    assert.deepEqual(await readFile(join(dir, "model-settings.json")), before);
    const results = await Promise.allSettled([1, 2].map(() => store.save({ expectedRevision: 1, config, keyAction: "keep" })));
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    await writeFile(join(dir, "model-settings.json"), "{broken");
    await assert.rejects(store.read(), code("SETTINGS_CORRUPT"));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("real Windows DPAPI round trip uses synthetic input, rejects corrupt ciphertext", { skip: process.platform !== "win32" }, async () => {
  const value = "synthetic-test-key-中文-not-a-credential";
  const ciphertext = await windowsSecrets.protect(value);
  assert.equal(ciphertext.includes(value), false);
  assert.equal(await windowsSecrets.unprotect(ciphertext), value);
  await assert.rejects(windowsSecrets.unprotect("invalid"));
});

test("Windows read-only target rejects replacement and preserves the previous configuration", { skip: process.platform !== "win32" }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "model-save-failure-"));
  const path = join(dir, "model-settings.json");
  try {
    const store = new ModelSettings(dir, fakeSecrets);
    await store.save({ expectedRevision: 0, config, keyAction: "replace", apiKey: "synthetic-readonly-test" });
    const before = await readFile(path);
    await chmod(path, 0o444);
    await assert.rejects(store.save({ expectedRevision: 1, config: { ...config, model: "changed" }, keyAction: "keep" }), code("SAVE_FAILED"));
    assert.deepEqual(await readFile(path), before);
    assert.equal((await store.read()).revision, 1);
  } finally { await chmod(path, 0o666).catch(() => {}); await rm(dir, { recursive: true, force: true }); }
});
