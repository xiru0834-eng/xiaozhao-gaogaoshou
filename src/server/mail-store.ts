import { DatabaseSync } from "node:sqlite";
import { randomUUID, createHash } from "node:crypto";
import { basename, dirname } from "node:path";
import { safeFile } from "./runtime-config.ts";
import { mailSecrets, type SecretProtector } from "./model-secrets.ts";
import { validateMessage } from "./mail-analysis.ts";
import {schemaBackup} from './recruitment-task-store.ts';
import type {ExtractedMailTask,MailTaskAnalysis,MailTaskBatch} from '../shared/mail-task-contract.ts';
import {
  MailError,
  type MailMessage,
  type MailCandidate,
  type MailExtraction,
} from "../shared/mail-contract.ts";

export class MailStore {
  private db: DatabaseSync;
  private secrets: SecretProtector;
  constructor(path: string, secrets: SecretProtector = mailSecrets) {
    this.secrets = secrets;
    this.db = new DatabaseSync(safeFile(dirname(path), basename(path)));
    try {
      const version=Number(this.db.prepare("PRAGMA user_version").get()!.user_version);
      if (version > 2)
        throw new MailError("邮箱数据来自更高版本，请升级软件。");
      if(version===1)schemaBackup(this.db,path,2);
      this.db
        .exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000; BEGIN IMMEDIATE;
  CREATE TABLE IF NOT EXISTS mail(id TEXT PRIMARY KEY,account TEXT NOT NULL,signature TEXT NOT NULL UNIQUE,subject TEXT NOT NULL,state TEXT NOT NULL,extraction TEXT,error TEXT NOT NULL DEFAULT '',raw TEXT NOT NULL,createdAt TEXT NOT NULL,intent TEXT);
  CREATE TABLE IF NOT EXISTS settings(id TEXT PRIMARY KEY,value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS tombstones(signature TEXT PRIMARY KEY,id TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,kind TEXT NOT NULL,label TEXT NOT NULL,secret TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS budget(day TEXT PRIMARY KEY,calls INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS task_analyses(mailId TEXT PRIMARY KEY,data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS task_batches(id TEXT PRIMARY KEY,data TEXT NOT NULL);
  PRAGMA user_version=2; COMMIT;`);
    } catch (error) {
      if (this.db.isTransaction) this.db.exec("ROLLBACK");
      this.db.close();
      throw error;
    }
  }
  async ingest(account: string, value: MailMessage) {
    const m = validateMessage(value),
      signature = createHash("sha256")
        .update(account + "\0" + m.key + "\0" + m.text)
        .digest("hex");
    const findExisting = () => this.db
      .prepare(
        "SELECT id FROM mail WHERE signature=? UNION ALL SELECT id FROM tombstones WHERE signature=?",
      )
      .get(signature, signature);
    const existing = findExisting();
    if (existing) return String(existing.id);
    if (Number(this.db.prepare("SELECT count(*) n FROM mail").get()!.n) >= 2000)
      throw new MailError("邮件缓存已达 2000 封，请清理已处理邮件后重试。");
    const id = randomUUID(),
      raw = await this.secrets.protect(JSON.stringify(m));
    // Encryption yields: another ingest or cleanup may have finished meanwhile.
    // Recheck tombstones and capacity in the same transaction as the insert.
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const raced = findExisting();
      if (raced) {
        this.db.exec("COMMIT");
        return String(raced.id);
      }
      if (Number(this.db.prepare("SELECT count(*) n FROM mail").get()!.n) >= 2000)
        throw new MailError("邮件缓存已达 2000 封，请清理已处理邮件后重试。");
      this.db
        .prepare(
          "INSERT OR IGNORE INTO mail(id,account,signature,subject,state,raw,createdAt) VALUES(?,?,?,?,?,?,?)",
        )
        .run(id, account, signature, m.subject, "queued", raw, new Date().toISOString());
      const savedId = String(
        this.db.prepare("SELECT id FROM mail WHERE signature=?").get(signature)!.id,
      );
      this.db.exec("COMMIT");
      return savedId;
    } catch (error) {
      if (this.db.isTransaction) this.db.exec("ROLLBACK");
      throw error;
    }
  }
  private row(r: any): MailCandidate {
    return {
      ...r,
      extraction: r.extraction ? JSON.parse(r.extraction) : null,
      intent: r.intent ? JSON.parse(r.intent) : null,
    };
  }
  list(): MailCandidate[] {
    return this.db
      .prepare(
        "SELECT id,account,subject,state,extraction,error,createdAt,intent FROM mail ORDER BY createdAt DESC LIMIT 2000",
      )
      .all()
      .map((r) => this.row(r));
  }
  get(id: string) {
    const r = this.db
      .prepare(
        "SELECT id,account,subject,state,extraction,error,createdAt,intent FROM mail WHERE id=?",
      )
      .get(id);
    if (!r) throw new MailError("邮件记录不存在。", 404);
    return this.row(r);
  }
  async source(id: string): Promise<MailMessage> {
    this.get(id);
    return validateMessage(
      JSON.parse(
        await this.secrets.unprotect(
          String(
            this.db.prepare("SELECT raw FROM mail WHERE id=?").get(id)!.raw,
          ),
        ),
      ),
    );
  }
  taskAnalysis(id:string):MailTaskAnalysis|null {
    const r=this.db.prepare('SELECT data FROM task_analyses WHERE mailId=?').get(id);return r?JSON.parse(String(r.data)):null;
  }
  saveTaskAnalysis(id:string,sourceVersion:string,actions:ExtractedMailTask[],method:'manual'|'model'){
    const previous=this.taskAnalysis(id);
    if(previous?.actions.some(a=>a.state==='confirmed'||a.state==='confirming'))throw new MailError('已有已确认事项，不能重新分析覆盖。请编辑任务或单独手动记录。',409);
    const data:MailTaskAnalysis={mailId:id,revision:(previous?.revision??0)+1,sourceVersion,createdAt:new Date().toISOString(),method,actions:actions.map(a=>({...a,id:randomUUID(),state:'review',taskId:null}))};
    this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare('INSERT INTO task_analyses VALUES(?,?) ON CONFLICT(mailId) DO UPDATE SET data=excluded.data').run(id,JSON.stringify(data));this.state(id,'review');this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}return data;
  }
  taskBatch(id:string):MailTaskBatch|null {const r=this.db.prepare('SELECT data FROM task_batches WHERE id=?').get(id);return r?JSON.parse(String(r.data)):null;}
  pendingTaskBatches():MailTaskBatch[]{return this.db.prepare('SELECT data FROM task_batches').all().map(r=>JSON.parse(String(r.data))).filter(b=>b.state==='pending');}
  beginTaskBatch(batch:MailTaskBatch){
    const analysis=this.taskAnalysis(batch.mailId)!;
    this.db.exec('BEGIN IMMEDIATE');try{
      for(const id of batch.actionIds){const a=analysis.actions.find(a=>a.id===id);if(!a||a.state!=='review')throw new MailError('邮件事项已经处理或正在保存，请刷新核对。',409);a.state='confirming';}
      this.db.prepare('INSERT INTO task_batches VALUES(?,?)').run(batch.requestId,JSON.stringify(batch));
      this.db.prepare('UPDATE task_analyses SET data=? WHERE mailId=?').run(JSON.stringify(analysis),batch.mailId);
      this.state(batch.mailId,'confirming');this.db.exec('COMMIT');
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  finishTaskBatch(batch:MailTaskBatch,taskIds:string[],error=''){
    const analysis=this.taskAnalysis(batch.mailId);if(!analysis)throw new MailError('确认源记录缺失，保留回执等待恢复。');
    this.db.exec('BEGIN IMMEDIATE');try{
      batch.actionIds.forEach((id,i)=>{const a=analysis.actions.find(a=>a.id===id)!;a.state=error?'review':'confirmed';a.taskId=error?null:taskIds[i];});
      this.db.prepare('UPDATE task_batches SET data=? WHERE id=?').run(JSON.stringify({...batch,state:error?'conflict':'committed',error}),batch.requestId);
      this.db.prepare('UPDATE task_analyses SET data=? WHERE mailId=?').run(JSON.stringify(analysis),batch.mailId);
      this.state(batch.mailId,analysis.actions.some(a=>a.state==='confirming')?'confirming':analysis.actions.every(a=>['confirmed','ignored'].includes(a.state))?'confirmed':'review',error);this.db.exec('COMMIT');
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  ignoreTask(id:string,actionId:string,revision:number){
    const data=this.taskAnalysis(id);if(!data||data.revision!==revision)throw new MailError('分析版本已变化，请刷新。',409);
    const action=data.actions.find(a=>a.id===actionId);if(!action||action.state!=='review')throw new MailError('此事项不能忽略。',409);
    action.state='ignored';this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare('UPDATE task_analyses SET data=? WHERE mailId=?').run(JSON.stringify(data),id);this.state(id,data.actions.some(a=>a.state==='confirming')?'confirming':data.actions.every(a=>a.state==='ignored')?'ignored':data.actions.every(a=>['confirmed','ignored'].includes(a.state))?'confirmed':'review');this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  finish(id: string, extraction: MailExtraction) {
    this.db
      .prepare(
        "UPDATE mail SET state='review',extraction=?,error='' WHERE id=?",
      )
      .run(JSON.stringify(extraction), id);
  }
  state(id: string, state: MailCandidate["state"], error = "") {
    this.get(id);
    this.db
      .prepare("UPDATE mail SET state=?,error=? WHERE id=?")
      .run(state, error, id);
  }
  intent(id: string, value: unknown) {
    this.db
      .prepare("UPDATE mail SET state='confirming',intent=? WHERE id=?")
      .run(JSON.stringify(value), id);
  }
  resetIntent(id: string) {
    this.db
      .prepare("UPDATE mail SET state='review',intent=NULL WHERE id=?")
      .run(id);
  }
  consent(endpoint: string, enabled: boolean, automatic: boolean) {
    this.db
      .prepare(
        "INSERT INTO settings VALUES('consent',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value",
      )
      .run(
        JSON.stringify({ endpoint, enabled, automatic: enabled && automatic }),
      );
  }
  preferences(): { endpoint: string; enabled: boolean; automatic: boolean } {
    const r = this.db
      .prepare("SELECT value FROM settings WHERE id='consent'")
      .get();
    return r
      ? JSON.parse(String(r.value))
      : { endpoint: "", enabled: false, automatic: false };
  }
  spend() {
    const day = new Date().toISOString().slice(0, 10);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const calls = Number(
        this.db.prepare("SELECT calls FROM budget WHERE day=?").get(day)
          ?.calls ?? 0,
      );
      if (calls >= 30)
        throw new MailError(
          "今日邮件模型分析已达 30 次，明日再试或手动录入。",
          429,
        );
      this.db
        .prepare(
          "INSERT INTO budget VALUES(?,1) ON CONFLICT(day) DO UPDATE SET calls=calls+1",
        )
        .run(day);
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  accounts() {
    return this.db
      .prepare("SELECT id,kind,label FROM accounts ORDER BY id")
      .all() as unknown as { id: string; kind: string; label: string }[];
  }
  async account(id: string) {
    const r = this.db.prepare("SELECT * FROM accounts WHERE id=?").get(id);
    if (!r) throw new MailError("邮箱未连接。", 404);
    return {
      id: String(r.id),
      kind: String(r.kind),
      label: String(r.label),
      secret: JSON.parse(await this.secrets.unprotect(String(r.secret))),
    };
  }
  async saveAccount(id: string, kind: string, label: string, secret: unknown, canCommit: () => boolean = () => true) {
    const encrypted = await this.secrets.protect(JSON.stringify(secret));
    // Encryption is asynchronous. Authorization may be cancelled while it runs.
    if (!canCommit()) return false;
    this.db
      .prepare(
        "INSERT INTO accounts VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET secret=excluded.secret,label=excluded.label",
      )
      .run(id, kind, label, encrypted);
    return true;
  }
  disconnect(id: string) {
    this.db.prepare("DELETE FROM accounts WHERE id=?").run(id);
  }
  purge() {
    if(this.pendingTaskBatches().length)throw new MailError('有确认操作待恢复，请先刷新完成恢复再清理。',409);
    try {
      this.db.exec(
        "BEGIN IMMEDIATE; INSERT OR IGNORE INTO tombstones SELECT signature,id FROM mail WHERE state IN ('confirmed','ignored'); DELETE FROM mail WHERE state IN ('confirmed','ignored'); COMMIT;",
      );
    } catch (error) {
      if (this.db.isTransaction) this.db.exec("ROLLBACK");
      throw error;
    }
  }
  integrity() {
    return this.db.prepare("PRAGMA integrity_check").get()!.integrity_check;
  }
  schemaVersion() { return Number(this.db.prepare('PRAGMA user_version').get()!.user_version); }
  close() {
    this.db.close();
  }
}
