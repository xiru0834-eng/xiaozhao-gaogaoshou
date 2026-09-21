import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, link } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { startServer } from '../src/server/http.ts';
import { MailStore } from '../src/server/mail-store.ts';
import { ScheduleStore } from '../src/server/schedule-store.ts';
import { MailTaskService } from '../src/server/mail-task-service.ts';
import { emptyTaskDraft } from '../src/shared/recruitment-task-contract.ts';

const secrets = { protect: async (s: string) => Buffer.from(s).toString('base64'), unprotect: async (s: string) => Buffer.from(s,'base64').toString() };
const message = {key:'audit',subject:'合成面试通知',sender:'fixture@example.test',receivedAt:'2026-09-21T00:00:00Z',text:'这是一封合成通知，不是真实邮件。',attachment:false};

test('health reports the actual initialized database schema versions', async () => {
  const dir=await mkdtemp(join(tmpdir(),'backend-health-audit-'));
  await mkdir(join(dir,'web'));await writeFile(join(dir,'web/index.html'),'audit');
  const app=await startServer({dataDir:dir,webDir:join(dir,'web'),port:0});
  try {
    const health=await (await fetch(app.url+'/health')).json() as {schemas:Record<string,number>};
    for (const [key,file] of [['progress','qiuzhao'],['catalog','catalog'],['schedules','schedules'],['mail','mail']]) {
      const db=new DatabaseSync(join(dir,file+'.db'),{readOnly:true});
      try {assert.equal(health.schemas[key],db.prepare('PRAGMA user_version').get()!.user_version,key);} finally {db.close();}
    }
  } finally {await app.close();await rm(dir,{recursive:true,force:true});}
});

test('ignoring every mail action is ignored, never falsely recorded as tasks',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'backend-ignore-audit-'));
  const mail=new MailStore(join(dir,'mail.db'),secrets),schedules=new ScheduleStore(join(dir,'schedules.db'));
  const service=new MailTaskService(mail,schedules.recruitment,{} as never);
  try {
    const id=await mail.ingest('manual',message);
    const a=await service.manual(id,{...emptyTaskDraft(),title:'不要创建这个任务'});
    mail.ignoreTask(id,a.actions[0].id,a.revision);
    assert.equal(mail.get(id).state,'ignored');
    assert.equal(schedules.recruitment.all().length,0);
  } finally {service.close();mail.close();schedules.close();await rm(dir,{recursive:true,force:true});}
});

test('a stale tab cannot confirm an entire mail ignored in another window',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'backend-stale-mail-'));
  const mail=new MailStore(join(dir,'mail.db'),secrets),schedules=new ScheduleStore(join(dir,'schedules.db'));
  const service=new MailTaskService(mail,schedules.recruitment,{} as never);
  try {
    const id=await mail.ingest('manual',message),a=await service.manual(id,{...emptyTaskDraft(),title:'合成面试'});
    mail.state(id,'ignored');
    await assert.rejects(service.confirm({requestId:randomUUID(),mailId:id,analysisRevision:a.revision,sourceVersion:a.sourceVersion,decisions:[{actionId:a.actions[0].id,mode:'create',draft:a.actions[0].draft}]}),/忽略|处理/);
    assert.equal(schedules.recruitment.all().length,0);
  } finally {service.close();mail.close();schedules.close();await rm(dir,{recursive:true,force:true});}
});

test('mail store refuses linked databases before altering unrelated files',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'backend-mail-link-'));
  const original=join(dir,'unrelated.db'),alias=join(dir,'mail.db');
  const seed=new DatabaseSync(original);seed.exec('CREATE TABLE sentinel(value TEXT); INSERT INTO sentinel VALUES (\'keep\');');seed.close();
  await link(original,alias);
  let opened:MailStore|undefined;
  try {
    assert.throws(()=>{opened=new MailStore(alias,secrets);},/Unsafe linked/);
    const check=new DatabaseSync(original,{readOnly:true});
    try {assert.equal(check.prepare('PRAGMA user_version').get()!.user_version,0);assert.equal(check.prepare('SELECT count(*) n FROM sqlite_master WHERE type=\'table\'').get()!.n,1);}finally{check.close();}
  } finally {opened?.close();await rm(dir,{recursive:true,force:true});}
});

test('an encrypted ingest finishing late cannot resurrect a purged mail',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'backend-mail-purge-race-'));
  let release!:()=>void,entered!:()=>void,calls=0;
  const gate=new Promise<void>(r=>{release=r;}),started=new Promise<void>(r=>{entered=r;});
  const mail=new MailStore(join(dir,'mail.db'),{...secrets,protect:async s=>{if(++calls===1){entered();await gate;}return secrets.protect(s);}});
  try {
    const delayed=mail.ingest('manual',message);await started;
    const saved=await mail.ingest('manual',message);mail.state(saved,'ignored');mail.purge();
    release();assert.equal(await delayed,saved);
    assert.equal(mail.list().length,0,'cleared mail must stay tombstoned');
  }finally{release();mail.close();await rm(dir,{recursive:true,force:true});}
});

test('parallel mail ingestion cannot exceed the configured cache capacity',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'backend-mail-capacity-')),path=join(dir,'mail.db');
  const mail=new MailStore(path,secrets);
  try {
    const db=new DatabaseSync(path);
    db.exec("WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<1999) INSERT INTO mail(id,account,signature,subject,state,raw,createdAt) SELECT 'seed-'||x,'manual','sig-'||x,'合成','queued','', '2026-09-21T00:00:00Z' FROM n;");db.close();
    const results=await Promise.allSettled([mail.ingest('manual',{...message,key:'first'}),mail.ingest('manual',{...message,key:'second'})]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    const check=new DatabaseSync(path,{readOnly:true});try{assert.equal(check.prepare('SELECT count(*) n FROM mail').get()!.n,2000);}finally{check.close();}
  }finally{mail.close();await rm(dir,{recursive:true,force:true});}
});

test('mail purge rolls back on write failure and a later retry remains usable',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'backend-mail-purge-atomic-')),path=join(dir,'mail.db');
  const mail=new MailStore(path,secrets);
  try {
    const id=await mail.ingest('manual',message);mail.state(id,'ignored');
    const db=new DatabaseSync(path);db.exec("CREATE TRIGGER prevent_purge BEFORE DELETE ON mail BEGIN SELECT RAISE(ABORT,'simulated disk write failure'); END;");db.close();
    assert.throws(()=>mail.purge(),/simulated/);
    assert.equal(mail.get(id).state,'ignored');
    const check=new DatabaseSync(path);try{assert.doesNotThrow(()=>check.exec('DROP TRIGGER prevent_purge'));}finally{check.close();}
    assert.doesNotThrow(()=>mail.purge());assert.equal(mail.list().length,0);assert.equal(mail.integrity(),'ok');
  }finally{mail.close();await rm(dir,{recursive:true,force:true});}
});

test('server drains an in-flight manual mail task before closing its database',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'backend-http-drain-'));
  await mkdir(join(dir,'web'));await writeFile(join(dir,'web/index.html'),'<meta name="app-token" content="__APP_TOKEN__">');
  let release!:()=>void,entered!:()=>void;
  const gate=new Promise<void>(r=>{release=r;}),started=new Promise<void>(r=>{entered=r;});
  const app=await startServer({dataDir:dir,webDir:join(dir,'web'),port:0,mailDependencies:{secrets:{...secrets,unprotect:async s=>{entered();await gate;return secrets.unprotect(s);}}}});
  let closing:Promise<void>|undefined;
  try {
    const html=await (await fetch(app.url)).text(),health=await (await fetch(app.url+'/health')).json() as {profileId:string};
    const headers={'Content-Type':'application/json','X-Profile-Id':health.profileId,'X-App-Token':html.match(/app-token" content="([a-f0-9]+)"/)![1]};
    const post=(body:unknown)=>fetch(app.url+'/api/mail',{method:'POST',headers,body:JSON.stringify(body)});
    const response=await post({action:'paste',subject:message.subject,text:message.text,receivedAt:message.receivedAt});
    const {id}=await response.json() as {id:string};assert.equal(response.status,200);
    const pending=post({action:'manualTask',id,draft:{...emptyTaskDraft(),title:'关闭时仍在保存的合成任务'}});await started;
    closing=app.close();await new Promise(r=>setTimeout(r,30));release();
    const result=await pending;assert.equal(result.status,200,await result.text());
    await closing;
    const check=new DatabaseSync(join(dir,'mail.db'),{readOnly:true});
    try {assert.equal(check.prepare('SELECT count(*) n FROM task_analyses').get()!.n,1);assert.equal(check.prepare('PRAGMA integrity_check').get()!.integrity_check,'ok');}finally{check.close();}
  }finally{release();await(closing??app.close());await rm(dir,{recursive:true,force:true});}
});
