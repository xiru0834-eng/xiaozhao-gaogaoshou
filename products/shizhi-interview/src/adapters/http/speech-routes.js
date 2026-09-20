import { SpeechTranscriptionError, transcribe } from '../../infrastructure/speech-provider.js'

/** Registers same-origin recording upload and nonsecret capability discovery.
 * @param {object} ctx Web server registration context.
 * @param {object} config Validated speech provider configuration.
 * @param {object} options Server environment and provider transport.
 */
export function registerSpeechRoutes(ctx, config, { env = process.env, fetcher = fetch } = {}) {
  const send = (response, status, data) => {
    if (response.destroyed) return
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
    response.end(JSON.stringify(data))
  }
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/interview/api/voice', handler: async (request, response) => {
    const rejected = ctx.connection.requestRejection(request)
    if (rejected) return send(response, rejected, { error: { message: '请从本机启动链接打开页面' } })
    if (request.method === 'GET') return send(response, 200, {
      configured: Boolean(config.url), provider: config.url ? new URL(config.url).origin : null,
      ready: Boolean(config.url) && (config.provider !== 'qwen' || Boolean(env[config.apiKeyEnv]?.trim())),
      maxSeconds: config.maxSeconds, maxBytes: config.maxBytes, mimeTypes: config.mimeTypes,
    })
    if (request.method !== 'POST') return send(response, 405, { error: { message: '仅支持 GET 和 POST' } })
    if (!config.url) return send(response, 503, { error: { message: '语音转写服务尚未配置' } })
    const controller = new AbortController()
    const cancel = () => controller.abort()
    response.once('close', cancel)
    try {
      if (request.headers.origin && new URL(request.headers.origin).host !== request.headers.host) return send(response, 403, { error: { message: '仅接受同源请求' } })
      if (request.headers['sec-fetch-site'] === 'cross-site') return send(response, 403, { error: { message: '仅接受同源请求' } })
      const mime = String(request.headers['content-type'] || '')
      if (!/^audio\/(webm|ogg|mp4|wav|mpeg)(;|$)/.test(mime)) return send(response, 415, { error: { message: '不支持此录音格式' } })
      let size = 0
      const chunks = []
      for await (const chunk of request) {
        size += chunk.length
        if (size > config.maxBytes) return send(response, 413, { error: { message: '录音过大，请缩短后重试' } })
        chunks.push(chunk)
      }
      const text = await transcribe(config, Buffer.concat(chunks), mime, { signal: controller.signal, env, fetcher })
      send(response, 200, { text })
    } catch (error) {
      send(response, 502, { error: { message: error instanceof SpeechTranscriptionError ? error.message
        : error instanceof TypeError ? '语音请求无效，请检查配置后重试' : '语音转写未完成，请检查服务连接后重试；你可以继续文字作答' } })
    } finally { response.off('close', cancel) }
  } }))
}
