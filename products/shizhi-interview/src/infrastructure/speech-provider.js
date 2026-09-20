/** Validates the optional speech provider before registering HTTP routes.
 * @param {object} config Explicit plugin configuration.
 * @param {object} env Host environment, used for references only.
 * @returns {object} Resolved speech settings.
 */
export function resolveSpeechConfig(config = {}, env = process.env) {
  const url = config.url || env.SHIZHI_ASR_URL || ''
  const model = config.model || env.SHIZHI_ASR_MODEL || ''
  const apiKeyEnv = config.apiKeyEnv || 'SHIZHI_ASR_API_KEY'
  const maxBytes = config.maxBytes ?? 8 * 1024 * 1024
  const timeoutMs = config.timeoutMs ?? 60000
  const maxSeconds = config.maxSeconds ?? 180
  if (Boolean(url) !== Boolean(model)) throw new TypeError('SHIZHI_ASR_URL 与 SHIZHI_ASR_MODEL 必须同时配置')
  if (url) {
    const parsed = new URL(url)
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new TypeError('语音服务地址不能包含凭据、查询参数或片段')
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))) throw new TypeError('语音服务须使用 HTTPS，本机地址可用 HTTP')
  }
  for (const value of [maxBytes, timeoutMs, maxSeconds]) if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError('语音限制必须为正整数')
  return { url, model, apiKeyEnv, maxBytes, timeoutMs, maxSeconds }
}

/** Sends one confirmed recording to a multipart transcription endpoint.
 * @param {object} config Resolved provider settings.
 * @param {Uint8Array} bytes Recording payload held in memory.
 * @param {string} mime Browser recording MIME type.
 * @param {object} options Request cancellation, transport and credentials.
 * @returns {Promise<string>} Editable transcript; audio is not persisted.
 */
export async function transcribe(config, bytes, mime, { signal, fetcher = fetch, env = process.env } = {}) {
  if (!config.url) throw new Error('语音转写服务尚未配置')
  const extensions = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/wav': 'wav', 'audio/mpeg': 'mp3' }
  const type = mime.split(';')[0].trim()
  if (!extensions[type] || !bytes.length || bytes.length > config.maxBytes) throw new TypeError('录音格式或大小不受支持')
  const form = new FormData()
  form.set('file', new Blob([bytes], { type: mime }), `answer.${extensions[type]}`)
  form.set('model', config.model)
  form.set('language', 'zh')
  form.set('response_format', 'json')
  const key = env[config.apiKeyEnv]
  const response = await fetcher(config.url, { method: 'POST', body: form, redirect: 'error',
    headers: key ? { Authorization: `Bearer ${key}` } : {},
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(config.timeoutMs)]) : AbortSignal.timeout(config.timeoutMs) })
  if (!response.ok) throw new Error(`语音服务返回 ${response.status}，请检查服务配置后重试`)
  const result = await response.json()
  if (typeof result.text !== 'string' || !result.text.trim()) throw new Error('没有识别到语音，请重试或直接输入')
  if (result.text.length > 16000) throw new Error('转写文本过长，请缩短录音后重试')
  return result.text.trim()
}
