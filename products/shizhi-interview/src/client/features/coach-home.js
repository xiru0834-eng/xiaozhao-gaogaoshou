/** Daily practice, targeted preparation and timed interviews in one workspace. */
import React from 'react'
import { COACH_TRACKS, coachReference, coachTrack } from '../../domain/coach-catalog.js'
import { interviewApi } from '../shared/api.js'
import { useInterviewQuery } from '../shared/hooks.js'
import { h, Button, ErrorNotice, Markdown } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'
import { SpeakButton, VoiceAnswer } from './voice-answer.js'
import { CoachFeedback, AnswerComparison } from './coach-feedback.js'
import { CoachPreparation } from './coach-preparation.js'
import { CoachRevision } from './coach-revision.js'

/** Renders durable practice state; agent lifecycle never substitutes for saved results.
 * @param {object} props Session, session creator and optional company context.
 * @returns {object} Practice workspace.
 */
export function CoachHome({ sessionId, createSession, company, targetRole = '' }) {
  const [busy, setBusy] = React.useState('')
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [drafts, setDrafts] = React.useState({})
  const [editing, setEditing] = React.useState('')
  const [voiceBusy, setVoiceBusy] = React.useState(false)
  const [now, setNow] = React.useState(Date.now())
  const inFlight = React.useRef(false)
  const query = useInterviewQuery(`coach:${sessionId}`, () => sessionId ? interviewApi.session(sessionId) : Promise.resolve(null), [sessionId], { cache: false })
  const context = query.data?.resource?.data?.sessionId === sessionId ? query.data.resource.data : null
  const practice = context?.practice
  const question = context?.currentQuestion
  const latest = question?.attempts.at(-1)
  const answerKey = `${sessionId}:${question?.id}`
  const draft = drafts[answerKey] || ''
  const mock = practice?.config.coach?.kind === 'mock'
  const active = practice?.status === 'active'
  const running = query.data?.runtime?.status === 'running'
  const disabled = Boolean(busy) || voiceBusy || running
  const navigationDisabled = disabled || Boolean(draft.trim())
  const ending = practice?.config.coach?.ending
  const deadline = mock ? practice.createdAt + practice.config.coach.durationMinutes * 60000 : 0
  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000))
  const reference = question ? coachReference(question.prompt) : null
  const originId = practice?.config.coach?.sourcePracticeId
  const origin = useInterviewQuery(`coach-origin:${originId}`, () => originId ? interviewApi.practice(originId) : Promise.resolve(null), [originId])
  const earlier = origin.data?.resource.data.questions.find((item) => item.id === practice?.config.coach?.sourceQuestionId)?.attempts || []
  const incomplete = active && ((!question && practice?.config.coach) || (mock ? ending || Boolean(latest) : latest && (!latest.evaluation || !question.explanation)))
  React.useEffect(() => { setNotice(''); setError(''); setEditing('') }, [sessionId])
  React.useEffect(() => {
    if (!sessionId || !active) return undefined
    const timer = setInterval(() => { if (!document.hidden) void query.reload() }, 2500)
    return () => clearInterval(timer)
  }, [sessionId, active])
  React.useEffect(() => {
    if (!mock || !active) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [mock, active])
  async function run(command, payload = {}) {
    if (voiceBusy) { setError(t('micBusy')); return }
    if (inFlight.current || running) return
    if (draft.trim() && ['start', 'review-start', 'next', 'followup', 'finish', 'archive'].includes(command)) { setError(t('finishDraftHint')); return }
    inFlight.current = true; setBusy(command); setError(''); setNotice('')
    try {
      const starting = ['start', 'review-start'].includes(command)
      const targetSession = starting || !sessionId ? await createSession() : sessionId
      const response = await fetch('/interview/api/coach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        session: targetSession, command, payload: { practiceId: practice?.id, questionId: question?.id, revision: context?.revision,
          ...(command === 'start' && company ? { companyName: company.companyName, targetRole } : {}), ...payload },
      }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message || t('error'))
      if (command === 'submit') { setDrafts((current) => ({ ...current, [answerKey]: '' })); setEditing('') }
      if (command === 'retry') setEditing(answerKey)
      if (result.delivery === 'unavailable') setNotice(t('unavailable'))
      if (!result.delivery && ['finish', 'archive'].includes(command)) setNotice(t('saved'))
      interviewApi.invalidate()
    } catch (failure) { setError(failure.message || t('error')) }
    finally { inFlight.current = false; setBusy('') }
  }
  const recover = ending ? 'finish' : !question || mock ? 'generate' : 'review'
  return h('div', { className: 'sz-home' },
    h('section', { className: 'sz-hero' }, h('div', { className: 'sz-eyebrow' }, t('eyebrow')),
      h('h1', null, t('headline')), h('p', null, t('intro'))),
    h(ErrorNotice, null, error || query.error), notice ? h('p', { className: 'sz-notice', role: 'status' }, notice) : null,
    practice ? h('section', { className: 'sz-session' },
      h('header', { className: 'sz-session-header' }, h('div', null, h('span', { className: 'sz-eyebrow' }, t(mock ? 'mockTitle' : 'question')),
        h('h2', null, mock ? practice.config.targetRole : practice.topic), practice.config.target ? h('p', null, practice.config.target.companyName) : null),
        h('span', { className: 'sz-progress' }, question?.sequence || 0, ' / ', mock ? practice.config.coach.questionLimit : coachTrack(practice.config.topic)?.questions.length || practice.questions.length)),
      mock && active ? h('p', { className: 'sz-timer', role: 'timer', 'aria-label': t('timeRemaining') }, t('timeRemaining'), ' ',
        `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`, ' · ', t('mockInProgressHint')) : null,
      mock && active && secondsLeft === 0 && !ending ? h('p', { className: 'sz-notice' }, t('timeExpired')) : null,
      practice.summary ? h('section', { className: 'sz-report' }, h('h3', null, t('mockReport')),
        h(Markdown, null, practice.summary.overall), h('h4', null, t('reportStrengths')),
        h('ul', null, practice.summary.strengths.map((text, index) => h('li', { key: index }, text))), h('h4', null, t('reportImprovements')),
        h('ul', null, practice.summary.improvements.map((text, index) => h('li', { key: index }, text)))) : null,
      !active ? h('p', { className: 'sz-notice' }, t('saved')) : null,
      question ? h('div', { className: 'sz-question' }, h('h3', null, question.prompt), h(SpeakButton, { key: question.id, text: question.prompt, disabled: voiceBusy })) : null,
      active && question && !ending && (!latest || editing === answerKey) ? h(VoiceAnswer, { key: answerKey, value: draft, busy: disabled,
        submitLabel: t(mock ? 'mockSubmit' : 'submit'), onActiveChange: setVoiceBusy,
        onChange: (text) => setDrafts((current) => ({ ...current, [answerKey]: text })), onSubmit: () => run('submit', { answer: draft }) }) : null,
      running ? h('p', { className: 'sz-notice', role: 'status' }, t('modelRunning')) : null,
      incomplete && !running && !busy ? h('div', { className: 'sz-recovery', role: 'status' }, h('p', null, t(ending ? 'reportIncomplete' : mock && latest ? 'mockContinueHint' : 'reviewIncomplete')),
        h(Button, { disabled: voiceBusy, onClick: () => run(recover) }, t(ending ? 'retryReport' : mock ? 'continueMock' : !question ? 'generateQuestion' : 'review')),
        h(Button, { onClick: query.reload }, t('refresh'))) : null,
      latest && !mock ? h('section', { className: 'sz-feedback' },
        h('div', { className: 'sz-feedback-heading' }, h('h3', null, t('feedback')), latest.evaluation ? h('span', { className: 'sz-score' }, latest.evaluation.score, h('small', null, ' / 10')) : null),
        latest.evaluation ? h(React.Fragment, null, h(CoachFeedback, { evaluation: latest.evaluation }), h('p', { className: 'sz-hint' }, t('feedbackHint'))) : null,
        h(AnswerComparison, { attempts: [...earlier, ...question.attempts] }),
        active ? h('div', { className: 'sz-answer-actions' }, h(Button, { disabled, onClick: () => run('retry') }, t('retry')),
          h(Button, { disabled: navigationDisabled, onClick: () => run('followup') }, t('followup'))) : null,
        reference ? h('details', { className: 'sz-history' }, h('summary', null, t('reference')), h('p', null, reference.cues),
          h('a', { href: reference.source, target: '_blank', rel: 'noreferrer' }, t('source'))) : null,
        question.explanation ? h('details', { className: 'sz-history' }, h('summary', null, t('edit')), h(Markdown, null, question.explanation.detail), h(Markdown, null, question.explanation.memorizationPoints)) : null) : null,
      latest ? h('details', { className: 'sz-history' }, h('summary', null, t('history'), ' · ', question.attempts.length, ' ', t('attempts')),
        question.attempts.map((attempt) => h('article', { key: attempt.id }, h('span', null, '#', attempt.sequence), h(Markdown, null, attempt.answer)))) : null,
      active ? h('footer', { className: 'sz-session-footer' },
        h(Button, { disabled: navigationDisabled, onClick: () => run('finish') }, t(mock ? 'endMock' : 'finish')),
        mock ? h(Button, { disabled: navigationDisabled, onClick: () => run('archive') }, t('archiveOnly')) :
          h(Button, { tone: 'primary', disabled: navigationDisabled, onClick: () => run('next') }, t('next')),
        draft.trim() ? h('p', { className: 'sz-hint' }, t('finishDraftHint')) : null) : null) : null,
    h(CoachRevision, { busy: navigationDisabled, version: practice?.updatedAt, onReview: (item) => run('review-start', { sourcePracticeId: item.practiceId, sourceQuestionId: item.questionId }) }),
    h(CoachPreparation, { targetRole, busy: navigationDisabled, onStart: (payload) => run('start', payload) }),
    h('section', { className: 'sz-catalog' }, h('div', { className: 'sz-section-heading' }, h('h2', null, t('catalog')), h('span', null, t('catalogHint'))),
      h('div', { className: 'sz-tracks' }, COACH_TRACKS.map((item, index) => h('button', { type: 'button', key: item.id,
        className: `sz-track sz-track-${item.id}`, disabled: navigationDisabled || Boolean(company && !targetRole.trim()), onClick: () => run('start', { track: item.id }),
        'aria-label': `${t('start')} · ${item.title}` }, h('div', { className: 'sz-track-top' }, h('span', null, item.icon), h('span', null, `0${index + 1} ↗`)),
        h('h3', null, item.title), h('p', null, item.subtitle), h('span', null, item.questions.length, ' ', t('questions')))))),
    h('p', { className: 'sz-local' }, t('local')))
}
