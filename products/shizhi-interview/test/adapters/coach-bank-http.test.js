import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { registerApiRoutes } from '../../src/adapters/http/api-routes.js'
import { applicationFixture } from '../support/application-fixture.js'

function fixture() {
  const routes = new Map()
  const { application } = applicationFixture()
  registerApiRoutes({ effect: (factory) => factory(), connection: { requestRejection: () => null },
    webServer: { register: (route) => { routes.set(route.path, route.handler); return () => {} } } }, { application })
  return async (method, body, headers = {}) => {
    const request = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))])
    Object.assign(request, { method, url: '/interview/api/question-bank', headers: { 'content-type': 'application/json', host: 'localhost:4317', ...headers } })
    let status, result
    await routes.get(request.url)(request, { writeHead: (value) => { status = value }, end: (value) => { result = JSON.parse(value) } })
    return { status, result }
  }
}

test('the authenticated bank route lists, masters and restores a known question', async () => {
  const request = fixture()
  const listed = await request('GET')
  assert.equal(listed.status, 200)
  const key = listed.result.items[0].key
  assert.equal((await request('POST', { key, mastered: true })).result.mastered, true)
  assert.equal((await request('GET')).result.items.find((item) => item.key === key).mastered, true)
  assert.equal((await request('POST', { key, mastered: false })).result.mastered, false)
  assert.equal((await request('DELETE')).status, 405)
})

test('foreign origins, non-JSON requests and invalid question choices do not modify the bank', async () => {
  const request = fixture()
  const key = (await request('GET')).result.items[0].key
  assert.equal((await request('POST', { key, mastered: true }, { origin: 'https://example.com' })).status, 400)
  assert.equal((await request('POST', { key, mastered: true }, { 'content-type': 'text/plain' })).status, 400)
  assert.equal((await request('POST', { key: 'missing', mastered: true })).result.error.code, 'QUESTION_NOT_FOUND')
  assert.equal((await request('POST', { key, mastered: 'yes' })).result.error.code, 'INVALID_QUESTION_STATE')
  assert.equal((await request('GET')).result.items.filter((item) => item.mastered).length, 0)
})
