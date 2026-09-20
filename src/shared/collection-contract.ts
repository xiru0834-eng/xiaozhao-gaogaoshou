/** Phase 3 boundaries. External pages and model output never carry persistence authority. */
export class CollectionError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) { super(message); this.code = code; this.status = status; }
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CollectionError("VALIDATION", "请求格式不正确。");
  return value as Record<string, unknown>;
}
export function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new CollectionError("VALIDATION", "请求包含不支持的字段。");
}
export function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) throw new CollectionError("VALIDATION", "数值范围不正确。");
  return value as number;
}
export interface JobPreferences {
  graduationMonth: string;
  degree: "bachelor" | "master" | "doctor";
  major: string;
  cities: string[];
  includeInternships: boolean;
  confirmed: true;
}
export interface PreferencesView { revision: number; preferences: JobPreferences | null }
export function parsePreferences(input: unknown): JobPreferences {
  const v = record(input);
  exactKeys(v, ["graduationMonth", "degree", "major", "cities", "includeInternships", "confirmed"]);
  if (typeof v.graduationMonth !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(v.graduationMonth) || !["bachelor", "master", "doctor"].includes(String(v.degree)) || typeof v.major !== "string" || !v.major.trim() || v.major.length > 80 || !Array.isArray(v.cities) || v.cities.length > 10 || v.cities.some(c => typeof c !== "string" || !c.trim() || c.length > 40) || typeof v.includeInternships !== "boolean" || v.confirmed !== true) throw new CollectionError("VALIDATION", "请核对毕业月份、学历、专业和城市，并确认条件。");
  return { graduationMonth: v.graduationMonth, degree: v.degree as JobPreferences["degree"], major: v.major.trim(), cities: [...new Set(v.cities.map(c => (c as string).trim()))], includeInternships: v.includeInternships, confirmed: true };
}
export type RunState = "queued" | "running" | "completed" | "partial" | "failed" | "cancelled" | "interrupted";
export interface RunInput {
  mode: "source_only" | "extract";
  sourceIds: string[];
  requestId: string;
  maxModelCalls: number;
  expectedModelRevision?: number;
  expectedPreferenceRevision?: number;
}
export function parseRunInput(input: unknown): RunInput {
  const v = record(input);
  exactKeys(v, ["mode", "sourceIds", "requestId", "maxModelCalls", "expectedModelRevision", "expectedPreferenceRevision"]);
  if (!["source_only", "extract"].includes(String(v.mode)) || !Array.isArray(v.sourceIds) || v.sourceIds.length < 1 || v.sourceIds.length > 3 || new Set(v.sourceIds).size !== v.sourceIds.length || v.sourceIds.some(s => typeof s !== "string" || !/^[a-z0-9-]{1,80}$/.test(s)) || typeof v.requestId !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(v.requestId)) throw new CollectionError("VALIDATION", "请选择 1–3 个已支持来源。");
  const mode = v.mode as RunInput["mode"];
  const maxModelCalls = integer(v.maxModelCalls, 0, mode === "source_only" ? 0 : 3);
  return { mode, sourceIds: v.sourceIds as string[], requestId: v.requestId, maxModelCalls, ...(mode === "extract" ? { expectedModelRevision: integer(v.expectedModelRevision), expectedPreferenceRevision: integer(v.expectedPreferenceRevision, 1) } : {}) };
}
export interface EvidenceQuote { quote: string; start: number; end: number }
export function evidenceQuote(body: string, quote: unknown): EvidenceQuote {
  if (typeof quote !== "string" || !quote.trim() || quote.length > 1000) throw new CollectionError("EVIDENCE", "字段缺少可核对的原文。");
  const start = body.indexOf(quote);
  if (start < 0) throw new CollectionError("EVIDENCE", "字段引用不在原文中。");
  return { quote, start, end: start + quote.length };
}
// Include the complete, adapter-reviewed URL. Generic query/hash stripping loses ATS IDs.
export function jobIdentity(sourceId: string, canonicalUrl: string): string { return sourceId + "|" + canonicalUrl; }
export const JOB_FIELDS = ["title", "locations", "graduation", "degree", "experience", "employment", "skills", "salary", "published", "deadline", "status"] as const;
export type JobFields = Record<(typeof JOB_FIELDS)[number], EvidenceQuote | null>;
export interface SourceDefinition {
  id: string; company: string; name: string; entryUrl: string;
  kind: "detail" | "listing";
  /** Exact public routes, not arbitrary tenant paths or application tokens. */
  allowedUrls: string[];
  verifiedAt: string;
  note: string;
}
export type SourceState = "readable" | "robots_denied" | "robots_unknown" | "login_required" | "dynamic" | "http_error" | "timeout" | "network_error" | "unsafe_url" | "too_large" | "unsupported" | "cancelled";
export interface SourceDocument {
  sourceId: string; url: string; checkedAt: string; state: SourceState; httpStatus: number | null;
  message: string; text: string; hash: string; title: string | null;
  links: { text: string; url: string }[]; requests: number;
}
export type Decision = "eligible" | "ineligible" | "unknown";
export interface JobAssessment {
  eligibility: Decision; availability: "open" | "closed" | "unknown";
  reasons: string[]; recommended: boolean;
}
export interface JobDraft {
  key: string; sourceId: string; company: string; url: string; applicationUrl: string | null;
  fields: JobFields; assessment: JobAssessment; firstSeenAt: string; lastVerifiedAt: string;
  extraction: "model" | "structured"; evidenceId: string;
}
export interface Candidate {
  id: string; runId: string; kind: "new" | "changed" | "duplicate" | "review";
  job: JobDraft; previous: JobDraft | null; canAccept: boolean; accepted: boolean;
}
export interface RunView {
  id: string; input: RunInput; state: RunState; startedAt: string; finishedAt: string | null;
  modelCalls: number; documents: SourceDocument[]; errors: string[]; candidates: number;
  usage: { input: number | null; output: number | null }; preferenceRevision: number;
}
