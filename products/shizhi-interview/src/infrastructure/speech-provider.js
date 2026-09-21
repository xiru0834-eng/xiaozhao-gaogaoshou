/** Validates the optional speech provider before registering HTTP routes.
 * @param {object} config Explicit plugin configuration.
 * @param {object} env Host environment, used for references only.
 * @returns {object} Resolved speech settings.
 */
export function resolveSpeechConfig(config = {}, env = process.env) {
  const provider = config.provider || env.SHIZHI_ASR_PROVIDER || 'multipart'
  const url = config.url || env.SHIZHI_ASR_URL || ''
  const model = config.model || env.SHIZHI_ASR_MODEL || ''
  const apiKeyEnv = config.apiKeyEnv || 'SHIZHI_ASR_API_KEY'
  const maxBytes = config.maxBytes ?? 8 * 1024 * 1024
  const timeoutMs = config.timeoutMs ?? 60000
  const maxSeconds = config.maxSeconds ?? 180
  if (!['multipart', 'qwen'].includes(provider)) throw new TypeError('SHIZHI_ASR_PROVIDER 仅支持 multipart 或 qwen')
  if (Boolean(url) !== Boolean(model)) throw new TypeError('SHIZHI_ASR_URL 与 SHIZHI_ASR_MODEL 必须同时配置')
  if (url) {
    const parsed = new URL(url)
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new TypeError('语音服务地址不能包含凭据、查询参数或片段')
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))) throw new TypeError('语音服务须使用 HTTPS，本机地址可用 HTTP')
  }
  for (const value of [maxBytes, timeoutMs, maxSeconds]) if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError('语音限制必须为正整数')
  if (provider === 'qwen' && (maxBytes > 10000000 || maxSeconds > 300)) throw new TypeError('千问转写单次录音不能超过 10 MB 或 300 秒')
  const mimeTypes = provider === 'qwen' ? ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus']
    : ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus']
  return { provider, url, model, apiKeyEnv, maxBytes, timeoutMs, maxSeconds, mimeTypes }
}

/** A locally authored speech failure safe to display without provider response details. */
export class SpeechTranscriptionError extends Error {}

/** Sends a recording through multipart transcription or Qwen's JSON audio API.
 * @param {object} config Resolved provider settings.
 * @param {Uint8Array} bytes Recording payload held in memory.
 * @param {string} mime Browser recording MIME type.
 * @param {object} options Request cancellation, transport and credentials.
 * @returns {Promise<string>} Editable transcript; audio is not persisted.
 */
export async function transcribe(config, bytes, mime, { signal, fetcher = fetch, env = process.env } = {}) {
  if (!config.url) throw new SpeechTranscriptionError('语音转写服务尚未配置')
  const extensions = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/wav': 'wav', 'audio/mpeg': 'mp3' }
  const type = mime.split(';')[0].trim()
  if (!extensions[type] || !bytes.length || bytes.length > config.maxBytes) throw new TypeError('录音格式或大小不受支持')
  const key = env[config.apiKeyEnv]?.trim()
  const headers = key ? { Authorization: `Bearer ${key}` } : {}
  let body
  if (config.provider === 'qwen') {
    if (!key) throw new SpeechTranscriptionError('请先在产品 .env 中填写语音服务密钥，再重启服务')
    if (type === 'audio/mp4') throw new SpeechTranscriptionError('千问转写请使用支持 WebM 或 Ogg 录音的浏览器')
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify({ model: config.model, stream: false,
      messages: [{ role: 'user', content: [{ type: 'input_audio', input_audio: { data: `data:${type};base64,${Buffer.from(bytes).toString('base64')}` } }] }],
      asr_options: { language: 'zh', enable_itn: false } })
  } else {
    body = new FormData()
    body.set('file', new Blob([bytes], { type: mime }), `answer.${extensions[type]}`)
    body.set('model', config.model)
    body.set('language', 'zh')
    body.set('response_format', 'json')
  }
  const response = await fetcher(config.url, { method: 'POST', body, redirect: 'error', headers,
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(config.timeoutMs)]) : AbortSignal.timeout(config.timeoutMs) })
  if (!response.ok) {
    const hint = { 401: '密钥无效，请检查语音服务密钥和地域', 403: '没有调用权限，请检查模型权限、地域和账号状态',
      429: '请求受限，请检查服务额度或稍后重试' }[response.status] || '请检查服务配置后重试'
    throw new SpeechTranscriptionError(`语音服务返回 ${response.status}：${hint}`)
  }
  const result = await response.json()
  const choice = config.provider === 'qwen' ? result?.choices?.[0] : null
  if (config.provider === 'qwen' && choice?.finish_reason !== 'stop') throw new SpeechTranscriptionError('语音转写结果不完整，请缩短录音后重试')
  const text = config.provider === 'qwen' ? choice?.message?.content : result?.text
  if (typeof text !== 'string' || !text.trim()) throw new SpeechTranscriptionError('没有识别到语音，请重试或直接输入')
  if (text.length > 16000) throw new SpeechTranscriptionError('转写文本过长，请缩短录音后重试')
  return text.trim()
}
