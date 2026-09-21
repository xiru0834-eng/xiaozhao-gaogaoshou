import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from '../src/server/http.ts';
import { DEFAULT_DAILY_OPTIONS } from '../src/shared/daily-contract.ts';

test('daily HTTP lifecycle: guarded config, real store + protocol fixture, reports, multi-window delivery, no progress writes', async () => {
  const dir=await mkdtemp(join(tmpdir(),'daily-api-')),web=join(dir,'web');await mkdir(web);
  await writeFile(join(web,'index.html'),'<meta name="app-token" content="__APP_TOKEN__"><meta name="profile-id" content="__PROFILE_ID__">');
  let calls=0;
  const app=await startServer({dataDir:join(dir,'data'),webDir:web,port:0,
    collectionDependencies:{sources:[]},
    modelDependencies:{secrets:{protect:async s=>Buffer.from(s).toString('base64'),unprotect:async s=>Buffer.from(s,'base64').toString()},
      searchTransport:async()=>{calls++;return {status:200,body:JSON.stringify({content:[{type:'web_search_tool_result',content:[{type:'web_search_result',url:'https://example.org/jobs/1',title:'2027 AI Agent 校招 内推'}]}],usage:{server_tool_use:{web_search_requests:1}}})};}},
  });
  try {
    const page=await (await fetch(app.url)).text(), health=await (await fetch(app.url+'/health')).json() as any;
    const headers={'Content-Type':'application/json','X-App-Token':page.match(/app-token" content="([a-f0-9]+)"/)![1],'X-Profile-Id':health.profileId};
    const call=async(path:string,method='GET',body?:unknown)=>fetch(app.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    const get=async(path:string)=>(await call(path)).json() as Promise<any>;
    assert.equal((await fetch(app.url+'/api/daily-settings')).status,403);
    assert.equal((await fetch(app.url+'/api/daily-settings',{headers:{...headers,Origin:'https://evil.example'}})).status,403);
    const original=await get('/api/status');
    assert.equal((await call('/api/daily-settings','PUT',{expectedRevision:0,settings:DEFAULT_DAILY_OPTIONS})).status,200);assert.equal(calls,0);
    assert.equal((await call('/api/daily-activations','POST',{requestId:'activate-request',settingsRevision:1})).status,422);
    await call('/api/model-settings','POST',{expectedRevision:0,config:{baseUrl:'https://api.deepseek.com',model:'deepseek-flash',timeoutSeconds:10,maxTokens:4096,tokenField:'max_tokens'},keyAction:'replace',apiKey:'synthetic-key'});
    await call('/api/job-preferences','POST',{expectedRevision:0,preferences:{graduationMonth:'2027-01',degree:'master',major:'软件工程',cities:[],includeInternships:false,confirmed:true}});
    const input={requestId:'daily-manual-request',expectedSettingsRevision:1};
    const start=await call('/api/discovery-runs','POST',input);assert.equal(start.status,202);
    const {run:created}=await start.json() as any;
    let run=created;
    for(let i=0;i<100 && run.state==='running';i++){await new Promise(r=>setTimeout(r,10));run=(await get('/api/discovery-runs/'+created.id)).run;}
    assert.equal(run.state,'partial');assert.equal(run.counts.discovered,1);assert.equal(run.counts.acceptedJobs,0);assert.equal(run.counts.verifiedJobs,0);
    assert.ok(run.errors.some((s:string)=>s.includes('核验')));
    const callCount=calls;await call('/api/discovery-runs','POST',input);assert.equal(calls,callCount);
    const report=(await get('/api/daily-reports')).reports[0];assert.equal(report.id,run.id);
    const notices=await Promise.all(['claim-one','claim-two'].map(requestId=>call('/api/notification-deliveries','POST',{reportId:report.id,requestId}).then(r=>r.json()))) as any[];
    assert.equal(notices.filter(v=>v.claim.claimed).length,1);
    assert.deepEqual(await get('/api/status'),original);
    assert.equal((await call('/api/daily-reports?limit=101')).status,400);
    assert.equal((await call('/api/daily-activations','POST',{requestId:'activate-request',settingsRevision:1})).status,200);
    assert.equal(calls,callCount); // Enabling schedules the future; it does not run now.
    assert.equal((await call('/api/daily-activations/current','DELETE')).status,200);
    assert.equal((await get('/api/daily-settings')).settings.enabled,false);
  } finally {await app.close();await rm(dir,{recursive:true,force:true});}
});
