/** Adds interview preparation to the upstream company workbench. */
import { t } from '../client/shared/coach-locale.js'

/** Replaces the standalone model panel with navigation to the shared coach.
 * @param {object} session Workbench data session.
 * @returns {void} Owns listeners for this iframe document's lifetime.
 */
export function mountModelSettings(session) {
  const send = (action, companyName) => {
    if (document.querySelector('#savenote')?.dataset.kind !== 'ready') {
      window.alert(t('careerWaitSave'))
      return
    }
    window.parent.postMessage({ type: 'shizhi-career', action, companyName }, window.location.origin)
  }
  const addButton = (parent, text, action, companyName) => {
    const button = document.createElement('button')
    button.type = 'button'; button.className = 'action sz-career-action'; button.textContent = text
    button.addEventListener('click', () => send(action, companyName))
    parent.appendChild(button)
  }
  const header = document.querySelector('.header-tools')
  let counts = new Map()
  addButton(header, t('careerPractice'), 'practice')
  addButton(header, t('chatTitle'), 'chat')
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
    if (event.origin === location.origin && event.source === window.parent && event.data?.type === 'shizhi-career-refresh') void addHistory()
  })
  void addHistory()
}
