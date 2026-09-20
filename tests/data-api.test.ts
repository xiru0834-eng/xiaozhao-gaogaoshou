import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {startServer} from '../src/server/http.ts';
import type {CatalogSnapshot} from '../src/shared/catalog-contract.ts';

test('two HTTP profiles are isolated; catalog append persists, paginates and never changes progress',async()=>{
  const root=await mkdtemp(join(tmpdir(),'xiaozhao-data-api-'));const web=join(root,'web');await mkdir(web);await writeFile(join(web,'index.html'),'<meta name="app-token" content="__APP_TOKEN__"><meta name="profile-id" content="__PROFILE_ID__">');
  let a=await startServer({dataDir:join(root,'a'),webDir:web,port:0});const b=await startServer({dataDir:join(root,'b'),webDir:web,port:0});
  try{
    const page=await(await fetch(a.url)).text();const token=page.match(/app-token" content="([a-f0-9]+)"/)?.[1];assert.ok(token);
    const health=await(await fetch(a.url+'/health')).json() as {profileId:string;instanceId:string};assert.match(health.profileId,/^[a-f0-9-]{36}$/);
    assert.notEqual((await(await fetch(b.url+'/health')).json() as {profileId:string}).profileId,health.profileId);
    assert.equal((await fetch(b.url+'/api/status',{headers:{'X-Profile-Id':health.profileId}})).status,409);
    await assert.rejects(startServer({dataDir:join(root,'a'),webDir:web,port:0}),/already in use/);
    const headers={'Content-Type':'application/json','X-App-Token':token,'X-Profile-Id':health.profileId};
    await fetch(a.url+'/api/status',{method:'POST',headers,body:JSON.stringify({updates:{腾讯:'面试'}})});
    const catalog=await(await fetch(a.url+'/api/catalog')).json() as CatalogSnapshot;
    const body={expectedRevision:catalog.revision,company:{row:['合成验收公司','ai','Agent','上海','','','https://example.org/jobs','','','测试数据'],ownership:'foreign',aliases:['SYNTHETIC'],firstSeenDate:'2026-09-20',channel:'none',channelEvidence:''}};
    assert.equal((await fetch(a.url+'/api/companies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).status,403);
    assert.equal((await fetch(a.url+'/api/companies',{method:'POST',headers,body:JSON.stringify(body)})).status,201);
    assert.equal((await fetch(a.url+'/api/companies',{method:'POST',headers,body:JSON.stringify(body)})).status,409);
    const list=await(await fetch(a.url+'/api/companies?offset=315&limit=1')).json() as {items:unknown[];total:number};assert.equal(list.total,316);assert.equal(list.items.length,1);
    assert.equal((await fetch(a.url+'/api/companies?limit=99999')).status,400);
    assert.deepEqual((await(await fetch(a.url+'/api/status')).json() as {statuses:object}).statuses,{腾讯:'面试'});
    assert.deepEqual((await(await fetch(b.url+'/api/status')).json() as {statuses:object}).statuses,{});
    const db=await fetch(a.url+'/api/backup?kind=catalog');assert.match(Buffer.from(await db.arrayBuffer()).subarray(0,15).toString(),/SQLite format 3/);
    await a.close();a=await startServer({dataDir:join(root,'a'),webDir:web,port:0});
    const after=await(await fetch(a.url+'/api/catalog')).json() as CatalogSnapshot;assert.equal(after.companies.length,316);assert.equal(after.companies.at(-1)?.[0],'合成验收公司');
    assert.equal((await(await fetch(a.url+'/health')).json() as {profileId:string}).profileId,health.profileId);
  }finally{await a.close();await b.close();await rm(root,{recursive:true,force:true});}
});
test('port conflict never reuses another profile and releases failed startup locks',async()=>{
  const root=await mkdtemp(join(tmpdir(),'xiaozhao-port-'));const a=await startServer({dataDir:join(root,'a'),webDir:root,port:0});
  try{
    await assert.rejects(startServer({dataDir:join(root,'b'),webDir:root,port:Number(new URL(a.url).port)}),/EADDRINUSE/);
    const b=await startServer({dataDir:join(root,'b'),webDir:root,port:0});await b.close();
  }finally{await a.close();await rm(root,{recursive:true,force:true});}
});
