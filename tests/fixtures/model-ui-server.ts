/** Manual browser QA only. No real keys, remote network or user data. */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer, request } from "node:http";
import { startServer } from "../../src/server/http.ts";
import { postCompletion } from "../../src/server/model-client.ts";

const directory = await mkdtemp(join(tmpdir(), "xiaozhao-model-browser-"));
const provider = createServer(async (req, res) => {
  const chunks = [];
  for await (const part of req) chunks.push(part);
  const payload = JSON.parse(Buffer.concat(chunks).toString());
  const prompt = payload.messages[0].content as string;
  if (payload.model === "fixture-error-401") { res.writeHead(401); res.end("fixture error"); return; }
  const reply = () => {
    if (!res.destroyed) res.end(JSON.stringify({ model: "fixture-chat-only", choices: [{ message: { role: "assistant", content: `【本机合成测试，不是真实模型】\n已收到：${prompt}\n<script>这是文本，不应执行</script>` }, finish_reason: "stop" }], usage: { prompt_tokens: 16, completion_tokens: 24 } }));
  };
  if (prompt === "模拟等待") {
    const timer = setTimeout(reply, 20000);
    res.on("close", () => clearTimeout(timer));
  } else reply();
});
await new Promise<void>(resolveReady => provider.listen(0, "127.0.0.1", resolveReady));
const address = provider.address();
if (!address || typeof address === "string") throw new Error("No fixture port");
const app = await startServer({ dataDir: directory, webDir: resolve("dist/web"), port: 18769, modelDependencies: {
  transport: (_url, key, payload, signal) => postCompletion(handler => request(`http://127.0.0.1:${address.port}`, { method: "POST", signal, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }, handler), payload, signal),
} });
console.log(`Synthetic model QA: ${app.url}\nIsolated temporary data: ${directory}`);
let stopping = false;
async function close() {
  if (stopping) return;
  stopping = true;
  await app.close(); provider.closeAllConnections();
  await new Promise<void>(done => provider.close(() => done()));
  await rm(directory, { recursive: true, force: true });
}
process.on("SIGINT", () => void close());
process.on("SIGTERM", () => void close());
