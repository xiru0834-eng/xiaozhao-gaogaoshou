import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { registerCareerRoutes } from '../../src/adapters/http/career-routes.js'
import { openCareerRepository } from '../../src/infrastructure/career-repository.js'

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'shizhi-integrated-http-'))
  let career, server, dispose, handler
  try {
    career = await openCareerRepository(directory)
    registerCareerRoutes({ effect: (fn) => { dispose = fn() },
      webServer: { register: (route) => { handler = route.handler; return () => {} } },
      connection: { requestRejection: (request) => request.headers['x-harness-test'] === 'session' ? null : 401 },
    }, career, { repository: { listPractices: async () => [] } })
    server = createServer((request, response) => { void handler(request, response) })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const origin = `http://127.0.0.1:${server.address().port}`
    const call = (path, options = {}) => fetch(`${origin}/interview/career${path}`, {
      ...options, headers: { 'x-harness-test': 'session', ...options.headers },
    })
    const page = await call('/')
    const html = await page.text()
    const headers = { 'x-app-token': html.match(/name="app-token" content="([a-f0-9]+)"/)[1],
      'x-profile-id': career.profileId, 'content-type': 'application/json' }
    return { career, directory, call, page, headers, async close() {
      const drained = new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
      await dispose(); await drained
      await rm(directory, { recursive: true, force: true })
    } }
  } catch (error) {
    server?.close()
    if (dispose) await dispose(); else await career?.close()
    await rm(directory, { recursive: true, force: true })
    throw error
  }
}

test('all workbench modules share authenticated mounted routes and the original company profile', async () => {
  const instance = await fixture()
  const { call, headers, career, page } = instance
  try {
    assert.equal(page.headers.get('x-frame-options'), 'SAMEORIGIN')
    assert.equal((await call('/api/catalog', { headers: { 'x-harness-test': 'wrong' } })).status, 401)
    assert.equal((await call('/api/schedules')).status, 403)
    assert.equal((await call('/api/catalog', { headers: { 'x-profile-id': 'wrong' } })).status, 409)
    assert.equal((await call('/api/status', { method: 'POST', headers: { ...headers, origin: 'https://example.com' }, body: '{"updates":{}}' })).status, 403)
    assert.equal((await call('/api/daily-settings', { method: 'PUT', headers: { ...headers, 'x-app-token': 'wrong' }, body: '{}' })).status, 403)
    for (const path of ['/api/catalog', '/api/status', '/api/schedules', '/api/recruitment-tasks?limit=10', '/api/mail', '/api/daily-settings', '/api/sources', '/api/model-settings']) {
      const response = await call(path, { headers })
      assert.equal(response.status, 200, path)
      assert.equal((await response.json()).profileId, career.profileId, path)
    }
    for (const path of ['/assets/workbench.js', '/assets/workbench.css', '/assets/skins/mint-hero-v2.png']) assert.equal((await call(path)).status, 200, path)
    assert.equal((await call('/assets/../../.env')).status, 404)
    const name = career.catalog.snapshot().companies[0][0]
    assert.equal((await call('/api/status', { method: 'POST', headers, body: JSON.stringify({ updates: { [name]: '面试' } }) })).status, 200)
    assert.equal(career.store.statuses()[name], '面试')
    const paused = await call('/api/daily-activations/current', { method: 'DELETE', headers })
    assert.equal(paused.status, 200)
    assert.equal((await call('/preparation')).status, 200)
  } finally { await instance.close() }
})

test('calendar writes through the mounted API survive reopening without replacing company progress', async () => {
  const instance = await fixture()
  const { call, headers, directory, career } = instance
  try {
    const before = career.catalog.snapshot()
    const name = before.companies[0][0]
    career.save({ [name]: '面试' })
    const draft = { id: randomUUID(), company: '示例公司', role: 'Agent 开发', kind: 'interview', round: '一面', date: '2026-10-05', time: '14:00', endTime: '15:00', zone: 'Asia/Shanghai', status: 'planned', location: '线上', url: 'https://example.com/meeting', notes: '准备项目介绍', review: '', tasks: [{ text: '复习 RAG', done: false }] }
    const response = await call('/api/schedules', { method: 'POST', headers, body: JSON.stringify({ action: 'save', requestId: randomUUID(), expectedRevision: 0, item: draft }) })
    const saved = await response.json()
    assert.equal(response.status, 200, JSON.stringify(saved))
    assert.equal(saved.items[0].company, draft.company)
    assert.deepEqual(career.catalog.snapshot(), before)
    await assert.rejects(openCareerRepository(directory), /already in use/)
    await career.close()
    const reopened = await openCareerRepository(directory)
    try {
      assert.equal(reopened.profileId, career.profileId)
      assert.deepEqual(reopened.catalog.snapshot(), before)
      assert.equal(reopened.store.statuses()[name], '面试')
      const database = new DatabaseSync(join(directory, 'schedules.db'), { readOnly: true })
      try { assert.equal(JSON.parse(database.prepare('SELECT data FROM events WHERE id=?').get(draft.id).data).company, draft.company) }
      finally { database.close() }
    } finally { await reopened.close() }
  } finally { await instance.close() }
})

test('workbench shutdown removes routes and waits for an in-flight history response', async () => {
  const gate = Promise.withResolvers()
  let handler, dispose, closed = false, unregistered = false
  const career = { profileId: 'profile-one', workbench: { start() {} }, close: async () => { closed = true } }
  registerCareerRoutes({ effect: (fn) => { dispose = fn() }, webServer: { register: (route) => { handler = route.handler; return () => { unregistered = true } } },
    connection: { requestRejection: () => null } }, career, { repository: { listPractices: () => gate.promise } })
  const request = Object.assign(Readable.from([]), { url: '/interview/career/preparation', method: 'GET', headers: { host: '127.0.0.1:4317' } })
  let status
  const response = handler(request, { writeHead: (code) => { status = code }, end() {} })
  const closing = dispose()
  try { assert.deepEqual({ closed, unregistered }, { closed: false, unregistered: true }) }
  finally { gate.resolve([]); await Promise.all([response, closing]) }
  assert.equal(status, 200)
  assert.equal(closed, true)
})
