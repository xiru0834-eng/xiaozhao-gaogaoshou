import test from 'node:test'
import assert from 'node:assert/strict'
import { createHomeActions, registerProductHome } from '../../src/client/shared/home-session.js'
import { SlotCore } from '@deepseek-ai/dsh-client-ui-slots'

function fixture(result = { ok: true, value: { accepted: true } }) {
  const calls = []
  const actions = createHomeActions({
    async create(...args) { calls.push(['create', ...args]); return 'new-session' },
    async using(id, options, operation) {
      calls.push(['retain', id, options.source])
      try {
        return await operation({ binding: { session: {
          async prompt(content, mode) { calls.push(['prompt', content, mode]); return result },
        } } })
      } finally { calls.push(['release', id]) }
    },
  }, { openSession(id) { calls.push(['open', id]) } })
  return { actions, calls }
}

test('the first chat creates a session without a workspace and opens it after admission', async () => {
  const { actions, calls } = fixture()
  assert.equal(await actions.sendMessage(undefined, '你好'), 'new-session')
  assert.deepEqual(calls, [
    ['create'], ['retain', 'new-session', 'controllerOperation'],
    ['prompt', [{ type: 'text', text: '你好' }], 'queue'],
    ['open', 'new-session'], ['release', 'new-session'],
  ])
})

test('an existing empty session is reused, and failed submission does not navigate away', async () => {
  const { actions, calls } = fixture({ ok: false, error: { message: '模型未配置' } })
  await assert.rejects(actions.sendMessage('existing', '解释索引'), /模型未配置/)
  assert.equal(calls.some(([action]) => action === 'create' || action === 'open'), false)
  assert.deepEqual(calls.at(-1), ['release', 'existing'])
})

test('a practice starts in a new independent session without a directory picker', async () => {
  const { actions, calls } = fixture()
  assert.equal(await actions.createSession(), 'new-session')
  assert.deepEqual(calls, [['create'], ['open', 'new-session']])
})

test('the landing page yields to the original conversation and releases its subscription', () => {
  const slots = new SlotCore()
  const releaseRoot = slots.register({ name: 'root', children: {
    'main.conversation': { kind: 'single', scope: 'session-maybe' },
  } }, () => null)
  const original = () => null
  const home = () => null
  const releaseOriginal = slots.register({ name: 'main.conversation', children: {
    'conversation.session.header': { kind: 'single', scope: 'session' },
  } }, original)
  let state = { byId: {} }, listener
  const sessions = { list: { getSnapshot: () => state, subscribe: (fn) => { listener = fn; return () => { listener = undefined } } } }
  const dispose = registerProductHome(slots, sessions, home)
  try {
    assert.equal(slots.entriesOfSlot('main.conversation')[0].component, home)
    state = { byId: { one: { blank: false, retainedBy: { mainView: 1 } } } }
    listener()
    assert.equal(slots.entriesOfSlot('main.conversation')[0].component, original)
    state.byId.one.blank = true
    listener()
    assert.equal(slots.entriesOfSlot('main.conversation')[0].component, home)
    dispose()
    assert.equal(listener, undefined)
    assert.equal(slots.entriesOfSlot('main.conversation')[0].component, original)
  } finally { dispose(); releaseOriginal(); releaseRoot() }
})
