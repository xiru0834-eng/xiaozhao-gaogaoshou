/** Adds interview preparation to the upstream company workbench. */
import { t } from '../client/shared/coach-locale.js'
import './career-paper.css'
import { mountCareerAppearance } from './career-appearance.js'
import { mountModelSettings as mountWorkbenchModels } from '../../../../src/client/model-settings.ts'
import { requestWorkbenchNavigation } from '../../../../src/client/workbench-shell.ts'

/** Retains workbench model settings and adds navigation to the shared coach.
 * @param {object} session Workbench data session.
 * @returns {void} Owns listeners for this iframe document's lifetime.
 */
export function mountModelSettings(session) {
  mountCareerAppearance()
  mountWorkbenchModels(session)
  queueMicrotask(() => {
    const nav = document.querySelector('#workspace-navigation')
    const revealSelection = () => {
      const selected = nav.querySelector('[aria-current=page]')
      if (!selected || !nav.clientWidth) return
      const item = selected.getBoundingClientRect(), viewport = nav.getBoundingClientRect()
      if (item.left < viewport.left || item.right > viewport.right) {
        nav.scrollTo({ left: nav.scrollLeft + item.left - viewport.left - (nav.clientWidth - item.width) / 2, behavior: 'instant' })
      }
    }
    new MutationObserver(revealSelection).observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] })
    new ResizeObserver(revealSelection).observe(nav)
    revealSelection()
  })
  const modelButton = document.querySelector('#open-model')
  if (modelButton) modelButton.dataset.navLabel = t('careerModelSettings')
  const send = (action, companyName) => {
    if (document.querySelector('#savenote')?.dataset.kind !== 'ready') {
      window.alert(t('careerWaitSave'))
      return
    }
    requestWorkbenchNavigation(window, () => {
      window.parent.postMessage({ type: 'shizhi-career', action, companyName }, window.location.origin)
    })
  }
  const addButton = (parent, text, action, companyName) => {
    const button = document.createElement('button')
    button.type = 'button'; button.className = 'action sz-career-action'; button.textContent = text
    button.addEventListener('click', () => send(action, companyName))
    parent.appendChild(button)
  }
  let counts = new Map()
  const augment = () => {
    for (const card of document.querySelectorAll('.row[data-id]')) {
      if (card.querySelector('.sz-career-action')) continue
      const count = counts.get(card.dataset.id)
      addButton(card.querySelector('.links'), `${t('careerPrepare')}${count ? ` · ${count}` : ''}`, 'prepare', card.dataset.id)
    }
    const detail = document.querySelector('#company-detail[open] .detail-actions')
    if (detail && !detail.querySelector('.sz-career-action')) {
      addButton(detail, t('careerPrepare'), 'prepare', document.querySelector('#detail-title').textContent)
    }
  }
  const observer = new MutationObserver(augment)
  observer.observe(document.querySelector('#board'), { childList: true, subtree: true })
  observer.observe(document.querySelector('#company-detail'), { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] })
  augment()
  const addHistory = async () => {
    try {
      const data = await session.read('/preparation')
      counts = new Map()
      for (const item of data.items) counts.set(item.companyName, (counts.get(item.companyName) || 0) + 1)
      for (const card of document.querySelectorAll('.row[data-id]')) {
        const button = card.querySelector('.sz-career-action')
        const count = counts.get(card.dataset.id)
        if (button) button.textContent = `${t('careerPrepare')}${count ? ` · ${count}` : ''}`
      }
    } catch (error) { /* The workbench remains usable when practice summaries are unavailable. */ }
  }
  window.addEventListener('focus', addHistory)
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== window.parent) return
    if (event.data?.type === 'shizhi-career-refresh') void addHistory()
    if (event.data?.type === 'shizhi-career-navigate' && ['practice', 'chat'].includes(event.data.action)) send(event.data.action)
    if (event.data?.type === 'shizhi-career-navigate' && event.data.action === 'schedules') document.getElementById('open-schedules')?.click()
    if (event.data?.type === 'shizhi-career-navigate' && event.data.action === 'models') document.getElementById('open-model')?.click()
  })
  const saveStatus = document.querySelector('#savenote')
  const ready = new MutationObserver(() => {
    if (saveStatus.dataset.kind !== 'ready') return
    window.parent.postMessage({ type: 'shizhi-career-ready' }, location.origin)
    ready.disconnect()
  })
  if (saveStatus.dataset.kind === 'ready') window.parent.postMessage({ type: 'shizhi-career-ready' }, location.origin)
  else ready.observe(saveStatus, { attributes: true, attributeFilter: ['data-kind'] })
  void addHistory()
}
