/** Navigation to saved coach practices and their existing answers. */
import { interviewApi } from '../shared/api.js'
import { useInterviewQuery } from '../shared/hooks.js'
import { h, Button, ErrorNotice } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'

/** Lists ongoing and completed practices without changing their status.
 * @param {object} props Navigation state and open callback.
 * @returns {object} Saved practice list.
 */
export function CoachRecords({ disabled, onOpen }) {
  const query = useInterviewQuery('coach-records', () => interviewApi.practices(), [], { cache: false })
  const records = (query.data?.resource.data || []).filter((item) => item.coachKind)
  return h('section', { className: 'sz-records' },
    h('div', { className: 'sz-page-heading' }, h('div', null, h('h2', null, t('recordsPage')), h('p', null, t('recordHint')))),
    h(ErrorNotice, null, query.error), query.error ? h(Button, { onClick: query.reload }, t('refresh')) : null,
    query.loading ? h('p', { role: 'status' }, t('loadingRecords')) : !records.length ? h('p', { className: 'sz-empty' }, t('recordEmpty')) :
      h('div', { className: 'sz-record-list' }, records.map((item) => h('article', { key: item.id },
        h('div', null, h('span', { className: `sz-status ${item.status}` }, t(item.status === 'active' ? 'recordActive' : 'recordCompleted')),
          h('h3', null, item.topic), h('p', null, new Date(item.updatedAt).toLocaleString('zh-CN'), ' · ', item.questionCount, ' ', t('questions'), ' · ', item.attemptCount, ' ', t('recordAnswers'))),
        h(Button, { disabled, onClick: () => onOpen(item.id), 'aria-label': `${t('recordOpen')} · ${item.topic}` }, t('recordOpen'))))))
}
