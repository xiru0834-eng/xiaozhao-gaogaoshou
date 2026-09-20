import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { startServer } from "../src/server/http.ts";
import type { ModelTransport } from "../src/server/model-client.ts";

const config = { baseUrl: "https://model.example.com/v1", model: "test-model", timeoutSeconds: 10, maxTokens: 512, tokenField: "max_tokens" };
const secrets = { async protect(s: string) { return Buffer.from(s).toString("base64"); }, async unprotect(s: string) { return Buffer.from(s, "base64").toString(); } };
async function fixture(transport: ModelTransport) {
  const dir = await mkdtemp(join(tmpdir(), "model-api-"));
  await writeFile(join(dir, "index.html"), '<meta name="app-token" content="__APP_TOKEN__">');
  const app = await startServer({ dataDir: dir, webDir: dir, port: 0, modelDependencies: { secrets, transport } });
  const page = await (await fetch(app.url)).text();
  const token = page.match(/content="([a-f0-9]{64})"/)![1];
  const health = await (await fetch(app.url + "/health")).json() as { profileId: string };
  const headers = { "X-App-Token": token, "X-Profile-Id": health.profileId, "Content-Type": "application/json" };
  const call = (path: string, body?: unknown, custom: Record<string, string> = headers, signal?: AbortSignal) => fetch(app.url + path, { method: body === undefined ? "GET" : "POST", headers: custom, body: body === undefined ? undefined : JSON.stringify(body), signal });
  return { app, dir, call, headers, async close() { await app.close(); await rm(dir, { recursive: true, force: true }); } };
}
test("model API guards all secrets and calls; save never invokes model, ledger unchanged", async () => {
  let calls = 0;
  let sent = "";
  const f = await fixture(async (_url, _key, payload) => { calls++; sent = payload; return { choices: [{ message: { role: "assistant", content: "test response" } }] }; });
  try {
    const before = await (await f.call("/api/catalog")).text();
    for (const path of ["/api/model-settings", "/api/model-tests", "/api/model-generations"]) {
      const body = path === "/api/model-settings" ? undefined : { expectedRevision: 0, prompt: "hello" };
      assert.equal((await f.call(path, body, {})).status, 403);
      assert.equal((await f.call(path, body, { ...f.headers, Origin: "https://evil.example" })).status, 403);
      assert.equal((await f.call(path, body, { ...f.headers, "X-Profile-Id": "wrong-profile" })).status, 409);
    }
    assert.equal((await f.call("/api/model-tests", { expectedRevision: 0 })).status, 422);
    assert.equal((await f.call("/api/model-settings", { expectedRevision: 0, config, keyAction: "replace", apiKey: "synthetic-api-key" })).status, 200);
    assert.equal(calls, 0);
    const view = await (await f.call("/api/model-settings")).text();
    assert.equal(view.includes("synthetic-api-key"), false);
    assert.equal(view.includes("encryptedKey"), false);
    assert.equal((await f.call("/model-settings.json")).status, 404);
    const response = await f.call("/api/model-tests", { expectedRevision: 1 });
    assert.equal(response.status, 200);
    assert.equal(calls, 1);
    assert.equal(JSON.parse(sent).max_tokens, 64);
    assert.equal((await f.call("/api/model-generations", { expectedRevision: 1, prompt: "我的测试" })).status, 200);
    assert.equal(JSON.parse(sent).messages[0].content, "我的测试");
    assert.equal((await f.call("/api/model-generations", { expectedRevision: 1, prompt: "x".repeat(2001) })).status, 400);
    assert.equal((await f.call("/api/model-tests", { expectedRevision: 0 })).status, 409);
    for (let n = 0; n < 4; n++) assert.equal((await f.call("/api/model-tests", { expectedRevision: 1 })).status, 200);
    assert.equal((await f.call("/api/model-tests", { expectedRevision: 1 })).status, 429);
    assert.equal(calls, 6);
    assert.equal(await (await f.call("/api/catalog")).text(), before);
    assert.deepEqual((await (await f.call("/api/status")).json() as { statuses: object }).statuses, {});
  } finally { await f.close(); }
});

test("concurrent model/save calls fail busy; disconnect aborts provider and releases lock", async () => {
  let started!: () => void;
  const began = new Promise<void>(resolve => { started = resolve; });
  let aborted = false;
  const f = await fixture(async (_url, _key, _payload, signal) => {
    started();
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => { aborted = true; reject(signal.reason); }, { once: true }));
  });
  try {
    await f.call("/api/model-settings", { expectedRevision: 0, config, keyAction: "replace", apiKey: "test-only" });
    const controller = new AbortController();
    const pending = f.call("/api/model-tests", { expectedRevision: 1 }, f.headers, controller.signal).catch(() => {});
    await began;
    assert.equal((await f.call("/api/model-tests", { expectedRevision: 1 })).status, 409);
    assert.equal((await f.call("/api/model-settings", { expectedRevision: 1, config, keyAction: "clear" })).status, 409);
    controller.abort();
    await pending;
    for (let n = 0; n < 50 && !aborted; n++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(aborted, true);
    assert.equal((await f.call("/api/model-settings", { expectedRevision: 1, config, keyAction: "clear" })).status, 200);
  } finally { await f.close(); }
});
