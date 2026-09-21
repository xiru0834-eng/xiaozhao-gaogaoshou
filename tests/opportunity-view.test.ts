import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roleKeywords, deadlineNotice, placeMenu, mountWorkbenchOverview } from '../src/client/opportunity-view.ts';

test('role chips only summarize explicitly present role keywords', () => {
  assert.deepEqual(roleKeywords('大模型应用 · 智能客服 Agent'), ['大模型', 'Agent']);
  assert.deepEqual(roleKeywords('人工智能安全研究员 · Java / C++'), ['人工智能', 'Java', 'C++']);
  assert.deepEqual(roleKeywords('研究 / 工程'), []);
  assert.deepEqual(roleKeywords('AIGC · RAG · Agent · Python · Java'), ['AIGC', 'RAG', 'Agent']);
  assert.deepEqual(roleKeywords('agent / AGENT · RAG'), ['Agent', 'RAG']);
});

test('deadline notice uses the filtered count and never claims guaranteed availability', () => {
  assert.deepEqual(deadlineNotice(8, false), { title: '别错过，这一批机会', detail: '当前筛选中有 8 家公司在 7 天内截止。日期来自目录，投前请核对官网。', action: '查看近期截止', pressed: false });
  assert.equal(deadlineNotice(0, false).title, '按自己的节奏，继续下一站');
  assert.equal(deadlineNotice(0, true).action, '取消截止筛选');
  assert.equal(deadlineNotice(1, true).pressed, true);
});

test('filter menu stays in the viewport and flips above a low anchor', () => {
  const below = placeMenu({left: 12, right: 82, top: 430, bottom: 470}, {width: 273, height: 495}, {width: 320, height: 900, top: 96});
  assert.ok(below.left >= 12 && below.left + 273 <= 308);
  assert.ok(below.top + below.maxHeight <= 888);
  const above = placeMenu({left: 800, right: 900, top: 650, bottom: 690}, {width: 620, height: 430}, {width: 1024, height: 768, top: 56});
  assert.ok(above.top >= 68);
  assert.ok(above.top + above.maxHeight <= 642);
});

test('overview can collapse and reopen without changing filters or application records', () => {
  const attrs: Record<string,string> = {};
  let click = () => {};
  const button = {textContent:'', setAttribute: (k:string,v:string) => attrs[k]=v,
    addEventListener: (_:string, handler:()=>void) => {click = handler;}};
  const root = {dataset:{}, querySelector: () => button};
  mountWorkbenchOverview(root as unknown as HTMLElement);
  assert.equal(attrs['aria-expanded'], 'true');
  click();
  assert.deepEqual(root.dataset, {focus: 'true'});
  assert.equal(attrs['aria-expanded'], 'false');
  assert.match(button.textContent, /展开概览/);
  click();
  assert.deepEqual(root.dataset, {focus: 'false'});
  assert.equal(attrs['aria-expanded'], 'true');
});
