import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { gzipSync } from "node:zlib";
import { readWire, secureSourceUrl } from "../src/server/source-wire.ts";
import { SourceReader } from "../src/server/source-fetch.ts";
import type { SourceDefinition } from "../src/shared/collection-contract.ts";
import { parseSourceHtml } from "../src/server/source-document.ts";

test("semantic job headers inside main remain evidence while site banners are excluded", () => {
  const parsed = parseSourceHtml('<header><h1>Company Navigation</h1></header><main><article><header><h1>Agent 工程师</h1><p>2027届</p></header><p>硕士以上，经验不限，全职研发</p></article></main>', "https://example.org/job");
  assert.equal(parsed.title, "Agent 工程师"); assert.ok(parsed.text.includes("2027届")); assert.ok(!parsed.text.includes("Company Navigation"));
});

test("hidden headings and application anchors do not become evidence", () => {
  const parsed = parseSourceHtml('<main><div hidden><h1>Fake</h1><a href="/fake">立即申请</a></div><h1>Agent 工程师</h1><div style="display:none"><a href="/hidden">投递简历</a></div><a href="https://127.0.0.1/apply">立即申请</a><p>2027届 硕士 全职</p></main>', "https://example.org/job");
  assert.equal(parsed.title, "Agent 工程师"); assert.deepEqual(parsed.links, []); assert.ok(!parsed.text.includes("Fake"));
});

const source: SourceDefinition = { id: "fixture", company: "合成公司", name: "合成来源", kind: "detail", entryUrl: "https://jobs.example.com/job/1", allowedUrls: ["https://jobs.example.com/job/1", "https://jobs.example.com/job/2"], verifiedAt: "2026-09-20", note: "合成测试" };
const html = '<main><h1>Agent 开发工程师</h1><p>2027届，本科及以上；经验不限；北京。</p><script>window.secret="not text";</script><a href="/apply/1">申请岗位</a></main>';
test("source URL scope rejects private, credentialed and unregistered paths without transport", () => {
  assert.equal(secureSourceUrl(source, source.entryUrl).href, source.entryUrl);
  for (const url of ["http://jobs.example.com/job/1", "https://jobs.example.com/job/1?token=secret", "https://evil.example/job/1", "https://127.0.0.1/", "https://user:pass@jobs.example.com/job/1"]) assert.throws(() => secureSourceUrl(source, url));
});
test("robots denial, unknown and unsafe redirect stop before fetching content", async () => {
  for (const body of ["User-agent: *\nDisallow: /job/", "<html>not robots</html>"]) {
    let calls = 0;
    const reader = new SourceReader({ intervalMs: 0, transport: async () => { calls++; return { status: 200, body, contentType: "text/plain", location: null }; } });
    const doc = await reader.read(source, new AbortController().signal);
    assert.ok(["robots_denied", "robots_unknown"].includes(doc.state));
    assert.equal(calls, 1);
  }
  let calls = 0;
  const reader = new SourceReader({ intervalMs: 0, transport: async url => { calls++; return url.pathname === "/robots.txt" ? { status: 404, body: "", contentType: "text/plain", location: null } : { status: 302, body: "", contentType: "text/html", location: "http://169.254.169.254/latest" }; } });
  assert.equal((await reader.read(source, new AbortController().signal)).state, "unsafe_url");
  assert.equal(calls, 2);
});
test("successful source extraction strips executable/navigation content and binds stable evidence", async () => {
  const reader = new SourceReader({ intervalMs: 0, transport: async url => ({ status: 200, body: url.pathname === "/robots.txt" ? "User-agent: *\nAllow: /" : html, contentType: url.pathname === "/robots.txt" ? "text/plain" : "text/html; charset=utf-8", location: null }) });
  const doc = await reader.read(source, new AbortController().signal);
  assert.equal(doc.state, "readable");
  assert.equal(doc.title, "Agent 开发工程师");
  assert.ok(doc.text.includes("2027届"));
  assert.ok(!doc.text.includes("secret"));
  assert.equal(doc.links[0].url, "https://jobs.example.com/apply/1");
  assert.match(doc.hash, /^[a-f0-9]{64}$/);
  assert.equal(doc.requests, 2);
});
test("network and HTTP failures are never classified as job closure", async () => {
  for (const status of [401, 403, 404, 429, 500]) {
    const reader = new SourceReader({ intervalMs: 0, transport: async url => ({ status: url.pathname === "/robots.txt" ? 404 : status, body: "", contentType: "text/html", location: null }) });
    const doc = await reader.read(source, new AbortController().signal);
    assert.equal(doc.state, status === 401 || status === 403 ? "login_required" : "http_error");
    assert.equal(doc.text, "");
  }
});
test("actual wire parser limits decompressed bytes and handles cancellation and charset", async () => {
  const server = createServer((req, res) => {
    if (req.url === "/slow") return;
    res.writeHead(200, { "content-type": req.url === "/bad" ? "text/html; charset=x-invalid" : "text/html; charset=utf-8", "content-encoding": "gzip" });
    res.end(gzipSync(req.url === "/big" ? "x".repeat(4096) : html));
  });
  await new Promise<void>(done => server.listen(0, "127.0.0.1", done));
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const read = (path: string, signal = new AbortController().signal) => readWire(handler => request(`http://127.0.0.1:${address.port}${path}`, handler), signal, 2048);
  try {
    assert.equal((await read("/")).body, html);
    await assert.rejects(read("/big"), /大小/);
    await assert.rejects(read("/bad"), /编码/);
    await assert.rejects(read("/slow", AbortSignal.timeout(30)), /超时/);
  } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
});
