import React from 'react'
import { COACH_TRACKS, coachReference, coachTrack } from '../../domain/coach-catalog.js'
import { interviewApi } from '../shared/api.js'
import { useInterviewQuery } from '../shared/hooks.js'
import { h, Button, ErrorNotice, Markdown } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'
import { SpeakButton, VoiceAnswer } from './voice-answer.js'

/** Built-in practice workspace, with server-persisted answers and optional AI review.
 * @param {object} props Current Harness session identifier.
 * @returns {object} React element.
 */
export function CoachHome({ sessionId, createSession, company, targetRole = '' }) {
  const [busy, setBusy] = React.useState('')
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [drafts, setDrafts] = React.useState({})
  const [editing, setEditing] = React.useState('')
  const [waiting, setWaiting] = React.useState(null)
  const inFlight = React.useRef(false)
  const query = useInterviewQuery(`coach:${sessionId}`, () => sessionId ? interviewApi.session(sessionId) : Promise.resolve(null), [sessionId], { cache: false })
  const context = query.data?.resource?.data
  const practice = context?.practice
  const question = context?.currentQuestion
  const latest = question?.attempts.at(-1)
  const answerKey = `${sessionId}:${question?.id}`
  const draft = drafts[answerKey] || ''
  const track = coachTrack(practice?.config.topic)
  const reference = coachReference(question?.prompt)
  React.useEffect(() => { setNotice(''); setError('') }, [sessionId])
  React.useEffect(() => {
    if (!sessionId || (!waiting && (!latest || (latest.evaluation && question.explanation)))) return undefined
    const timer = setInterval(() => { if (!document.hidden) void query.reload() }, 2500)
    return () => clearInterval(timer)
  }, [sessionId, latest?.id, Boolean(latest?.evaluation), Boolean(question?.explanation), waiting])
  React.useEffect(() => {
    if (!waiting) return
    const complete = waiting.command === 'followup' ? question?.id !== waiting.questionId : Boolean(latest?.evaluation && question?.explanation)
    if (complete) { setWaiting(null); setNotice('') }
  }, [waiting, question, latest])
  async function run(command, payload = {}) {
    if (inFlight.current) return
    inFlight.current = true; setBusy(command); setError(''); setNotice('')
    try {
      const targetSession = command === 'start' || !sessionId ? await createSession() : sessionId
      const response = await fetch('/interview/api/coach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        session: targetSession, command, payload: { practiceId: practice?.id, questionId: question?.id, revision: context?.revision,
          ...(command === 'start' && company ? { companyName: company.companyName, targetRole } : {}), ...payload },
      }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message || t('error'))
      if (command === 'submit') { setDrafts((current) => ({ ...current, [answerKey]: '' })); setEditing('') }
      if (command === 'retry') setEditing(answerKey)
      if (result.delivery) {
        setNotice(t(result.delivery === 'queued' ? 'pending' : 'unavailable'))
        setWaiting(result.delivery === 'queued' ? { command, questionId: question.id } : null)
      }
      if (command === 'finish') setNotice(t('saved'))
      interviewApi.invalidate()
    } catch (failure) { setError(failure.message || t('error')) }
    finally { inFlight.current = false; setBusy('') }
  }
  return h('div', { className: 'sz-home' },
    h('section', { className: 'sz-hero' },
      h('div', { className: 'sz-eyebrow' }, h('span', { className: 'sz-dot' }), t('eyebrow')),
      h('h1', null, t('headline')), h('p', null, t('intro')),
      h('div', { className: 'sz-hero-meta' }, h('span', null, '01 / ', t('answer')), h('span', null, '02 / ', t('feedback')), h('span', null, '03 / ', t('retry')))),
    !sessionId ? h('p', { className: 'sz-notice' }, t('setup')) : null,
    h(ErrorNotice, null, error || query.error),
    notice ? h('p', { className: 'sz-notice', role: 'status' }, notice) : null,
    practice && question ? h('section', { className: 'sz-session' },
      h('header', { className: 'sz-session-header' },
        h('div', null, h('span', { className: 'sz-eyebrow' }, t('question')), h('h2', null, practice.topic),
          practice.config.target ? h('p', null, practice.config.target.companyName, ' · ', practice.config.target.targetRole) : null),
        h('span', { className: 'sz-progress' }, String(question.sequence).padStart(2, '0'), ' / ', track?.questions.length || practice.questions.length)),
      h('div', { className: 'sz-question' }, h('h3', null, question.prompt), h(SpeakButton, { key: question.id, text: question.prompt })),
      !latest || editing === answerKey ? h(VoiceAnswer, { key: answerKey, value: draft, busy: Boolean(busy),
        onChange: (text) => setDrafts((current) => ({ ...current, [answerKey]: text })), onSubmit: () => run('submit', { answer: draft }) }) : null,
      latest ? h('section', { className: 'sz-feedback' },
        h('div', { className: 'sz-feedback-heading' }, h('h3', null, t('feedback')),
          latest.evaluation ? h('span', { className: 'sz-score' }, latest.evaluation.score, h('small', null, ' / 10')) : h('span', { className: 'sz-pending' }, t('remaining'))),
        latest.evaluation ? h(React.Fragment, null, h(Markdown, null, latest.evaluation.feedback),
          h('div', { className: 'sz-dimensions' }, Object.entries(latest.evaluation.dimensions || {}).map(([key, value]) => h('span', { key }, key, ' ', value, '/10'))),
          h('p', { className: 'sz-hint' }, t('feedbackHint'))) : null,
        h('div', { className: 'sz-answer-actions' },
          !latest.evaluation ? h(Button, { disabled: Boolean(busy), onClick: () => run('review') }, t('review')) : null,
          h(Button, { disabled: Boolean(busy), onClick: () => query.reload() }, t('refresh')),
          h(Button, { disabled: Boolean(busy), onClick: () => run('retry') }, t('retry')),
          h(Button, { disabled: Boolean(busy), onClick: () => run('followup') }, t('followup'))),
        h('details', { className: 'sz-history' }, h('summary', null, t('history'), ' · ', question.attempts.length, ' ', t('attempts')),
          question.attempts.map((attempt) => h('article', { key: attempt.id }, h('span', { className: 'sz-hint' }, '#', attempt.sequence, ' · ', attempt.evaluation ? `${attempt.evaluation.score}/10` : t('remaining')), h(Markdown, null, attempt.answer)))),
        reference ? h('details', { className: 'sz-history' }, h('summary', null, t('reference')), h('p', null, reference.cues), h('p', { className: 'sz-hint' }, t('referenceHint')),
          h('a', { href: reference.source, target: '_blank', rel: 'noreferrer' }, t('source'))) : null,
        question.explanation ? h('details', { className: 'sz-history' }, h('summary', null, t('edit')), h(Markdown, null, question.explanation.detail), h(Markdown, null, question.explanation.memorizationPoints)) : null) : null,
      h('footer', { className: 'sz-session-footer' }, h(Button, { disabled: Boolean(busy), onClick: () => run('finish') }, t('finish')),
        h(Button, { tone: 'primary', disabled: Boolean(busy), onClick: () => run('next') }, t('next')))) : null,
    h('section', { className: 'sz-catalog' }, h('div', { className: 'sz-section-heading' }, h('h2', null, t('catalog')), h('span', null, t('catalogHint'))),
      h('div', { className: 'sz-tracks' }, COACH_TRACKS.map((item, index) => h('button', { type: 'button', key: item.id,
        className: `sz-track sz-track-${item.id}`, disabled: Boolean(busy) || Boolean(company && !targetRole.trim()), onClick: () => run('start', { track: item.id }),
        'aria-label': `${t('start')} · ${item.title}` },
      h('div', { className: 'sz-track-top' }, h('span', { className: 'sz-track-icon', 'aria-hidden': true }, item.icon), h('span', null, `0${index + 1} ↗`)),
      h('h3', null, item.title), h('p', null, item.subtitle), h('span', { className: 'sz-track-count' }, item.questions.length, ' ', t('questions'), ' · ', t('coach')))))),
    h('p', { className: 'sz-local' }, h('span', null, '◈'), ' ', t('local')))
}
