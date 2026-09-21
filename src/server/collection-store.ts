import type { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { CollectionError, JOB_FIELDS, exactKeys, integer, record, type Candidate, type JobDraft, type RunView, type SourceDefinition, type SourceDocument } from "../shared/collection-contract.ts";
import { normalizedName, type NewCompany } from "../shared/catalog-contract.ts";

export const COLLECTION_SCHEMA = `
CREATE TABLE sources(id TEXT PRIMARY KEY, json TEXT NOT NULL);
CREATE TABLE collection_runs(id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, json TEXT NOT NULL);
CREATE TABLE evidence(id TEXT PRIMARY KEY, json TEXT NOT NULL);
CREATE TABLE jobs(key TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), json TEXT NOT NULL);
CREATE TABLE update_candidates(id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES collection_runs(id), json TEXT NOT NULL);
CREATE TABLE job_observations(sequence INTEGER PRIMARY KEY, job_key TEXT NOT NULL REFERENCES jobs(key), candidate_id TEXT NOT NULL, json TEXT NOT NULL);
CREATE TABLE acceptance_receipts(request_id TEXT PRIMARY KEY, input TEXT NOT NULL, result TEXT NOT NULL);
INSERT INTO metadata VALUES ('collection_revision',0);`;

// New navigation text can shift evidence offsets without changing the actual job.
function comparable(job: JobDraft) { return JSON.stringify([JOB_FIELDS.map(key => job.fields[key]?.quote ?? null), job.assessment, job.applicationUrl, job.company]); }
export class CollectionStore {
  private readonly db: DatabaseSync;
  private readonly sources: Map<string, SourceDefinition>;
  private readonly appendCompany: (value: NewCompany) => { id: string; inserted: boolean };
  constructor(db: DatabaseSync, sources: SourceDefinition[], appendCompany: (value: NewCompany) => { id: string; inserted: boolean }) {
    this.db = db; this.sources = new Map(sources.map(s => [s.id, s])); this.appendCompany = appendCompany;
    for (const s of sources) db.prepare("INSERT INTO sources VALUES (?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json").run(s.id, JSON.stringify(s));
    for (const row of db.prepare("SELECT json FROM collection_runs").all()) {
      const run = JSON.parse(String(row.json)) as RunView;
      if (["queued", "running"].includes(run.state)) this.saveRun({ ...run, state: "interrupted", finishedAt: new Date().toISOString(), errors: [...run.errors, "上次进程中断。不会自动重新请求网站或模型。"] });
    }
  }
  revision() { return Number(this.db.prepare("SELECT value FROM metadata WHERE key='collection_revision'").get()?.value); }
  checkCapacity() { if (Number(this.db.prepare("SELECT count(*) AS n FROM collection_runs").get()?.n) >= 1000) throw new CollectionError("LIMIT", "本地已保存 1000 次采集，请先导出归档；不会自动删除历史。", 409); }
  candidate(id: string): Candidate {
    const row = this.db.prepare("SELECT json FROM update_candidates WHERE id=?").get(id);
    if (!row) throw new CollectionError("NOT_FOUND", "候选不存在。", 404);
    return JSON.parse(String(row.json)) as Candidate;
  }
  catalogRevision() { return Number(this.db.prepare("SELECT value FROM metadata WHERE key='revision'").get()?.value); }
  saveRun(run: RunView) {
    this.db.prepare("INSERT INTO collection_runs VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json").run(run.id, run.input.requestId, JSON.stringify(run));
  }
  findRequest(id: string): RunView | null {
    const row = this.db.prepare("SELECT json FROM collection_runs WHERE request_id=?").get(id);
    return row ? JSON.parse(String(row.json)) as RunView : null;
  }
  runs(offset = 0, limit = 100): RunView[] { return this.db.prepare("SELECT json FROM collection_runs ORDER BY rowid DESC LIMIT ? OFFSET ?").all(limit, offset).map(r => JSON.parse(String(r.json)) as RunView); }
  runCount() { return Number(this.db.prepare("SELECT count(*) AS n FROM collection_runs").get()?.n); }
  run(id: string): RunView {
    const row = this.db.prepare("SELECT json FROM collection_runs WHERE id=?").get(id);
    if (!row) throw new CollectionError("NOT_FOUND", "采集记录不存在。", 404);
    return JSON.parse(String(row.json)) as RunView;
  }
  saveEvidence(id: string, doc: SourceDocument) { this.db.prepare("INSERT INTO evidence VALUES (?,?)").run(id, JSON.stringify(doc)); }
  evidence(id: string): SourceDocument {
    const row = this.db.prepare("SELECT json FROM evidence WHERE id=?").get(id);
    if (!row) throw new CollectionError("NOT_FOUND", "原文快照不存在。", 404);
    return JSON.parse(String(row.json)) as SourceDocument;
  }
  private company(name: string): string | null {
    const row = this.db.prepare("SELECT company_id FROM aliases WHERE key=?").get(normalizedName(name));
    return row ? String(row.company_id) : null;
  }
  private existing(key: string): JobDraft | null {
    const row = this.db.prepare("SELECT json FROM jobs WHERE key=?").get(key);
    return row ? JSON.parse(String(row.json)) as JobDraft : null;
  }
  jobs(offset = 0, limit = 100) { return { revision: this.revision(), total: Number(this.db.prepare("SELECT count(*) AS n FROM jobs").get()?.n), items: this.db.prepare("SELECT json FROM jobs ORDER BY rowid DESC LIMIT ? OFFSET ?").all(limit, offset).map(row => JSON.parse(String(row.json)) as JobDraft) }; }
  propose(runId: string, job: JobDraft): Candidate {
    const previous = this.existing(job.key), source = this.sources.get(job.sourceId);
    const kind = !previous ? "new" : comparable(previous) === comparable(job) ? "duplicate" : "changed";
    const canAccept = !!source && (!!this.company(job.company) || !!source.companyRecord) && kind !== "duplicate";
    const candidate: Candidate = { id: randomUUID(), runId, kind: canAccept || kind === "duplicate" ? kind : "review", job, previous, canAccept, accepted: false };
    this.db.prepare("INSERT INTO update_candidates VALUES (?,?,?)").run(candidate.id, runId, JSON.stringify(candidate));
    return candidate;
  }
  candidates(runId: string): Candidate[] { return this.db.prepare("SELECT json FROM update_candidates WHERE run_id=? ORDER BY rowid").all(runId).map(r => JSON.parse(String(r.json)) as Candidate); }
  accept(input: unknown) {
    const value = record(input); exactKeys(value, ["requestId", "candidateIds", "expectedRevision", "expectedCatalogRevision"]);
    if (typeof value.requestId !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(value.requestId) || !Array.isArray(value.candidateIds) || !value.candidateIds.length || value.candidateIds.length > 30 || new Set(value.candidateIds).size !== value.candidateIds.length || value.candidateIds.some(i => typeof i !== "string" || i.length > 100)) throw new CollectionError("VALIDATION", "请选择有效候选，最多 30 条。");
    integer(value.expectedRevision); integer(value.expectedCatalogRevision);
    const serialized = JSON.stringify({ requestId: value.requestId, candidateIds: [...value.candidateIds].sort(), expectedRevision: value.expectedRevision, expectedCatalogRevision: value.expectedCatalogRevision });
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const receipt = this.db.prepare("SELECT input,result FROM acceptance_receipts WHERE request_id=?").get(value.requestId);
      if (receipt) {
        if (receipt.input !== serialized) throw new CollectionError("CONFLICT", "重复请求的内容不一致。", 409);
        this.db.exec("COMMIT"); return JSON.parse(String(receipt.result)) as { accepted: number; revision: number; companiesAdded: number };
      }
      if (this.revision() !== value.expectedRevision || this.catalogRevision() !== value.expectedCatalogRevision) throw new CollectionError("CONFLICT", "台账已变化，请重新查看差异后确认。", 409);
      let companiesAdded = 0;
      for (const id of value.candidateIds as string[]) {
        const row = this.db.prepare("SELECT json FROM update_candidates WHERE id=?").get(id);
        if (!row) throw new CollectionError("NOT_FOUND", "候选不存在，整批未写入。", 404);
        const candidate = JSON.parse(String(row.json)) as Candidate;
        if (!candidate.canAccept || candidate.accepted) throw new CollectionError("CONFLICT", "候选不可接受或已经入库。", 409);
        if (["queued", "running"].includes(this.run(candidate.runId).state)) throw new CollectionError("CONFLICT", "采集尚未结束，请先等待或取消。", 409);
        const { job } = candidate, current = this.existing(job.key);
        if ((current === null) !== (candidate.previous === null) || (current && comparable(current) !== comparable(candidate.previous!))) throw new CollectionError("CONFLICT", "岗位已变化，请重新采集比较。", 409);
        const evidence = this.evidence(job.evidenceId);
        if (!Number.isFinite(Date.parse(evidence.checkedAt)) || Date.now() - Date.parse(evidence.checkedAt) > 86400000) throw new CollectionError("STALE", "候选原文已超过 24 小时，请重新检查后收录。", 409);
        const source = this.sources.get(job.sourceId);
        const quotesValid = JOB_FIELDS.every(key => {
          const quote = job.fields[key];
          return quote === null || (!!quote && Number.isInteger(quote.start) && Number.isInteger(quote.end) && quote.start >= 0 && quote.end > quote.start && quote.end <= evidence.text.length && evidence.text.slice(quote.start, quote.end) === quote.quote);
        });
        if (evidence.state !== "readable" || evidence.sourceId !== job.sourceId || source?.company !== job.company || source.entryUrl !== job.url || !source.allowedUrls.includes(evidence.url) || evidence.hash !== createHash("sha256").update(evidence.text).digest("hex") || !quotesValid || job.fields.title?.quote !== evidence.title || (job.applicationUrl !== null && !evidence.links.some(link => link.url === job.applicationUrl))) throw new CollectionError("EVIDENCE", "原文或字段证据不可核验，整批未写入。", 409);
        let companyId = this.company(job.company);
        if (!companyId) {
          const trusted = this.sources.get(job.sourceId)?.companyRecord;
          if (!trusted || trusted.row[0] !== job.company) throw new CollectionError("REVIEW", "公司性质尚未核验，不能自动新增。", 409);
          const appended = this.appendCompany(trusted); companyId = appended.id;
          companiesAdded += Number(appended.inserted);
        }
        const next = { ...job, firstSeenAt: current?.firstSeenAt ?? job.firstSeenAt };
        this.db.prepare("INSERT INTO jobs VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET json=excluded.json").run(job.key, companyId, JSON.stringify(next));
        this.db.prepare("INSERT INTO job_observations(job_key,candidate_id,json) VALUES (?,?,?)").run(job.key, id, JSON.stringify(next));
        this.db.prepare("UPDATE update_candidates SET json=? WHERE id=?").run(JSON.stringify({ ...candidate, accepted: true }), id);
      }
      this.db.exec("UPDATE metadata SET value=value+1 WHERE key='collection_revision'");
      const result = { accepted: value.candidateIds.length, revision: this.revision(), companiesAdded };
      this.db.prepare("INSERT INTO acceptance_receipts VALUES (?,?,?)").run(value.requestId, serialized, JSON.stringify(result));
      this.db.exec("COMMIT"); return result;
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
}
