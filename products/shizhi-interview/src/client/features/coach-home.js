/** Daily practice, targeted preparation and timed interviews in one workspace. */
import React from 'react'
import { coachReference, coachTrack } from '../../domain/coach-catalog.js'
import { interviewApi } from '../shared/api.js'
import { useInterviewQuery } from '../shared/hooks.js'
import { h, Button, ErrorNotice, Markdown, Icon } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'
import { SpeakButton, VoiceAnswer } from './voice-answer.js'
import { CoachFeedback, AnswerComparison } from './coach-feedback.js'
import { CoachPreparation } from './coach-preparation.js'
import { CoachRevision } from './coach-revision.js'
import { CoachCatalog } from './coach-catalog.js'
import { CoachRecords } from './coach-records.js'
import { CoachOverview } from './coach-overview.js'
import { coachQuestionKey } from '../../domain/coach-bank.js'
import { useAnswerDraft } from '../shared/answer-draft.js'

const PAGES = [
  ['studio', 'studioPage', 'studioDescription', 'grid'],
  ['bank', 'bankPage', 'bankDescription', 'book'], ['mock', 'mockPage', 'mockDescription', 'microphone'],
  ['targeted', 'targetedPage', 'targetedDescription', 'code'], ['revision', 'revisionPage', 'revisionDescription', 'swap'],
  ['records', 'recordsPage', 'recordsDescription', 'archive'], ['mastered', 'masteredPage', 'masteredDescription', 'check'],
]

/** Renders durable practice state; agent lifecycle never substitutes for saved results.
 * @param {object} props Session, session creator and optional company context.
 * @returns {object} Practice workspace.
 */
export function CoachHome({ sessionId, createSession, company, targetRole = '', intent }) {
  const [page, setPage] = React.useState('studio')
  const [bankTrack, setBankTrack] = React.useState('all')
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [busy, setBusy] = React.useState('')
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [focused, setFocused] = React.useState(true)
  const [editing, setEditing] = React.useState('')
  const [voiceBusy, setVoiceBusy] = React.useState(false)
  const [now, setNow] = React.useState(Date.now())
  const inFlight = React.useRef(false)
  const root = React.useRef(null)
  const query = useInterviewQuery(`coach:${sessionId}`, () => sessionId ? interviewApi.session(sessionId) : Promise.resolve(null), [sessionId], { cache: false })
  const context = sessionId && query.data?.resource?.data?.sessionId === sessionId ? query.data.resource.data : null
  const practice = context?.practice
  const bank = useInterviewQuery('coach-bank', () => interviewApi.questionBank(), [practice?.updatedAt], { cache: false })
  const bankItems = bank.data?.items || []
  const question = context?.currentQuestion
  const latest = question?.attempts.at(-1)
  const answerKey = `${practice?.id}:${question?.id}`
  const answerDraft = useAnswerDraft(practice?.id, question?.id, question?.attempts.length || 0)
  const draft = answerDraft.text
  const mock = practice?.config.coach?.kind === 'mock'
  const active = practice?.status === 'active'
  const running = query.data?.runtime?.status === 'running'
  const disabled = Boolean(busy) || voiceBusy || running
  const navigationDisabled = disabled || Boolean(draft.trim())
  const ending = practice?.config.coach?.ending
  const deadline = mock ? practice.createdAt + practice.config.coach.durationMinutes * 60000 : 0
  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000))
  const reference = question ? coachReference(question.prompt) : null
  const currentBankKey = question ? coachQuestionKey(question.prompt) : ''
  const mastered = bankItems.some((item) => item.key === currentBankKey && item.mastered)
  const selectable = bankItems.filter((item) => item.topic === practice?.config.topic && !item.mastered)
  const canSelect = ['standard', 'review'].includes(practice?.config.coach?.kind)
  const originId = practice?.config.coach?.sourcePracticeId
  const origin = useInterviewQuery(`coach-origin:${originId}`, () => originId ? interviewApi.practice(originId) : Promise.resolve(null), [originId])
  const earlier = origin.data?.resource.data.questions.find((item) => item.id === practice?.config.coach?.sourceQuestionId)?.attempts || []
  const incomplete = active && ((!question && practice?.config.coach) || (mock ? ending || Boolean(latest) : latest && (!latest.evaluation || !question.explanation)))
  React.useEffect(() => { setNotice(''); setError(''); setEditing('') }, [sessionId])
  React.useEffect(() => {
    root.current?.closest('.sz-landing,.di-workspace-content')?.scrollTo({ top: 0, behavior: 'instant' })
    root.current?.querySelector('.sz-coach-nav button[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  }, [page])
  React.useEffect(() => { if (practice) { setPage('session'); setPickerOpen(false) } }, [practice?.id])
  React.useEffect(() => {
    if (intent?.practiceId === practice?.id && practice) setPage('session')
    else if (intent?.practiceId) void run('resume', { sourcePracticeId: intent.practiceId })
    else if (intent?.page) setPage(intent.page)
  }, [intent])
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
    if (draft.trim() && ['select', 'next', 'followup', 'finish', 'archive'].includes(command)) { setError(t('finishDraftHint')); return }
    inFlight.current = true; setBusy(command); setError(''); setNotice('')
    try {
      await answerDraft.flush()
      const starting = ['start', 'review-start', 'resume'].includes(command)
      const targetSession = starting || !sessionId ? await createSession() : sessionId
      const response = await fetch('/interview/api/coach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        session: targetSession, command, payload: { practiceId: practice?.id, questionId: question?.id, revision: context?.revision,
          ...(command === 'start' && company ? { companyName: company.companyName, targetRole } : {}), ...payload },
      }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message || t('error'))
      if (command === 'submit') { answerDraft.submitted(); setEditing('') }
      if (command === 'retry') setEditing(answerKey)
      if (result.delivery === 'unavailable') setNotice(t('unavailable'))
      if (!result.delivery && ['finish', 'archive'].includes(command)) setNotice(t('saved'))
      setPage('session'); setPickerOpen(false)
      interviewApi.invalidate()
    } catch (failure) { setError(failure.message || t('error')) }
    finally { inFlight.current = false; setBusy('') }
  }
  async function setMastered(key, value) {
    if (inFlight.current || disabled) return
    inFlight.current = true; setBusy('mastery'); setError(''); setNotice('')
    try { await interviewApi.setQuestionMastered(key, value); setNotice(t(value ? 'questionMoved' : 'questionRestored')) }
    catch (failure) { setError(failure.message || t('error')) }
    finally { inFlight.current = false; setBusy('') }
  }
  const recover = ending ? 'finish' : !question || mock ? 'generate' : 'review'
  const activePage = page === 'session' ? mock ? 'mock' : practice?.config.coach?.kind === 'targeted' ? 'targeted' : 'bank' : page
  const navigate = (id) => { setPage(id); setBankTrack('all'); setNotice(''); setError('') }
  const openBank = (track) => { navigate('bank'); setBankTrack(track) }
  return h('div', { ref: root, className: `sz-home${page === 'session' ? ' is-answering' : ''}${page === 'session' && focused ? ' is-focused' : ''}${page === 'studio' ? ' is-studio' : ''}` },
    page === 'session' ? h('div', { className: 'sz-focus-bar' }, h(Button, { disabled: Boolean(busy) || voiceBusy, onClick: () => setPage('studio') }, t('backToStudio')),
      h('span', null, t(active ? 'focusHint' : 'viewReport')),
      h(Button, { 'aria-pressed': focused, onClick: () => setFocused(!focused) }, t(focused ? 'exitFocus' : 'enterFocus'))) : null,
    h('nav', { className: 'sz-coach-nav', 'aria-label': t('coachNavigation') }, PAGES.map(([id, label, description, icon]) => h('button', {
      type: 'button', key: id, 'aria-pressed': activePage === id, title: t(description), disabled: Boolean(busy) || voiceBusy,
      onClick: () => navigate(id),
    }, h(Icon, { name: icon }), h('span', null, t(label))))),
    page !== 'studio' ? h('header', { className: 'sz-hub-heading' }, h('div', null, h('h1', null, t('hubTitle')), h('p', null, t('hubIntro'))),
      h('div', { className: 'sz-bank-stats' }, h('span', null, h('strong', null, bankItems.filter((item) => !item.mastered).length), t('pendingCount')),
        h('span', null, h('strong', null, bankItems.filter((item) => item.mastered).length), t('masteredCount')))) : null,
    h(ErrorNotice, null, error || query.error), notice ? h('p', { className: 'sz-notice', role: 'status' }, notice) : null,
    bank.error ? h('div', null, h(ErrorNotice, null, bank.error), h(Button, { onClick: bank.reload }, t('refresh'))) : null,
    practice && page !== 'session' ? h('div', { className: 'sz-resume-bar' }, h('span', null, practice.topic),
      h(Button, { onClick: () => setPage('session') }, t(active ? 'continuePractice' : 'viewReport'))) : null,
    page === 'studio' ? h(CoachOverview, { onNavigate: navigate, onOpenBank: openBank, disabled: Boolean(busy) || voiceBusy, loading: bank.loading, items: bankItems }) : null,
    page === 'session' && practice ? h('section', { className: 'sz-session' },
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
      question ? h('div', { className: 'sz-question' }, h('h3', null, question.prompt),
        h('div', { className: 'sz-question-tools' }, h(SpeakButton, { key: question.id, text: question.prompt, disabled: voiceBusy }),
          active && canSelect ? h(Button, { disabled: navigationDisabled || bank.loading || Boolean(bank.error), 'aria-expanded': pickerOpen,
            onClick: () => setPickerOpen(!pickerOpen) }, t('chooseQuestion')) : null,
          h(Button, { className: 'sz-mastery-button', disabled: disabled || bank.loading || Boolean(bank.error),
            onClick: () => setMastered(currentBankKey, !mastered) }, t(mastered ? 'restoreQuestion' : 'slayQuestion'))),
        mastered ? h('span', { className: 'sz-mastered-badge' }, t('questionMastered')) : null,
        pickerOpen && canSelect ? h('section', { className: 'sz-session-picker', 'aria-label': t('chooseQuestion') }, h('p', null, t('chooseQuestionHint')),
          !selectable.length ? h('p', null, t('noSelectable')) : h('ol', null, selectable.map((item) => h('li', { key: item.key },
            h('button', { type: 'button', disabled: navigationDisabled || item.key === currentBankKey, 'aria-current': item.key === currentBankKey ? 'true' : undefined,
              onClick: () => run('select', { bankKey: item.key }) }, h('span', null, item.prompt),
              item.key === currentBankKey ? h('small', null, t('currentQuestion')) : practice.questions.some((saved) => coachQuestionKey(saved.prompt) === item.key) ? h('small', null, t('practicedQuestion')) : null))))) : null) : null,
      active && question && !ending && (!latest || editing === answerKey || draft) ? h(React.Fragment, null, h(VoiceAnswer, { key: answerKey, value: draft, busy: disabled || !answerDraft.ready,
        submitLabel: t(mock ? 'mockSubmit' : 'submit'), onActiveChange: setVoiceBusy,
        onChange: answerDraft.change, onSubmit: () => run('submit', { answer: draft }) }),
        h('div', { className: 'sz-draft-status', role: 'status' }, h('span', null, answerDraft.status),
          answerDraft.conflict ? h('div', null,
            h(Button, { disabled, onClick: () => answerDraft.resolve(true) }, t('draftKeepMine')),
            h(Button, { disabled, onClick: () => answerDraft.resolve(false) }, t('draftUseSaved')))
            : h(Button, { disabled, onClick: answerDraft.retry }, t('draftSaveNow')))) : null,
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
    page === 'revision' ? h(CoachRevision, { busy: navigationDisabled, version: practice?.updatedAt, onReview: (item) => run('review-start', { sourcePracticeId: item.practiceId, sourceQuestionId: item.questionId }) }) : null,
    ['mock', 'targeted'].map((kind) => h('div', { key: kind, hidden: page !== kind },
      h(CoachPreparation, { kind, targetRole, busy: navigationDisabled, pending: Boolean(busy) || running, onStart: (payload) => run('start', payload) }))),
    page === 'bank' || page === 'mastered' ? h(CoachCatalog, { key: `${page}:${bankTrack}`, initialTrack: bankTrack, mastered: page === 'mastered', items: bankItems, loading: bank.loading,
      disabled: page === 'mastered' ? disabled : navigationDisabled || Boolean(company && !targetRole.trim()) || Boolean(bank.error),
      onStart: (payload) => run('start', payload), onRestore: (item) => setMastered(item.key, false) }) : null,
    page === 'records' ? h(CoachRecords, { disabled: navigationDisabled, onOpen: (id) => run('resume', { sourcePracticeId: id }) }) : null,
    h('p', { className: 'sz-local' }, t('local')))
}
