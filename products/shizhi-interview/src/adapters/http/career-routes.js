/** Mounts the shared recruiting application behind Harness authentication. */
import { DomainError } from '../../domain/errors.js'

/** Shares the complete workbench API and company-linked practice history.
 * @param {object} ctx Web route and connection services.
 * @param {object} career Owned workbench application and profile stores.
 * @param {object} application Interview application for company-linked history.
 * @returns {void} Registers routes with lifecycle-owned disposal.
 */
export function registerCareerRoutes(ctx, career, application) {
  const handle = async (request, response) => {
    const send = (status, value) => {
      response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
        'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' })
      response.end(JSON.stringify(value))
    }
    const rejected = ctx.connection.requestRejection(request)
    if (rejected) return send(rejected, { error: { message: '请从本机启动链接打开页面' } })
    const origin = `http://${request.headers.host}`
    const url = new URL(request.url, origin)
    if (url.pathname !== '/interview/career' && !url.pathname.startsWith('/interview/career/')) return send(404, { error: { message: '页面不存在' } })
    const path = url.pathname.slice('/interview/career'.length) || '/'
    const profileId = career.profileId
    const identity = request.headers['x-profile-id'] || url.searchParams.get('profileId')
    if (identity && identity !== profileId) return send(409, { profileId, error: { message: '资料已切换，请刷新工作台' } })
    if ((request.headers.origin && request.headers.origin !== origin) || request.headers['sec-fetch-site'] === 'cross-site') return send(403, { error: { message: '工作台连接已过期，请刷新' } })
    if (!['GET', 'HEAD'].includes(request.method) && (identity !== profileId || !String(request.headers['content-type'] || '').startsWith('application/json'))) return send(403, { error: { message: '工作台连接已过期，请刷新' } })
    try {
      if (request.method === 'GET' && path === '/company') return send(200, { company: career.company(url.searchParams.get('name')), profileId })
      if (request.method === 'GET' && path === '/preparation') {
        const practices = await application.repository.listPractices()
        const items = practices.filter((p) => p.config.target && (!url.searchParams.get('companyId') || p.config.target.companyId === url.searchParams.get('companyId')))
          .map((p) => ({ id: p.id, companyId: p.config.target.companyId, companyName: p.config.target.companyName,
            role: p.config.target.targetRole, topic: p.topic, status: p.status, updatedAt: p.updatedAt,
            answers: p.questions.reduce((sum, q) => q.attempts.length, 0),
            scores: p.questions.flatMap((q) => q.attempts.filter((a) => a.evaluation).map((a) => a.evaluation.score)) }))
        return send(200, { items, profileId })
      }
      const originalUrl = request.url
      request.url = `${path}${url.search}`
      try { await career.workbench.handle(request, response, origin) }
      finally { request.url = originalUrl }
    } catch (error) {
      const invalidRequest = error instanceof TypeError || error instanceof DomainError
      if (!response.headersSent) send(invalidRequest ? 400 : 500, { profileId, error: { message: invalidRequest ? error.message : '工作台操作失败，请重试' } })
    }
  }
  ctx.effect(() => {
    const pending = new Set()
    const unregister = ctx.webServer.register({ kind: 'prefix', path: '/interview/career', handler: (request, response) => {
      const operation = handle(request, response)
      pending.add(operation)
      return operation.finally(() => pending.delete(operation))
    } })
    career.workbench.start()
    return async () => {
      unregister()
      await Promise.allSettled([...pending])
      await career.close()
    }
  })
}
