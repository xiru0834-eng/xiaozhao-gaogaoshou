export class DailyError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) { super(message); this.code = code; this.status = status; }
}
export interface DailyOptions {
  localTime: string; timeZone: string; notifyEnabled: boolean; notifyTime: string | null;
  searchLimit: number; pageLimit: number; extractLimit: number;
  acceptancePolicy: 'review';
}
export const DEFAULT_DAILY_OPTIONS: DailyOptions = {
  localTime: '07:00', timeZone: 'Australia/Sydney', notifyEnabled: true, notifyTime: null,
  searchLimit: 6, pageLimit: 20, extractLimit: 6, acceptancePolicy: 'review',
};
export function dailyObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DailyError('VALIDATION', '请求格式不正确。');
  return value as Record<string, unknown>;
}
export function dailyKeys(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).some(k => !keys.includes(k))) throw new DailyError('VALIDATION', '包含不支持的字段。');
}
export function dailyId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(value)) throw new DailyError('VALIDATION', '请求标识无效。');
  return value;
}
export function dailyInteger(value: unknown, max: number, min = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) throw new DailyError('VALIDATION', '数值超出允许范围。');
  return value as number;
}
export function dailyTime(value: unknown): string {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new DailyError('VALIDATION', '时间格式须为 HH:mm。');
  return value;
}
export function dailyZone(value: unknown): string {
  if (typeof value !== 'string' || value.length > 80 || !/^[A-Za-z0-9_/+-]+$/.test(value)) throw new DailyError('VALIDATION', '时区无效。');
  try { return new Intl.DateTimeFormat('en', {timeZone:value}).resolvedOptions().timeZone; }
  catch { throw new DailyError('VALIDATION', '请选择有效的 IANA 时区。'); }
}
export function parseDailyOptions(value: unknown): DailyOptions {
  const v = dailyObject(value);
  dailyKeys(v, Object.keys(DEFAULT_DAILY_OPTIONS));
  if (typeof v.notifyEnabled !== 'boolean' || v.acceptancePolicy !== 'review') throw new DailyError('VALIDATION', '提醒选项无效；自动收录尚未开放。');
  return {localTime:dailyTime(v.localTime),timeZone:dailyZone(v.timeZone),notifyEnabled:v.notifyEnabled,
    notifyTime:v.notifyTime === null ? null : dailyTime(v.notifyTime), searchLimit:dailyInteger(v.searchLimit,6,1),
    pageLimit:dailyInteger(v.pageLimit,20,1),extractLimit:dailyInteger(v.extractLimit,6,1),acceptancePolicy:'review'};
}
export interface DailySettings { revision: number; enabled: boolean; options: DailyOptions; nextDueAt: string | null; modelRevision: number | null; preferenceRevision: number | null; pauseReason: string | null }
export type DailyRunState = 'running' | 'completed' | 'partial' | 'failed' | 'cancelled' | 'interrupted' | 'blocked';
export interface DailyCounts { discovered: number; verifiedJobs: number; acceptedJobs: number; referralLeads: number; duplicates: number; needsReview: number; failedSources: number }
export const emptyDailyCounts = (): DailyCounts => ({discovered:0,verifiedJobs:0,acceptedJobs:0,referralLeads:0,duplicates:0,needsReview:0,failedSources:0});
export interface SearchLead { title: string; url: string; publishedAt: string | null }
export interface DailyRun {
  id: string; requestId: string; state: DailyRunState; startedAt: string; finishedAt: string | null;
  trigger: 'manual' | 'scheduled'; occurrence: string | null; settings: DailySettings;
  phase: string; counts: DailyCounts; companies: string[]; leads: SearchLead[]; errors: string[];
  usage: {searchRequests:number; serverSearches:number|null; input:number|null; output:number|null};
  collectionRunIds: string[];
}
export interface DailyReport { id: string; run: DailyRun; readAt: string | null; eligibleAt: string; expiresAt: string }
export interface NotificationWindow { id: string; start: string; end: string; zone: string }
export type NotificationClaim = {claimed:true; deliveryId:string; reportId:string} | {claimed:false;reason:'disabled'|'not_due'|'already_offered'|'expired'};
