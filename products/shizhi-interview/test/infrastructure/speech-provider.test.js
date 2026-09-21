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

const qwenEnv = { SHIZHI_ASR_PROVIDER: 'qwen', SHIZHI_ASR_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  SHIZHI_ASR_MODEL: 'qwen3-asr-flash', SHIZHI_ASR_API_KEY: 'test-only-qwen-key' }
const qwenResponse = (content, finish_reason = 'stop') => new Response(JSON.stringify({ choices: [{ finish_reason, message: { content } }] }))

test('provider selection is explicit and Qwen recording limits fit its audio API', () => {
  assert.equal(resolveSpeechConfig({}, {}).provider, 'multipart')
  const config = resolveSpeechConfig({}, qwenEnv)
  assert.equal(config.provider, 'qwen')
  assert.equal(config.model, 'qwen3-asr-flash')
  assert.deepEqual(config.mimeTypes, ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus'])
  assert.equal(resolveSpeechConfig({ provider: 'multipart' }, qwenEnv).provider, 'multipart')
  assert.throws(() => resolveSpeechConfig({}, { SHIZHI_ASR_PROVIDER: 'qwne' }), /SHIZHI_ASR_PROVIDER/)
  assert.throws(() => resolveSpeechConfig({ maxSeconds: 301 }, qwenEnv), /300 秒/)
  assert.throws(() => resolveSpeechConfig({ maxBytes: 10000001 }, qwenEnv), /10 MB/)
})

test('Qwen receives one Base64 audio message with server-only credentials and returns editable text', async () => {
  const config = resolveSpeechConfig({ apiKeyEnv: 'DASHSCOPE_API_KEY' }, qwenEnv)
  const audio = new Uint8Array([0, 255, 1, 2, 128])
  const text = await transcribe(config, audio, 'audio/webm;codecs=opus', {
    env: { DASHSCOPE_API_KEY: ' test-only-key ' }, fetcher: async (url, request) => {
      assert.equal(url, qwenEnv.SHIZHI_ASR_URL)
      assert.deepEqual(request.headers, { Authorization: 'Bearer test-only-key', 'Content-Type': 'application/json' })
      assert.equal(request.method, 'POST')
      assert.equal(request.redirect, 'error')
      assert.deepEqual(JSON.parse(request.body), { model: 'qwen3-asr-flash', stream: false,
        messages: [{ role: 'user', content: [{ type: 'input_audio', input_audio: { data: 'data:audio/webm;base64,AP8BAoA=' } }] }],
        asr_options: { language: 'zh', enable_itn: false } })
      assert.doesNotMatch(request.body, /test-only-key/)
      return qwenResponse('  TCP 使用三次握手建立连接。  ')
    },
  })
  assert.equal(text, 'TCP 使用三次握手建立连接。')
})

test('Qwen refuses missing credentials and unsupported audio before sending requests', async () => {
  const config = resolveSpeechConfig({}, qwenEnv)
  for (const env of [{}, { SHIZHI_ASR_API_KEY: '   ' }]) {
    await assert.rejects(transcribe(config, new Uint8Array([1]), 'audio/webm', { env, fetcher: assert.fail }), /填写语音服务密钥/)
  }
  await assert.rejects(transcribe(config, new Uint8Array([1]), 'audio/mp4', { env: qwenEnv, fetcher: assert.fail }), /WebM 或 Ogg/)
})

test('Qwen rejects incomplete, empty and malformed responses instead of inventing a transcript', async () => {
  const config = resolveSpeechConfig({}, qwenEnv)
  for (const [response, message] of [
    [qwenResponse('截断的文字', 'length'), /结果不完整/], [qwenResponse('拒绝', 'content_filter'), /结果不完整/],
    [new Response('{}'), /结果不完整/], [new Response('null'), /结果不完整/],
    [qwenResponse('  '), /没有识别到/], [qwenResponse([{ text: 'unexpected format' }]), /没有识别到/],
    [qwenResponse('字'.repeat(16001)), /转写文本过长/],
  ]) {
    await assert.rejects(transcribe(config, new Uint8Array([1]), 'audio/ogg', { env: qwenEnv, fetcher: async () => response }), message)
  }
})

test('Qwen authentication and quota errors expose local guidance without the provider body', async () => {
  for (const [status, message] of [[401, /密钥无效/], [403, /没有调用权限/], [429, /请求受限/], [500, /检查服务配置/]]) {
    await assert.rejects(transcribe(resolveSpeechConfig({}, qwenEnv), new Uint8Array([1]), 'audio/webm', {
      env: qwenEnv, fetcher: async () => new Response('private-provider-detail', { status }),
    }), (error) => { assert.match(error.message, message); assert.doesNotMatch(error.message, /private-provider-detail/); return true })
  }
})

test('cancelling Qwen transcription aborts the provider request', async () => {
  const controller = new AbortController()
  let started, observedSignal
  const ready = new Promise((resolve) => { started = resolve })
  const pending = transcribe(resolveSpeechConfig({}, qwenEnv), new Uint8Array([1]), 'audio/webm', {
    env: qwenEnv, signal: controller.signal, fetcher: async (url, { signal }) => {
      observedSignal = signal
      return new Promise((resolve, reject) => { signal.addEventListener('abort', () => reject(signal.reason), { once: true }); started() })
    },
  })
  await ready
  controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(observedSignal.aborted, true)
})
