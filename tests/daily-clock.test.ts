import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailySlot, nextDailySlot, localDay, notificationWindow } from '../src/server/daily-clock.ts';
import { parseDailyOptions, DEFAULT_DAILY_OPTIONS } from '../src/shared/daily-contract.ts';

test('normal Sydney schedule and first enable never run a past slot', () => {
  assert.equal(dailySlot('2026-09-21', '07:00', 'Australia/Sydney'), '2026-09-20T21:00:00.000Z');
  assert.equal(nextDailySlot('2026-09-20T21:00:00.000Z', '07:00', 'Australia/Sydney').at, '2026-09-21T21:00:00.000Z');
  assert.equal(localDay('2026-09-20T21:00:00.000Z', 'Australia/Sydney'), '2026-09-21');
});
test('spring gap moves to first valid minute and autumn overlap uses first occurrence', () => {
  assert.equal(dailySlot('2026-10-04', '02:30', 'Australia/Sydney'), '2026-10-03T16:00:00.000Z');
  assert.equal(dailySlot('2026-04-05', '02:30', 'Australia/Sydney'), '2026-04-04T15:30:00.000Z');
});
test('local dates cross UTC day, year and leap day correctly', () => {
  assert.equal(nextDailySlot('2028-02-28T23:59:00Z', '00:00', 'UTC').day, '2028-02-29');
  assert.equal(nextDailySlot('2026-12-31T23:59:00Z', '00:00', 'UTC').day, '2027-01-01');
  assert.equal(dailySlot('2026-09-21', '07:00', 'Pacific/Kiritimati'), '2026-09-20T17:00:00.000Z');
});
test('notification windows preserve existing boundaries on timezone edits and handle 23/25 hour days', () => {
  const spring = notificationWindow('2026-10-04T00:00:00Z', 'Australia/Sydney');
  assert.equal(Date.parse(spring.end) - Date.parse(spring.start), 23 * 3600000);
  assert.deepEqual(notificationWindow('2026-10-04T01:00:00Z', 'America/New_York', spring), spring);
  const autumn = notificationWindow('2026-04-05T00:00:00Z', 'Australia/Sydney');
  assert.equal(Date.parse(autumn.end) - Date.parse(autumn.start), 25 * 3600000);
  const changed = notificationWindow(spring.end, 'America/New_York', spring);
  assert.equal(changed.start, spring.end);
  assert.ok(changed.end > changed.start);
});
test('invalid settings, dates, times, unknown fields and excessive budgets fail closed', () => {
  assert.equal(parseDailyOptions(DEFAULT_DAILY_OPTIONS).timeZone, 'Australia/Sydney');
  for (const patch of [{localTime:'24:00'}, {timeZone:'Mars/City'}, {searchLimit:0}, {searchLimit:100}, {notifyEnabled:'yes'}, {acceptancePolicy:'all'}, {apiKey:'not-allowed'}]) {
    assert.throws(() => parseDailyOptions({...DEFAULT_DAILY_OPTIONS, ...patch}));
  }
  assert.throws(() => dailySlot('2026-02-30', '07:00', 'UTC'));
  assert.throws(() => nextDailySlot('broken', '07:00', 'UTC'));
});
