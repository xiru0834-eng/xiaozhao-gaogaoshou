import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../companion.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];

// Execute the shipped view script; no real bridge, SQLite or personal records.
function harness(stored = '{}', navigation: any = {bookmark:null,browse:null}) {
  const writes: Array<[string, string]> = [];
  const nodes = new Map<string, any>();
  const listeners: Record<string, Function> = {};
  const doc: any = { activeElement: null, hasFocus: () => true, querySelectorAll: () => [], querySelector: () => null,
    addEventListener: (type: string, fn: Function) => { listeners[type] = fn; } };
  function element(id: string) {
    const attrs: Record<string, string> = {};
    const classes = new Set<string>();
    return { id, hidden: false, value: '', textContent: '', innerHTML: '', scrollTop: 0, dataset: {}, childNodes: [{ textContent: '' }],
      setAttribute: (key: string, value: unknown) => { attrs[key] = String(value); }, getAttribute: (key: string) => attrs[key],
      classList: { toggle: (key: string, on: boolean) => on ? classes.add(key) : classes.delete(key), contains: (key: string) => classes.has(key) },
      addEventListener() {}, querySelectorAll: () => [], getBoundingClientRect: () => ({top:0,bottom:50}), contains: (other: any) => other?.parent === id,
      focus() { doc.activeElement = this; }, scrollIntoView() {} };
  }
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const node = element(match[1]);
    node.hidden = /\shidden(?:\s|>)/.test(match[0]);
    nodes.set(match[1], node);
  }
  doc.getElementById = (id: string) => nodes.get(id);
  doc.body = element('body'); doc.documentElement = element('html');
  nodes.get('owner').value = '全部性质'; nodes.get('stage').value = '全部进度';
  const context = vm.createContext({ document: doc, window: { addEventListener() {} },
    localStorage: { getItem: (key: string) => key === 'companion-layout-v1' ? stored : null,
      setItem: (key: string, value: string) => writes.push([key, value]) },
    setTimeout: () => 0, clearTimeout() {}, setInterval() {}, console });
  vm.runInContext(script, context);
  const run = (code: string) => vm.runInContext(code, context);
  const companies = ['测试甲', '测试乙'].map(name => ({ name, owner: '私企', city: '上海', roles: 'Agent', code: 'ABCD', url: 'https://example.com', industry: 'AI' }));
  run(`setSnapshot(${JSON.stringify({ companies, statuses: {}, today: [], date: '2026-09-20', navigation })})`);
  return { run, nodes, writes, doc, listeners };
}

test('companion defaults to collapsed operations and compact rows', () => {
  const h = harness();
  assert.equal(h.nodes.get('selection-body')?.hidden, true);
  assert.equal(h.nodes.get('panel-toggle')?.getAttribute('aria-expanded'), 'false');
  assert.equal(h.doc.body.classList.contains('comfortable'), false);
});

test('disclosures preserve selected company, filters and application state', () => {
  const h = harness();
  h.nodes.get('search').value = '测试';
  const before = h.run('JSON.stringify({selected,statuses,tab})');
  h.run('setDisclosure("selection", true); setDisclosure("filters", false);');
  assert.equal(h.nodes.get('selection-body').hidden, false);
  assert.equal(h.nodes.get('filter-panel').hidden, true);
  assert.equal(h.nodes.get('search').value, '测试');
  assert.equal(h.run('JSON.stringify({selected,statuses,tab})'), before);
  assert.ok(h.writes.every(([key]) => key === 'companion-layout-v1'));
});

test('collapsing restores focus out of hidden panel and closes nested source', () => {
  const h = harness();
  h.run('setDisclosure("selection", true)');
  h.nodes.get('details').hidden = false;
  h.doc.activeElement = { parent: 'selection-body' };
  h.run('setDisclosure("selection", false)');
  assert.equal(h.doc.activeElement.id, 'panel-toggle');
  assert.equal(h.nodes.get('details').hidden, true);
});

test('layout preferences reload and malformed values fall back safely', () => {
  const h = harness('{"selection":true,"filters":false,"comfortable":true}');
  assert.equal(h.nodes.get('selection-body').hidden, false);
  assert.equal(h.nodes.get('filter-panel').hidden, true);
  assert.equal(h.doc.body.classList.contains('comfortable'), true);
  for (const value of ['bad json', 'null', '{"selection":"true","filters":0}']) {
    assert.equal(harness(value).nodes.get('selection-body')?.hidden, true);
  }
});

test('Escape dismisses source then operations without collapsing native window', () => {
  const h = harness();
  h.run('setDisclosure("selection", true)');
  h.nodes.get('details').hidden = false;
  h.listeners.keydown({ key: 'Escape' });
  assert.equal(h.nodes.get('details').hidden, true);
  assert.equal(h.nodes.get('selection-body').hidden, false);
  h.listeners.keydown({ key: 'Escape' });
  assert.equal(h.nodes.get('selection-body').hidden, true);
});

test('switching companies resets source disclosure, empty results hide actions', () => {
  const h = harness();
  h.nodes.get('details').hidden = false;
  h.run('step(1)');
  assert.equal(h.nodes.get('details').hidden, true);
  h.nodes.get('search').value = '无匹配公司'; h.run('render()');
  assert.equal(h.nodes.get('selected').hidden, true);
});

const point = {name:'测试乙',anchor:'测试乙',offset:0,scroll:50,query:'测试',owner:'私企',stage:'全部进度',tab:'未投',onlyCode:true,recent:false};
test('initial snapshot restores browse position once; polling does not reset it', () => {
  const h = harness('{}', {bookmark:null,browse:point});
  assert.equal(h.run('selected'), '测试乙');
  assert.equal(h.nodes.get('owner').value, '私企');
  assert.equal(h.nodes.get('companies').scrollTop, 50);
  h.run('selected="测试甲"; setSnapshot({statuses:{},navigation:{browse:null}})');
  assert.equal(h.run('selected'), '测试甲');
});
test('bookmark restores filters and never writes application statuses or overwrites bookmark', () => {
  const h = harness('{}', {bookmark:point,browse:null});
  h.run('statuses={"测试乙":"已投"}; restorePosition(bookmark,true)');
  assert.equal(h.run('selected'), '测试乙');
  assert.equal(h.run('tab'), 'all'); // Status changed since marking: explicitly relax filters.
  assert.equal(h.run('statuses["测试乙"]'), '已投');
  assert.equal(h.run('bookmark.tab'), '未投');
  assert.match(h.nodes.get('toast-text').textContent, /筛选/);
});
test('removed company leaves current context intact and gives an explanation', () => {
  const h = harness();
  h.run(`restorePosition(${JSON.stringify({...point,name:'已移除'})},true)`);
  assert.equal(h.run('selected'), '测试甲');
  assert.match(h.nodes.get('toast-text').textContent, /不在/);
});
test('anchor uses visible list row, not unrelated selected detail company', () => {
  const h = harness();
  h.nodes.get('companies').scrollTop = 57;
  h.nodes.get('companies').querySelectorAll = () => [{dataset:{name:'测试乙'},getBoundingClientRect:()=>({top:-7,bottom:43})}];
  const value = h.run('capturePosition()');
  assert.equal(value.name, '测试甲');
  assert.equal(value.anchor, '测试乙');
  assert.equal(value.offset, 7);
});

test('manual bookmark acknowledges durable save; failure retains original marker', async () => {
  const h = harness('{}', {bookmark:point,browse:null});
  h.run('bridge={save_navigation:async()=>{throw Error("disk full")}}');
  await h.run('markBookmark("测试甲")');
  assert.equal(h.run('bookmark.name'), '测试乙');
  assert.match(h.nodes.get('toast-text').textContent, /失败/);
  h.run('bridge={save_navigation:async()=>true}');
  await h.run('markBookmark("测试甲")');
  assert.equal(h.run('bookmark.name'), '测试甲');
  await h.run('markBookmark(null)');
  assert.equal(h.nodes.get('bookmark-tools').hidden, true);
});
test('exit waits for browse save before closing native shell', async () => {
  const h = harness();
  h.run('globalThis.calls=[];bridge={save_navigation:async()=>{calls.push("saved")},window_action:async()=>{calls.push("closed");return {}}}');
  await h.run('shell("close")');
  assert.equal(h.run('calls.join(",")'), 'saved,closed');
});
