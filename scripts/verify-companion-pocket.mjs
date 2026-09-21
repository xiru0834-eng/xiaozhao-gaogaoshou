// Browser regression checks against the synthetic bridge, never the user's DB.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = createRequire(import.meta.url)(process.argv[2] || 'playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
const shotDir = 'qa-companion';
await mkdir(shotDir, { recursive: true });
try {
  const context = await browser.newContext({viewport:{width:380,height:680},permissions:['clipboard-read','clipboard-write']});
  const page = await context.newPage(), errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:18768/');
  await page.locator('.company-row').first().waitFor();
  const visible = await page.locator('.company-row').evaluateAll(rows=>{
    const list=document.getElementById('companies').getBoundingClientRect();
    return rows.filter(r=>{const b=r.getBoundingClientRect();return b.top>=list.top&&b.bottom<=list.bottom;}).length;
  });
  assert.ok(visible>=7, `Only ${visible} full rows`);
  results.push({check:'380x680 visible companies',value:visible});
  const originalCompany=await page.locator('#company-name').textContent();
  const minimums = [];
  for(const skin of ['mint','blue','sakura','violet','amber']) {
    await page.locator('#more').click();
    await page.locator(`[data-skin-option=${skin}]`).click();
    await page.getByRole('button',{name:'关闭设置',exact:true}).click();
    assert.equal(await page.locator('html').getAttribute('data-skin'),skin);
    assert.equal(await page.locator('#company-name').textContent(),originalCompany);
    const imageReady=await page.locator('.brand-portrait').evaluate(async e=>{
      const value=getComputedStyle(e).backgroundImage;
      if(value==='none')return false;
      const image=new Image();image.src=value.slice(5,-2);
      try{await image.decode();return image.naturalWidth>0;}catch{return false;}
    });
    assert.equal(imageReady,true,skin+' avatar must decode');
    for(const mode of ['light','dark']) {
      if(await page.locator('html').getAttribute('data-theme')!==mode){
        await page.locator('#more').click();await page.locator('#theme').click();
      }
      const ratios=await page.evaluate(()=>{
        const cs=getComputedStyle(document.documentElement);
        const lum=hex=>{let value=hex.trim().replace('#','');if(value.length===3)value=[...value].map(x=>x+x).join('');const channels=value.match(/.{2}/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];};
        const ratio=(a,b)=>{const x=lum(cs.getPropertyValue(a)),y=lum(cs.getPropertyValue(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
        return [['--ink','--surface'],['--muted','--surface'],['--muted','--bg'],['--brand','--soft'],['--brand','--on-brand']].map(([a,b])=>({a,b,ratio:ratio(a,b)}));
      });
      assert.ok(ratios.every(r=>r.ratio>=4.5),JSON.stringify({skin,mode,ratios}));
      minimums.push({skin,mode,minimum:Math.min(...ratios.map(r=>r.ratio))});
      await page.waitForTimeout(220); // Finish the intentional 180ms theme transitions before visual QA.
      await page.screenshot({path:`${shotDir}/pocket-${skin}-${mode}.png`});
    }
    await page.locator('#more').click();await page.locator('#theme').click();
  }
  results.push({check:'five skins, two modes, decoded avatars and text contrast',value:minimums});
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-skin'),'amber');
  await page.locator('#more').click();await page.locator('[data-skin-option=mint]').click();
  await page.screenshot({path:`${shotDir}/pocket-settings.png`});
  await page.getByRole('button',{name:'关闭设置',exact:true}).click();
  await page.locator('#filters-collapse').click();await page.locator('#filter-toggle').click();
  await page.getByLabel('公司性质').selectOption('私企');await page.locator('#only-code').click();
  await page.locator('#filters-collapse').click();
  assert.equal(await page.getByRole('button',{name:/待投递/}).isVisible(),true);
  assert.match(await page.locator('#filter-summary').textContent(),/私企.*有内推码/);
  await page.locator('#search').fill('腾讯');
  await page.locator('#panel-toggle').click();
  await page.locator('#copy').click();
  await page.getByText('内推码已复制，去表单粘贴吧。',{exact:true}).waitFor();
  assert.match(await page.locator('#toast-text').textContent(),/已复制/);
  await page.locator('#toast-close').click();await page.locator('#mark').click();
  await page.getByText('腾讯 · 已保存为已投',{exact:true}).waitFor();
  assert.equal(await page.locator('#today-count').textContent(),'1');
  await page.locator('#undo').click();
  assert.equal(await page.locator('#status').inputValue(),'未投');
  results.push({check:'compound filters, persistent tabs, copy, save and undo',value:'PASS'});
  await page.locator('#search').fill('___没有这家公司___');
  assert.equal(await page.locator('#selected').isVisible(),false);
  await page.locator('#reset').click();await page.locator('#panel-toggle').click();
  await page.setViewportSize({width:320,height:560});
  await page.locator('#panel-toggle').click();
  assert.ok((await page.locator('#companies').boundingBox()).height>=100);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`${shotDir}/pocket-small-details.png`});
  await page.locator('#more').click();await page.locator('#theme').click();
  await page.screenshot({path:`${shotDir}/pocket-small-dark.png`});
  await page.keyboard.press('Escape');
  await page.locator('#collapse').click();
  await page.setViewportSize({width:28,height:88});
  assert.equal(await page.locator('.app').isVisible(),false);
  assert.equal(await page.locator('#edge').isVisible(),true);
  assert.equal(await page.locator('#toast').isVisible(),false,'collapsed edge cannot be covered by a toast');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.body.scrollHeight<=innerHeight),true);
  await page.screenshot({path:`${shotDir}/pocket-edge.png`});
  await page.locator('#edge').click();await page.setViewportSize({width:380,height:680});
  assert.equal(await page.locator('.app').isVisible(),true);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('#pin').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  results.push({check:'small layout, disclosure, native-sized edge UI, reduced motion',value:'PASS'});
  const failure=await context.newPage();await failure.goto('http://127.0.0.1:18768/?fail-save');
  await failure.locator('.company-row').first().waitFor();
  if(await failure.locator('#selection-body').isHidden())await failure.locator('#panel-toggle').click();
  await failure.locator('#mark').click();await failure.locator('#retry').waitFor();
  assert.equal(await failure.locator('#today-count').textContent(),'0');
  await failure.locator('#collapse').click();
  assert.equal(await failure.locator('.app').isVisible(),true);
  await failure.locator('#retry').click();
  await failure.getByText('腾讯 · 已保存为已投',{exact:true}).waitFor();
  assert.equal(await failure.locator('#today-count').textContent(),'1');
  assert.deepEqual(errors,[]);
  results.push({check:'save failure blocks close, retry confirmed once, no JS errors',value:'PASS'});
  await writeFile(`${shotDir}/pocket-browser-results.json`,JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
} finally { await browser.close(); }
