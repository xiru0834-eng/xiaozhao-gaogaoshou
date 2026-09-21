/** Searchable personal bank with a separate, reversible mastered collection. */
import React from 'react'
import { COACH_TRACKS } from '../../domain/coach-catalog.js'
import { h, Button } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'

/** Renders one bank page with direction filters, search and bounded result pages.
 * @param {object} props Persisted bank, mastery filter and question actions.
 * @returns {object} Question bank page.
 */
export function CoachCatalog({ items, loading, disabled, onStart, onRestore, mastered = false }) {
  const [track, setTrack] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(0)
  const eligible = items.filter((item) => item.mastered === mastered)
  const filtered = eligible.filter((item) => (track === 'all' || item.track === track)
    && `${item.prompt} ${item.topic} ${item.section}`.toLowerCase().includes(search.trim().toLowerCase()))
  const lastPage = Math.max(0, Math.ceil(filtered.length / 12) - 1)
  const currentPage = Math.min(page, lastPage)
  const visible = filtered.slice(currentPage * 12, (currentPage + 1) * 12)
  const tracks = [{ id: 'all', title: t('allTopics') }, ...COACH_TRACKS.filter((item) => item.sections),
    ...COACH_TRACKS.filter((item) => !item.sections), { id: 'personal', title: t('personalQuestions') }]
  return h('section', { className: 'sz-bank-page', 'aria-label': t(mastered ? 'masteredPage' : 'bankPage') },
    h('div', { className: 'sz-page-heading' }, h('div', null, h('h2', null, t(mastered ? 'masteredPage' : 'bankPage')),
      h('p', null, t(mastered ? 'masteredHint' : 'bankHint'))), h('span', { className: 'sz-count-pill' }, eligible.length, ' ', t('bankTotal'))),
    h('label', { className: 'sz-bank-search' }, t('bankSearch'), h('input', { type: 'search', value: search, placeholder: t('bankSearchHint'),
      onChange: (event) => { setSearch(event.target.value); setPage(0) } })),
    h('div', { className: 'sz-bank-layout' },
      h('nav', { className: 'sz-topic-nav', 'aria-label': t('allTopics') }, tracks.map((item) => h('button', { type: 'button', key: item.id,
        'aria-pressed': track === item.id, onClick: () => { setTrack(item.id); setPage(0) } },
      h('span', null, item.title), h('span', null, eligible.filter((question) => item.id === 'all' || question.track === item.id).length)))),
      h('div', null, loading ? h('p', { className: 'sz-empty', role: 'status' }, t('bankLoading')) : !filtered.length
        ? h('p', { className: 'sz-empty' }, t(mastered && !eligible.length ? 'noMastered' : 'noBankResults'))
        : h('ol', { className: 'sz-question-list' }, visible.map((item, index) => h('li', { key: item.key },
          h('span', { className: 'sz-bank-number', 'aria-hidden': true }, String(currentPage * 12 + index + 1).padStart(2, '0')),
          h('div', { className: 'sz-question-list-copy' }, h('p', { className: 'sz-question-meta' }, item.section || item.topic), h('h3', null, item.prompt)),
          h(Button, { disabled, 'aria-label': `${t(mastered ? 'restoreQuestion' : 'startAnswer')} · ${item.prompt}`,
            onClick: () => mastered ? onRestore(item) : onStart({ bankKey: item.key }) }, t(mastered ? 'restoreQuestion' : 'startAnswer'))))),
      lastPage > 0 ? h('div', { className: 'sz-pagination' },
        h(Button, { disabled: currentPage === 0, onClick: () => setPage(currentPage - 1) }, t('previousPage')),
        h('span', null, currentPage + 1, ' / ', lastPage + 1, ' ', t('page')),
        h(Button, { disabled: currentPage === lastPage, onClick: () => setPage(currentPage + 1) }, t('nextPage'))) : null)))
}
