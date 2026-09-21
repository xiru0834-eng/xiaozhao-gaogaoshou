import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { DAILY_SCHEMA, DailyStore } from '../src/server/daily-store.ts';
import { DEFAULT_DAILY_OPTIONS } from '../src/shared/daily-contract.ts';

function setup() { const db = new DatabaseSync(':memory:'); db.exec(DAILY_SCHEMA); return {db,s:new DailyStore(db,'profile-test')}; }
const now = '2026-09-20T20:00:00.000Z', due = '2026-09-20T21:00:00.000Z';
test('settings optimistic concurrency, explicit activation and daily claim are durable', () => {
  const {db,s} = setup();
  try {
    assert.equal(s.settings().enabled,false);
    s.configure(DEFAULT_DAILY_OPTIONS,0,now);
    assert.throws(() => s.configure(DEFAULT_DAILY_OPTIONS,0,now), /变化/);
    s.activate(1,3,2,now);
    assert.equal(s.settings().nextDueAt,due);
    assert.equal(s.claimDue(now),null);
    const run = s.claimDue(due)!;
    assert.equal(run.trigger,'scheduled');
    assert.equal(s.claimDue(due),null);
    const reopened = new DailyStore(db,'profile-test');
    reopened.recover(due);
    assert.equal(reopened.run(run.id).state,'interrupted');
    assert.equal(reopened.reports().length,1);
    assert.equal(reopened.claimDue(due),null);
    assert.equal(db.prepare('PRAGMA integrity_check').get()?.integrity_check,'ok');
  } finally { db.close(); }
});
test('long offline gap catches only latest eligible slot, never replays all missed days', () => {
  const {db,s} = setup();
  try {
    s.activate(0,1,1,now);
    const catchup=s.claimDue('2026-09-22T22:00:00Z');
    assert.equal(catchup?.occurrence,'2026-09-23');
    assert.equal(s.claimDue('2026-09-22T22:00:00Z'),null);
    s.finish({...catchup!,state:'completed',finishedAt:'2026-09-22T22:00:00Z'},'2026-09-22T22:00:00Z');
    assert.equal(s.settings().nextDueAt,'2026-09-23T21:00:00.000Z');
    assert.ok(s.claimDue('2026-09-23T22:00:00Z'));
    assert.equal(s.claimDue('2026-09-23T22:00:00Z'),null);
  } finally { db.close(); }
});
test('activation receipts cannot enable a second time after disable or replay changed payload',()=>{
  const {db,s}=setup();try{
    const first=s.activate(0,1,1,now,'activation-first');
    assert.deepEqual(s.activate(0,1,1,now,'activation-first'),first);
    s.disable();s.activate(0,1,1,now,'activation-first');assert.equal(s.settings().enabled,false);
    assert.throws(()=>s.activate(2,1,1,now,'activation-first'),/不一致/);
  }finally{db.close();}
});
test('request idempotency and run/report atomic rollback preserve previous terminal state', () => {
  const {db,s} = setup();
  try {
    const run = s.startManual('request-test-1',0,now,1,1);
    assert.equal(s.startManual('request-test-1',0,now,1,1).id,run.id);
    assert.throws(() => s.startManual('request-test-2',0,now,1,1),/运行/);
    db.exec("CREATE TRIGGER fail_report BEFORE INSERT ON daily_reports BEGIN SELECT RAISE(ABORT,'disk full'); END");
    assert.throws(() => s.finish({...run,state:'completed',finishedAt:due},due),/disk full/);
    assert.equal(s.run(run.id).state,'running');
    db.exec('DROP TRIGGER fail_report');
    s.finish({...run,state:'completed',finishedAt:due},due);
    assert.equal(s.reports().length,1);
    assert.throws(() => s.finish({...run,state:'failed',finishedAt:due},due),/结束/);
  } finally { db.close(); }
});
test('budget reserve is atomic, shared across runs, held on timeout and persisted on reopen', () => {
  const {db,s} = setup();
  try {
    const run = s.startManual('request-budget',0,now,1,1);
    for(let i=0;i<6;i++) {s.reserve(`attempt-${i}`,run.id,'search',now);s.attemptState(`attempt-${i}`,'sent');s.attemptState(`attempt-${i}`,'unknown');}
    assert.equal(new DailyStore(db,'profile-test').usage(now).search,6);
    assert.throws(() => s.reserve('attempt-over',run.id,'search',now),/额度/);
    s.reserve('attempt-0',run.id,'search',now); // Exact retry of reservation is not a new debit.
    assert.equal(s.usage(now).search,6);
    assert.throws(() => s.reserve('attempt-0',run.id,'extract',now),/不一致/);
    assert.throws(() => s.attemptState('attempt-0','sent'),/状态/);
  } finally { db.close(); }
});
test('two windows, reload, same request recovery and timezone edits cannot duplicate a daily offer', () => {
  const {db,s} = setup();
  try {
    const run = s.startManual('request-notice',0,now,1,1);
    s.finish({...run,state:'completed',finishedAt:due},due);
    const report = s.reports()[0];
    assert.equal(s.notification(due)?.id,report.id);
    const claim = s.claimNotification(report.id,'notice-request-1',due);
    assert.equal(claim.claimed,true);
    assert.deepEqual(s.claimNotification(report.id,'notice-request-1',due),claim);
    assert.equal(s.claimNotification(report.id,'notice-request-2',due).claimed,false);
    assert.equal(s.reports()[0].readAt,null);
    const newer = s.startManual('request-notice-2',0,due,1,1);
    s.finish({...newer,state:'completed',finishedAt:due},due);
    s.configure({...DEFAULT_DAILY_OPTIONS,timeZone:'America/Los_Angeles'},0,due);
    assert.equal(s.claimNotification(s.reports()[0].id,'notice-request-3',due).claimed,false);
    if(claim.claimed) s.notificationAction(claim.deliveryId,'opened',due);
    assert.equal(s.report(report.id).readAt,due);
  } finally { db.close(); }
});
test('notifications respect delayed time, disabled, expiry and failed delivery writes', () => {
  const {db,s} = setup();
  try {
    s.configure({...DEFAULT_DAILY_OPTIONS,notifyTime:'09:00'},0,now);
    const run = s.startManual('request-delayed',1,now,1,1);
    s.finish({...run,state:'failed',finishedAt:due},due);
    assert.equal(s.notification(due),null);
    const later = '2026-09-20T23:00:00.000Z';
    assert.ok(s.notification(later));
    db.exec("CREATE TRIGGER fail_delivery BEFORE INSERT ON daily_deliveries BEGIN SELECT RAISE(ABORT,'disk full'); END");
    assert.throws(() => s.claimNotification(run.id,'notice-failure',later),/disk full/);
    db.exec('DROP TRIGGER fail_delivery');
    assert.equal(s.claimNotification(run.id,'notice-failure',later).claimed,true);
    assert.equal(s.notification('2026-09-22T23:00:00Z'),null);
  } finally { db.close(); }
});
