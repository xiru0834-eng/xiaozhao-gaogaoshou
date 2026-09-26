import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { DomainError } from '../../domain/errors.js'
import { dispatchCommand } from './command-dispatcher.js'
import { createCoachCommands } from '../../application/coach-commands.js'

function sendJson(response, status, data) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  response.end(JSON.stringify(data))
}

async function readJsonBody(request, maximumBytes = 1024 * 1024) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maximumBytes) throw new DomainError('REQUEST_TOO_LARGE', '请求体超过大小限制')
    chunks.push(chunk)
  }
  if (!size) return {}
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new DomainError('INVALID_JSON', '请求体不是有效 JSON') }
}

function errorResponse(error) {
  if (error instanceof DomainError) {
    return { status: 400, body: { error: { code: error.code, message: error.message, details: error.details } } }
  }
  if (error instanceof TypeError) {
    return { status: 400, body: { error: { code: 'INVALID_COMMAND', message: error.message } } }
  }
  return { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: '面试插件内部错误' } } }
}

function query(request) {
  return new URL(request.url || '/', 'http://dsh.local').searchParams
}

function requiredSessionId(value) {
  if (typeof value !== 'string' || !value.trim()) throw new DomainError('SESSION_ID_REQUIRED', '缺少会话 ID')
  return value.trim()
}

export function registerApiRoutes(hostCtx, { application, eventBridge, exporter, career, drafts }) {
  const register = (path, handler) => hostCtx.effect(() => hostCtx.webServer.register({ kind: 'exact', path,
    handler: (request, response) => {
      const rejected = hostCtx.connection.requestRejection(request)
      if (rejected) return sendJson(response, rejected, { error: { message: '请从本机启动链接打开页面' } })
      return handler(request, response)
    },
  }))
  const coachCommand = createCoachCommands({ application, eventBridge, resolveCompany: career ? (name) => career.company(name) : undefined })
  register('/interview/api/today', async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: { message: '仅支持 GET' } })
    try {
      const [practices, reviews] = await Promise.all([application.listPractices({ status: 'active' }), application.reviewQueue()])
      const recent = practices.resource.data.filter((item) => item.coachKind).sort((a, b) => b.updatedAt - a.updatedAt)[0] || null
      const upcoming = (career?.schedules?.snapshot().items || []).filter((item) => {
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: item.zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
        return item.status === 'planned' && (item.start ? Date.parse(item.start) >= Date.now() : item.date >= today)
      }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0] || null
      sendJson(response, 200, { recent, reviewCount: reviews.filter((item) => item.due || item.needsWork || item.uncertain).length, upcoming })
    } catch (error) { const output = errorResponse(error); sendJson(response, output.status, output.body) }
  })
  register('/interview/api/draft', async (request, response) => {
    try {
      if (!['GET', 'POST'].includes(request.method)) return sendJson(response, 405, { error: { message: '仅支持 GET 或 POST' } })
      if (request.method === 'POST' && (!String(request.headers['content-type'] || '').startsWith('application/json') ||
        request.headers.origin && new URL(request.headers.origin).host !== request.headers.host)) throw new TypeError('仅接受同源 JSON 请求')
      const input = request.method === 'POST' ? await readJsonBody(request, 160 * 1024) : Object.fromEntries(query(request))
      if (typeof input.practice !== 'string' || typeof input.question !== 'string') throw new TypeError('缺少题目')
      const result = await application.getPractice(input.practice)
      const practice = result.resource.data
      const question = practice.questions.find((item) => item.id === input.question)
      if (!question) throw new TypeError('题目不存在')
      if (request.method === 'GET') return sendJson(response, 200, drafts.read(practice.id, question.id, question.attempts.length))
      if (practice.status !== 'active' || input.attempts !== question.attempts.length) throw new DomainError('DRAFT_STALE', '回答已提交或练习已结束，请刷新查看')
      sendJson(response, 200, drafts.save(practice.id, question.id, question.attempts.length, input.revision, input.text))
    } catch (error) { const output = errorResponse(error); sendJson(response, output.status, output.body) }
  })
  register('/interview/api/question-bank', async (request, response) => {
    try {
      if (request.method === 'GET') return sendJson(response, 200, { items: await application.coachBank() })
      if (request.method !== 'POST') return sendJson(response, 405, { error: { message: '仅支持 GET 或 POST' } })
      if (!String(request.headers['content-type'] || '').startsWith('application/json')) throw new TypeError('需要 JSON 请求')
      if (request.headers.origin && new URL(request.headers.origin).host !== request.headers.host) throw new TypeError('仅接受同源请求')
      const body = await readJsonBody(request, 20 * 1024)
      sendJson(response, 200, await application.setCoachQuestionMastered(body.key, body.mastered))
    } catch (error) { const output = errorResponse(error); sendJson(response, output.status, output.body) }
  })
  register('/interview/api/coach', async (request, response) => {
    if (request.method !== 'POST') return sendJson(response, 405, { error: { message: '仅支持 POST' } })
    try {
      if (!String(request.headers['content-type'] || '').startsWith('application/json')) throw new TypeError('需要 JSON 请求')
      if (request.headers.origin && new URL(request.headers.origin).host !== request.headers.host) throw new TypeError('仅接受同源请求')
      const body = await readJsonBody(request, 80 * 1024)
      sendJson(response, 200, await coachCommand(requiredSessionId(body.session), body.command, body.payload))
    } catch (error) {
      const output = errorResponse(error); sendJson(response, output.status, output.body)
    }
  })

  register('/interview/api/review-queue', async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: { message: '仅支持 GET' } })
    try { sendJson(response, 200, { items: await application.reviewQueue() }) }
    catch (error) { const output = errorResponse(error); sendJson(response, output.status, output.body) }
  })

  register('/interview/api/session', async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET' } })
    try {
      const sessionId = requiredSessionId(query(request).get('session'))
      sendJson(response, 200, { ...await application.readAtomicSession(sessionId), runtime: { status: eventBridge?.status?.(sessionId) || 'unavailable' } })
    } catch (error) {
      const output = errorResponse(error); sendJson(response, output.status, output.body)
    }
  })

  register('/interview/api/practices', async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET' } })
    try {
      const params = query(request)
      sendJson(response, 200, await application.listPractices({ query: params.get('query') || undefined, mode: params.get('mode') || undefined, status: params.get('status') || undefined }))
    } catch (error) {
      const output = errorResponse(error); sendJson(response, output.status, output.body)
    }
  })

  register('/interview/api/practice', async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET' } })
    try {
      sendJson(response, 200, await application.getPractice(query(request).get('id')))
    } catch (error) {
      const output = errorResponse(error); sendJson(response, output.status, output.body)
    }
  })

  register('/interview/api/insights', async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET' } })
    try {
      sendJson(response, 200, await application.getInsights())
    } catch (error) {
      const output = errorResponse(error); sendJson(response, output.status, output.body)
    }
  })

  register('/interview/api/leetcode', async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET' } })
    try {
      sendJson(response, 200, await application.getLeetcodeCatalog())
    } catch (error) {
      const output = errorResponse(error); sendJson(response, output.status, output.body)
    }
  })

  register('/interview/api/command', async (request, response) => {
    if (request.method !== 'POST') return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST' } })
    try {
      const body = await readJsonBody(request)
      const result = await dispatchCommand({ application, eventBridge }, requiredSessionId(body.session), body.command, body.payload)
      sendJson(response, 200, result)
    } catch (error) {
      const output = errorResponse(error); sendJson(response, output.status, output.body)
    }
  })

  register('/interview/api/download', async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET' } })
    const download = exporter.resolveDownload(query(request).get('token'))
    if (!download || !existsSync(download.filePath)) return sendJson(response, 404, { error: { code: 'DOWNLOAD_NOT_FOUND', message: '导出文件不存在或下载令牌已失效' } })
    const fileName = encodeURIComponent(basename(download.name))
    response.writeHead(200, {
      'content-type': download.contentType,
      'content-disposition': `attachment; filename*=UTF-8''${fileName}`,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    })
    response.end(readFileSync(download.filePath))
  })
}

export { errorResponse, readJsonBody }
