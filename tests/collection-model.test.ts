import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ModelSettings } from "../src/server/model-settings.ts";
import { ModelService } from "../src/server/model-service.ts";
import { extractJob } from "../src/server/job-extract.ts";
import { PreferencesStore } from "../src/server/job-preferences.ts";
import type { SourceDefinition, SourceDocument } from "../src/shared/collection-contract.ts";
const source: SourceDefinition = { id: "test-source", company: "合成公司", name: "测试", entryUrl: "https://example.com/job", allowedUrls: ["https://example.com/job"], kind: "detail", note: "synthetic", verifiedAt: "2026-09-20" };
const fields = { title: "Agent 工程师", locations: "北京", graduation: "2027届", degree: "硕士及以上", experience: "经验不限", employment: "全职", skills: "RAG", salary: null, published: null, deadline: null, status: "立即申请" };
const doc: SourceDocument = { sourceId: source.id, url: source.entryUrl, text: Object.values(fields).filter(Boolean).join("\n"), title: fields.title, state: "readable", httpStatus: 200, checkedAt: "2026-09-20T00:00:00Z", hash: "a".repeat(64), message: "", links: [{ text: "立即申请", url: "https://example.com/apply" }], requests: 2 };
test("preference saves are confirmed, versioned and survive reopening; corrupt state is not overwritten", async () => {
  const dir = await mkdtemp(join(tmpdir(), "xiaozhao-preferences-"));
  try {
    const prefs = new PreferencesStore(dir);
    assert.equal((await prefs.read()).preferences, null);
    const preferences = { graduationMonth: "2027-01", degree: "master", major: "软件工程", cities: [], includeInternships: false, confirmed: true };
    const saved = await prefs.save({ expectedRevision: 0, preferences });
    assert.equal(saved.revision, 1);
    assert.deepEqual(await new PreferencesStore(dir).read(), saved);
    await assert.rejects(prefs.save({ expectedRevision: 0, preferences }), /已更新/);
    await assert.rejects(prefs.save({ expectedRevision: 1, preferences: { ...preferences, phone: "never stored" } }));
    await writeFile(join(dir, "job-preferences.json"), "broken");
    await assert.rejects(prefs.save({ expectedRevision: 1, preferences }), /损坏/);
    assert.equal(await readFile(join(dir, "job-preferences.json"), "utf8"), "broken");
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test("internal extraction uses public evidence, shares model safety, rejects hallucination/truncation", async () => {
  const dir = await mkdtemp(join(tmpdir(), "xiaozhao-extract-"));
  const settings = new ModelSettings(dir, { protect: async x => Buffer.from(x).toString("base64"), unprotect: async x => Buffer.from(x, "base64").toString() });
  let mode = "ok", calls = 0;
  const model = new ModelService(settings, async (_url, _key, payload) => {
    calls++; const input = JSON.parse(payload); assert.ok(input.messages[0].content.includes(doc.text));
    assert.ok(!input.messages[0].content.includes("软件工程"));
    return { choices: [{ message: { content: JSON.stringify({ fields: mode === "fake" ? { ...fields, degree: "博士" } : fields }) }, finish_reason: mode === "length" ? "length" : "stop" }] };
  });
  try {
    await model.save({ expectedRevision: 0, config: { baseUrl: "https://example.com/v1", model: "fixture", timeoutSeconds: 10, maxTokens: 512, tokenField: "max_tokens" }, keyAction: "replace", apiKey: "synthetic-not-real" });
    const result = await extractJob(source, doc, model, 1, new AbortController().signal);
    assert.equal(result.fields.title?.quote, fields.title);
    assert.equal(result.applicationUrl, "https://example.com/apply");
    mode = "fake"; await assert.rejects(extractJob(source, doc, model, 1, new AbortController().signal), /原文/);
    mode = "length"; await assert.rejects(extractJob(source, doc, model, 1, new AbortController().signal), /截断/);
    await assert.rejects(model.run({ expectedRevision: 1, prompt: "x".repeat(2001) }, false, new AbortController().signal));
    assert.equal(calls, 3);
  } finally { model.dispose(); await rm(dir, { recursive: true, force: true }); }
});
