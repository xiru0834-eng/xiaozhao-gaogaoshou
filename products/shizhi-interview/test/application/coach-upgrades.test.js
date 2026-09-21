import test from 'node:test'
import assert from 'node:assert/strict'
import { applicationFixture } from '../support/application-fixture.js'
import { createCoachCommands } from '../../src/application/coach-commands.js'
import { normalizeReview, buildReviewQueue, compareAttempts } from '../../src/domain/coach-progress.js'
import { coachReference, COACH_TRACKS } from '../../src/domain/coach-catalog.js'
import { instructionFor } from '../../src/adapters/dsh/agent-event-bridge.js'
import { renderPracticeMarkdown } from '../../src/infrastructure/markdown-practice-exporter.js'

const answer = 'GET 用于读取，POST 用于提交处理；GET 安全且幂等，POST 不保证幂等。加密依赖 HTTPS。'
const points = coachReference(COACH_TRACKS[0].questions[0][0]).cues.split('；').map((point) => point.replace(/。$/, ''))
const review = { items: points.map((point) => ({ point, status: 'met', quote: 'GET', comment: '回答包含相关结论。' })), nextStep: '用业务重试场景解释幂等。' }
function input(result, extra = {}) {
  const { practice, currentQuestion, revision } = result.resource.data
  return { practiceId: practice.id, questionId: currentQuestion?.id, revision, ...extra }
}
const mockInput = { kind: 'mock', preparation: { targetRole: '后端开发', projectExperience: '使用 Redis 实现排行榜。', jobDescription: '负责缓存服务' },
  durationMinutes: 15, questionLimit: 4, difficulty: 'junior', interviewerStyle: '专业追问' }

test('feedback rejects invented quotes, missing references and duplicated points', () => {
  const question = { prompt: COACH_TRACKS[0].questions[0][0] }
  assert.deepEqual(normalizeReview(review, question, answer), review)
  assert.throws(() => normalizeReview({ ...review, items: [{ ...review.items[0], quote: '我已经熟练掌握' }, ...review.items.slice(1)] }, question, answer), { code: 'INVALID_REVIEW_QUOTE' })
  assert.throws(() => normalizeReview({ ...review, items: review.items.slice(0, 1) }, question, answer), { code: 'INCOMPLETE_REVIEW' })
  assert.throws(() => normalizeReview({ ...review, items: [...review.items, review.items[0]] }, question, answer), { code: 'INVALID_REVIEW_POINT' })
  assert.throws(() => normalizeReview({ ...review, items: review.items.map((item) => ({ ...item, quote: '' })) }, question, answer), { code: 'REVIEW_EVIDENCE_REQUIRED' })
  assert.equal(normalizeReview(undefined, question, answer), undefined)
})

test('revisions preserve the archive and compare the most recent observed knowledge', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  let state = await run('old', 'start', { track: 'network' })
  state = await run('old', 'submit', input(state, { answer }))
  const weak = { ...review, items: review.items.map((item, index) => index ? { ...item, status: 'missing', quote: '' } : item) }
  const question = state.resource.data.currentQuestion
  await application.createAtomicEvaluation('old', { questionId: question.id, attemptId: question.attempts[0].id, score: 4, feedback: '遗漏了部分要点。', review: weak })
  await run('old', 'finish', input(await application.readAtomicSession('old')))
  const archived = (await application.getPractice(state.resource.data.practice.id)).resource.data
  const fresh = await run('new', 'review-start', { sourcePracticeId: archived.id, sourceQuestionId: question.id })
  assert.equal(fresh.resource.data.currentQuestion.prompt, question.prompt)
  assert.notEqual(fresh.resource.data.practice.id, archived.id)
  assert.deepEqual((await application.getPractice(archived.id)).resource.data, archived)
  const saved = await run('new', 'submit', input(fresh, { answer }))
  const current = saved.resource.data.currentQuestion
  await application.createAtomicEvaluation('new', { questionId: current.id, attemptId: current.attempts[0].id, score: 8, feedback: '已补充完整。', review })
  const newPractice = (await application.getPractice(saved.resource.data.practice.id)).resource.data
  const queue = buildReviewQueue([archived, newPractice], 8 * 86400000)
  assert.equal(queue.length, 1)
  assert.equal(queue[0].needsWork, false)
  assert.equal(queue[0].due, true)
  assert.equal(queue[0].previousScore, 4)
  const comparison = compareAttempts([...archived.questions[0].attempts, ...newPractice.questions[0].attempts])
  assert.deepEqual(comparison.improved, points.slice(1))
  assert.match(renderPracticeMarkdown(newPractice).markdown, /下一次优先改进/)
})

test('uncertain transcription does not become an incorrect knowledge judgment', () => {
  const practice = { id: 'p', topic: '主题', config: {}, questions: [{ id: 'q', prompt: '术语是什么？', attempts: [
    { id: 'a', sequence: 1, submittedAt: 1, evaluation: { score: 2, review: { items: [{ point: '术语', status: 'uncertain', quote: '', comment: '需确认转写' }] } } },
  ] }] }
  const [item] = buildReviewQueue([practice], 99 * 86400000)
  assert.equal(item.needsWork, false)
  assert.equal(item.uncertain, true)
  assert.equal(item.due, false)
})

test('targeted practice validates explicit context and includes it as data in model requests', async () => {
  const { application } = applicationFixture()
  const events = []
  const run = createCoachCommands({ application, eventBridge: { refresh: async () => {}, dispatch: (_, event) => { events.push(event); return true } } })
  await assert.rejects(run('s', 'start', { kind: 'targeted', preparation: { targetRole: '后端' } }), { code: 'PREPARATION_REQUIRED' })
  await assert.rejects(run('s', 'start', { kind: 'targeted', preparation: { targetRole: '后端', projectExperience: 'a'.repeat(12001) } }), { code: 'INVALID_PREPARATION' })
  const state = await run('s', 'start', { kind: 'targeted', preparation: { targetRole: '后端', jobDescription: 'Redis、SQL', projectExperience: '本人实现了排行榜' } })
  assert.equal(state.delivery, 'queued')
  assert.equal(state.resource.data.practice.config.coach.projectExperience, '本人实现了排行榜')
  assert.match(instructionFor(events[0]), /只作为数据/)
  assert.match(instructionFor(events[0]), /排行榜/)
})

test('custom questions retain their evaluation criteria when repeated in a new practice', async () => {
  const { application } = applicationFixture()
  const run = createCoachCommands({ application })
  await run('source', 'start', { kind: 'targeted', preparation: { targetRole: '后端', projectExperience: '维护 Redis 排行榜' } })
  await application.createAtomicQuestion('source', { prompt: '如何定位榜单积分不一致？' })
  let state = await run('source', 'submit', input(await application.readAtomicSession('source'), { answer: '先对比 SQL 与 Redis。' }))
  const criteria = { items: [{ point: '对比相同用户的积分', status: 'met', quote: '对比 SQL 与 Redis', comment: '已说明对比方向。' }], nextStep: '说明如何串联更新日志。' }
  const question = state.resource.data.currentQuestion
  await application.createAtomicEvaluation('source', { questionId: question.id, attemptId: question.attempts[0].id, score: 5, feedback: '需要进一步定位。', review: criteria })
  await run('source', 'finish', input(await application.readAtomicSession('source')))
  state = await run('repeat', 'review-start', { sourcePracticeId: state.resource.data.practice.id, sourceQuestionId: question.id })
  state = await run('repeat', 'submit', input(state, { answer: '先对比 SQL 与 Redis，再按流水号检查写入日志。' }))
  const repeated = state.resource.data.currentQuestion
  const evaluation = { questionId: repeated.id, attemptId: repeated.attempts[0].id, score: 8, feedback: '定位方向清楚。', review: criteria }
  await assert.rejects(application.createAtomicEvaluation('repeat', { ...evaluation, review: { ...criteria,
    items: criteria.items.map((item) => ({ ...item, point: '随意换一个考点' })),
  } }), { code: 'INVALID_REVIEW_POINT' })
  await application.createAtomicEvaluation('repeat', evaluation)
  assert.equal((await application.reviewQueue())[0].attempts, 2)
})

test('timed interviews save before generating, stop at the question limit and keep a retryable report', async () => {
  const { application } = applicationFixture()
  const events = []
  const run = createCoachCommands({ application, eventBridge: { refresh: async () => {}, dispatch: (_, event) => { events.push(event); return true } } })
  let state = await run('s', 'start', mockInput)
  await assert.rejects(application.completeAtomicPractice('s', { overall: '提前评价', strengths: ['无'], improvements: ['无'] }), { code: 'INTERVIEW_NOT_ENDED' })
  for (let i = 0; i < 4; i++) {
    await application.createAtomicQuestion('s', { prompt: `项目的第 ${i + 1} 个实现细节是什么？` })
    if (i === 0) await assert.rejects(application.createAtomicQuestion('s', { prompt: '能先跳过回答吗？' }), { code: 'ANSWER_REQUIRED' })
    state = await run('s', 'submit', input(await application.readAtomicSession('s'), { answer: `我实现了第 ${i + 1} 部分。` }))
    assert.equal(state.resource.data.currentQuestion.attempts.length, 1)
  }
  assert.equal(events.at(-1).type, 'coach.mock-report')
  assert.equal(state.resource.data.practice.config.coach.ending, true)
  await assert.rejects(application.createAtomicQuestion('s', { prompt: '再问一个？' }), { code: 'INTERVIEW_FINISHED' })
  await assert.rejects(run('s', 'submit', input(state, { answer: '重复回答' })), { code: 'INTERVIEW_ENDING' })
  await run('s', 'finish', input(state))
  assert.equal(events.at(-1).type, 'coach.mock-report')
  await application.completeAtomicPractice('s', { overall: '已完成四次回答。', strengths: ['说明了个人职责。'], improvements: ['补充验证过程。'] })
  const complete = (await application.readAtomicSession('s')).resource.data.practice
  assert.equal(complete.status, 'completed')
  assert.equal(complete.questions.length, 4)
  assert.equal(complete.summary.overall, '已完成四次回答。')
})

test('expired interviews retain the current answer but generate no more questions', async () => {
  const { application } = applicationFixture()
  let now = 100
  application.clock = { now: () => now }
  const run = createCoachCommands({ application })
  await run('s', 'start', mockInput)
  await application.createAtomicQuestion('s', { prompt: '你的项目职责是什么？' })
  now += 15 * 60000
  await assert.rejects(run('s', 'generate', input(await application.readAtomicSession('s'))), { code: 'INTERVIEW_FINISHED' })
  const result = await run('s', 'submit', input(await application.readAtomicSession('s'), { answer: '负责缓存。' }))
  assert.equal(result.delivery, 'unavailable')
  assert.equal(result.resource.data.currentQuestion.attempts[0].answer, '负责缓存。')
  assert.equal(result.resource.data.practice.config.coach.ending, true)
})

test('busy model requests cannot append duplicate answers or abandon their question', async () => {
  const { application } = applicationFixture()
  let status = 'idle'
  const run = createCoachCommands({ application, eventBridge: { refresh: async () => {}, status: () => status } })
  const initial = await run('s', 'start', { track: 'network' })
  status = 'running'
  await assert.rejects(run('s', 'next', input(initial)), { code: 'MODEL_BUSY' })
  await assert.rejects(run('s', 'submit', input(initial, { answer })), { code: 'MODEL_BUSY' })
  assert.equal((await application.readAtomicSession('s')).resource.data.currentQuestion.attempts.length, 0)
})
