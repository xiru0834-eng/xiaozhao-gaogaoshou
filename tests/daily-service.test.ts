import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { DailyService } from '../src/server/daily-service.ts';
import { DailyStore, DAILY_SCHEMA } from '../src/server/daily-store.ts';
import { ModelError } from '../src/shared/model-contract.ts';
import type { ModelService } from '../src/server/model-service.ts';
import type { CollectionService } from '../src/server/collection-service.ts';
import type { CatalogStore } from '../src/server/catalog-store.ts';
import type { SearchResult } from '../src/server/search-deepseek.ts';

// Real scheduler/store; only external model and source boundaries are substituted.
function fixture(search?:(signal:AbortSignal)=>Promise<SearchResult>) {
  const db=new DatabaseSync(':memory:');db.exec(DAILY_SCHEMA);const store=new DailyStore(db,'scheduler-test');
  let now='2026-09-20T20:00:00.000Z',calls=0,revision=1;
  const model={settings:{read:async()=>({revision,hasKey:true,config:{baseUrl:'https://api.deepseek.com'}})},
    searchPublic:async(_query:string,_rev:number,signal:AbortSignal)=>{calls++;return search?search(signal):{leads:Array.from({length:5},(_,i)=>({title:'岗位 '+i,url:`https://example.org/job/${i}`,publishedAt:null})),usage:{input:3,output:4,serverSearches:1}};}} as unknown as ModelService;
  const collection={sources:[],preferences:{read:async()=>({revision:1,preferences:{graduationMonth:'2027-01'}})},isBusy:()=>false} as unknown as CollectionService;
  const catalog={snapshot:()=>({companies:[['测试公司']]})} as unknown as CatalogStore;
  const service=new DailyService(store,model,collection,catalog,()=>now);
  return {db,store,service,setNow:(value:string)=>{now=value;},changeModel:()=>{revision++;},calls:()=>calls,
    close:async()=>{await service.close();db.close();}};
}
async function finished(store:DailyStore,id:string) {
  for(let i=0;i<100;i++){const r=store.run(id);if(r.state!=='running')return r;await new Promise(resolve=>setTimeout(resolve,5));}
  throw Error('Run did not terminate');
}
test('headless due check executes once without a browser and next day can run again',async()=>{
  const f=fixture();try{
    await f.service.activate(0);assert.equal(f.calls(),0);
    f.setNow('2026-09-20T21:00:00.000Z');await Promise.all([f.service.tick(),f.service.tick()]);
    await finished(f.store,f.store.active()?.id??f.store.reports()[0].id);assert.equal(f.calls(),1);
    await f.service.tick();assert.equal(f.calls(),1);
    await new Promise(r=>setTimeout(r,0));f.setNow('2026-09-21T21:00:00.000Z');await f.service.tick();
    await finished(f.store,f.store.active()?.id??f.store.reports()[0].id);assert.equal(f.store.reports().length,2);assert.ok(f.calls()>1);
  }finally{await f.close();}
});
test('provider 429 stops immediately, keeps quota and saves failure instead of success',async()=>{
  const f=fixture(async()=>{throw new ModelError('RATE_LIMIT');});try{
    const run=await f.service.start('failure-request',0);const done=await finished(f.store,run.id);
    assert.equal(done.state,'failed');assert.equal(f.calls(),1);assert.equal(f.store.usage(done.startedAt).search,1);
    assert.equal(f.store.reports().length,1);assert.equal(f.db.prepare('SELECT state FROM daily_attempts').get()?.state,'unknown');
    assert.equal((await f.service.start('failure-request',0)).id,run.id);assert.equal(f.calls(),1);
  }finally{await f.close();}
});
test('cancel aborts in-flight request, never queues more work, second start is rejected',async()=>{
  const f=fixture(signal=>new Promise((_resolve,reject)=>{signal.addEventListener('abort',()=>reject(new ModelError('CANCELLED')),{once:true});}));
  try{
    const run=await f.service.start('cancel-request',0);
    for(let i=0;i<50&&!f.calls();i++)await new Promise(r=>setTimeout(r,2));
    await assert.rejects(f.service.start('second-request',0),/运行/);
    f.service.cancel(run.id);assert.equal((await finished(f.store,run.id)).state,'cancelled');assert.equal(f.calls(),1);
  }finally{await f.close();}
});
test('changed credentials pause automatic execution before any paid request',async()=>{
  const f=fixture();try{
    await f.service.activate(0);f.changeModel();f.setNow('2026-09-20T21:00:00.000Z');await f.service.tick();
    assert.equal(f.calls(),0);assert.equal(f.store.settings().enabled,false);assert.match(f.store.settings().pauseReason!,/变化/);
  }finally{await f.close();}
});
test('report disk failure stops subsequent invocations and preserves interrupted evidence',async()=>{
  const f=fixture();try{
    f.db.exec("CREATE TRIGGER full_disk BEFORE INSERT ON daily_reports BEGIN SELECT RAISE(ABORT,'disk full'); END");
    await f.service.start('disk-request',0);
    for(let i=0;i<100;i++){if((await f.service.view()).failure)break;await new Promise(r=>setTimeout(r,5));}
    assert.match((await f.service.view()).failure!,/写入/);
    await assert.rejects(f.service.start('do-not-repeat',0),/写入/);assert.equal(f.calls(),1);
    f.db.exec('DROP TRIGGER full_disk');f.store.recover('2026-09-20T22:00:00.000Z');assert.equal(f.store.reports()[0].run.state,'interrupted');
  }finally{await f.close();}
});

test('closing during readiness waits and never launches a late paid search',async()=>{
  const f=fixture();let release!:()=>void,entered!:()=>void;
  const gate=new Promise<void>(r=>{release=r;}),started=new Promise<void>(r=>{entered=r;});
  const readiness=f.service.readiness.bind(f.service);
  f.service.readiness=async()=>{entered();await gate;return readiness();};
  try {
    const pending=f.service.start('shutdown-readiness',0);await started;
    const rejected=assert.rejects(pending,/停止|关闭/);
    let closed=false;const closing=f.service.close().then(()=>{closed=true;});
    await new Promise(r=>setImmediate(r));const premature=closed;
    release();await closing;await rejected;
    assert.equal(premature,false);assert.equal(f.calls(),0);assert.equal(f.store.active(),null);
  }finally{release();await f.close();}
});
