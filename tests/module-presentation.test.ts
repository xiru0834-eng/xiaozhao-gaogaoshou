import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moduleIdentity, moduleCompanion } from '../src/client/module-identity.ts';

const read = (name: string) => readFileSync(new URL(`../src/client/${name}`, import.meta.url), 'utf8');
test('modules use distinct decorative icons and a non-interactive companion', () => {
  const icons = (['models', 'schedules', 'updates'] as const).map(moduleIdentity);
  assert.equal(new Set(icons).size, 3);
  for (const html of icons) { assert.match(html, /aria-hidden="true"/); assert.match(html, /<svg/); }
  assert.match(moduleCompanion, /aria-hidden="true"/);
  assert.doesNotMatch(moduleCompanion, /button|tabindex/);
});
test('refined module views preserve controller field and action contracts', () => {
  const contracts = [
    ['model-settings-view.ts', 'data-model', ['form','fields','url','model','key','save','test','prompt','generate','cancel','feedback','answer']],
    ['updates-view.ts', 'data-updates', ['sources','budget','consent','extract','source-only','preferences','preference-fields','month','degree','major','cities','internships','confirmed','save-prefs','runs','preview','jobs']],
    ['schedules-view.ts', 'data-s', ['new','search','kind','state','zone','calendar','grid','day-events','list','form','fields','close-editor','time-preview','tasks','save','cancel','delete']],
  ] as const;
  for (const [name, attr, keys] of contracts) {
    const html = read(name);
    for (const key of keys) assert.equal(html.split(`${attr}="${key}"`).length - 1, 1, `${name}: unique ${key}`);
  }
  const schedule = read('schedules-view.ts');
  for (const field of ['company','role','kind','round','date','zone','time','endTime','location','url','notes','status','review']) {
    assert.equal(schedule.split(`name="${field}"`).length - 1, 1, `schedule field ${field}`);
  }
});
test('module polish keeps character opt-out, focus, reduced motion and small screens', () => {
  const css = read('module-surfaces.css');
  assert.match(css, /\[data-characters="false"\] \.module-companion/);
  assert.match(css, /appearance-dialog\[data-characters=false\] \.skin-art/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /max-width:400px/);
  assert.match(css, /color:var\(--on-accent\)/);
  assert.match(css, /\.appearance-dialog \.appearance-footer[^}]*max-width:none/);
  assert.doesNotMatch(css, /background-blend-mode:luminosity/);
});
