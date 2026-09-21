import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { DailyError, DEFAULT_DAILY_OPTIONS, parseDailyOptions, emptyDailyCounts, type DailySettings, type DailyRun, type DailyReport, type NotificationWindow, type NotificationClaim } from '../shared/daily-contract.ts';
import { dailySlot, localDay, nextDailySlot, latestDailySlot, notificationWindow } from './daily-clock.ts';

export const DAILY_SCHEMA = `
CREATE TABLE daily_settings(id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL);
CREATE TABLE daily_activations(request_id TEXT PRIMARY KEY, expected_revision INTEGER NOT NULL, json TEXT NOT NULL);
CREATE TABLE daily_runs(id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, occurrence TEXT UNIQUE, state TEXT NOT NULL, json TEXT NOT NULL);
CREATE TABLE daily_attempts(id TEXT PRIMARY KEY, run_id TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, state TEXT NOT NULL);
CREATE INDEX daily_budget_idx ON daily_attempts(day,kind);
CREATE TABLE daily_reports(id TEXT PRIMARY KEY REFERENCES daily_runs(id), json TEXT NOT NULL, read_at TEXT, eligible_at TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE daily_windows(id TEXT PRIMARY KEY, start_at TEXT NOT NULL, end_at TEXT NOT NULL, json TEXT NOT NULL);
CREATE TABLE daily_deliveries(id TEXT PRIMARY KEY, window_id TEXT UNIQUE NOT NULL REFERENCES daily_windows(id), report_id TEXT UNIQUE NOT NULL REFERENCES daily_reports(id), request_id TEXT UNIQUE NOT NULL, offered_at TEXT NOT NULL, action TEXT, action_at TEXT);
CREATE TABLE daily_leads(url TEXT PRIMARY KEY, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL, json TEXT NOT NULL);
`;
type BudgetKind = 'search' | 'page' | 'extract';
type AttemptState = 'reserved' | 'sent' | 'settled' | 'unknown';
const iso = (now: string) => new Date(now).toISOString();
export class DailyStore {
  private readonly db: DatabaseSync;
  readonly profileId: string;
  constructor(db: DatabaseSync, profileId: string) { this.db = db; this.profileId = profileId; }
  private transaction<T>(work: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = work(); this.db.exec('COMMIT'); return result; }
    catch(error) { this.db.exec('ROLLBACK'); throw error; }
  }
  settings(): DailySettings {
    const row = this.db.prepare('SELECT json FROM daily_settings WHERE id=1').get();
    return row ? JSON.parse(String(row.json)) : {revision:0,enabled:false,options:{...DEFAULT_DAILY_OPTIONS},nextDueAt:null,modelRevision:null,preferenceRevision:null,pauseReason:null};
  }
  private saveSettings(s: DailySettings) { this.db.prepare('INSERT INTO daily_settings VALUES (1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').run(JSON.stringify(s)); }
  private compareRevision(expected: number) { const s = this.settings(); if(s.revision !== expected) throw new DailyError('CONFLICT','设置已变化，请刷新后重试。',409); return s; }
  configure(value: unknown, expected: number, now: string) {
    const options = parseDailyOptions(value);
    return this.transaction(() => {
      if(this.active()) throw new DailyError('BUSY','请等待当前运行结束后修改设置。',409);
      const s = this.compareRevision(expected);
      const budgetChanged = ['searchLimit','pageLimit','extractLimit'].some(k => s.options[k as keyof typeof options] !== options[k as keyof typeof options]);
      const enabled = s.enabled && !budgetChanged;
      const next = {...s,revision:s.revision+1,options,enabled,nextDueAt:enabled ? this.nextUnclaimed(now,options.localTime,options.timeZone) : null,pauseReason:budgetChanged && s.enabled ? '额度已变化，请重新启用。' : s.pauseReason};
      this.saveSettings(next); return next;
    });
  }
  activate(expected: number, modelRevision: number, preferenceRevision: number, now: string, requestId?:string) {
    return this.transaction(() => {
      if(requestId){
        const receipt=this.db.prepare('SELECT expected_revision,json FROM daily_activations WHERE request_id=?').get(requestId);
        if(receipt){if(receipt.expected_revision!==expected)throw new DailyError('CONFLICT','启用请求内容不一致。',409);return JSON.parse(String(receipt.json)) as DailySettings;}
      }
      const s = this.compareRevision(expected);
      if (s.enabled && s.modelRevision === modelRevision && s.preferenceRevision === preferenceRevision) return s;
      const next = {...s,revision:s.revision+1,enabled:true,modelRevision,preferenceRevision,pauseReason:null,nextDueAt:this.nextUnclaimed(now,s.options.localTime,s.options.timeZone)};
      this.saveSettings(next);
      if(requestId)this.db.prepare('INSERT INTO daily_activations VALUES (?,?,?)').run(requestId,expected,JSON.stringify(next));
      return next;
    });
  }
  disable(reason: string | null = null) {
    return this.transaction(() => { const s = this.settings(); const next = {...s,revision:s.revision+1,enabled:false,nextDueAt:null,pauseReason:reason};this.saveSettings(next);return next; });
  }
  private nextUnclaimed(now: string, time: string, zone: string) {
    const day = localDay(now,zone);
    const existing = this.db.prepare('SELECT id FROM daily_runs WHERE occurrence=?').get(day);
    return nextDailySlot(now,time,zone,existing ? day : undefined).at;
  }
  active(): DailyRun | null {
    const row = this.db.prepare("SELECT json FROM daily_runs WHERE state='running' LIMIT 1").get();
    return row ? JSON.parse(String(row.json)) : null;
  }
  private insert(requestId: string, now: string, settings: DailySettings, occurrence: string | null): DailyRun {
    if(this.active()) throw new DailyError('BUSY','已有每日更新正在运行。',409);
    if(Number(this.db.prepare('SELECT count(*) AS n FROM daily_runs').get()?.n) >= 1000) throw new DailyError('CAPACITY','已保存1000次更新，请先备份归档；不会删除旧记录。',409);
    const run: DailyRun = {id:randomUUID(),requestId,state:'running',startedAt:iso(now),finishedAt:null,trigger:occurrence?'scheduled':'manual',occurrence,settings,phase:'准备',counts:emptyDailyCounts(),companies:[],leads:[],errors:[],usage:{searchRequests:0,serverSearches:0,input:0,output:0},collectionRunIds:[]};
    this.db.prepare('INSERT INTO daily_runs VALUES (?,?,?,?,?)').run(run.id,requestId,occurrence,run.state,JSON.stringify(run));return run;
  }
  findRequest(id: string): DailyRun | null { const row = this.db.prepare('SELECT json FROM daily_runs WHERE request_id=?').get(id);return row ? JSON.parse(String(row.json)) : null; }
  startManual(requestId: string, expected: number, now: string, modelRevision: number, preferenceRevision: number) {
    return this.transaction(() => {
      const previous = this.findRequest(requestId);
      if(previous) {
        if(previous.trigger !== 'manual' || previous.settings.revision !== expected) throw new DailyError('CONFLICT','重复请求内容不一致。',409);
        return previous;
      }
      const s = this.compareRevision(expected);
      return this.insert(requestId,now,{...s,modelRevision,preferenceRevision},null);
    });
  }
  claimDue(now: string): DailyRun | null {
    return this.transaction(() => {
      const s = this.settings();
      if(!s.enabled || !s.nextDueAt || Date.parse(now) < Date.parse(s.nextDueAt) || this.active()) return null;
      const latest=latestDailySlot(now,s.options.localTime,s.options.timeZone);
      const occurrence=latest.day;
      const missed=Date.parse(latest.at)<Date.parse(s.nextDueAt)||Date.parse(now)-Date.parse(latest.at)>86400000;
      this.saveSettings({...s,nextDueAt:this.nextUnclaimed(now,s.options.localTime,s.options.timeZone)});
      if(missed || this.db.prepare('SELECT id FROM daily_runs WHERE occurrence=?').get(occurrence)) return null;
      return this.insert(`scheduled-${occurrence}`,now,s,occurrence);
    });
  }
  run(id: string): DailyRun {
    const row = this.db.prepare('SELECT json FROM daily_runs WHERE id=?').get(id);
    if(!row) throw new DailyError('NOT_FOUND','更新记录不存在。',404);
    return JSON.parse(String(row.json));
  }
  saveRun(run: DailyRun) {
    const result = this.db.prepare("UPDATE daily_runs SET json=? WHERE id=? AND state='running'").run(JSON.stringify(run),run.id);
    if(!result.changes) throw new DailyError('CONFLICT','运行已结束，拒绝迟到结果。',409);
  }
  finish(run: DailyRun, now: string) {
    if(run.state === 'running' || !run.finishedAt) throw new DailyError('VALIDATION','运行尚未结束。');
    return this.transaction(() => {
      if(this.run(run.id).state !== 'running') throw new DailyError('CONFLICT','运行已结束。',409);
      const options = run.settings.options;
      const at = options.notifyTime ? dailySlot(localDay(now,options.timeZone),options.notifyTime,options.timeZone) : iso(now);
      const eligible = at > iso(now) ? at : iso(now);
      this.db.prepare("UPDATE daily_runs SET state=?,json=? WHERE id=?").run(run.state,JSON.stringify(run),run.id);
      this.db.prepare('INSERT INTO daily_reports VALUES (?,?,NULL,?,?)').run(run.id,JSON.stringify(run),eligible,new Date(Date.parse(eligible)+86400000).toISOString());
    });
  }
  recover(now: string) {
    // No network request is replayed. The unfinished reservation still consumes quota.
    this.db.prepare("UPDATE daily_attempts SET state='unknown' WHERE state IN ('reserved','sent')").run();
    const run = this.active();
    if(run) this.finish({...run,state:'interrupted',finishedAt:iso(now),errors:[...run.errors,'上次更新中断。未知费用已保留，不自动重发请求。']},now);
  }
  reports(offset = 0, limit = 50): DailyReport[] {
    return this.db.prepare('SELECT * FROM daily_reports ORDER BY rowid DESC LIMIT ? OFFSET ?').all(limit,offset).map(r => ({id:String(r.id),run:JSON.parse(String(r.json)),readAt:r.read_at as string|null,eligibleAt:String(r.eligible_at),expiresAt:String(r.expires_at)}));
  }
  reportCount(){return Number(this.db.prepare('SELECT count(*) AS n FROM daily_reports').get()?.n);}
  report(id: string): DailyReport {
    const r = this.db.prepare('SELECT * FROM daily_reports WHERE id=?').get(id);
    if(!r) throw new DailyError('NOT_FOUND','日报不存在。',404);
    return {id:String(r.id),run:JSON.parse(String(r.json)),readAt:r.read_at as string|null,eligibleAt:String(r.eligible_at),expiresAt:String(r.expires_at)};
  }
  readReport(id: string, now: string) { this.report(id);this.db.prepare('UPDATE daily_reports SET read_at=COALESCE(read_at,?) WHERE id=?').run(iso(now),id); }
  unread() { return Number(this.db.prepare('SELECT count(*) AS n FROM daily_reports WHERE read_at IS NULL').get()?.n); }
  usage(now: string) {
    const result = {search:0,page:0,extract:0};
    for(const row of this.db.prepare('SELECT kind,count(*) AS n FROM daily_attempts WHERE day=? GROUP BY kind').all(iso(now).slice(0,10))) result[row.kind as BudgetKind]=Number(row.n);
    return result;
  }
  reserve(id: string, runId: string, kind: BudgetKind, now: string) {
    return this.transaction(() => {
      const day = iso(now).slice(0,10);
      const old = this.db.prepare('SELECT * FROM daily_attempts WHERE id=?').get(id);
      if(old) {if(old.run_id !== runId || old.kind !== kind || old.day !== day) throw new DailyError('CONFLICT','预留请求不一致。',409);return;}
      const row = this.db.prepare('SELECT json FROM daily_runs WHERE id=?').get(runId);
      let options = this.settings().options;
      if(row) {
        const run = JSON.parse(String(row.json)) as DailyRun;
        if(run.state !== 'running') throw new DailyError('CONFLICT','运行已结束。',409);
        options = run.settings.options;
      } else {
        const collection = this.db.prepare('SELECT json FROM collection_runs WHERE id=?').get(runId);
        if(!collection || !['queued','running'].includes(JSON.parse(String(collection.json)).state)) throw new DailyError('CONFLICT','采集任务不存在或已经结束。',409);
      }
      if(this.usage(now)[kind] >= options[`${kind}Limit`]) throw new DailyError('BUDGET','已到每日调用额度，剩余来源未检查。',429);
      this.db.prepare("INSERT INTO daily_attempts VALUES (?,?,?,?,'reserved')").run(id,runId,day,kind);
    });
  }
  attemptState(id: string, state: Exclude<AttemptState,'reserved'>) {
    const allowed = state === 'sent' ? ['reserved'] : ['sent'];
    const old = this.db.prepare('SELECT state FROM daily_attempts WHERE id=?').get(id);
    if(old?.state === state) return;
    if(!old || !allowed.includes(String(old.state))) throw new DailyError('CONFLICT','请求状态不允许回退或重新发送。',409);
    this.db.prepare('UPDATE daily_attempts SET state=? WHERE id=?').run(state,id);
  }
  observeLead(lead: DailyRun['leads'][number], now: string) {
    const old = this.db.prepare('SELECT url FROM daily_leads WHERE url=?').get(lead.url);
    this.db.prepare('INSERT INTO daily_leads VALUES (?,?,?,?) ON CONFLICT(url) DO UPDATE SET last_seen=excluded.last_seen,json=excluded.json').run(lead.url,iso(now),iso(now),JSON.stringify(lead));
    return !old;
  }
  notification(now: string): DailyReport | null {
    if(!this.settings().options.notifyEnabled) return null;
    const row = this.db.prepare('SELECT id FROM daily_reports WHERE read_at IS NULL AND eligible_at<=? AND expires_at>? ORDER BY rowid DESC LIMIT 1').get(iso(now),iso(now));
    return row ? this.report(String(row.id)) : null;
  }
  claimNotification(reportId: string, requestId: string, now: string): NotificationClaim {
    return this.transaction(() => {
      const receipt = this.db.prepare('SELECT id,report_id FROM daily_deliveries WHERE request_id=?').get(requestId);
      if(receipt) {if(receipt.report_id !== reportId) throw new DailyError('CONFLICT','领取请求不一致。',409);return {claimed:true,deliveryId:String(receipt.id),reportId};}
      if(!this.settings().options.notifyEnabled) return {claimed:false,reason:'disabled'};
      const report = this.report(reportId);
      if(report.expiresAt <= iso(now)) return {claimed:false,reason:'expired'};
      if(report.eligibleAt > iso(now) || this.notification(now)?.id !== reportId) return {claimed:false,reason:'not_due'};
      const row = this.db.prepare('SELECT json FROM daily_windows ORDER BY rowid DESC LIMIT 1').get();
      const window = notificationWindow(now,this.settings().options.timeZone,row ? JSON.parse(String(row.json)) as NotificationWindow : undefined);
      if(this.db.prepare('SELECT id FROM daily_deliveries WHERE window_id=? OR report_id=?').get(window.id,reportId)) return {claimed:false,reason:'already_offered'};
      this.db.prepare('INSERT OR IGNORE INTO daily_windows VALUES (?,?,?,?)').run(window.id,window.start,window.end,JSON.stringify(window));
      const id = randomUUID();
      this.db.prepare('INSERT INTO daily_deliveries VALUES (?,?,?,?,?,NULL,NULL)').run(id,window.id,reportId,requestId,iso(now));
      return {claimed:true,deliveryId:id,reportId};
    });
  }
  notificationAction(id: string, action: 'dismissed'|'opened', now: string) {
    this.transaction(() => {
      const row = this.db.prepare('SELECT action,report_id FROM daily_deliveries WHERE id=?').get(id);
      if(!row) throw new DailyError('NOT_FOUND','提醒不存在。',404);
      if(row.action === 'opened') return;
      this.db.prepare('UPDATE daily_deliveries SET action=?,action_at=? WHERE id=?').run(action,iso(now),id);
      if(action === 'opened') this.readReport(String(row.report_id),now);
    });
  }
}
