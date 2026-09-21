import test from 'node:test'
import assert from 'node:assert/strict'
import { AGENT_TRACK } from '../../src/domain/agent-catalog.js'
import { COACH_TRACKS, coachReference, coachTrack } from '../../src/domain/coach-catalog.js'
import { normalizeReview } from '../../src/domain/coach-progress.js'
import { createCoachCommands } from '../../src/application/coach-commands.js'
import { applicationFixture } from '../support/application-fixture.js'

function input(result, extra = {}) {
  const { practice, currentQuestion, revision } = result.resource.data
  return { practiceId: practice.id, questionId: currentQuestion.id, revision, ...extra }
}

test('the agent bank has distinct prompts, bounded review criteria and explicit official reading', () => {
  assert.equal(AGENT_TRACK.sections.length, 6)
  assert.equal(AGENT_TRACK.questions.length, 24)
  assert.equal(new Set(COACH_TRACKS.flatMap((track) => track.questions.map(([prompt]) => prompt))).size, 56)
  assert.equal(coachTrack('拾知 · 智能体应用开发'), AGENT_TRACK)
  for (const [prompt, cues, source] of AGENT_TRACK.questions) {
    assert.ok(prompt.length > 10)
    assert.equal(new URL(source).protocol, 'https:')
    assert.deepEqual(coachReference(prompt), { cues, source })
    const points = cues.split('；').map((point) => point.replace(/。$/, ''))
    const review = { items: points.map((point) => ({ point, status: 'missing', quote: '', comment: '本次未回答。' })), nextStep: '先解释基本流程。' }
    assert.deepEqual(normalizeReview(review, { prompt }, '暂时不会'), review)
  }
})

test('starting from a selected agent question preserves its review source and visits every question once', async () => {
  const { application } = applicationFixture()
  const events = []
  const run = createCoachCommands({ application, eventBridge: { refresh: async () => {}, dispatch: (_session, event) => { events.push(event); return true } } })
  let state = await run('agent-session', 'start', { track: 'agent', questionIndex: 9 })
  assert.equal(state.resource.data.currentQuestion.prompt, AGENT_TRACK.questions[9][0])
  state = await run('agent-session', 'submit', input(state, { answer: '按标题和表格结构切分，保留来源，再用实际问题验证召回。' }))
  assert.deepEqual(events[0].reference, coachReference(AGENT_TRACK.questions[9][0]))
  const order = [state.resource.data.currentQuestion.prompt]
  for (let index = 1; index < 24; index++) {
    state = await run('agent-session', 'next', input(state))
    order.push(state.resource.data.currentQuestion.prompt)
  }
  assert.deepEqual(order, [...AGENT_TRACK.questions.slice(9), ...AGENT_TRACK.questions.slice(0, 9)].map(([prompt]) => prompt))
  await assert.rejects(run('agent-session', 'next', input(state)), { code: 'TRACK_FINISHED' })
  await run('agent-session', 'finish', input(state))
  assert.equal((await application.getPractice(state.resource.data.practice.id)).resource.data.questions.length, 24)
})

test('invalid question selections do not replace an existing session practice', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  const current = await run('session', 'start', { track: 'network' })
  for (const questionIndex of [-1, 24, 1.5, '9', null]) {
    await assert.rejects(run('session', 'start', { track: 'agent', questionIndex }), { code: 'INVALID_QUESTION' })
    assert.equal((await application.readAtomicSession('session')).resource.data.practice.id, current.resource.data.practice.id)
  }
  const first = await run('agent', 'start', { track: 'agent' })
  assert.equal(first.resource.data.currentQuestion.prompt, AGENT_TRACK.questions[0][0])
})
