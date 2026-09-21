import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startServer } from "../src/server/http.ts";
import type { SourceDefinition, RunView } from "../src/shared/collection-contract.ts";
const fields = { title: "Agent 工程师", locations: "北京", graduation: "2027届", degree: "硕士及以上", experience: "经验不限", employment: "全职", skills: "RAG", salary: null, published: null, deadline: null, status: "立即申请" };
const source: SourceDefinition = { id: "fixture-api", company: "腾讯", name: "Synthetic API", entryUrl: "https://example.org/job", kind: "detail", allowedUrls: ["https://example.org/job"], verifiedAt: "2026-09-20", note: "SYNTHETIC ONLY" };
test("manual collection HTTP flow isolates profile, previews before accept, deduplicates requests and preserves progress", async () => {
  const dir = await mkdtemp(join(tmpdir(), "xiaozhao-collection-api-")), web = join(dir, "web"); await mkdir(web);
  await writeFile(join(web, "index.html"), '<meta name="app-token" content="__APP_TOKEN__"><meta name="profile-id" content="__PROFILE_ID__">');
  let calls = 0;
  const app = await startServer({ dataDir: join(dir, "data"), webDir: web, port: 0,
    modelDependencies: { secrets: { protect: async x => Buffer.from(x).toString("base64"), unprotect: async x => Buffer.from(x, "base64").toString() }, transport: async () => { calls++; return { choices: [{ message: { content: JSON.stringify({ fields }) }, finish_reason: "stop" }] }; } },
    collectionDependencies: { sources: [source], intervalMs: 0, transport: async url => ({ status: 200, contentType: url.pathname === "/robots.txt" ? "text/plain" : "text/html", location: null, body: url.pathname === "/robots.txt" ? "User-agent: *\nAllow: /" : `<main><h1>${fields.title}</h1><p>${Object.values(fields).filter(Boolean).join("\n")}</p><a href="/apply">立即申请</a></main>` }) },
  });
  try {
    const page = await (await fetch(app.url)).text(), health = await (await fetch(app.url + "/health")).json() as { profileId: string };
    const headers = { "Content-Type": "application/json", "X-App-Token": page.match(/app-token" content="([a-f0-9]+)"/)![1], "X-Profile-Id": health.profileId };
    const get = async (path: string) => (await fetch(app.url + path, { headers })).json() as Promise<any>;
    const post = (path: string, body: unknown) => fetch(app.url + path, { method: "POST", headers, body: JSON.stringify(body) });
    assert.equal((await fetch(app.url + "/api/sources")).status, 403);
    assert.equal((await fetch(app.url + "/api/sources", { headers: { ...headers, "X-Profile-Id": "wrong" } })).status, 409);
    assert.equal((await fetch(app.url + "/api/sources", { headers: { ...headers, Origin: "https://evil.example" } })).status, 403);
    await post("/api/status", { updates: { 腾讯: "面试" } });
    const original = await get("/api/catalog");
    await post("/api/job-preferences", { expectedRevision: 0, preferences: { graduationMonth: "2027-01", degree: "master", major: "软件工程", cities: [], includeInternships: false, confirmed: true } });
    await post("/api/model-settings", { expectedRevision: 0, config: { baseUrl: "https://example.org/v1", model: "fixture", timeoutSeconds: 10, maxTokens: 512, tokenField: "max_tokens" }, keyAction: "replace", apiKey: "synthetic-test" });
    const input = { mode: "extract", sourceIds: [source.id], requestId: "manual-request-1", maxModelCalls: 1, expectedModelRevision: 1, expectedPreferenceRevision: 1 };
    const response = await post("/api/collection-runs", input); assert.equal(response.status, 202);
    const { run: created } = await response.json() as { run: RunView };
    let run = created;
    for (let i = 0; i < 100 && ["queued", "running"].includes(run.state); i++) { await new Promise(r => setTimeout(r, 10)); run = (await get("/api/collection-runs/" + created.id)).run; }
    assert.equal(run.state, "completed"); assert.equal(run.candidates, 1); assert.equal(calls, 1);
    assert.equal((await post("/api/collection-runs", input)).status, 202); assert.equal(calls, 1);
    assert.equal((await post("/api/collection-runs", { ...input, maxModelCalls: 2 })).status, 409);
    const batch = await get("/api/update-batches/" + run.id); assert.equal(batch.candidates.length, 1);
    assert.equal(batch.candidates[0].job.assessment.recommended, true);
    assert.equal((await get("/api/jobs")).items.length, 0); assert.deepEqual(await get("/api/catalog"), original);
    const accept = { requestId: "accept-request-1", candidateIds: [batch.candidates[0].id], expectedRevision: batch.revision, expectedCatalogRevision: batch.catalogRevision };
    assert.equal((await post("/api/update-batches/accept", accept)).status, 200);
    assert.equal((await post("/api/update-batches/accept", accept)).status, 200);
    assert.equal((await get("/api/jobs")).items.length, 1);
    assert.equal((await get("/api/jobs?limit=1&offset=1")).items.length, 0);
    assert.equal((await get("/api/jobs?limit=1&offset=1")).total, 1);
    assert.equal((await fetch(app.url + "/api/jobs?limit=101", { headers })).status, 400);
    assert.deepEqual((await get("/api/status")).statuses, { 腾讯: "面试" });
    assert.deepEqual(await get("/api/catalog"), original);
    assert.equal((await post("/api/collection-runs", { ...input, requestId: "manual-request-2", sourceIds: ["arbitrary"] })).status, 400);
    assert.equal((await get("/api/sources")).sources.length, 1);
  } finally { await app.close(); await rm(dir, { recursive: true, force: true }); }
});
