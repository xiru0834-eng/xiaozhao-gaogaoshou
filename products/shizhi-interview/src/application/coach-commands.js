import { COACH_TRACKS, coachTrack, coachReference } from '../domain/coach-catalog.js'
import { DomainError } from '../domain/errors.js'

/** Serializes workspace commands per session; failed commands do not block later work.
 * @param {object} runtime Application and agent bridge owned by the plugin.
 * @returns {Function} Async command dispatcher.
 */
export function createCoachCommands({ application, eventBridge, resolveCompany }) {
  const pending = new Map()
  async function execute(sessionId, command, payload) {
    if (command === 'start') {
      const track = COACH_TRACKS.find((item) => item.id === payload.track)
      if (!track) throw new DomainError('INVALID_TRACK', '请选择一个练习方向')
      let target
      if (payload.companyName) {
        if (!resolveCompany) throw new DomainError('CAREER_UNAVAILABLE', '公司目录尚未就绪，请刷新工作台')
        if (typeof payload.targetRole !== 'string' || !payload.targetRole.trim() || payload.targetRole.length > 200) {
          throw new DomainError('TARGET_ROLE_REQUIRED', '请填写目标岗位，最多 200 字')
        }
        target = { ...resolveCompany(payload.companyName), targetRole: payload.targetRole.trim() }
      }
      await application.createAtomicPractice(sessionId, { mode: 'bagu', config: { topic: `拾知 · ${track.title}`, ...(target ? { target } : {}) } })
      await application.createAtomicQuestion(sessionId, { prompt: track.questions[0][0] })
      await eventBridge?.refresh(sessionId)
      return application.readAtomicSession(sessionId)
    }
    const current = await application.readAtomicSession(sessionId)
    const { practice, currentQuestion: question, revision } = current.resource.data
    if (!practice || practice.status !== 'active') throw new DomainError('NO_PRACTICE', '请先开始或继续一条练习')
    if (payload.practiceId !== practice.id || payload.questionId !== question?.id || payload.revision !== revision) {
      throw new DomainError('STALE_QUESTION', '题目已发生变化，请刷新后再操作；你的输入仍保留在文本框中')
    }
    if (command === 'next') {
      const track = coachTrack(practice.config.topic)
      if (!track) throw new DomainError('CUSTOM_TOPIC', '自定义主题请使用对话区继续出题')
      const used = new Set(practice.questions.map((item) => item.prompt))
      const next = track.questions.find(([prompt]) => !used.has(prompt))
      if (!next) throw new DomainError('TRACK_FINISHED', '本方向的题目已练完，可以回看记录或结束本次练习')
      await application.createAtomicQuestion(sessionId, { prompt: next[0] })
    } else if (command === 'retry') {
      await application.focusAtomicQuestion(sessionId, question.id)
    } else if (command === 'finish') {
      const result = await application.archiveAtomicPractice(sessionId)
      await eventBridge?.refresh(sessionId)
      return result
    } else if (command === 'submit' || command === 'review' || command === 'followup') {
      let attempt = question.attempts.at(-1)
      if (command === 'submit') {
        if (typeof payload.answer !== 'string' || !payload.answer.trim() || payload.answer.length > 16000) {
          throw new DomainError('INVALID_ANSWER', '请输入回答，最多 16000 字')
        }
        const result = await application.createAtomicAttempt(sessionId, { questionId: question.id, answer: payload.answer.trim() })
        attempt = result.resource.data
      }
      if (!attempt) throw new DomainError('NO_ANSWER', '请先提交你的回答')
      if (command === 'review' && attempt.evaluation) return current
      await eventBridge?.refresh(sessionId)
      const delivered = eventBridge?.dispatch(sessionId, {
        type: command === 'followup' ? 'coach.followup' : 'coach.review',
        practiceId: practice.id, questionId: question.id, attemptId: attempt.id,
        answer: attempt.answer, mode: practice.mode, includeModeContext: true,
        reference: coachReference(question.prompt),
        target: practice.config.target,
      }) === true
      return { ...await application.readAtomicSession(sessionId), delivery: delivered ? 'queued' : 'unavailable' }
    } else {
      throw new DomainError('INVALID_COMMAND', '不支持此练习操作')
    }
    return application.readAtomicSession(sessionId)
  }
  return (sessionId, command, payload = {}) => {
    const previous = pending.get(sessionId) || Promise.resolve()
    const result = previous.then(() => execute(sessionId, command, payload))
    const settled = result.catch(() => {})
    pending.set(sessionId, settled)
    void settled.then(() => { if (pending.get(sessionId) === settled) pending.delete(sessionId) })
    return result
  }
}
