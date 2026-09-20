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

export function registerApiRoutes(hostCtx, { application, eventBridge, exporter, career }) {
  const register = (path, handler) => hostCtx.effect(() => hostCtx.webServer.register({ kind: 'exact', path,
    handler: (request, response) => {
      const rejected = hostCtx.connection.requestRejection(request)
      if (rejected) return sendJson(response, rejected, { error: { message: '请从本机启动链接打开页面' } })
      return handler(request, response)
    },
  }))
  const coachCommand = createCoachCommands({ application, eventBridge, resolveCompany: career ? (name) => career.company(name) : undefined })
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

  register('/interview/api/session', async (request, response) => {
    if (request.method !== 'GET') return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET' } })
    try {
      sendJson(response, 200, await application.readAtomicSession(requiredSessionId(query(request).get('session'))))
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
