import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { registerSpeechRoutes } from '../../src/adapters/http/speech-routes.js'
import { resolveSpeechConfig } from '../../src/infrastructure/speech-provider.js'

const env = { SHIZHI_ASR_PROVIDER: 'qwen', SHIZHI_ASR_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  SHIZHI_ASR_MODEL: 'qwen3-asr-flash', SHIZHI_ASR_API_KEY: 'test-only-key' }

function makeRoute(options = {}) {
  let handler
  const ctx = { effect: (factory) => factory(), connection: { requestRejection: () => null },
    webServer: { register: (route) => { handler = route.handler; return () => {} } } }
  registerSpeechRoutes(ctx, resolveSpeechConfig({}, env), { env, fetcher: assert.fail, ...options })
  return handler
}

async function request(handler, method, headers = {}) {
  const input = Readable.from([Buffer.from([1, 2, 3])])
  Object.assign(input, { method, headers: { host: '127.0.0.1:4317', origin: 'http://127.0.0.1:4317', 'content-type': 'audio/webm;codecs=opus', ...headers } })
  const response = Object.assign(new EventEmitter(), {
    writeHead(status) { this.status = status }, end(body) { this.body = JSON.parse(body) },
  })
  await handler(input, response)
  input.destroy()
  assert.equal(response.listenerCount('close'), 0)
  return response
}

test('voice discovery reports readiness and supported formats without disclosing credentials', async () => {
  const response = await request(makeRoute(), 'GET')
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { configured: true, provider: 'https://dashscope.aliyuncs.com', ready: true,
    maxSeconds: 180, maxBytes: 8 * 1024 * 1024, mimeTypes: ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus'] })
  const missing = await request(makeRoute({ env: {} }), 'GET')
  assert.equal(missing.body.configured, true)
  assert.equal(missing.body.ready, false)
  const rejected = await request(makeRoute({ env: {} }), 'POST')
  assert.equal(rejected.status, 502)
  assert.match(rejected.body.error.message, /填写语音服务密钥/)
})

test('the authenticated voice route converts browser audio into a Qwen request and returns only the transcript', async () => {
  const handler = makeRoute({ fetcher: async (url, options) => {
    assert.equal(JSON.parse(options.body).messages[0].content[0].input_audio.data, 'data:audio/webm;base64,AQID')
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: '  GET 是幂等的。  ' } }], usage: { seconds: 3 } }))
  } })
  const response = await request(handler, 'POST')
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { text: 'GET 是幂等的。' })
  const rejected = await request(makeRoute(), 'POST', { origin: 'https://unrelated.example' })
  assert.equal(rejected.status, 403)
})

test('voice errors preserve actionable status guidance but hide untrusted transport and response details', async () => {
  const forbidden = await request(makeRoute({ fetcher: async () => new Response('private response', { status: 403 }) }), 'POST')
  assert.match(forbidden.body.error.message, /403.*权限/)
  assert.doesNotMatch(forbidden.body.error.message, /private/)
  const transport = await request(makeRoute({ fetcher: async () => { throw new Error('private transport') } }), 'POST')
  assert.match(transport.body.error.message, /检查服务连接/)
  assert.doesNotMatch(transport.body.error.message, /private/)
})
