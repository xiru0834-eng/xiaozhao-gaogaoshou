// Real browser + HTTP + SQLite, disposable profile. Native-search response is a labelled fixture.
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { startServer } from '../dist/server/server/http.js';
const {chromium}=createRequire(import.meta.url)(process.argv[2]||'playwright');
const dir=await mkdtemp(join(tmpdir(),'daily-browser-'));
const evidence=resolve('artifacts/daily-verification');await mkdir(evidence,{recursive:true});
let calls=0;
const app=await startServer({port:0,dataDir:dir,webDir:resolve('dist/web'),collectionDependencies:{sources:[]},modelDependencies:{
  secrets:{protect:async s=>Buffer.from(s).toString('base64'),unprotect:async s=>Buffer.from(s,'base64').toString()},
  searchTransport:async()=>{calls++;return {status:200,body:JSON.stringify({content:[{type:'web_search_tool_result',content:[{type:'web_search_result',title:'合成验收样例 · 2027 Agent 应用岗位（非真实招聘）',url:'https://example.org/campus/fixture'}]}],usage:{input_tokens:10,output_tokens:10,server_tool_use:{web_search_requests:1}}})};},
}});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const html=await(await fetch(app.url)).text(),health=await(await fetch(app.url+'/health')).json();
  const headers={'Content-Type':'application/json','X-Profile-Id':health.profileId,'X-App-Token':html.match(/app-token" content="([a-f0-9]+)"/)[1]};
  const api=async(path,method='GET',body)=>{const r=await fetch(app.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});assert.ok(r.ok,`${path}: ${r.status}`);return r.json();};
  const original=await api('/api/status');
  await api('/api/model-settings','POST',{expectedRevision:0,config:{baseUrl:'https://api.deepseek.com',model:'deepseek-flash',timeoutSeconds:10,maxTokens:4096,tokenField:'max_tokens'},keyAction:'replace',apiKey:'synthetic-browser-test-key'});
  await api('/api/job-preferences','POST',{expectedRevision:0,preferences:{graduationMonth:'2027-01',degree:'master',major:'软件工程',cities:[],includeInternships:false,confirmed:true}});
  const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(app.url+'/#daily');await page.locator('[data-daily="fields"]:not(:disabled)').waitFor();
  await page.getByLabel('每天开始时间',{exact:true}).fill('08:30');
  await page.locator('.daily-budget summary').click();await page.getByLabel('搜索请求',{exact:true}).fill('1');
  await page.getByRole('button',{name:'保存设置',exact:true}).click();await page.getByText('设置已保存；保存本身没有调用模型。',{exact:true}).waitFor();
  assert.equal(calls,0);
  await page.reload();await page.locator('[data-daily="fields"]:not(:disabled)').waitFor();assert.equal(await page.getByLabel('每天开始时间',{exact:true}).inputValue(),'08:30');
  await page.locator('[data-daily="consent"]').check();
  await page.getByRole('button',{name:'现在检查一次',exact:true}).click();
  await page.locator('.daily-letter').waitFor({timeout:5000});assert.equal(calls,1);
  await page.getByRole('button',{name:'每日更新',exact:true}).count();
  await page.locator('#daily-heading').click();await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('.daily-notice').waitFor();
  await page.screenshot({path:join(evidence,'desktop-letter.png'),fullPage:true});
  // A second visible window must not get a second offer.
  const second=await context.newPage();await second.goto(app.url+'/#daily');
  await second.locator('.daily-letter').waitFor();await second.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await new Promise(r=>setTimeout(r,400));assert.equal(await second.locator('.daily-notice').count(),0);
  await page.getByRole('button',{name:'稍后看',exact:true}).click();await page.reload();await page.locator('.daily-letter').waitFor();
  assert.equal(await page.locator('.daily-notice').count(),0);
  await page.locator('.daily-letter').first().click();await page.locator('[data-daily="report"]:not([hidden])').waitFor();
  assert.match(await page.locator('[data-daily="report"]').innerText(),/尚未证明岗位开放或内推有效/);
  await page.locator('[data-daily="consent"]').check();await page.getByRole('button',{name:'启用每日更新',exact:true}).click();
  await page.locator('[data-daily="enabled"][data-enabled="true"]').waitFor();assert.equal(calls,1);
  await page.getByRole('button',{name:'暂停自动更新',exact:true}).click();await page.locator('[data-daily="enabled"][data-enabled="false"]').waitFor();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:join(evidence,'mobile.png'),fullPage:true});
  assert.equal(await page.locator('.daily-page').evaluate(n=>n.scrollWidth<=n.clientWidth+1),true);
  // Validate second-theme layout, without touching persisted appearance settings.
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.screenshot({path:join(evidence,'mobile-dark.png'),fullPage:true});
  await page.locator('[data-daily="back"]').click();await page.locator('#open-schedules').click();await page.locator('.schedule-page:not([hidden])').waitFor();
  await page.locator('#open-daily').click();await page.locator('.daily-page:not([hidden])').waitFor();
  assert.deepEqual(await api('/api/status'),original);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,fixtureSearchCalls:calls,noPaidCalls:true,multiWindowOnce:true,mobile:true,preservedProgress:true,consoleErrors:errors.length,evidence}));
} catch(error) {
  for(const context of browser.contexts())for(const [i,page] of context.pages().entries()){
    await page.screenshot({path:join(evidence,`failure-${i}.png`),fullPage:true}).catch(()=>{});
    console.error('UI feedback:',await page.locator('[data-daily="feedback"]').textContent().catch(()=>''));
  }
  throw error;
} finally {await browser.close();await app.close();await rm(dir,{recursive:true,force:true});}
