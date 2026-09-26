import test from 'node:test'
import assert from 'node:assert/strict'
import { applicationFixture } from '../support/application-fixture.js'
import { createCoachCommands } from '../../src/application/coach-commands.js'
import { coachQuestionKey } from '../../src/domain/coach-bank.js'

function input(result, extra = {}) {
  const { practice, currentQuestion, revision } = result.resource.data
  return { practiceId: practice.id, questionId: currentQuestion?.id, revision, ...extra }
}

test('mastery removes a question from future draws without changing saved answers', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  const bank = await application.coachBank()
  assert.equal(bank.length, 232)
  const first = bank.find((item) => item.track === 'network')
  const second = bank.find((item) => item.track === 'network' && item.questionIndex === 1)
  let state = await run('one', 'start', { bankKey: first.key })
  state = await run('one', 'submit', input(state, { answer: '这是需要保留的回答。' }))
  const before = await application.getPractice(state.resource.data.practice.id)
  await application.setCoachQuestionMastered(first.key, true)
  await application.setCoachQuestionMastered(first.key, true)
  assert.deepEqual(await application.getPractice(before.resource.data.id), before)
  assert.equal((await application.coachBank()).filter((item) => item.mastered).length, 1)
  assert.equal((await run('two', 'start', { track: 'network' })).resource.data.currentQuestion.prompt, second.prompt)
  await assert.rejects(run('three', 'start', { bankKey: first.key }), { code: 'QUESTION_MASTERED' })
  state = await run('one', 'next', input(state))
  assert.equal(state.resource.data.currentQuestion.prompt, second.prompt)
  await assert.rejects(run('one', 'select', input(state, { bankKey: first.key })), { code: 'QUESTION_MASTERED' })
  await application.setCoachQuestionMastered(first.key, false)
  state = await run('one', 'select', input(state, { bankKey: first.key }))
  assert.equal(state.resource.data.currentQuestion.attempts[0].answer, '这是需要保留的回答。')
  assert.equal(state.resource.data.practice.questions.length, 2)
})

test('free selection preserves previous attempts and rejects stale or cross-topic selections', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  const bank = await application.coachBank()
  const first = bank.find((item) => item.track === 'agent')
  const selected = bank.find((item) => item.track === 'agent' && item.questionIndex === 9)
  let state = await run('one', 'start', { bankKey: first.key })
  const old = input(state)
  state = await run('one', 'select', input(state, { bankKey: selected.key }))
  assert.equal(state.resource.data.currentQuestion.prompt, selected.prompt)
  await assert.rejects(run('one', 'select', { ...old, bankKey: first.key }), { code: 'STALE_QUESTION' })
  await assert.rejects(run('one', 'select', input(state, { bankKey: bank.find((item) => item.track === 'java').key })), { code: 'INVALID_QUESTION' })
  state = await run('one', 'select', input(state, { bankKey: first.key }))
  assert.equal(state.resource.data.practice.questions.length, 2)
})

test('an entirely mastered direction stays empty until the user restores a question', async () => {
  const { application, repository } = applicationFixture()
  const run = createCoachCommands({ application })
  const questions = (await application.coachBank()).filter((item) => item.track === 'redis')
  for (const item of questions) await application.setCoachQuestionMastered(item.key, true)
  await assert.rejects(run('one', 'start', { track: 'redis' }), { code: 'NO_PENDING_QUESTION' })
  assert.equal((await repository.listPractices()).length, 0)
  await application.setCoachQuestionMastered(questions[4].key, false)
  const result = await run('one', 'start', { track: 'redis' })
  assert.equal(result.resource.data.currentQuestion.prompt, questions[4].prompt)
})

test('mastered questions leave the review queue and restoration retains their earlier evaluation', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  let state = await run('one', 'start', { track: 'network' })
  state = await run('one', 'submit', input(state, { answer: 'GET 获取资源。' }))
  const question = state.resource.data.currentQuestion
  await application.createAtomicEvaluation('one', { questionId: question.id, attemptId: question.attempts[0].id, score: 4, feedback: '需要补充。' })
  const queue = await application.reviewQueue()
  assert.equal(queue.length, 1)
  await application.setCoachQuestionMastered(coachQuestionKey(question.prompt), true)
  assert.deepEqual(await application.reviewQueue(), [])
  await assert.rejects(run('two', 'review-start', { sourcePracticeId: queue[0].practiceId, sourceQuestionId: queue[0].questionId }), { code: 'QUESTION_MASTERED' })
  await application.setCoachQuestionMastered(coachQuestionKey(question.prompt), false)
  assert.deepEqual(await application.reviewQueue(), queue)
})

test('a personal question can be restored even after its source practice is deleted', async () => {
  const { application, repository } = applicationFixture()
  const run = createCoachCommands({ application })
  const state = await run('one', 'start', { kind: 'targeted', preparation: { targetRole: 'Agent 开发', projectExperience: '文档问答' } })
  await application.createAtomicQuestion('one', { prompt: '如何对检索结果做质量控制？' })
  const key = coachQuestionKey('如何对检索结果做质量控制？')
  await application.setCoachQuestionMastered(key, true)
  await repository.deletePractice(state.resource.data.practice.id)
  await application.setCoachQuestionMastered(key, false)
  const selected = await run('two', 'start', { bankKey: key })
  assert.equal(selected.resource.data.currentQuestion.prompt, key)
  assert.equal(selected.resource.data.practice.config.coach.kind, 'standard')
})

test('mock interviews retain AI-led question order and completed records reopen without new attempts', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  await run('one', 'start', { kind: 'mock', preparation: { targetRole: '后端', projectExperience: '订单服务' },
    durationMinutes: 15, questionLimit: 4, difficulty: 'junior', interviewerStyle: '专业追问' })
  await application.createAtomicQuestion('one', { prompt: '介绍一下你的订单服务。' })
  const state = await application.readAtomicSession('one')
  await assert.rejects(run('one', 'select', input(state, { bankKey: '介绍一下你的订单服务。' })), { code: 'SELECTION_NOT_ALLOWED' })
  await run('one', 'archive', input(state))
  const archive = await application.getPractice(state.resource.data.practice.id)
  const reopened = await run('two', 'resume', { sourcePracticeId: state.resource.data.practice.id })
  assert.equal(reopened.resource.data.practice.status, 'completed')
  assert.deepEqual(await application.getPractice(state.resource.data.practice.id), archive)
})

test('unknown questions and invalid mastery flags cannot write personal bank state', async () => {
  const { application, repository } = applicationFixture()
  const first = (await application.coachBank())[0]
  await assert.rejects(application.setCoachQuestionMastered('unknown', true), { code: 'QUESTION_NOT_FOUND' })
  await assert.rejects(application.setCoachQuestionMastered(first.key, 'true'), { code: 'INVALID_QUESTION_STATE' })
  assert.deepEqual(await repository.listCoachQuestionStates(), [])
})
