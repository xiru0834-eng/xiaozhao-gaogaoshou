/** Validates optional product settings stored alongside existing practice configuration. */
import { assertDomain } from './errors.js'

/** Normalizes explicit coaching settings; legacy practices have none.
 * @param {object|undefined} value Input from the product configuration form.
 * @returns {object|undefined} Durable coaching settings.
 */
export function normalizeCoach(value) {
  if (value === undefined) return undefined
  assertDomain(value && ['standard', 'targeted', 'mock', 'review'].includes(value.kind), 'INVALID_COACH', '请选择有效的练习方式')
  const coach = { kind: value.kind }
  for (const key of ['targetRole', 'jobDescription', 'projectExperience', 'sourcePracticeId', 'sourceQuestionId']) {
    if (value[key] === undefined) continue
    assertDomain(typeof value[key] === 'string' && value[key].length <= (key === 'targetRole' ? 200 : 12000), 'INVALID_PREPARATION', '岗位最多 200 字，岗位要求和项目经历各最多 12000 字')
    coach[key] = value[key].trim()
  }
  if (value.kind === 'targeted') assertDomain(coach.targetRole && (coach.jobDescription || coach.projectExperience), 'PREPARATION_REQUIRED', '请填写目标岗位，以及岗位要求或项目经历')
  if (value.kind === 'mock') {
    assertDomain([10, 15, 20].includes(value.durationMinutes) && [4, 6, 8].includes(value.questionLimit), 'INVALID_INTERVIEW_LIMIT', '请选择有效的面试时长和题数')
    coach.durationMinutes = value.durationMinutes
    coach.questionLimit = value.questionLimit
    coach.ending = value.ending === true
  }
  return coach
}

/** Indicates when a timed interview must stop asking new questions; current drafts remain submittable.
 * @param {object} practice Saved practice.
 * @param {number} now Current timestamp.
 * @returns {boolean} Whether time or question budget is exhausted.
 */
export function interviewLimitReached(practice, now) {
  const coach = practice.config.coach
  return coach?.kind === 'mock' && (coach.ending || practice.questions.length >= coach.questionLimit
    || now >= practice.createdAt + coach.durationMinutes * 60000)
}
