/** Product commands preserve answers before requesting model work. */
import { COACH_TRACKS, coachTrack, coachReference } from '../domain/coach-catalog.js'
import { DomainError } from '../domain/errors.js'
import { normalizeCoach, interviewLimitReached } from '../domain/coach-configuration.js'

/** Serializes UI commands per session; agent results are read from persisted records.
 * @param {object} runtime Application and agent bridge owned by the plugin.
 * @returns {Function} Async command dispatcher.
 */
export function createCoachCommands({ application, eventBridge, resolveCompany }) {
  const pending = new Map()
  async function dispatch(sessionId, practice, question, type, attempt) {
    await eventBridge?.refresh(sessionId)
    const delivered = eventBridge?.dispatch(sessionId, { type, practiceId: practice.id, questionId: question?.id,
      attemptId: attempt?.id, answer: attempt?.answer, mode: practice.mode, includeModeContext: true,
      reference: question ? coachReference(question.prompt) : null, target: practice.config.target,
      preparation: practice.config.coach?.jobDescription || practice.config.coach?.projectExperience ? practice.config.coach : undefined }) === true
    return { ...await application.readAtomicSession(sessionId), delivery: delivered ? 'queued' : 'unavailable' }
  }
  function targetOf(payload) {
    if (!payload.companyName) return undefined
    if (!resolveCompany) throw new DomainError('CAREER_UNAVAILABLE', '公司目录尚未就绪，请刷新工作台')
    if (typeof payload.targetRole !== 'string' || !payload.targetRole.trim() || payload.targetRole.length > 200) throw new DomainError('TARGET_ROLE_REQUIRED', '请填写目标岗位，最多 200 字')
    return { ...resolveCompany(payload.companyName), targetRole: payload.targetRole.trim() }
  }
  async function execute(sessionId, command, payload) {
    if (eventBridge?.status?.(sessionId) === 'running') throw new DomainError('MODEL_BUSY', '当前会话仍在运行，请等待结束后再操作')
    if (command === 'review-start') {
      const source = (await application.getPractice(payload.sourcePracticeId)).resource.data
      const question = source.questions.find((item) => item.id === payload.sourceQuestionId)
      if (!question?.attempts.some((attempt) => attempt.evaluation)) throw new DomainError('REVIEW_NOT_FOUND', '没有找到可复习的已点评问题')
      const config = { ...source.config, coach: { ...source.config.coach, kind: 'review', sourcePracticeId: source.id, sourceQuestionId: question.id } }
      await application.createAtomicPractice(sessionId, { mode: source.mode, config })
      await application.createAtomicQuestion(sessionId, { prompt: question.prompt })
      await eventBridge?.refresh(sessionId)
      return application.readAtomicSession(sessionId)
    }
    if (command === 'start') {
      const kind = payload.kind || 'standard'
      const coach = normalizeCoach({ ...payload.preparation, kind,
        ...(kind === 'mock' ? { durationMinutes: payload.durationMinutes, questionLimit: payload.questionLimit, ending: false } : {}) })
      const target = targetOf(payload)
      let mode, config, prompt
      if (kind === 'mock') {
        mode = 'mock'
        config = { resume: coach.projectExperience, targetRole: coach.targetRole,
          jobDescriptionProvided: Boolean(coach.jobDescription), jobDescription: coach.jobDescription,
          difficulty: payload.difficulty, interviewerStyle: payload.interviewerStyle, coding: false, coach }
      } else if (kind === 'targeted') {
        mode = 'scenario'; config = { topic: `岗位专项 · ${coach.targetRole}`, coach }
      } else if (kind === 'standard') {
        const track = COACH_TRACKS.find((item) => item.id === payload.track)
        if (!track) throw new DomainError('INVALID_TRACK', '请选择一个练习方向')
        const questionIndex = payload.questionIndex === undefined ? 0 : payload.questionIndex
        if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= track.questions.length) throw new DomainError('INVALID_QUESTION', '请选择题库中存在的问题')
        mode = 'bagu'; config = { topic: `拾知 · ${track.title}`, coach }; prompt = track.questions[questionIndex][0]
      } else throw new DomainError('INVALID_TRACK', '请选择有效的练习方式')
      if (target) config.target = target
      await application.createAtomicPractice(sessionId, { mode, config })
      if (prompt) await application.createAtomicQuestion(sessionId, { prompt })
      const current = await application.readAtomicSession(sessionId)
      if (!prompt) return dispatch(sessionId, current.resource.data.practice, null, kind === 'mock' ? 'coach.mock-next' : 'coach.targeted')
      await eventBridge?.refresh(sessionId)
      return current
    }
    const current = await application.readAtomicSession(sessionId)
    const { practice, currentQuestion: question, revision } = current.resource.data
    if (!practice || practice.status !== 'active') throw new DomainError('NO_PRACTICE', '请先开始或继续一条练习')
    if (payload.practiceId !== practice.id || payload.questionId !== question?.id || payload.revision !== revision) {
      throw new DomainError('STALE_QUESTION', '题目已发生变化，请刷新后再操作；你的输入仍保留在文本框中')
    }
    const mock = practice.config.coach?.kind === 'mock'
    if (command === 'finish' && mock) {
      await application.endCoachInterview(sessionId)
      return dispatch(sessionId, practice, question, 'coach.mock-report')
    }
    if (command === 'archive' || command === 'finish') {
      const result = await application.archiveAtomicPractice(sessionId)
      await eventBridge?.refresh(sessionId)
      return result
    }
    if (practice.config.coach?.ending) throw new DomainError('INTERVIEW_ENDING', '面试已结束，请重试生成复盘或仅保存记录')
    if (command === 'generate' || (command === 'next' && (mock || practice.config.coach?.kind === 'targeted' || (practice.config.coach?.kind === 'review' && practice.mode === 'scenario')))) {
      if (mock && interviewLimitReached(practice, application.clock.now())) throw new DomainError('INTERVIEW_FINISHED', '本场面试已到结束时间或题数上限，请结束并查看复盘')
      if (question && !question.attempts.length) throw new DomainError('ANSWER_REQUIRED', '请先回答当前问题')
      return dispatch(sessionId, practice, question, mock ? 'coach.mock-next' : 'coach.targeted')
    }
    if (!question) throw new DomainError('QUESTION_REQUIRED', '请先生成面试问题')
    if (command === 'next') {
      const track = coachTrack(practice.config.topic)
      if (!track) throw new DomainError('CUSTOM_TOPIC', '自定义主题请使用针对回答追问')
      const used = new Set(practice.questions.map((item) => item.prompt))
      const position = track.questions.findIndex(([prompt]) => prompt === question.prompt)
      const ordered = [...track.questions.slice(position + 1), ...track.questions.slice(0, position + 1)]
      const next = ordered.find(([prompt]) => !used.has(prompt))
      if (!next) throw new DomainError('TRACK_FINISHED', '本方向的题目已练完，可以回看记录或结束本次练习')
      await application.createAtomicQuestion(sessionId, { prompt: next[0] })
    } else if (command === 'retry') {
      if (mock) throw new DomainError('MOCK_RETRY_NOT_ALLOWED', '模拟面试保留真实问答，请继续下一轮或结束复盘')
      await application.focusAtomicQuestion(sessionId, question.id)
    } else if (['submit', 'review', 'followup'].includes(command)) {
      if (mock && command !== 'submit') throw new DomainError('MOCK_REVIEW_NOT_ALLOWED', '模拟面试进行中不提供点评或答案')
      let attempt = question.attempts.at(-1)
      if (command === 'submit') {
        if (typeof payload.answer !== 'string' || !payload.answer.trim() || payload.answer.length > 16000) throw new DomainError('INVALID_ANSWER', '请输入回答，最多 16000 字')
        if (mock && attempt) throw new DomainError('ALREADY_ANSWERED', '当前问题已回答，请继续面试')
        attempt = (await application.createAtomicAttempt(sessionId, { questionId: question.id, answer: payload.answer.trim() })).resource.data
      }
      if (!attempt) throw new DomainError('NO_ANSWER', '请先提交你的回答')
      if (mock) {
        if (interviewLimitReached(practice, application.clock.now())) {
          await application.endCoachInterview(sessionId)
          return dispatch(sessionId, practice, question, 'coach.mock-report', attempt)
        }
        return dispatch(sessionId, practice, question, 'coach.mock-next', attempt)
      }
      if (command === 'review' && attempt.evaluation && question.explanation) return current
      return dispatch(sessionId, practice, question, command === 'followup' ? 'coach.followup' : 'coach.review', attempt)
    } else throw new DomainError('INVALID_COMMAND', '不支持此练习操作')
    return application.readAtomicSession(sessionId)
  }
  return (sessionId, command, payload = {}) => {
    const previous = pending.get(sessionId) || Promise.resolve()
    const result = previous.then(() => execute(sessionId, command, payload))
    const settled = result.catch((_error) => { /* The caller receives the error; later commands must remain usable. */ })
    pending.set(sessionId, settled)
    void settled.then(() => { if (pending.get(sessionId) === settled) pending.delete(sessionId) })
    return result
  }
}
