import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { registerApiRoutes } from '../../src/adapters/http/api-routes.js'
import { AnswerDrafts } from '../../src/infrastructure/answer-drafts.js'
import { applicationFixture } from '../support/application-fixture.js'
import { createCoachCommands } from '../../src/application/coach-commands.js'

test('draft HTTP validates origin and answer identity; submitted text is never revived', async (t) => {
  const { application } = applicationFixture(), drafts = new AnswerDrafts(':memory:')
  application.drafts = drafts
  t.after(() => drafts.close())
  const run = createCoachCommands({ application })
  const initial = (await run('session', 'start', { track: 'network' })).resource.data
  const routes = new Map()
  registerApiRoutes({ effect: (fn) => fn(), connection: { requestRejection: () => null }, webServer: {
    register: (route) => { routes.set(route.path, route.handler); return () => {} },
  } }, { application, drafts })
  async function request(url, body, headers = {}) {
    const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : [])
    Object.assign(req, { url, method: body ? 'POST' : 'GET', headers: { host: 'localhost', 'content-type': 'application/json', ...headers } })
    let status, data
    await routes.get(url.split('?')[0])(req, { writeHead: (code) => { status = code }, end: (text) => { data = JSON.parse(text) } })
    return { status, data }
  }
  const input = { practice: initial.practice.id, question: initial.currentQuestion.id, attempts: 0, revision: 0, text: '我的回答' }
  assert.equal((await request('/interview/api/draft', input, { origin: 'https://foreign.test' })).status, 400)
  assert.equal((await request('/interview/api/draft', input)).status, 200)
  const url = `/interview/api/draft?practice=${input.practice}&question=${input.question}`
  assert.equal((await request(url)).data.text, input.text)
  assert.equal((await request('/interview/api/draft', input)).data.error.code, 'DRAFT_CONFLICT')
  await run('session', 'submit', { practiceId: input.practice, questionId: input.question, revision: initial.revision, answer: input.text })
  assert.equal((await request(url)).data.text, '')
  assert.equal((await request('/interview/api/draft', { ...input, revision: 1 })).data.error.code, 'DRAFT_STALE')
  const today = await request('/interview/api/today')
  assert.equal(today.data.recent.id, input.practice)
  assert.equal(today.data.upcoming, null)
  await application.deletePractice(input.practice)
  assert.equal(drafts.read(input.practice, input.question, 0).text, '')
})
