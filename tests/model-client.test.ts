import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { ModelError, type ModelConfig } from "../src/shared/model-contract.ts";
import { publicAddress, resolvePublic, postCompletion, generateText, secureTransport } from "../src/server/model-client.ts";

const config: ModelConfig = { baseUrl: "https://models.example.com/v1", model: "test-chat", timeoutSeconds: 10, maxTokens: 512, tokenField: "max_tokens" };
const code = (expected: string) => (error: unknown) => error instanceof ModelError && error.code === expected;

test("model endpoints reject private/reserved IPv4 and IPv6 and mixed DNS answers", async () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.0.1", "169.254.169.254", "100.64.0.1", "198.18.0.1", "0.0.0.0", "224.0.0.1", "192.0.2.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "2001:db8::1", "2002:7f00:1::", "not-ip"]) assert.equal(publicAddress(address), false, address);
  for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) assert.equal(publicAddress(address), true, address);
  await assert.rejects(resolvePublic("example.com", async () => [{ address: "8.8.8.8", family: 4 }, { address: "127.0.0.1", family: 4 }]), code("UNSAFE_ENDPOINT"));
  await assert.rejects(resolvePublic("example.com", async () => []), code("NETWORK"));
  await assert.rejects(secureTransport(new URL("https://127.0.0.1/v1/chat/completions"), "synthetic", "{}", new AbortController().signal), code("UNSAFE_ENDPOINT"));
  await assert.rejects(secureTransport(new URL("http://8.8.8.8/v1/chat/completions"), "synthetic", "{}", new AbortController().signal), code("UNSAFE_ENDPOINT"));
});

test("real HTTP fixture exercises completion payload, response, HTTP errors and response limit", async () => {
  let mode = "ok";
  let received: Record<string, unknown> = {};
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    received = JSON.parse(Buffer.concat(chunks).toString());
    assert.equal(req.headers.authorization, "Bearer synthetic-fixture-key");
    if (/^\d+$/.test(mode)) { res.writeHead(Number(mode), { Location: "https://elsewhere.invalid" }); res.end("do-not-leak-synthetic-fixture-key"); return; }
    if (mode === "huge") { res.end("x".repeat(1024 * 1024 + 1)); return; }
    if (mode === "broken") { res.end("not json"); return; }
    if (mode === "empty") { res.end(JSON.stringify({ choices: [{ message: { content: null } }] })); return; }
    res.end(JSON.stringify({ model: "served-test-model", choices: [{ message: { role: "assistant", content: "<script>fixture text</script>" }, finish_reason: mode === "length" ? "length" : "stop" }], usage: { prompt_tokens: 9, completion_tokens: 4 } }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const transport = (_url: URL, key: string, payload: string, signal: AbortSignal) => postCompletion(
    handler => request(`http://127.0.0.1:${address.port}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, signal }, handler), payload, signal,
  );
  try {
    const result = await generateText(config, "synthetic-fixture-key", "test prompt", new AbortController().signal, transport);
    assert.equal(result.text, "<script>fixture text</script>");
    assert.equal(result.usage.input, 9);
    assert.equal(received.max_tokens, 512);
    assert.equal(received.stream, false);
    assert.deepEqual(received.messages, [{ role: "user", content: "test prompt" }]);
    await generateText({ ...config, tokenField: "max_completion_tokens" }, "synthetic-fixture-key", "test", new AbortController().signal, transport);
    assert.equal(received.max_completion_tokens, 512);
    assert.equal("max_tokens" in received, false);
    for (const [value, expected] of [["401", "AUTH"], ["403", "AUTH"], ["402", "QUOTA"], ["404", "NOT_FOUND"], ["429", "RATE_LIMIT"], ["500", "UPSTREAM"], ["400", "PARAMETERS"], ["302", "REDIRECT"], ["broken", "PROTOCOL"], ["empty", "EMPTY_RESPONSE"], ["huge", "RESPONSE_LIMIT"]]) {
      mode = value;
      await assert.rejects(generateText(config, "synthetic-fixture-key", "test", new AbortController().signal, transport), code(expected));
    }
    mode = "length";
    assert.equal((await generateText(config, "synthetic-fixture-key", "test", new AbortController().signal, transport)).truncated, true);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("abort and timeout close the upstream connection without retries", async () => {
  let count = 0;
  let received = Promise.withResolvers<void>();
  let closed = Promise.withResolvers<void>();
  const server = createServer((req, res) => { count++; req.resume(); received.resolve(); res.once("close", () => closed.resolve()); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const transport = (_url: URL, _key: string, payload: string, signal: AbortSignal) => postCompletion(handler => request(`http://127.0.0.1:${address.port}`, { method: "POST", signal }, handler), payload, signal);
  try {
    for (const expected of ["TIMEOUT", "CANCELLED"]) {
      received = Promise.withResolvers<void>(); closed = Promise.withResolvers<void>();
      const controller = new AbortController();
      const rejected = assert.rejects(generateText(config, "test", "hello", controller.signal, transport), code(expected));
      // Wait for the wire event, not an arbitrary 100ms under parallel Windows test load.
      await received.promise;
      controller.abort(expected === "TIMEOUT" ? new DOMException("fixture deadline", "TimeoutError") : undefined);
      await rejected; await closed.promise;
    }
    assert.equal(count, 2);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("configured timeout bounds a request without relying on caller timeout", async () => {
  const started = performance.now();
  await assert.rejects(generateText(config, "test-key", "hello", new AbortController().signal,
    async (_url, _key, _payload, signal) => new Promise((_resolve, reject) => {
      // Keep the fixture alive while the production timeout signal fires.
      const timer = setTimeout(() => reject(new Error("fixture failed to time out")), 13000);
      signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
    })), code("TIMEOUT"));
  assert.ok(performance.now() - started < 12500);
});

test("provider output is schema checked and a literal key echo is redacted", async () => {
  const signal = new AbortController().signal;
  for (const raw of [{}, { choices: [] }, { choices: [{ message: { content: [] } }] }, { choices: [{ message: { role: "user", content: "bad" } }] }]) {
    await assert.rejects(generateText(config, "synthetic-echo-key", "hello", signal, async () => raw), code("PROTOCOL"));
  }
  const result = await generateText(config, "synthetic-echo-key", "hello", signal, async () => ({
    model: "synthetic-echo-key", choices: [{ message: { content: "echo synthetic-echo-key" } }], usage: { prompt_tokens: -1, completion_tokens: "12" },
  }));
  assert.equal(result.text, "echo [密钥已隐藏]");
  assert.equal(result.model, config.model);
  assert.deepEqual(result.usage, { input: null, output: null });
});
