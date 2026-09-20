import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { registerCareerRoutes } from '../../src/adapters/http/career-routes.js'

function fixture(rejected = null, listPractices = async () => []) {
  let handler, dispose, closed = false, unregistered = false
  const writes = []
  const career = { profileId: 'profile-one', company: (name) => ({ companyName: name }),
    catalog: { snapshot: () => ({ companies: [['Company']] }) }, store: { statuses: () => ({ Company: '面试' }) }, save: (value) => writes.push(value), close: () => { closed = true } }
  registerCareerRoutes({ effect: (fn) => { dispose = fn() }, webServer: { register: (route) => { handler = route.handler; return () => { unregistered = true } } },
    connection: { requestRejection: () => rejected } }, career, { repository: { listPractices } })
  async function call(path, { method = 'GET', headers = {}, body } = {}) {
    const request = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : [])
    Object.assign(request, { url: `/interview/career${path}`, method, headers: { host: '127.0.0.1:4317', ...headers } })
    let status, result, outputHeaders
    await handler(request, { writeHead: (code, values) => { status = code; outputHeaders = values }, end: (value) => { result = value }, setHeader() {} })
    return { status, result, headers: outputHeaders }
  }
  return { call, writes, dispose: () => dispose(), state: () => ({ closed, unregistered }) }
}
test('company routes require Harness authentication and scope writes to the current workbench', async () => {
  assert.equal((await fixture(401).call('/api/catalog')).status, 401)
  const { call, writes } = fixture()
  const page = await call('/')
  assert.equal(page.status, 200)
  const token = page.result.toString().match(/name="app-token" content="([a-f0-9]+)"/)[1]
  const headers = { 'x-app-token': token, 'x-profile-id': 'profile-one', 'content-type': 'application/json' }
  assert.equal((await call('/api/status', { method: 'POST', body: { updates: {} } })).status, 403)
  assert.equal((await call('/api/status', { method: 'POST', headers: { ...headers, origin: 'https://example.com' }, body: { updates: {} } })).status, 403)
  assert.equal((await call('/api/status', { method: 'POST', headers, body: { updates: { Company: '面试' } } })).status, 200)
  assert.deepEqual(writes, [{ Company: '面试' }])
  assert.equal((await call('/api/catalog', { headers: { 'x-profile-id': 'wrong' } })).status, 409)
  assert.equal((await call('/assets/../../.env')).status, 404)
  assert.equal(page.headers['x-frame-options'], 'SAMEORIGIN')
})

test('workbench shutdown removes routes and waits for an in-flight response before closing storage', async () => {
  const gate = Promise.withResolvers()
  const instance = fixture(null, () => gate.promise)
  const response = instance.call('/preparation')
  const closing = instance.dispose()
  try {
    assert.deepEqual(instance.state(), { closed: false, unregistered: true })
  } finally {
    gate.resolve([])
    await Promise.all([response, closing])
  }
  assert.equal((await response).status, 200)
  assert.deepEqual(instance.state(), { closed: true, unregistered: true })
})
