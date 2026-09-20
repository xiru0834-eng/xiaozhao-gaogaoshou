/** Replays captured model outputs without credentials through the real tool adapters. */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createAtomicToolDefinitions } from '../../src/adapters/dsh/atomic-tool-definitions.js'
import { createPresentationToolDefinitions } from '../../src/adapters/dsh/presentation-tool-definitions.js'
import { createCoachCommands } from '../../src/application/coach-commands.js'
import { compareAttempts } from '../../src/domain/coach-progress.js'
import { applicationFixture } from '../support/application-fixture.js'

const recorded = JSON.parse(readFileSync(new URL('../fixtures/recorded-coach-results.json', import.meta.url), 'utf8'))

function replayFixture() {
  const { application } = applicationFixture()
  const sessionId = 'recorded-session'
  const exec = { agent: { session: { header: { id: sessionId } } } }
  const definitions = [...createAtomicToolDefinitions(application), ...createPresentationToolDefinitions(application)]
  const tools = Object.fromEntries(definitions.map((tool) => [tool.name, tool]))
  return { application, sessionId, call: (name, args) => tools[name].execute(args, exec), run: createCoachCommands({ application }) }
}

test('recorded weak and improved answers retain evidence through tools, presentation and review scheduling', async () => {
  const { application, sessionId, call, run } = replayFixture()
  const started = await run(sessionId, 'start', { track: 'network' })
  const practiceId = started.resource.data.practice.id
  const questionId = started.resource.data.currentQuestion.id
  const question = recorded.review.questions[0]
  for (const attempt of question.attempts) {
    const saved = await call('interview_attempt', { operation: 'create', question_id: questionId, answer: attempt.answer })
    await call('interview_evaluation', { operation: 'create', question_id: questionId, attempt_id: saved.resource.data.id, ...attempt.evaluation })
  }
  await call('interview_explanation', { operation: 'create', question_id: questionId, detail: question.explanation.detail, memorization_points: question.explanation.memorizationPoints })
  const display = await call('interview_show_review', { practice_id: practiceId, question_id: questionId })
  assert.equal(display.artifact.kind, 'review')
  const actual = (await application.readAtomicSession(sessionId)).resource.data.currentQuestion
  assert.deepEqual(actual.attempts.map(({ answer, evaluation }) => ({ answer,
    evaluation: { score: evaluation.score, feedback: evaluation.feedback, dimensions: evaluation.dimensions, review: evaluation.review },
  })), question.attempts)
  assert.deepEqual(compareAttempts(actual.attempts).improved.sort(), question.attempts[1].evaluation.review.items.map((item) => item.point).sort())
  assert.equal((await application.reviewQueue())[0].needsWork, false)
})

test('recorded four-question interview permits a final report but no mid-interview review', async () => {
  const { application, sessionId, call, run } = replayFixture()
  const config = recorded.mock.config
  let state = await run(sessionId, 'start', { kind: 'mock', preparation: config.coach, durationMinutes: 15,
    questionLimit: 4, difficulty: config.difficulty, interviewerStyle: config.interviewerStyle })
  for (const question of recorded.mock.questions) {
    const saved = await call('interview_question', { operation: 'create', prompt: question.prompt })
    state = await application.readAtomicSession(sessionId)
    await assert.rejects(call('interview_show_review', { practice_id: state.resource.data.practice.id, question_id: saved.resource.data.id }), { code: 'REVIEW_NOT_ALLOWED' })
    state = await run(sessionId, 'submit', { practiceId: state.resource.data.practice.id, questionId: saved.resource.data.id,
      revision: state.resource.data.revision, answer: question.attempts[0].answer })
  }
  application.clock = { now: () => recorded.mock.summary.createdAt }
  await call('interview_practice', { operation: 'complete', ...recorded.mock.summary })
  const practice = (await application.readAtomicSession(sessionId)).resource.data.practice
  assert.equal(practice.status, 'completed')
  assert.deepEqual(practice.summary, recorded.mock.summary)
  assert.equal(practice.questions.length, 4)
  const shown = await call('interview_show_summary', { practice_id: practice.id })
  assert.equal(shown.artifact.kind, 'finished')
})
