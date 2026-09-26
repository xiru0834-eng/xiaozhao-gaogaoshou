import test from 'node:test'
import assert from 'node:assert/strict'
import { AGENT_TRACK, AGENT_QUESTION_SECTIONS } from '../../src/domain/agent-catalog.js'
import { buildCoachBank, coachQuestionKey } from '../../src/domain/coach-bank.js'
import legacyPrompts from '../fixtures/agent-legacy-prompts.json' with { type: 'json' }
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
  assert.equal(AGENT_TRACK.questions.length, 200)
  assert.equal(new Set(COACH_TRACKS.flatMap((track) => track.questions.map(([prompt]) => coachQuestionKey(prompt)))).size, 232)
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
  for (let index = 1; index < AGENT_TRACK.questions.length; index++) {
    state = await run('agent-session', 'next', input(state))
    order.push(state.resource.data.currentQuestion.prompt)
  }
  assert.deepEqual(order, [...AGENT_TRACK.questions.slice(9), ...AGENT_TRACK.questions.slice(0, 9)].map(([prompt]) => prompt))
  await assert.rejects(run('agent-session', 'next', input(state)), { code: 'TRACK_FINISHED' })
  await run('agent-session', 'finish', input(state))
  assert.equal((await application.getPractice(state.resource.data.practice.id)).resource.data.questions.length, 200)
})

test('invalid question selections do not replace an existing session practice', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  const current = await run('session', 'start', { track: 'network' })
  for (const questionIndex of [-1, 200, 1.5, '9', null]) {
    await assert.rejects(run('session', 'start', { track: 'agent', questionIndex }), { code: 'INVALID_QUESTION' })
    assert.equal((await application.readAtomicSession('session')).resource.data.practice.id, current.resource.data.practice.id)
  }
  const first = await run('agent', 'start', { track: 'agent' })
  assert.equal(first.resource.data.currentQuestion.prompt, AGENT_TRACK.questions[0][0])
})

test('each categorized data file contains distinct stable IDs and usable content metadata', () => {
  assert.deepEqual(AGENT_QUESTION_SECTIONS.map(({ id, questions }) => [id, questions.length]), [
    ['foundations', 24], ['tools', 36], ['retrieval', 48], ['context', 28], ['reliability', 32], ['evaluation', 32],
  ])
  const ids = []
  for (const section of AGENT_QUESTION_SECTIONS) {
    assert.equal(section.schemaVersion, 1)
    assert.ok(AGENT_TRACK.sections.some(({ title }) => title === section.title))
    for (const question of section.questions) {
      assert.deepEqual(Object.keys(question).sort(), ['cues', 'difficulty', 'id', 'prompt', 'source', 'type'])
      assert.match(question.id, /^agent-\d{3}$/)
      assert.ok(['foundation', 'intermediate', 'advanced'].includes(question.difficulty), question.id)
      assert.ok(['concept', 'scenario', 'project'].includes(question.type), question.id)
      assert.equal(question.prompt, question.prompt.trim(), question.id)
      assert.equal(question.cues.split('；').length, 3, question.id)
      assert.equal(new URL(question.source).protocol, 'https:', question.id)
      ids.push(question.id)
    }
  }
  assert.deepEqual(ids.sort(), Array.from({ length: 200 }, (_, index) => `agent-${String(index + 1).padStart(3, '0')}`))
})

test('the released question wording, indexes and stored mastery keys survive catalog expansion', () => {
  assert.equal(legacyPrompts.length, 24)
  assert.deepEqual(AGENT_TRACK.questions.slice(0, legacyPrompts.length).map(([prompt]) => prompt), legacyPrompts)
  const states = legacyPrompts.map((prompt) => ({
    key: coachQuestionKey(prompt), prompt, topic: '拾知 · 智能体应用开发', mastered: true,
  }))
  const bank = buildCoachBank([], states).filter(({ track }) => track === 'agent')
  assert.equal(bank.length, 200)
  assert.equal(bank.filter(({ mastered }) => !mastered).length, 176)
  for (const [index, prompt] of legacyPrompts.entries()) {
    assert.equal(bank[index].prompt, prompt)
    assert.equal(bank[index].questionIndex, index)
    assert.equal(bank[index].mastered, true)
  }
})
