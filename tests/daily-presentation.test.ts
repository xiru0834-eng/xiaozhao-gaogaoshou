import { test } from 'node:test';
import assert from 'node:assert/strict';
import { noticeCopy, canOfferNotice, dailyStateLabel } from '../src/client/daily-presentation.ts';
import { createSession } from '../src/client/session.ts';

test('daily copy never promotes unverified leads to accepted jobs, and failures stay failures', () => {
  assert.match(noticeCopy('partial', 5, 0), /线索/);
  assert.doesNotMatch(noticeCopy('partial', 5, 0), /新增.*岗位/);
  assert.match(noticeCopy('failed', 0, 0), /未完成/);
  assert.match(noticeCopy('completed', 0, 0), /没有/);
  assert.equal(dailyStateLabel('interrupted'), '上次中断');
});
test('notices defer while hidden, editing, in a modal, or already displaying a notice', () => {
  assert.equal(canOfferNotice(true, false, false, false), true);
  for (const [visible, editing, modal, shown] of [[false,false,false,false],[true,true,false,false],[true,false,true,false],[true,false,false,true]])
    assert.equal(canOfferNotice(visible,editing,modal,shown),false);
});
test('daily session never retries a potentially billable write and rejects foreign profiles', async () => {
  let calls=0;
  const session=createSession('local','token',async()=>{calls++;return new Response(JSON.stringify({profileId:'local',error:{message:'Conflict'}}),{status:409});},async()=>{throw Error('must not reconnect');});
  await assert.rejects(session.dailyRequest('/api/daily-settings','PUT',{}), /Conflict/);
  assert.equal(calls,1);
  const foreign=createSession('local','token',async()=>new Response(JSON.stringify({profileId:'other'})),async()=>{throw Error();});
  await assert.rejects(foreign.dailyRequest('/api/daily-settings'), /档案/);
});
