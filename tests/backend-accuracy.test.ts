import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyTaskDraft, validateTaskDraft, type TaskTiming, type TimePoint } from '../src/shared/recruitment-task-contract.ts';
import { prepareTaskMail, validateMailTasks } from '../src/server/mail-task-analysis.ts';
import { ModelService } from '../src/server/model-service.ts';
import type { ModelSettings } from '../src/server/model-settings.ts';
import { ModelSettings as Settings } from '../src/server/model-settings.ts';
import { MailAPI } from '../src/server/mail-api.ts';
import { ScheduleStore } from '../src/server/schedule-store.ts';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateExtraction } from '../src/server/mail-analysis.ts';
import { startServer } from '../src/server/http.ts';
import { randomUUID } from 'node:crypto';

const point = (date: string, time = '14:00', zone: 'Asia/Shanghai' | 'Australia/Sydney' | 'UTC' = 'Asia/Shanghai'): TimePoint => ({precision:'minute',date,time,zone});
const draft = (timing: TaskTiming) => ({...emptyTaskDraft(),title:'合成测评',timing});
const day = (date:string):TimePoint => ({precision:'date',date,zone:'Asia/Shanghai'});

test('task normalization round-trips at the user uncertainty limit',()=>{
  const saved=validateTaskDraft({...draft({mode:'unknown',originalText:'另行通知'}),uncertainties:Array.from({length:20},(_,i)=>`待核实项${i}`)});
  assert.deepEqual(validateTaskDraft(saved),saved);
});

test('date-only deadline rejects a plan on a later day without inventing an exact deadline',()=>{
  const timing:TaskTiming={mode:'deadline',due:day('2026-10-05'),boundary:'unspecified'};
  assert.throws(()=>validateTaskDraft({...draft(timing),plannedSlot:{start:point('2026-10-06'),end:null}}),/截止/);
  const accepted=validateTaskDraft({...draft(timing),plannedSlot:{start:point('2026-10-05'),end:null}});
  assert.equal(accepted.timing.mode==='deadline'&&accepted.timing.due.precision,'date');
});

test('date-only deadline uses the deadline zone when comparing a known cross-zone plan',()=>{
  const timing:TaskTiming={mode:'deadline',due:day('2026-10-05'),boundary:'unspecified'};
  // UTC Oct 5 20:00 is Beijing Oct 6: genuinely outside the stated date.
  assert.throws(()=>validateTaskDraft({...draft(timing),plannedSlot:{start:point('2026-10-05','20:00','UTC'),end:null}}),/截止/);
});

test('date-only window rejects plans outside its opening and closing days',()=>{
  const timing:TaskTiming={mode:'window',opens:day('2026-10-04'),closes:day('2026-10-06'),durationMinutes:90,cutoffRule:'unknown'};
  for(const date of ['2026-10-03','2026-10-07'])assert.throws(()=>validateTaskDraft({...draft(timing),plannedSlot:{start:point(date),end:null}}),/窗口/);
});

test('finish-by examination window accounts for known duration even without a planned end',()=>{
  const timing:TaskTiming={mode:'window',opens:point('2026-10-05','09:00'),closes:point('2026-10-05','18:00'),durationMinutes:90,cutoffRule:'finish_by'};
  const plannedSlot={start:point('2026-10-05','17:30'),end:null};
  assert.throws(()=>validateTaskDraft({...draft(timing),plannedSlot}),/窗口|时长/);
  assert.doesNotThrow(()=>validateTaskDraft({...draft({...timing,cutoffRule:'start_by'}),plannedSlot}));
});

function extracted(text:string,date:string,time:string,zone:'UTC'|'Asia/Shanghai') {
  const prepared=prepareTaskMail({key:'synthetic',subject:'面试通知',sender:'hr@example.test',receivedAt:'2026-09-21T00:00:00Z',text,attachment:false});
  return validateMailTasks(JSON.stringify({version:2,actions:[{mutation:'create',draft:draft({mode:'fixed',start:point(date,time,zone),end:null}),linkRef:null,evidence:[{field:'timing',quote:text}]}]}),prepared)[0].draft;
}
test('mail evidence UTC+8 must not certify a model-supplied UTC timezone',()=>{
  const result=extracted('2026-10-05 14:00 UTC+8 面试','2026-10-05','14:00','UTC');
  assert.equal(result.timing.mode==='fixed'&&result.timing.start.zone,null);
});
test('mail evidence cannot splice one appointment date with another appointment time',()=>{
  const result=extracted('原面试2026-10-05 14:00，改为2026-10-06 16:00 北京时间。','2026-10-05','16:00','Asia/Shanghai');
  assert.equal(result.timing.mode,'unknown');
});
test('mail evidence accepts supported dates and clocks without overcorrecting valid notices',()=>{
  for(const [text,date,time,zone] of [
    ['2026年10月5日14:00 北京时间面试','2026-10-05','14:00','Asia/Shanghai'],
    ['2026-10-05 14:00 UTC 面试','2026-10-05','14:00','UTC'],
    ['2026-10-05 14:00 UTC +08:00 面试','2026-10-05','14:00','Asia/Shanghai'],
    ['2026-10-05 14:00，2026-10-06 16:00 北京时间','2026-10-06','16:00','Asia/Shanghai'],
    ['2026-10-05 14:00—15:00 北京时间','2026-10-05','15:00','Asia/Shanghai'],
  ] as const) {
    const result=extracted(text,date,time,zone);
    assert.equal(result.timing.mode,'fixed',text);
    assert.equal(result.timing.mode==='fixed'&&result.timing.start.zone,zone,text);
  }
  for(const offset of ['UTC+08:00','UTC +8','UTC -05:00']) {
    const result=extracted(`2026-10-05 14:00 ${offset}`,'2026-10-05','14:00','UTC');
    assert.equal(result.timing.mode==='fixed'&&result.timing.start.zone,null,offset);
  }
});
test('mail evidence cannot join independent quotes into a timestamp',()=>{
  const text='2026-10-05 的面试另行通知。其他日期可选 14:00。';
  const prepared=prepareTaskMail({key:'synthetic-split',subject:'面试通知',sender:'hr@example.test',receivedAt:'2026-09-21T00:00:00Z',text,attachment:false});
  const [result]=validateMailTasks(JSON.stringify({version:2,actions:[{mutation:'create',draft:draft({mode:'fixed',start:point('2026-10-05'),end:null}),linkRef:null,evidence:[{field:'timing',quote:'2026-10-05 的面试另行通知'},{field:'timing',quote:'其他日期可选 14:00'}]}]}),prepared);
  assert.equal(result.draft.timing.mode,'unknown');
});

test('legacy mail extraction cannot bypass the same date and timezone evidence gates',()=>{
  const text='原面试2026-10-05 14:00 UTC+8，改为2026-10-06 16:00 UTC+8。';
  const message={key:'legacy-evidence',subject:'面试通知',sender:'hr@example.test',receivedAt:'2026-09-21T00:00:00Z',text,attachment:false};
  const value={relevant:true,action:'create',purpose:'event',company:'',role:'',kind:'interview',round:'',date:'2026-10-05',time:'16:00',zone:'UTC',location:'',url:'',evidence:[text],uncertainties:[]};
  const result=validateExtraction(JSON.stringify(value),message);
  assert.equal(result.date,'');assert.equal(result.time,'');assert.equal(result.zone,'');
  const valid=validateExtraction(JSON.stringify({...value,date:'2026-10-06',zone:'Asia/Shanghai'}),message);
  assert.equal(valid.date,'2026-10-06');assert.equal(valid.time,'16:00');assert.equal(valid.zone,'Asia/Shanghai');
});
test('disposed model service does not reopen credentials or send a new request',async()=>{
  let credentials=0,calls=0;
  const model=new ModelService({credentials:async()=>{credentials++;return {config:{baseUrl:'https://example.test/v1',model:'synthetic',timeoutSeconds:10,maxTokens:64,tokenField:'max_tokens'},apiKey:'synthetic-only'};}} as unknown as ModelSettings,async()=>{calls++;return {choices:[{message:{content:'synthetic'},finish_reason:'stop'}]};});
  model.dispose();
  await assert.rejects(model.run({expectedRevision:1,prompt:'test'},false,new AbortController().signal),/停止|取消/);
  assert.equal(credentials,0);assert.equal(calls,0);
});

for (const scenario of ['read and manually organize', 'revoke consent'])
test(`corrupt model settings do not prevent mail users from ${scenario}`,async()=>{
  const dir=await mkdtemp(join(tmpdir(),'mail-settings-fault-'));
  const secrets={protect:async(s:string)=>Buffer.from(s).toString('base64'),unprotect:async(s:string)=>Buffer.from(s,'base64').toString()};
  await writeFile(join(dir,'model-settings.json'),'{broken synthetic settings');
  const schedule=new ScheduleStore(join(dir,'schedules.db'));
  const model=new ModelService(new Settings(dir,secrets));
  const api=new MailAPI(dir,schedule,model,secrets);
  try {
    api.store.consent('https://synthetic.test/v1',true,true);
    if(scenario==='revoke consent') {
      const result=await api.act({action:'consent',enabled:false,automatic:false}) as any;
      assert.equal(result.preferences.enabled,false);
      assert.equal(result.preferences.automatic,false);
    } else {
      const id=await api.store.ingest('manual',{key:'settings-fault',subject:'合成面试通知',sender:'hr@example.test',receivedAt:'2026-09-21T00:00:00Z',text:'时间另行通知',attachment:false});
      const snapshot=await api.read();
      assert.equal(snapshot.candidates.length,1);
      assert.equal(snapshot.model.configured,false);
      assert.match((snapshot.model as any).error,/配置/);
      await api.act({action:'manualTask',id,draft:{...emptyTaskDraft(),title:'手动核对面试'}});
      assert.equal(api.store.taskAnalysis(id)!.actions.length,1);
      assert.equal(schedule.recruitment.all().length,0,'manual candidate still needs confirmation');
    }
  } finally {await api.close();model.dispose();schedule.close();await rm(dir,{recursive:true,force:true});}
});

test('deadline validation reaches HTTP/SQLite and a date-only task survives restart unchanged',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'task-boundary-http-'));
  await writeFile(join(dir,'index.html'),'<meta name="app-token" content="__APP_TOKEN__">');
  let app=await startServer({port:0,dataDir:dir,webDir:dir});
  const headers=async()=>{
    const health=await(await fetch(app.url+'/health')).json();
    const html=await(await fetch(app.url)).text();
    return {'Content-Type':'application/json','X-Profile-Id':health.profileId,'X-App-Token':html.match(/content="([a-f0-9]{64})"/)![1]};
  };
  try {
    const authorization=await headers();
    const task=draft({mode:'deadline',due:day('2026-10-05'),boundary:'unspecified'});
    const create=async(value:unknown)=>fetch(app.url+'/api/recruitment-task-commands',{method:'POST',headers:authorization,body:JSON.stringify({requestId:randomUUID(),operations:[{action:'create',draft:value}]})});
    assert.equal((await create({...task,plannedSlot:{start:point('2026-10-06'),end:null}})).status,400);
    const list=await(await fetch(app.url+'/api/recruitment-tasks',{headers:authorization})).json();
    assert.equal(list.data.total,0);
    assert.equal((await create(task)).status,200);
    await app.close();
    app=await startServer({port:0,dataDir:dir,webDir:dir});
    const reopened=await headers();
    const after=await(await fetch(app.url+'/api/recruitment-tasks',{headers:reopened})).json();
    assert.equal(after.data.total,1);
    assert.deepEqual(after.data.items[0].timing,task.timing);
    const calendar=await(await fetch(app.url+'/api/recruitment-timeline?from=2026-10-01&to=2026-10-31&zone=Australia%2FSydney',{headers:reopened})).json();
    assert.equal(calendar.data.markers.length,1);
    assert.equal(calendar.data.markers[0].date,'2026-10-05');
    assert.equal(calendar.data.markers[0].instant,null);
  } finally {await app.close();await rm(dir,{recursive:true,force:true});}
});
