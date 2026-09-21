/**
 * Read-only web presentation regression; run against an already running build.
 * node scripts/verify-web-polish.mjs [http://127.0.0.1:18765/]
 * Optional: --out=artifacts/qa-web-polish --playwright=<module path> --baseline
 *
 * Company/status responses are labelled synthetic fixtures. Other local GETs
 * exercise the running modules. Every non-GET/HEAD and off-origin request is
 * blocked before transmission; notification offers are suppressed so opening
 * the page cannot claim/read a real notification. No real form is submitted.
 * Screenshots and test-results.json are evidence, not backend/paid-call proof.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const option = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const target = new URL(args.find(arg => !arg.startsWith('--')) || 'http://127.0.0.1:18765/');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname), 'Only a local preview can be tested.');
const evidence = resolve(option('out') || 'artifacts/qa-web-polish');
const require = createRequire(import.meta.url);
const { chromium } = require(option('playwright') || 'playwright');
await mkdir(evidence, { recursive: true });

const date = days => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};
const rows = [
  ['验收样例 · 星河智能', 'ai', 'AI Agent · 大模型应用', '北京/上海', 'QATEST001', '', 'https://example.org/qa/one', date(3), '三天后截止', '合成验收样例，不是真实招聘。'],
  ['验收样例 · 星海平台', 'net', 'AI Agent · 全栈', '杭州', '', '', 'https://example.org/qa/two', date(12), '十二天后截止', '合成验收样例，不是真实招聘。'],
  ['验收样例 · 公共智能研究院', 'ai', '机器学习 · Python', '上海', 'QATEST003', '', 'https://example.org/qa/three', date(4), '四天后截止', '合成验收样例，不是真实招聘。'],
  ['验收样例 · 国有云服务', 'soe', 'Agent 平台 · Java', '北京', 'QATEST004', '', 'https://example.org/qa/four', date(5), '五天后截止', '合成验收样例，不是真实招聘。'],
  ['验收样例 · 外企实验室', 'frn', 'AI 工程师', '深圳', '', '', 'https://example.org/qa/five', '', '待核验', '合成验收样例，不是真实招聘。'],
  ['验收样例 · 很长的公司名称与人工智能机器人研发中心', 'hw', '多模态 · 嵌入式人工智能 · Robot · C++', '北京/深圳/上海/杭州', 'QATEST006', '', 'https://example.org/qa/six', date(36), '三十六天后截止', '合成验收样例，用于验证长文本换行，不是真实招聘。'],
  ['验收样例 · 过期机会', 'game', '游戏 AI', '成都', '', '', 'https://example.org/qa/seven', date(-10), '已过期', '合成验收样例，不是真实招聘。'],
];
const owners = ['private', 'private', 'public', 'state', 'foreign', 'private', 'private'];
const catalog = {
  schemaVersion: 1, revision: 900001, companies: rows,
  appendDates: [[rows[0][0], date(-1)]],
  metadata: rows.map((row, index) => ({
    id: `co_${String(index + 1).padStart(32, '0')}`, name: row[0], sequence: index + 1,
    ownership: owners[index], aliases: index === 0 ? ['QA星河'] : [],
    channel: index === 3 ? 'online' : 'none', channelEvidence: index === 3 ? '合成线上渠道' : '',
  })),
};
const statuses = { [rows[2][0]]: '已投', [rows[4][0]]: '面试', [rows[5][0]]: 'Offer' };
const results = {
  startedAt: new Date().toISOString(), target: target.origin,
  mode: 'synthetic ledger + real local read-only module responses',
  baseline: args.includes('--baseline'),
  specification: [
    '不以装饰挤占公司列表',
    '沿用项目的键盘操作、可见焦点、小窗口适配、明暗主题与减少动画支持',
    '数据安全和真实反馈优先于看起来流畅',
  ],
  cases: [], screenshots: [], blockedMutations: [], blockedExternal: [],
  apiReads: [], apiErrors: [], consoleErrors: [], consoleWarnings: [], pageErrors: [], notes: [], confirmations: [],
};
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let page;
let confirmationAction = 'dismiss';

async function capture(name, fullPage = false) {
  const file = `${name}.png`;
  await page.screenshot({ path: join(evidence, file), fullPage, animations: 'disabled' });
  results.screenshots.push(file);
  return file;
}
async function test(name, run) {
  const started = Date.now();
  try {
    const detail = await run();
    results.cases.push({ name, status: 'PASS', durationMs: Date.now() - started, ...(detail ? { detail } : {}) });
  } catch (error) {
    const screenshot = await capture(`failure-${name.replace(/[^a-z0-9-]/gi, '-')}`).catch(() => null);
    results.cases.push({ name, status: 'FAIL', durationMs: Date.now() - started, error: error.message, screenshot });
    console.error(`FAIL ${name}: ${error.message}`);
    // Restore through normal user navigation; never patch the live DOM/state.
    await page.goto(target.href).catch(() => {});
    await page.locator('#board button.company-name').first().waitFor().catch(() => {});
  }
}
async function settle() {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function layout(label, scope = 'body') {
  await settle();
  const actual = await page.locator(scope).evaluate(root => {
    const width = document.documentElement.clientWidth;
    const openDialog = document.querySelector('dialog[open]');
    const region = root === document.body && openDialog ? openDialog : root;
    const visible = element => {
      if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
      for (let parent = element; parent; parent = parent.parentElement) {
        if (parent.hidden) return false;
        if (parent.tagName === 'DETAILS' && !parent.open && !parent.querySelector(':scope > summary')?.contains(element)) return false;
      }
      return true;
    };
    const controls = [...region.querySelectorAll('button,input,select,summary,a.action')]
      .filter(visible).map(element => ({
        element, rect: element.getBoundingClientRect(),
        name: element.id || element.getAttribute('aria-label') || (element.textContent || element.tagName).trim().slice(0, 45),
      })).filter(({ rect }) => rect.width >= 12 && rect.height >= 12 && rect.top >= 0 && rect.bottom <= innerHeight);
    const scrollableX = element => {
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (/auto|scroll/.test(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth + 1) return true;
      }
      return false;
    };
    const clipped = controls.filter(({ element, rect }) => (rect.left < -1 || rect.right > width + 1) && !scrollableX(element))
      .map(({ name, rect }) => ({ name, left: rect.left, right: rect.right }));
    // A scrolled field behind an opaque sticky footer is not a painted overlap.
    // Compare controls whose centres are actually visible on the current page.
    const painted = controls.filter(({ element, rect }) => {
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return hit === element || element.contains(hit);
    });
    const overlap = [];
    for (let i = 0; i < painted.length; i++) for (let j = i + 1; j < painted.length; j++) {
      const a = painted[i], b = painted[j];
      if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
      const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (x > 2 && y > 2) overlap.push([a.name, b.name, Math.round(x), Math.round(y)]);
    }
    const bounding = root.getBoundingClientRect();
    return {
      width, documentWidth: document.documentElement.scrollWidth,
      scopeWidth: root.clientWidth, scopeScrollWidth: root.scrollWidth,
      left: bounding.left, right: bounding.right, clipped, overlap,
    };
  });
  assert.ok(actual.documentWidth <= actual.width + 1, `${label}: document horizontal overflow ${JSON.stringify(actual)}`);
  assert.ok(actual.scopeScrollWidth <= actual.scopeWidth + 1, `${label}: container horizontal overflow ${JSON.stringify(actual)}`);
  assert.deepEqual(actual.clipped, [], `${label}: controls leave viewport`);
  assert.deepEqual(actual.overlap, [], `${label}: interactive controls overlap`);
  return actual;
}
async function focusIs(selector) {
  assert.ok(await page.locator(selector).evaluate(element => element === document.activeElement), `Focus should return to ${selector}`);
}
async function menu(selector, panel, name) {
  await page.locator(`${selector} > summary`).click();
  await settle();
  const rect = await page.locator(panel).boundingBox();
  const viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth, height: innerHeight }));
  await capture(name);
  assert.ok(rect && rect.x >= 0 && rect.x + rect.width <= viewport.width + 1 && rect.y >= 0 && rect.y + rect.height <= viewport.height + 1,
    `${name}: menu outside viewport ${JSON.stringify({ rect, viewport })}`);
  const background = await page.locator(panel).evaluate(element => getComputedStyle(element).backgroundColor);
  assert.ok(background !== 'transparent' && !/^rgba\([^)]*,\s*0\)$/.test(background),
    `${name}: transparent menu background lets underlying list text show through (${background})`);
  await layout(name, panel);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator(selector).getAttribute('open'), null);
  await focusIs(`${selector} > summary`);
}
async function expectedCompanies(expected) {
  assert.deepEqual((await page.locator('#board button.company-name').allTextContents()).map(s => s.trim()).sort(), expected.slice().sort());
}
async function resetFilters() {
  if (await page.locator('#reset-filters').isVisible()) await page.locator('#reset-filters').click();
}

try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (!['GET', 'HEAD'].includes(method)) {
      results.blockedMutations.push({ method, path: url.pathname });
      await route.abort('blockedbyclient');
      return;
    }
    if (url.origin !== target.origin) {
      results.blockedExternal.push({ method, origin: url.origin });
      await route.abort('blockedbyclient');
      return;
    }
    const profileId = request.headers()['x-profile-id'];
    let fixture;
    if (url.pathname === '/api/catalog') fixture = catalog;
    if (url.pathname === '/api/status') fixture = { statuses };
    if (url.pathname === '/api/daily-notifications') fixture = { unread: 0, notification: null };
    if (fixture) {
      await route.fulfill({ json: { ...fixture, profileId } });
      return;
    }
    if (url.pathname.startsWith('/api/') || url.pathname === '/health') results.apiReads.push(url.pathname);
    await route.continue();
  });
  page = await context.newPage();
  page.setDefaultTimeout(6000);
  page.on('pageerror', error => results.pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') results.consoleErrors.push(message.text());
    if (message.type() === 'warning') results.consoleWarnings.push(message.text());
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/') && response.status() >= 400) results.apiErrors.push({ path: url.pathname, status: response.status() });
  });
  page.on('dialog', async dialog => {
    const action = confirmationAction;
    confirmationAction = 'dismiss';
    results.confirmations.push({ type: dialog.type(), action });
    if (action === 'accept') await dialog.accept();
    else await dialog.dismiss();
  });
  await page.goto(target.href);
  await page.locator('#board button.company-name').first().waitFor();
  await test('fixture-connected', async () => {
    assert.match(await page.locator('#result-count').innerText(), /7\s*\/\s*7/);
    assert.match(await page.locator('#savenote').innerText(), /已连接|已保存|本机/);
    return { companies: rows.length, fixtureStatuses: Object.keys(statuses).length };
  });

  for (const width of [1366, 1024, 768, 390]) {
    const height = width === 390 ? 844 : 900;
    await page.setViewportSize({ width, height });
    await test(`viewport-${width}`, async () => {
      await page.goto(target.href);
      await page.locator('#board button.company-name').first().waitFor();
      await capture(`responsive-${width}`, true);
      const detail = await layout(`viewport-${width}`);
      detail.firstCompanyTop = (await page.locator('#board button.company-name').first().boundingBox()).y;
      return detail;
    });

    await test(`menus-${width}`, async () => {
      const exportMenu = await page.locator('#export-menu').count() ? '#export-menu' : '.header-tools > details.menu';
      await menu(exportMenu, `${exportMenu} .menu-panel`, `export-menu-${width}`);
      await menu('#advanced-filters', '#advanced-filters .filter-panel', `filters-menu-${width}`);
      await menu('#view-options', '#view-options .menu-panel', `view-menu-${width}`);
    });

    await test(`status-tabs-reachable-${width}`, async () => {
      const last = page.locator('#status-filters [data-status="unsuitable"]');
      await last.focus();
      await settle();
      const rect = await last.boundingBox();
      const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.ok(rect.x >= -1 && rect.x + rect.width <= viewportWidth + 1, 'The last horizontally scrollable status tab must be reachable by keyboard focus.');
      await capture(`status-last-tab-${width}`);
      await page.locator('#status-filters [data-status="all"]').click();
    });

    await test(`search-combined-filters-${width}`, async () => {
      await page.locator('#q').fill('QA星河');
      await expectedCompanies([rows[0][0]]);
      await page.locator('#clear-search').click();
      await focusIs('#q');
      await page.locator('#q').fill('不存在的验收公司');
      await expectedCompanies([]);
      await capture(`empty-search-${width}`);
      await page.locator('#clear-search').click();
      await page.locator('#q').fill('AI');
      await page.locator('#advanced-filters > summary').click();
      await page.locator('#ownership-filters [data-owner="private"]').click();
      if (await page.locator('#advanced-filters').getAttribute('open') === null) await page.locator('#advanced-filters > summary').click();
      await page.locator('#filters [data-cat="ai"]').click();
      await page.keyboard.press('Escape');
      if (await page.locator('#overview-toggle').getAttribute('aria-expanded') !== 'true') await page.locator('#overview-toggle').click();
      await page.locator('#summary-code').click();
      await page.locator('#summary-soon').click();
      await expectedCompanies([rows[0][0]]);
      assert.match(await page.locator('#active-filters').innerText(), /搜索：AI/);
      await capture(`combined-filters-${width}`, true);
      await layout(`filtered-${width}`);
      await resetFilters();
      await page.locator('#status-filters [data-status="applied"]').click();
      await expectedCompanies([rows[2][0], rows[4][0], rows[5][0]]);
      await resetFilters();
    });

    await test(`density-overview-${width}`, async () => {
      const toggle = page.locator('#overview-toggle');
      if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
      const before = (await page.locator('#board').boundingBox()).y;
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('#opportunity-intro').isVisible(), false);
      const after = (await page.locator('#board').boundingBox()).y;
      assert.ok(after < before, 'Collapsing overview should free vertical space.');
      await page.locator('[data-density-view="compact"]').click();
      assert.equal(await page.locator('body').getAttribute('data-density'), 'compact');
      assert.equal(await page.locator('[data-density-view="compact"]').getAttribute('aria-pressed'), 'true');
      await capture(`focused-compact-${width}`, true);
      await layout(`compact-${width}`);
      await page.locator('[data-density-view="comfortable"]').click();
      assert.equal(await page.locator('body').getAttribute('data-density'), 'comfortable');
      await toggle.click();
      assert.equal(await page.locator('#opportunity-intro').isVisible(), true);
      return { boardTopExpanded: before, boardTopCollapsed: after };
    });

    await test(`company-detail-escape-${width}`, async () => {
      const opener = page.locator('#board button.company-name').first();
      const name = await opener.innerText();
      await opener.click();
      await page.locator('#company-detail[open]').waitFor();
      assert.ok(await page.locator('#company-detail').evaluate(element => element.contains(document.activeElement)));
      await capture(`company-detail-${width}`);
      await layout('company detail', '#company-detail');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#company-detail').getAttribute('open'), null);
      assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), name.trim());
    });

    for (const skin of ['mint', 'blue', 'sakura', 'violet', 'amber']) {
      await test(`skin-${skin}-${width}`, async () => {
        await page.locator('#appearance-open').click();
        await page.locator(`input[name="skin-choice"][value="${skin}"]`).check();
        await page.locator('input[name="skin-mode"][value="light"]').check();
        await page.locator('[data-a="apply"]').click();
        await focusIs('#appearance-open');
        assert.equal(await page.locator('html').getAttribute('data-skin'), skin);
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
        await page.keyboard.press('Control+Home');
        await settle();
        await capture(`skin-${skin}-light-${width}`);
        await layout(`${skin}-light-${width}`);
        await page.locator('#theme-toggle').click();
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
        await capture(`skin-${skin}-dark-${width}`);
        await layout(`${skin}-dark-${width}`);
        await page.locator('#theme-toggle').click();
      });
    }
    await test(`appearance-cancel-${width}`, async () => {
      const original = await page.locator('html').getAttribute('data-skin');
      await page.locator('#appearance-open').click();
      await page.locator('input[name="skin-choice"][value="blue"]').check();
      await capture(`appearance-${width}`);
      await layout('appearance', '#appearance-dialog');
      await page.keyboard.press('Escape');
      await focusIs('#appearance-open');
      assert.equal(await page.locator('html').getAttribute('data-skin'), original, 'Cancel must not apply the preview.');
    });

    const modules = [
      { id: 'daily', launch: '#open-daily', page: '.daily-page', heading: '#daily-heading', back: '[data-daily="back"]', feedback: '[data-daily="feedback"]' },
      { id: 'updates', launch: '#open-updates', page: '.updates-page', heading: '#updates-heading', back: '[data-updates="back"]', feedback: '[data-updates="feedback"]' },
      { id: 'models', launch: '#open-model', page: '.model-page', heading: '#model-heading', back: '[data-model="back"]', feedback: '[data-model="feedback"]' },
      { id: 'schedules', launch: '#open-schedules', page: '.schedule-page', heading: '#schedule-heading', back: '.schedule-page [data-s="back"]', feedback: '.schedule-page [data-s="feedback"]' },
    ];
    for (const module of modules) await test(`module-${module.id}-${width}`, async () => {
      const opener = await page.locator(module.launch).count() ? page.locator(module.launch) : page.getByRole('button', { name: '模型设置', exact: true });
      await opener.click();
      await page.locator(`${module.page}:not([hidden])`).waitFor();
      await focusIs(module.heading);
      await page.waitForFunction(selector => !/正在读取/.test(document.querySelector(selector)?.textContent || ''), module.feedback);
      const feedback = await page.locator(module.feedback).innerText();
      assert.notEqual(await page.locator(module.feedback).getAttribute('data-error'), 'true', `${module.id}: ${feedback}`);
      assert.notEqual(await page.locator(module.feedback).getAttribute('data-kind'), 'error', `${module.id}: ${feedback}`);
      if (/旧版|重新启动/.test(feedback)) results.notes.push({ module: module.id, width, message: feedback });
      await capture(`module-${module.id}-${width}`, true);
      await layout(module.id, module.page);
      if (module.id === 'models' && await page.locator('#open-workbench').count()) {
        await page.locator('#model-id').fill('qa-unsaved-do-not-submit');
        const beforeConfirmations = results.confirmations.length;
        await page.locator('#open-workbench').click();
        assert.equal(results.confirmations.length, beforeConfirmations + 1, 'Leaving a dirty model form must ask before discarding.');
        assert.equal(results.confirmations.at(-1).action, 'dismiss');
        assert.equal(await page.locator(module.page).isVisible(), true, 'Cancelling must preserve the model page.');
        assert.equal(await page.locator('#model-id').inputValue(), 'qa-unsaved-do-not-submit');
        assert.equal(await opener.getAttribute('aria-pressed'), 'true');
        assert.notEqual(await page.locator('#open-workbench').getAttribute('aria-pressed'), 'true');
        await capture(`dirty-navigation-cancel-${width}`);
        // Accept only the local discard prompt; this never sends a form.
        confirmationAction = 'accept';
      }
      if (module.id === 'schedules') {
        await page.locator('.schedule-page [data-s="new"]').click();
        await page.locator('.schedule-dialog[open]').waitFor();
        assert.ok(await page.locator('.schedule-dialog').evaluate(element => element.contains(document.activeElement)));
        await capture(`schedule-editor-${width}`);
        await layout('schedule editor', '.schedule-dialog');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.schedule-dialog').getAttribute('open'), null);
        await focusIs('.schedule-page [data-s="new"]');
        const mail = page.getByRole('button', { name: '邮件待确认', exact: true });
        await mail.click();
        await page.locator('.mail-dialog[open]').waitFor();
        await capture(`mail-dialog-${width}`);
        await layout('mail dialog', '.mail-dialog');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.mail-dialog').getAttribute('open'), null);
        assert.ok(await mail.evaluate(element => element === document.activeElement));
      }
      await page.locator(module.back).click();
      assert.equal(await page.locator(module.page).isVisible(), false);
      assert.ok(await opener.evaluate(element => element === document.activeElement));
    });
  }
  await test('read-only-and-console', async () => {
    assert.deepEqual(results.blockedMutations, [], 'The UI attempted a mutation; it was blocked, but this is outside this read-only test.');
    assert.deepEqual(results.blockedExternal, [], 'The UI attempted off-origin traffic.');
    assert.deepEqual(results.pageErrors, [], 'Uncaught browser errors');
    assert.deepEqual(results.consoleErrors, [], 'Browser console errors');
    assert.deepEqual(results.consoleWarnings, [], 'Browser console warnings');
    assert.deepEqual(results.apiErrors, [], 'Local API failures');
  });
} catch (error) {
  results.cases.push({ name: 'suite', status: 'FAIL', error: error.stack });
  if (page) await capture('failure-suite').catch(() => {});
} finally {
  await browser.close();
  results.apiReads = [...new Set(results.apiReads)].sort();
  results.finishedAt = new Date().toISOString();
  results.summary = { passed: results.cases.filter(test => test.status === 'PASS').length, failed: results.cases.filter(test => test.status === 'FAIL').length };
  results.passed = results.summary.failed === 0;
  await writeFile(join(evidence, 'test-results.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({ passed: results.passed, passedCases: results.summary.passed, failedCases: results.summary.failed, evidence, screenshots: results.screenshots.length, blockedMutations: results.blockedMutations.length }));
  if (!results.passed) process.exitCode = 1;
}
