// Disposable profile: actual browser -> HTTP -> services -> SQLite.
// External source/model transports are synthetic; never reads personal credentials.
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { startServer } from '../dist/server/server/http.js';
import { ModelError } from '../dist/server/shared/model-contract.js';
const { chromium } = createRequire(import.meta.url)(process.argv[2] || 'playwright');
const directory = await mkdtemp(join(tmpdir(), 'backend-product-audit-'));
const evidence = resolve('artifacts/backend-audit');
await mkdir(evidence, { recursive: true });
const secrets = { protect: async s => Buffer.from(s).toString('base64'), unprotect: async s => Buffer.from(s, 'base64').toString() };
const fields = { title: 'Agent 工程师', locations: '北京', graduation: '2027届', degree: '硕士及以上', experience: '经验不限', employment: '全职', skills: 'RAG', salary: null, published: null, deadline: null, status: '立即申请' };
const html = `<main><h1>${fields.title}</h1><p>${Object.values(fields).filter(Boolean).join('\n')}</p><a href="/apply">立即申请</a></main>`;
const source = { id: 'audit-job', company: '腾讯', name: '合成测试 Agent 岗', entryUrl: 'https://example.org/job', kind: 'detail', allowedUrls: ['https://example.org/job'], verifiedAt: '2026-09-21', note: 'SYNTHETIC ONLY - not a real vacancy' };
let modelCalls = 0, sourceCalls = 0;
const app = await startServer({
  port: 0, dataDir: directory, webDir: resolve('dist/web'),
  mailDependencies: { secrets },
  modelDependencies: { secrets, transport: async (url, key, payload) => {
    assert.equal(url.href, 'https://synthetic.example/v1/chat/completions');
    assert.equal(key, 'synthetic-only'); modelCalls++;
    const input = JSON.parse(payload);
    if (input.model === 'fixture-error') throw new ModelError('AUTH');
    const extraction = payload.includes('<public_page>');
    return { choices: [{ message: { role: 'assistant', content: extraction ? JSON.stringify({ fields }) : '合成回复 <script>window.fixtureUnsafe=true</script>' }, finish_reason: 'stop' }] };
  } },
  collectionDependencies: { sources: [source], transport: async url => {
    sourceCalls++;
    return { status: 200, location: null, contentType: url.pathname === '/robots.txt' ? 'text/plain' : 'text/html', body: url.pathname === '/robots.txt' ? 'User-agent: *\nAllow: /' : html };
  } },
});
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
page.on('dialog', dialog => void dialog.accept());
try {
  const shell = await (await fetch(app.url)).text(), health = await (await fetch(app.url + '/health')).json();
  const headers = { 'Content-Type': 'application/json', 'X-Profile-Id': health.profileId, 'X-App-Token': shell.match(/app-token" content="([a-f0-9]+)"/)[1] };
  const api = async path => { const res = await fetch(app.url + path, { headers }); assert.ok(res.ok, `${path}: ${res.status}`); return res.json(); };
  await page.goto(app.url);
  const status = page.getByLabel('腾讯 投递状态', { exact: true });
  const savedStatus = page.waitForResponse(r => new URL(r.url()).pathname === '/api/status' && r.request().method() === 'POST' && r.ok());
  await status.selectOption('面试'); await savedStatus;
  await page.reload(); assert.equal(await status.inputValue(), '面试');
  const progress = await api('/api/status');
  await page.locator('#open-model').click();
  await page.locator('[data-model="fields"]:not(:disabled)').waitFor();
  await page.locator('#model-url').fill('https://synthetic.example/v1');
  await page.locator('#model-id').fill('fixture');
  await page.locator('#model-key').fill('synthetic-only');
  await page.locator('[data-model="save"]').click();
  await page.locator('[data-model="test"]:not(:disabled)').waitFor(); assert.equal(modelCalls, 0);
  await page.locator('[data-model="test"]').click();
  await page.locator('[data-model="answer-wrap"]:not([hidden])').waitFor(); assert.equal(modelCalls, 1);
  await page.locator('#model-prompt').fill('这是合成验收，请测试文本展示。');
  await page.locator('[data-model="generate"]').click();
  await page.locator('[data-model="generate"]:not(:disabled)').waitFor(); assert.equal(modelCalls, 2);
  assert.match(await page.locator('[data-model="answer"]').innerText(), /<script>/);
  assert.equal(await page.evaluate(() => window.fixtureUnsafe), undefined);
  await page.reload(); await page.locator('#open-model').click();
  await page.locator('[data-model="fields"]:not(:disabled)').waitFor();
  assert.equal(await page.locator('#model-key').inputValue(), '');
  assert.equal((await api('/api/model-settings')).settings.hasKey, true);
  await page.locator('#model-id').fill('fixture-error'); await page.locator('[data-model="save"]').click();
  await page.locator('[data-model="test"]:not(:disabled)').waitFor(); await page.locator('[data-model="test"]').click();
  await page.getByText('服务拒绝了 API Key。请核对密钥、服务地址和模型使用权限。', { exact: true }).waitFor();
  assert.equal(modelCalls, 3); // Auth failure is not retried.
  await page.locator('#model-id').fill('fixture'); await page.locator('[data-model="save"]').click();
  await page.locator('[data-model="test"]:not(:disabled)').waitFor();
  await page.locator('#open-updates').click();
  await page.locator('[data-updates="source-only"]:not(:disabled)').waitFor();
  await page.locator('[data-updates="source-only"]').click();
  await page.locator('[data-updates="preview"][data-state="completed"]').waitFor({ timeout: 10000 });
  assert.equal(modelCalls, 3); assert.equal((await api('/api/jobs')).total, 0);
  await page.locator('[data-view="start"]').click();
  await page.locator('#updates-month').fill('2027-01'); await page.locator('#updates-major').fill('软件工程');
  await page.locator('[data-updates="confirmed"]').check(); await page.locator('[data-updates="save-prefs"]').click();
  await page.getByText('匹配条件已保存在本机。之前的候选需要按新条件重新采集评估。', { exact: true }).waitFor();
  await page.locator('[data-updates="consent"]').check(); await page.locator('[data-updates="extract"]').click();
  await page.locator('.updates-candidate input:not(:disabled)').waitFor({ timeout: 10000 });
  assert.equal(modelCalls, 4); assert.equal((await api('/api/jobs')).total, 0);
  await page.locator('.updates-candidate input').check();
  await page.getByRole('button', { name: '确认收录所选（1）', exact: true }).click();
  await page.getByRole('button', { name: '确定收录', exact: true }).click();
  await page.getByText('所选岗位已收录。个人投递记录保持不变。', { exact: true }).waitFor();
  assert.equal((await api('/api/jobs')).total, 1); assert.deepEqual(await api('/api/status'), progress);
  await page.locator('[data-view="jobs"]').click(); await page.getByRole('heading', { name: 'Agent 工程师', exact: true }).waitFor();
  await page.screenshot({ path: join(evidence, 'accepted-job.png'), fullPage: true });
  await page.reload(); await page.locator('#open-updates').click();
  await page.locator('[data-updates="source-only"]:not(:disabled)').waitFor(); await page.locator('[data-view="jobs"]').click();
  await page.getByRole('heading', { name: 'Agent 工程师', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(evidence, 'mobile-jobs.png'), fullPage: true });
  assert.equal(await page.locator('.updates-page').evaluate(n => n.scrollWidth <= n.clientWidth + 1), true);
  assert.deepEqual(errors, []);
  const result = { passed: true, syntheticModelCalls: modelCalls, syntheticSourceCalls: sourceCalls, modelAuthErrorNoRetry: true, secretNotEchoed: true, outputEscaped: true, statusSurvivesReload: true, sourceOnlyNoModel: true, reviewRequiredBeforeAccept: true, acceptedJobs: 1, progressPreserved: true, mobile: true, pageErrors: 0 };
  await writeFile(join(evidence, 'result.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
} catch (error) {
  await page.screenshot({ path: join(evidence, 'failure.png'), fullPage: true }).catch(() => {});
  console.error('UI feedback:', await page.locator('[data-updates="feedback"]').textContent().catch(() => ''), await page.locator('[data-model="feedback"]').textContent().catch(() => ''));
  throw error;
} finally {
  await browser.close(); await app.close(); await rm(directory, { recursive: true, force: true });
}
