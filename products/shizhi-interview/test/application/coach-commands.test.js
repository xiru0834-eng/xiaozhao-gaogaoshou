import test from 'node:test'
import assert from 'node:assert/strict'
import { applicationFixture } from '../support/application-fixture.js'
import { createCoachCommands } from '../../src/application/coach-commands.js'
import { COACH_TRACKS } from '../../src/domain/coach-catalog.js'
import { instructionFor } from '../../src/adapters/dsh/agent-event-bridge.js'

function input(result, extra = {}) {
  const { practice, currentQuestion, revision } = result.resource.data
  return { practiceId: practice.id, questionId: currentQuestion.id, revision, ...extra }
}

test('a built-in practice can start and retain an answer without a model', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  const start = await run('one', 'start', { track: 'network' })
  assert.equal(start.resource.data.currentQuestion.prompt, COACH_TRACKS[0].questions[0][0])
  const saved = await run('one', 'submit', input(start, { answer: 'GET 用于获取资源，POST 请求对提交内容进行处理。' }))
  assert.equal(saved.delivery, 'unavailable')
  assert.equal(saved.resource.data.currentQuestion.attempts.length, 1)
  assert.equal(saved.resource.data.currentQuestion.latestScore, null)
  const retry = await run('one', 'retry', input(saved))
  const second = await run('one', 'submit', input(retry, { answer: 'GET 语义安全且幂等；POST 不保证幂等。是否加密取决于 HTTPS。' }))
  assert.equal(second.resource.data.currentQuestion.attempts.length, 2)
  assert.equal(second.resource.data.currentQuestion.attempts[0].answer, 'GET 用于获取资源，POST 请求对提交内容进行处理。')
})

test('simultaneous duplicate submissions create exactly one attempt', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  const start = await run('one', 'start', { track: 'database' })
  const payload = input(start, { answer: '索引减少扫描范围，但增加存储与写入维护成本。' })
  const results = await Promise.allSettled([run('one', 'submit', payload), run('one', 'submit', payload)])
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(results.find((result) => result.status === 'rejected').reason.code, 'STALE_QUESTION')
  assert.equal((await application.readAtomicSession('one')).resource.data.currentQuestion.attempts.length, 1)
})

test('invalid drafts do not consume the current revision or block later submissions', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  const start = await run('one', 'start', { track: 'java' })
  await assert.rejects(run('one', 'submit', input(start, { answer: ' ' })), { code: 'INVALID_ANSWER' })
  await run('one', 'submit', input(start, { answer: '利用 hashCode 定位桶，再用 equals 比较键。' }))
})

test('review retry refers to the saved attempt without appending another answer', async () => {
  const { application } = applicationFixture()
  const events = []
  const bridge = { refresh: async () => {}, dispatch: (session, event) => { events.push({ session, ...event }); return true } }
  const run = createCoachCommands({ application, eventBridge: bridge })
  const start = await run('one', 'start', { track: 'redis' })
  const saved = await run('one', 'submit', input(start, { answer: '我会用 Sorted Set 实现排行榜。' }))
  const reviewed = await run('one', 'review', input(saved))
  assert.equal(reviewed.delivery, 'queued')
  assert.equal(reviewed.resource.data.currentQuestion.attempts.length, 1)
  assert.equal(events[0].attemptId, events[1].attemptId)
  const prompt = instructionFor(events[0])
  assert.match(prompt, /禁止再次创建作答/)
  assert.match(prompt, /Sorted Set/)
  assert.match(prompt, /https:\/\/redis.io/)
  assert.match(prompt, /不得声称实时查证/)
})

test('fixed questions do not repeat and finishing retains a reviewable archive', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  let current = await run('one', 'start', { track: 'network' })
  for (let index = 1; index < 8; index++) current = await run('one', 'next', input(current))
  assert.equal(new Set(current.resource.data.practice.questions.map((item) => item.prompt)).size, 8)
  await assert.rejects(run('one', 'next', input(current)), { code: 'TRACK_FINISHED' })
  const id = current.resource.data.practice.id
  await run('one', 'finish', input(current))
  const archive = await application.getPractice(id)
  assert.equal(archive.resource.data.status, 'completed')
  assert.equal(archive.resource.data.questions.length, 8)
})
