import test from 'node:test'
import assert from 'node:assert/strict'
import { createHomeActions, registerProductHome } from '../../src/client/shared/home-session.js'
import { SlotCore } from '@deepseek-ai/dsh-client-ui-slots'

function sessionResult(coach) {
  return { resource: { data: { practice: coach ? { config: { coach } } : null } } }
}

function fixture(result = { ok: true, value: { accepted: true } }, coach) {
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
  }, { openSession(id) { calls.push(['open', id]) } }, { session: async () => sessionResult(coach) })
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

test('chat started from a practice uses a separate session', async () => {
  const { actions, calls } = fixture(undefined, { kind: 'mock' })
  assert.equal(await actions.sendMessage('interview', '你好'), 'new-session')
  assert.deepEqual(calls.slice(0, 2), [['create'], ['retain', 'new-session', 'controllerOperation']])
})

function routingFixture(t, readSession = async () => sessionResult()) {
  const slots = new SlotCore()
  const releaseRoot = slots.register({ name: 'root', children: {
    'main.conversation': { kind: 'single', scope: 'session-maybe' },
  } }, () => null)
  const original = () => null
  const home = () => null
  const releaseOriginal = slots.register({ name: 'main.conversation', children: {
    'conversation.session.header': { kind: 'single', scope: 'session' },
  } }, original)
  let state = { byId: {} }, listener, invalidate
  const sessions = { list: { getSnapshot: () => state, subscribe: (fn) => { listener = fn; return () => { listener = undefined } } } }
  const api = { session: readSession, subscribe: (fn) => { invalidate = fn; return () => { invalidate = undefined } } }
  const dispose = registerProductHome(slots, sessions, home, api)
  t.after(() => { dispose(); releaseOriginal(); releaseRoot() })
  return {
    select(id, blank = false) {
      state = { byId: id ? { [id]: { id, blank, retainedBy: { mainView: 1 } } } : {} }
      return listener()
    },
    invalidate: () => invalidate(),
    showingHome: () => slots.entriesOfSlot('main.conversation')[0].component === home,
    subscribed: () => Boolean(listener || invalidate),
    dispose,
  }
}

test('the landing page yields to ordinary chat and releases its subscriptions', async (t) => {
  const view = routingFixture(t)
  assert.equal(view.showingHome(), true)
  await view.select('chat')
  assert.equal(view.showingHome(), false)
  await view.select('empty', true)
  assert.equal(view.showingHome(), true)
  view.dispose()
  assert.equal(view.subscribed(), false)
  assert.equal(view.showingHome(), false)
})

for (const kind of ['standard', 'targeted', 'review', 'mock']) {
  test(`${kind} practice stays visible when model messages arrive and when reopened`, async (t) => {
    const view = routingFixture(t, async () => sessionResult({ kind }))
    await view.select('interview', true)
    const pending = view.select('interview', false)
    assert.equal(view.showingHome(), true)
    await pending
    assert.equal(view.showingHome(), true)
    await view.select(null)
    await view.select('interview', false)
    assert.equal(view.showingHome(), true)
    await view.invalidate()
    assert.equal(view.showingHome(), true)
  })
}

test('a delayed practice lookup cannot replace a newly selected chat', async (t) => {
  const delayed = Promise.withResolvers()
  const view = routingFixture(t, (id) => id === 'interview' ? delayed.promise : Promise.resolve(sessionResult()))
  const pending = view.select('interview')
  await view.select('chat')
  assert.equal(view.showingHome(), false)
  delayed.resolve(sessionResult({ kind: 'mock' }))
  await pending
  assert.equal(view.showingHome(), false)
})

test('lookup completion after disposal cannot register the product page again', async (t) => {
  const delayed = Promise.withResolvers()
  const view = routingFixture(t, () => delayed.promise)
  const pending = view.select('interview')
  view.dispose()
  delayed.resolve(sessionResult({ kind: 'mock' }))
  await pending
  assert.equal(view.showingHome(), false)
})

test('a failed lookup keeps the product page and can recover on invalidation', async (t) => {
  let offline = true
  const view = routingFixture(t, async () => {
    if (offline) throw new Error('offline')
    return sessionResult()
  })
  await view.select('unknown')
  assert.equal(view.showingHome(), true)
  offline = false
  await view.invalidate()
  assert.equal(view.showingHome(), false)
})

test('ordinary chat updates do not remount the product page while rechecking its binding', async (t) => {
  const delayed = Promise.withResolvers()
  let calls = 0
  const view = routingFixture(t, () => ++calls === 1 ? Promise.resolve(sessionResult()) : delayed.promise)
  await view.select('chat')
  const pending = view.invalidate()
  assert.equal(view.showingHome(), false)
  delayed.resolve(sessionResult())
  await pending
  assert.equal(view.showingHome(), false)
})
