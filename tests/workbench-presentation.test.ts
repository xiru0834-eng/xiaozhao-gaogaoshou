import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const legacy = read('../index.html');
const css = read('../src/client/styles.css');

test('legacy and TypeScript workbench ship identical presentation styles', () => {
  const embedded = legacy.match(/<style>([\s\S]*?)<\/style>/)?.[1];
  assert.equal(embedded?.replace(/\r\n/g, '\n').trim(), css.replace(/\r\n/g, '\n').trim());
});

test('both workbenches retain labelled search, filtering, density and result surfaces', () => {
  for (const html of [legacy, read('../web/index.html')]) {
    for (const id of ['q', 'active-filters', 'result-count', 'group-select', 'sort-order', 'density-toggle', 'board']) {
      assert.ok(html.includes(`id="${id}"`), `missing ${id}`);
    }
    assert.ok(html.includes('查找公司与调整视图'));
  }
});
