/** Product workbench and persistent interview practice view. */
import React from 'react'
import { CoachHome } from './coach-home.js'
import { h, Button, ErrorNotice, Icon } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'
import { interviewApi } from '../shared/api.js'
import { useInterviewQuery } from '../shared/hooks.js'
import { PracticeLibrary } from './practice-library.js'

async function careerRequest(path) {
  const response = await fetch(`/interview/career${path}`, { cache: 'no-store' })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.message || t('error'))
  return result
}

function ChatStart({ sessionId, sendMessage }) {
  const [draft, setDraft] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const sending = React.useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (sending.current || !draft.trim()) return
    sending.current = true
    setBusy(true)
    setError('')
    try {
      await sendMessage(sessionId, draft.trim())
      setDraft('')
    } catch (failure) {
      setError(failure.message || t('error'))
    } finally {
      sending.current = false
      setBusy(false)
    }
  }
  return h('form', { className: 'sz-chat-start', onSubmit: submit },
    h('label', { htmlFor: 'sz-chat-draft' }, t('chatTitle')),
    h('p', null, t('chatHint')),
    h('textarea', { id: 'sz-chat-draft', className: 'sz-textarea', value: draft, disabled: busy,
      placeholder: t('chatPlaceholder'), onChange: (event) => setDraft(event.target.value) }),
    h(ErrorNotice, null, error),
    h(Button, { type: 'submit', disabled: busy || !draft.trim() }, t(busy ? 'sending' : 'chatSend')))
}

/** Renders the workbench and coach for empty or practice-bound conversations, without a directory picker.
 * @param {object} props Harness slot hooks and product actions.
 * @returns {object} Product home with chat and practice actions.
 */
export function ProductConversation(props) {
  const { sessionId, actions } = props
  const [tab, setTab] = React.useState('career')
  const [company, setCompany] = React.useState(null)
  const [role, setRole] = React.useState('')
  const [history, setHistory] = React.useState([])
  const [viewPractice, setViewPractice] = React.useState(null)
  const [error, setError] = React.useState('')
  const frame = React.useRef(null)
  const frameReady = React.useRef(false)
  const pendingNavigation = React.useRef(null)
  const session = useInterviewQuery(`product-session:${sessionId}`, () => sessionId ? interviewApi.session(sessionId) : Promise.resolve(null), [sessionId], { cache: false })
  const practice = sessionId && session.data?.resource?.data?.sessionId === sessionId ? session.data.resource.data.practice : null
  React.useEffect(() => {
    if (!practice) return
    const target = practice.config.target
    setCompany(target || null); setRole(target?.targetRole || ''); setViewPractice(null)
    setTab('practice')
  }, [sessionId, practice?.id])
  React.useEffect(() => {
    let alive = true
    const receive = async (event) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return
      if (event.data?.type === 'shizhi-career-ready') {
        frameReady.current = true
        if (pendingNavigation.current) {
          frame.current?.contentWindow?.postMessage({ type: 'shizhi-career-navigate', action: pendingNavigation.current }, location.origin)
          pendingNavigation.current = null
        }
        return
      }
      if (event.data?.type !== 'shizhi-career') return
      setError(''); setViewPractice(null)
      if (event.data.action === 'chat' || event.data.action === 'practice') { setTab(event.data.action); return }
      if (event.data.action !== 'prepare' || typeof event.data.companyName !== 'string' || event.data.companyName.length > 200) return
      try {
        const data = await careerRequest(`/company?name=${encodeURIComponent(event.data.companyName)}`)
        if (!alive) return
        setCompany(data.company); setRole(''); setTab('practice')
      } catch (failure) { if (alive) setError(failure.message) }
    }
    window.addEventListener('message', receive)
    return () => { alive = false; window.removeEventListener('message', receive) }
  }, [])
  React.useEffect(() => {
    let alive = true
    if (tab === 'career') frame.current?.contentWindow?.postMessage({ type: 'shizhi-career-refresh' }, location.origin)
    const refresh = () => { if (company && tab === 'practice') void careerRequest(`/preparation?companyId=${encodeURIComponent(company.companyId)}`)
      .then((data) => { if (alive) setHistory(data.items) }).catch((failure) => { if (alive) setError(failure.message) })
    }
    refresh()
    const unsubscribe = interviewApi.subscribe(refresh)
    return () => { alive = false; unsubscribe() }
  }, [company, tab])
  const switchView = (next) => {
    if (tab === 'career' && next !== 'career') {
      if (!frameReady.current) { pendingNavigation.current = next; return }
      frame.current?.contentWindow?.postMessage({ type: 'shizhi-career-navigate', action: next }, location.origin)
      return
    }
    setTab(next); setViewPractice(null)
  }
  return h('main', { className: 'sz-product', 'aria-label': t('careerBrand') },
    h('nav', { className: 'sz-product-nav', 'aria-label': t('careerBrand') },
      h('strong', { className: 'sz-wordmark' }, h(Icon, { name: 'book', size: 23 }), t('careerBrand')),
      [['career', 'careerHome'], ['practice', 'careerPractice'], ['chat', 'chatTitle']].map(([id, label]) =>
        h('button', { type: 'button', key: id, 'aria-pressed': tab === id, onClick: () => switchView(id) }, t(label)))),
    h(ErrorNotice, null, error || session.error),
    h('iframe', { ref: frame, title: t('careerFrame'), src: '/interview/career/', className: 'sz-career-frame', hidden: tab !== 'career',
      onLoad: () => {
        frame.current?.contentWindow?.postMessage({ type: 'shizhi-career-appearance-request' }, location.origin)
      } }),
    tab === 'chat' ? h('div', { className: 'sz-landing' }, h(ChatStart, { key: sessionId || 'new', sessionId, sendMessage: actions.sendMessage })) : null,
    h('div', { className: 'sz-landing', hidden: tab !== 'practice' },
      company ? h('section', { className: 'sz-career-target' }, h('small', null, t('careerTarget')),
        h('h2', null, company.companyName), h('p', null, company.roles, ' · ', company.city),
        h('label', { htmlFor: 'sz-target-role' }, t('careerRole')),
        h('input', { id: 'sz-target-role', value: role, maxLength: 200, placeholder: t('careerRolePlaceholder'), onChange: (event) => setRole(event.target.value) }),
        h('p', { className: 'sz-hint' }, t('careerHint')),
        h(Button, { onClick: () => { setCompany(null); setRole(''); setHistory([]); setViewPractice(null) } }, t('careerClear')),
        h('h3', null, t('careerHistory')),
        history.length ? h('div', { className: 'sz-career-history' }, history.map((item) => h('button', { key: item.id, type: 'button', onClick: () => setViewPractice(item.id) },
          item.role, ' · ', item.topic, ' · ', item.answers, ' ', t('careerRecorded'), item.scores.length ? ` · ${(item.scores.reduce((a, b) => a + b, 0) / item.scores.length).toFixed(1)}/10` : '', ' ↗'))) : h('p', null, t('careerEmpty')),
      ) : null,
      viewPractice ? h(PracticeLibrary, { key: viewPractice, sessionId, initialPracticeId: viewPractice, allowCreate: false })
        : h(CoachHome, { sessionId, createSession: actions.createSession, company, targetRole: role })))
}
