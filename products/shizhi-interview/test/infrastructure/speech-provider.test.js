import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveSpeechConfig, transcribe } from '../../src/infrastructure/speech-provider.js'

test('partial or insecure remote speech configuration fails before recording', () => {
  assert.throws(() => resolveSpeechConfig({}, { SHIZHI_ASR_URL: 'https://example.com/transcribe' }))
  assert.throws(() => resolveSpeechConfig({ url: 'http://remote.example/transcribe', model: 'whisper' }, {}))
  assert.throws(() => resolveSpeechConfig({ maxBytes: -1 }, {}))
})

test('speech adapter sends multipart audio and resolves credentials only on the server', async () => {
  const config = resolveSpeechConfig({ url: 'http://127.0.0.1:8000/v1/audio/transcriptions', model: 'whisper' }, {})
  const text = await transcribe(config, new Uint8Array([1, 2]), 'audio/webm;codecs=opus', {
    env: { SHIZHI_ASR_API_KEY: 'test-only-secret' }, fetcher: async (url, request) => {
      assert.equal(url, config.url)
      assert.equal(request.headers.Authorization, 'Bearer test-only-secret')
      assert.equal(request.body.get('model'), 'whisper')
      assert.equal(request.body.get('file').size, 2)
      assert.equal(request.redirect, 'error')
      return new Response(JSON.stringify({ text: ' MVCC 使用多个数据版本。 ' }))
    },
  })
  assert.equal(text, 'MVCC 使用多个数据版本。')
})

test('oversized recordings and invalid provider responses never become answers', async () => {
  const config = resolveSpeechConfig({ url: 'https://example.com/transcriptions', model: 'test', maxBytes: 1 }, {})
  await assert.rejects(transcribe(config, new Uint8Array([1, 2]), 'audio/webm', { fetcher: assert.fail }))
  await assert.rejects(transcribe(config, new Uint8Array([1]), 'audio/webm', { fetcher: async () => new Response(JSON.stringify({ text: '' })) }), /没有识别到/)
  await assert.rejects(transcribe(config, new Uint8Array([1]), 'audio/webm', { fetcher: async () => new Response('provider detail', { status: 401 }) }), /401/)
})
