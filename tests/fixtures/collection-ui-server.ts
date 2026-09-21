/** Browser QA only: isolated temporary profile, synthetic provider/pages, no remote requests. */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { startServer } from "../../src/server/http.ts";
import { ModelSettings } from "../../src/server/model-settings.ts";
import type { SourceDefinition } from "../../src/shared/collection-contract.ts";
const directory = await mkdtemp(join(tmpdir(), "xiaozhao-collection-browser-"));
const secrets = { protect: async (x: string) => Buffer.from(x).toString("base64"), unprotect: async (x: string) => Buffer.from(x, "base64").toString() };
await new ModelSettings(directory, secrets).save({ expectedRevision: 0, config: { baseUrl: "https://example.org/v1", model: "SYNTHETIC-QA-NO-REAL-MODEL", timeoutSeconds: 10, maxTokens: 1024, tokenField: "max_tokens" }, keyAction: "replace", apiKey: "synthetic-only-no-real-key" });
const sources: SourceDefinition[] = [
  { id: "qa-matched", company: "腾讯", name: "合成测试 · 匹配的 Agent 岗位", kind: "detail", entryUrl: "https://example.org/matched", allowedUrls: ["https://example.org/matched"], verifiedAt: "2026-09-20", note: "非真实招聘；用于验证 UI、证据和确认入库。" },
  { id: "qa-unknown", company: "阿里云", name: "合成测试 · 毕业窗口缺失", kind: "detail", entryUrl: "https://example.org/unknown", allowedUrls: ["https://example.org/unknown"], verifiedAt: "2026-09-20", note: "不会被推荐；用于核验未知字段。" },
  { id: "qa-denied", company: "百度", name: "合成测试 · robots 拒绝", kind: "detail", entryUrl: "https://example.org/denied", allowedUrls: ["https://example.org/denied"], verifiedAt: "2026-09-20", note: "读取被拒绝；不是没有岗位。" },
];
const quotes = (unknown = false) => ({ title: unknown ? "RAG 开发工程师" : "Agent 开发工程师", locations: "北京", graduation: unknown ? null : "2027届毕业生", degree: "硕士及以上", experience: "经验不限", employment: "全职", skills: "RAG / Agent / Python", salary: null, published: null, deadline: null, status: "立即申请" });
const app = await startServer({ dataDir: directory, webDir: resolve("dist/web"), port: 18771,
  modelDependencies: { secrets, transport: async (_url, _key, payload) => { const prompt = JSON.parse(payload).messages[0].content as string; return { choices: [{ message: { content: JSON.stringify({ fields: quotes(prompt.includes("页面标题：RAG")) }) }, finish_reason: "stop" }], usage: { prompt_tokens: 120, completion_tokens: 80 } }; } },
  collectionDependencies: { sources, intervalMs: 0, transport: async (url, signal) => {
    await new Promise<void>((done, reject) => { const timer = setTimeout(done, 150); signal.addEventListener("abort", () => { clearTimeout(timer); reject(new Error("cancel")); }, { once: true }); });
    const fields = quotes(url.pathname === "/unknown");
    return { status: 200, contentType: url.pathname === "/robots.txt" ? "text/plain" : "text/html", location: null, body: url.pathname === "/robots.txt" ? "User-agent: *\nDisallow: /denied\n" : `<main><h1>${fields.title}</h1><p>${Object.values(fields).filter(Boolean).join("\n")}</p><a href="/apply">立即申请</a><p>&lt;script&gt;原文作为文本呈现&lt;/script&gt;</p></main>` };
  } },
});
console.log(`Synthetic collection QA ONLY: ${app.url}\nTemporary profile: ${directory}`);
let stopping = false;
async function stop() { if (stopping) return; stopping = true; await app.close(); await rm(directory, { recursive: true, force: true }); }
process.on("SIGINT", () => void stop()); process.on("SIGTERM", () => void stop());
