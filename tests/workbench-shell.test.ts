import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeModule, requestWorkbenchNavigation, WORKBENCH_MODULES } from '../src/client/workbench-shell.ts';

test('one stable navigation entry exists for each already-supported workspace page', () => {
  assert.deepEqual(WORKBENCH_MODULES.map(item => item.id), ['open-workbench', 'open-schedules', 'open-daily', 'open-updates', 'open-model']);
  assert.equal(activeModule(undefined), 'open-workbench');
  assert.equal(activeModule('schedules'), 'open-schedules');
  assert.equal(activeModule('models'), 'open-model');
  assert.equal(activeModule('unrecognized'), 'open-workbench');
});

test('returning home respects the existing unsaved-change navigation veto', () => {
  const events = new EventTarget();
  let changed = false;
  events.addEventListener('workspace:navigate', event => {
    assert.equal((event as CustomEvent).detail, 'workbench');
    event.preventDefault();
  });
  assert.equal(requestWorkbenchNavigation(events, () => { changed = true; }), false);
  assert.equal(changed, false);
});

test('accepted navigation changes only the presentation supplied by the caller', () => {
  let accepted = 0;
  assert.equal(requestWorkbenchNavigation(new EventTarget(), () => { accepted++; }), true);
  assert.equal(accepted, 1);
});
