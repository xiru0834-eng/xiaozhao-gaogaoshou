// Isolated local preview only. Pass an installed playwright module directory.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = createRequire(import.meta.url)(process.argv[2] || 'playwright');
const browser = await chromium.launch({channel:'msedge',headless:true});
try {
 const context = await browser.newContext({viewport:{width:380,height:680}});
 const page = await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:18768/');
 await page.getByRole('button',{name:'标记这里：腾讯',exact:true}).waitFor();
 await page.getByRole('button',{name:'待投递',exact:false}).click();
 await page.getByRole('button',{name:'筛选 ▾',exact:true}).click();
 await page.getByLabel('公司性质').selectOption('私企');
 await page.getByRole('button',{name:'标记这里：三环集团',exact:true}).click();
 await page.getByText('已标记：三环集团。上方可随时回到这里。').waitFor();
 await page.getByRole('textbox',{name:'搜索公司、岗位或城市'}).fill('腾讯');
 await page.getByRole('button',{name:'回到 · 三环集团',exact:true}).click();
 assert.equal(await page.locator('#company-name').textContent(),'三环集团');
 assert.equal(await page.locator('#search').inputValue(),'');
 assert.equal(await page.locator('#owner').inputValue(),'私企');
 const row=page.locator('[data-name="三环集团"]');
 const bounds=await row.boundingBox(), list=await page.locator('#companies').boundingBox();
 assert.ok(bounds.y>=list.y-1&&bounds.y+bounds.height<=list.y+list.height+1,'bookmark visible');
 // Waiting for the actual debounce duration is intentional in this isolated test.
 await page.waitForTimeout(350);
 await page.reload();
 await page.getByRole('button',{name:'回到 · 三环集团',exact:true}).waitFor();
 assert.equal(await page.locator('#company-name').textContent(),'三环集团');
 const restored=await row.boundingBox(),restoredList=await page.locator('#companies').boundingBox();
 assert.ok(Math.abs((restored.y-restoredList.y)-(bounds.y-list.y))<2,'scroll anchor restored relative to list on reload');
 await mkdir('qa-companion',{recursive:true});
 await page.screenshot({path:'qa-companion/bookmark-light.png'});
 await page.setViewportSize({width:320,height:560});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.ok((await page.locator('#companies').boundingBox()).height>=100);
 await page.getByRole('button',{name:'更多设置',exact:true}).click();
 await page.getByRole('button',{name:'切换深色 / 浅色',exact:true}).click();
 await page.waitForTimeout(200); // Allow the existing 150ms row colour transition to finish.
 await page.screenshot({path:'qa-companion/bookmark-dark-small.png'});
 await page.getByRole('button',{name:'清除位置书签',exact:true}).click();
 await page.getByText('位置书签已清除',{exact:true}).waitFor();
 await page.reload();
 await page.getByRole('button',{name:'标记这里：三环集团',exact:true}).waitFor();
 assert.equal(await page.locator('#bookmark-tools').isVisible(),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: mark, filter restore, visible anchor, reload persistence, clear, 320px dark layout; no page errors');
} finally {await browser.close();}
