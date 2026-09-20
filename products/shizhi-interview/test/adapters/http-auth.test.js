import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { registerApiRoutes, readJsonBody } from '../../src/adapters/http/api-routes.js'
import { registerSpeechRoutes } from '../../src/adapters/http/speech-routes.js'
import { resolveSpeechConfig } from '../../src/infrastructure/speech-provider.js'

test('all practice and speech routes reject an unauthenticated request before processing', async () => {
  const routes = []
  const ctx = { effect: (factory) => factory(), connection: { requestRejection: () => 401 }, webServer: { register: (route) => { routes.push(route); return () => {} } } }
  registerApiRoutes(ctx, {})
  registerSpeechRoutes(ctx, resolveSpeechConfig({}, {}))
  for (const route of routes) {
    let status, body
    await route.handler({ method: 'POST', headers: {} }, { writeHead: (value) => { status = value }, end: (value) => { body = value } })
    assert.equal(status, 401, route.path)
    assert.match(body, /启动链接/)
  }
})

test('Chinese answers survive a transport chunk splitting a UTF-8 character', async () => {
  const bytes = Buffer.from(JSON.stringify({ answer: '缓存失效与淘汰策略' }))
  const chunks = Array.from(bytes, (byte) => Buffer.from([byte]))
  const body = await readJsonBody(Readable.from(chunks))
  assert.equal(body.answer, '缓存失效与淘汰策略')
  await assert.rejects(readJsonBody(Readable.from(chunks), 4), { code: 'REQUEST_TOO_LARGE' })
})
