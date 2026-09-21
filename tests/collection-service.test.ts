import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CatalogStore } from "../src/server/catalog-store.ts";
import { CollectionService } from "../src/server/collection-service.ts";
import { PreferencesStore } from "../src/server/job-preferences.ts";
import { SourceReader } from "../src/server/source-fetch.ts";
import type { ModelService } from "../src/server/model-service.ts";
import type { SourceTransport } from "../src/server/source-wire.ts";
import type { RunView, SourceDefinition } from "../src/shared/collection-contract.ts";

const sources: SourceDefinition[] = ["one", "two"].map(id => ({ id, company: "腾讯", name: id,
  entryUrl: `https://example.org/${id}`, kind: "detail", allowedUrls: [`https://example.org/${id}`],
  verifiedAt: "2026-09-20", note: "SYNTHETIC ONLY" }));
const fields = { title: "Agent 工程师", locations: "北京", graduation: "2027届", degree: "硕士及以上", experience: "经验不限", employment: "全职", skills: "RAG", salary: null, published: null, deadline: null, status: "立即申请" };
const html = `<main><h1>${fields.title}</h1><p>${Object.values(fields).filter(Boolean).join("\n")}</p><a href="/apply">立即申请</a></main>`;
const allowed: SourceTransport = async url => ({ status: 200, contentType: url.pathname === "/robots.txt" ? "text/plain" : "text/html", location: null, body: url.pathname === "/robots.txt" ? "User-agent: *\nAllow: /" : html });

async function fixture(transport: SourceTransport) {
  const dir = await mkdtemp(join(tmpdir(), "xiaozhao-collection-service-")), backups = join(dir, "backups");
  await mkdir(backups);
  const catalog = new CatalogStore(join(dir, "catalog.db")), store = await catalog.collections(backups, sources), preferences = new PreferencesStore(dir);
  let calls = 0;
  const model = { settings: { read: async () => ({ revision: 1, hasKey: true }) }, extract: async () => {
    calls++; return { text: JSON.stringify({ fields }), truncated: false, usage: { input: 10, output: 20 } };
  } } as unknown as ModelService;
  const service = new CollectionService(store, preferences, sources, model, new SourceReader({ transport, intervalMs: 0 }));
  const wait = async (id: string): Promise<RunView> => {
    for (let i = 0; i < 100; i++) {
      const run = store.run(id); if (!["queued", "running"].includes(run.state)) return run;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error("test run did not terminate");
  };
  return { dir, catalog, store, preferences, service, wait, calls: () => calls, close: async () => { await service.close(); catalog.close(); await rm(dir, { recursive: true, force: true }); } };
}
test("source-only works without valid preferences; all denied is failed, not empty success", async () => {
  const f = await fixture(async () => ({ status: 200, contentType: "text/plain", location: null, body: "User-agent: *\nDisallow: /" }));
  try {
    await writeFile(join(f.dir, "job-preferences.json"), "broken");
    const run = await f.service.start({ mode: "source_only", sourceIds: ["one"], requestId: "denied-request", maxModelCalls: 0 });
    const done = await f.wait(run.id); assert.equal(done.state, "failed"); assert.equal(done.candidates, 0); assert.equal(f.calls(), 0);
  } finally { await f.close(); }
});
test("bounded extraction preserves partial results and never exceeds explicit model budget", async () => {
  const f = await fixture(allowed);
  try {
    await f.preferences.save({ expectedRevision: 0, preferences: { graduationMonth: "2027-01", degree: "master", major: "软件工程", cities: [], includeInternships: false, confirmed: true } });
    const run = await f.service.start({ mode: "extract", sourceIds: ["one", "two"], requestId: "budget-request", maxModelCalls: 1, expectedModelRevision: 1, expectedPreferenceRevision: 1 });
    const done = await f.wait(run.id); assert.equal(done.state, "partial"); assert.equal(done.candidates, 1); assert.equal(f.calls(), 1); assert.equal(f.store.jobs().items.length, 0);
  } finally { await f.close(); }
});
test("cancel aborts actual transport, blocks concurrency and makes no second source request", async () => {
  let entered!: () => void, aborted = false, requests = 0;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const f = await fixture(async (_url, signal) => {
    requests++; entered();
    return new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => { aborted = true; reject(signal.reason); }, { once: true });
    });
  });
  try {
    const input = { mode: "source_only", sourceIds: ["one", "two"], requestId: "cancel-request", maxModelCalls: 0 };
    const run = await f.service.start(input); await started;
    await assert.rejects(f.service.start({ ...input, requestId: "second-request" }), /运行/);
    assert.equal((await f.service.start(input)).id, run.id);
    f.service.cancel(run.id);
    assert.equal((await f.wait(run.id)).state, "cancelled"); assert.equal(aborted, true); assert.equal(requests, 1); assert.equal(f.calls(), 0);
  } finally { await f.close(); }
});
test("storage failure stops collection and exposes a failure rather than an endless running state", async () => {
  let requests = 0;
  const f = await fixture(async (url, signal) => { requests++; return allowed(url, signal); });
  try {
    const save = f.store.saveRun.bind(f.store);
    f.store.saveRun = run => { if (run.state !== "queued") throw Error("synthetic disk write failure"); save(run); };
    const input = { mode: "source_only", sourceIds: ["one"], requestId: "disk-failure", maxModelCalls: 0 };
    const run = await f.service.start(input); await f.service.close();
    assert.equal(f.service.viewRun(f.store.run(run.id)).state, "failed"); assert.equal(requests, 0);
    await assert.rejects(f.service.start({ ...input, requestId: "disk-retry" }), /重启/);
  } finally { await f.close(); }
});

test("shutdown waits for a preparing collection and prevents late work or new runs", async () => {
  let network=0,release!:()=>void,entered!:()=>void;
  const gate=new Promise<void>(r=>{release=r;}),started=new Promise<void>(r=>{entered=r;});
  const f=await fixture(async(url,signal)=>{network++;return allowed(url,signal);});
  const input={mode:'extract',sourceIds:['one'],requestId:'shutdown-preparing',maxModelCalls:1,expectedModelRevision:1,expectedPreferenceRevision:1};
  try {
    f.preferences.read=async()=>{entered();await gate;return {revision:1,preferences:{graduationMonth:'2027-01',degree:'master',major:'软件工程',cities:[],includeInternships:false,confirmed:true}};};
    const pending=f.service.start(input);await started;
    const rejected=assert.rejects(pending,/停止|关闭/);
    let closed=false;const closing=f.service.close().then(()=>{closed=true;});
    await new Promise(r=>setImmediate(r));
    const premature=closed;release();await closing;await rejected;
    assert.equal(premature,false,'must not close the database during startup');
    assert.equal(network,0);assert.equal(f.store.runCount(),0);
    await assert.rejects(f.service.start({...input,requestId:'after-close'}),/停止|关闭/);
  }finally{release();await f.close();}
});
