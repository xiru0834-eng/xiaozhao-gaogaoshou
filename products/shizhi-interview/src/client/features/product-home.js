/** Product landing page for new and empty conversations. */
import React from 'react'
import { CoachHome } from './coach-home.js'
import { h, Button, ErrorNotice } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'
import { interviewApi } from '../shared/api.js'
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

/** Renders a usable landing page for every empty conversation, without a directory picker.
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
  React.useEffect(() => {
    let alive = true
    if (sessionId) void interviewApi.session(sessionId).then((result) => {
      if (!alive || !result.resource.data.practice) return
      const target = result.resource.data.practice.config.target
      if (target) { setCompany(target); setRole(target.targetRole) }
      setTab('practice')
    }).catch((failure) => { if (alive) setError(failure.message) })
    return () => { alive = false }
  }, [sessionId])
  React.useEffect(() => {
    let alive = true
    const receive = async (event) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== 'shizhi-career') return
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
      frame.current?.contentWindow?.postMessage({ type: 'shizhi-career-navigate', action: next }, location.origin)
      return
    }
    setTab(next); setViewPractice(null)
  }
  return h('main', { className: 'sz-product', 'aria-label': t('careerBrand') },
    h('nav', { className: 'sz-product-nav', 'aria-label': t('careerBrand') },
      h('strong', null, t('careerBrand')),
      [['career', 'careerHome'], ['practice', 'careerPractice'], ['chat', 'chatTitle']].map(([id, label]) =>
        h('button', { type: 'button', key: id, 'aria-pressed': tab === id, onClick: () => switchView(id) }, t(label)))),
    h(ErrorNotice, null, error),
    h('iframe', { ref: frame, title: t('careerFrame'), src: '/interview/career/', className: 'sz-career-frame', hidden: tab !== 'career' }),
    tab === 'chat' ? h('div', { className: 'sz-landing' }, h(ChatStart, { key: sessionId || 'new', sessionId, sendMessage: actions.sendMessage })) : null,
    tab === 'practice' ? h('div', { className: 'sz-landing' },
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
        : h(CoachHome, { sessionId, createSession: actions.createSession, company, targetRole: role })) : null)
}
