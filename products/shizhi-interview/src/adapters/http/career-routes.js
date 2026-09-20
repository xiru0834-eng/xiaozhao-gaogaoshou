/** Serves the upstream workbench inside the authenticated Harness Web application. */
import { randomBytes } from 'node:crypto'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { readJsonBody } from './api-routes.js'
import { DomainError } from '../../domain/errors.js'

/** Mounts a company workbench whose mutations share Harness authentication.
 * @param {object} ctx Web route and connection services.
 * @param {object} career Owned catalog and progress stores.
 * @param {object} application Interview application for company-linked history.
 * @returns {void} Registers routes with lifecycle-owned disposal.
 */
export function registerCareerRoutes(ctx, career, application) {
  const token = randomBytes(32).toString('hex')
  const files = new Map([
    ['/', [new URL('../../../client/career/index.html', import.meta.url), 'text/html; charset=utf-8']],
    ['/assets/workbench.js', [new URL('../../../client/career/workbench.js', import.meta.url), 'text/javascript; charset=utf-8']],
    ['/assets/workbench.css', [new URL('../../../client/career/workbench.css', import.meta.url), 'text/css; charset=utf-8']],
  ])
  const handle = async (request, response) => {
    const send = (status, value, type = 'application/json; charset=utf-8') => {
      response.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer', 'x-frame-options': 'SAMEORIGIN',
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'" })
      response.end(Buffer.isBuffer(value) ? value : JSON.stringify(value))
    }
    const rejected = ctx.connection.requestRejection(request)
    if (rejected) return send(rejected, { error: { message: '请从本机启动链接打开页面' } })
    const url = new URL(request.url, 'http://dsh.local')
    if (url.pathname !== '/interview/career' && !url.pathname.startsWith('/interview/career/')) return send(404, { error: { message: '页面不存在' } })
    const path = url.pathname.slice('/interview/career'.length) || '/'
    const profileId = career.profileId
    const identity = request.headers['x-profile-id'] || url.searchParams.get('profileId')
    if (identity && identity !== profileId) return send(409, { error: { message: '资料已切换，请刷新工作台' } })
    try {
      if (request.method === 'POST') {
        if (request.headers['x-app-token'] !== token || identity !== profileId
          || !String(request.headers['content-type'] || '').startsWith('application/json')
          || (request.headers.origin && new URL(request.headers.origin).host !== request.headers.host)) return send(403, { error: { message: '工作台连接已过期，请刷新' } })
        if (path !== '/api/status') return send(404, { error: { message: '未找到此操作' } })
        const body = await readJsonBody(request, 80 * 1024)
        career.save(body.updates)
        return send(200, { ok: true, profileId })
      }
      if (request.method !== 'GET') return send(405, { error: { message: '不支持此操作' } })
      if (path === '/api/catalog') return send(200, { ...career.catalog.snapshot(), profileId })
      if (path === '/api/status') return send(200, { statuses: career.store.statuses(), profileId })
      if (path === '/company') return send(200, { company: career.company(url.searchParams.get('name')), profileId })
      if (path === '/preparation') {
        const practices = await application.repository.listPractices()
        const items = practices.filter((p) => p.config.target && (!url.searchParams.get('companyId') || p.config.target.companyId === url.searchParams.get('companyId')))
          .map((p) => ({ id: p.id, companyId: p.config.target.companyId, companyName: p.config.target.companyName,
            role: p.config.target.targetRole, topic: p.topic, status: p.status, updatedAt: p.updatedAt,
            answers: p.questions.reduce((sum, q) => sum + q.attempts.length, 0),
            scores: p.questions.flatMap((q) => q.attempts.filter((a) => a.evaluation).map((a) => a.evaluation.score)) }))
        return send(200, { items, profileId })
      }
      if (path === '/api/backup') {
        const kind = url.searchParams.get('kind') || 'progress'
        if (!['catalog', 'progress'].includes(kind)) return send(400, { error: { message: '备份类型不正确' } })
        const directory = await mkdtemp(join(tmpdir(), 'shizhi-career-backup-'))
        try {
          const target = join(directory, 'snapshot.db')
          await (kind === 'catalog' ? career.catalog : career.store).backup(target)
          response.setHeader('content-disposition', `attachment; filename="${kind}-backup.db"`)
          return send(200, await readFile(target), 'application/octet-stream')
        } finally { await rm(directory, { recursive: true, force: true }) }
      }
      const file = files.get(path)
      if (!file) return send(404, { error: { message: '页面不存在' } })
      let content = await readFile(file[0])
      if (path === '/') content = Buffer.from(content.toString('utf8').replace('__APP_TOKEN__', token).replace('__PROFILE_ID__', profileId))
      return send(200, content, file[1])
    } catch (error) {
      const invalidRequest = error instanceof TypeError || error instanceof DomainError
      return send(invalidRequest ? 400 : 500, { profileId, error: { message: invalidRequest ? error.message : '工作台操作失败，请重试' } })
    }
  }
  ctx.effect(() => {
    const pending = new Set()
    const unregister = ctx.webServer.register({ kind: 'prefix', path: '/interview/career', handler: (request, response) => {
      const operation = handle(request, response)
      pending.add(operation)
      return operation.finally(() => pending.delete(operation))
    } })
    return async () => {
      unregister()
      await Promise.allSettled([...pending])
      career.close()
    }
  })
}
