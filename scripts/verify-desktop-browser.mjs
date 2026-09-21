import {createRequire} from 'node:module';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.argv[2] || 'playwright');
const target = new URL(process.argv[3] || 'http://127.0.0.1:18766/');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname), 'Only a local desktop profile can be inspected.');
const output=await mkdtemp(join(tmpdir(),'xiaozhao-desktop-browser-'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==target.origin || !['GET','HEAD'].includes(route.request().method())) return route.abort();
    return route.continue();
  });
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(target.href);
  await page.getByRole('searchbox',{name:'搜索公司、岗位、城市或内推码'}).waitFor();
  await page.screenshot({path:join(output,'workbench.png')});
  assert.equal(await page.title(),'校招高高手 · 求职工作台');
  await page.goto(new URL('/#schedules', target).href);
  await page.getByText('面试日程',{exact:true}).first().waitFor();
  await page.screenshot({path:join(output,'schedules.png')});
  assert.deepEqual(errors,[]);
  await writeFile(join(output,'result.json'),JSON.stringify({ok:true,errors,workbenchAndScheduleLoaded:true,personalProgressWrites:0}));
  console.log(JSON.stringify({output,ok:true,errors}));
} finally {await browser.close();}
