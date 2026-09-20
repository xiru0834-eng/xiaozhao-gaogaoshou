/** Evidence checks and review scheduling derived from saved answers. */
import { assertDomain } from './errors.js'
import { coachReference } from './coach-catalog.js'

const DAY = 86400000
const STATES = ['met', 'partial', 'missing', 'incorrect', 'uncertain']

/** Validates model feedback against the actual answer and the fixed reference when present.
 * @param {object|undefined} review Optional structured feedback; older records omit it.
 * @param {object} question Saved question.
 * @param {string} answer Unmodified submitted text.
 * @param {string[]|undefined} previousPoints Criteria from the source of a repeated practice.
 * @returns {object|undefined} Validated, bounded feedback.
 */
export function normalizeReview(review, question, answer, previousPoints) {
  if (review === undefined) return undefined
  assertDomain(review && Array.isArray(review.items) && review.items.length > 0 && review.items.length <= 12,
    'INVALID_REVIEW', '逐项点评需要 1–12 个知识点')
  const reference = coachReference(question.prompt)
  const allowed = reference?.cues.split('；').map((text) => text.replace(/[。.]$/, '').trim())
    || question.attempts?.find((attempt) => attempt.evaluation?.review)?.evaluation.review.items.map((item) => item.point)
    || previousPoints
  const seen = new Set()
  const items = review.items.map((item) => {
    assertDomain(item && typeof item.point === 'string' && item.point.trim() && item.point.length <= 300
      && STATES.includes(item.status) && typeof item.quote === 'string' && item.quote.length <= 1000
      && typeof item.comment === 'string' && item.comment.trim() && item.comment.length <= 2000,
    'INVALID_REVIEW', '点评需要知识点、掌握状态、回答原文和具体解释')
    const point = item.point.trim()
    assertDomain(!seen.has(point) && (!allowed || allowed.includes(point)), 'INVALID_REVIEW_POINT', '请逐项使用本题参考要点，不能重复或改写要点')
    seen.add(point)
    assertDomain(!item.quote || answer.includes(item.quote), 'INVALID_REVIEW_QUOTE', '点评引用必须来自本次回答原文')
    assertDomain(!['met', 'partial', 'incorrect'].includes(item.status) || item.quote.trim(), 'REVIEW_EVIDENCE_REQUIRED', '判断正确、部分掌握或错误时必须引用回答原文')
    return { point, status: item.status, quote: item.quote, comment: item.comment.trim() }
  })
  assertDomain(!allowed || allowed.every((point) => seen.has(point)), 'INCOMPLETE_REVIEW', '点评必须覆盖本题全部参考要点')
  assertDomain(typeof review.nextStep === 'string' && review.nextStep.trim() && review.nextStep.length <= 2000,
    'INVALID_REVIEW', '请给出下一次回答的一项具体改进建议')
  return { items, nextStep: review.nextStep.trim() }
}

/** Groups identical questions and schedules only evaluated attempts, preserving uncertainty.
 * @param {object[]} practices Stored practices, including archives.
 * @param {number} now Current time in milliseconds.
 * @returns {object[]} Review cards with evidence and a suggested next review time.
 */
export function buildReviewQueue(practices, now) {
  const groups = new Map()
  for (const practice of practices) for (const question of practice.questions) {
    for (const attempt of question.attempts) {
      if (!attempt.evaluation) continue
      const key = `${practice.config.topic || practice.topic}\n${question.prompt}`
      const group = groups.get(key) || []
      group.push({ practice, question, attempt })
      groups.set(key, group)
    }
  }
  return [...groups.values()].map((entries) => {
    entries.sort((a, b) => a.attempt.submittedAt - b.attempt.submittedAt || a.attempt.sequence - b.attempt.sequence)
    const { practice, question, attempt } = entries.at(-1)
    const review = attempt.evaluation.review
    const weak = review?.items.filter((item) => ['partial', 'missing', 'incorrect'].includes(item.status))
    const uncertain = Boolean(review?.items.some((item) => item.status === 'uncertain'))
    const needsWork = review ? weak.length > 0 : attempt.evaluation.score < 7
    const dueAt = attempt.submittedAt + (needsWork ? DAY : 7 * DAY)
    const recurring = new Map()
    for (const entry of entries) for (const item of entry.attempt.evaluation.review?.items || []) {
      if (['partial', 'missing', 'incorrect'].includes(item.status)) recurring.set(item.point, (recurring.get(item.point) || 0) + 1)
    }
    return { practiceId: practice.id, questionId: question.id, prompt: question.prompt, topic: practice.topic,
      score: attempt.evaluation.score, attempts: entries.length, needsWork, uncertain, structured: Boolean(review),
      dueAt, due: !uncertain && dueAt <= now, nextStep: review?.nextStep || '',
      weakPoints: (weak || []).map((item) => ({ ...item, occurrences: recurring.get(item.point) || 1 })),
      previousScore: entries.length > 1 ? entries.at(-2).attempt.evaluation.score : null }
  }).sort((a, b) => Number(b.due) - Number(a.due) || Number(b.needsWork) - Number(a.needsWork) || a.dueAt - b.dueAt)
}

/** Compares observed knowledge points, without inferring improvement from score alone.
 * @param {object[]} attempts Chronological answers for one question.
 * @returns {object|null} Last two reviewed attempts and points gained or still missing.
 */
export function compareAttempts(attempts) {
  const reviewed = attempts.filter((attempt) => attempt.evaluation)
  if (reviewed.length < 2) return null
  const [before, after] = reviewed.slice(-2)
  const previous = new Map((before.evaluation.review?.items || []).map((item) => [item.point, item.status]))
  return { before, after,
    improved: (after.evaluation.review?.items || []).filter((item) => previous.has(item.point) && previous.get(item.point) !== 'met' && item.status === 'met').map((item) => item.point),
    remaining: (after.evaluation.review?.items || []).filter((item) => ['partial', 'missing', 'incorrect'].includes(item.status)).map((item) => item.point) }
}
