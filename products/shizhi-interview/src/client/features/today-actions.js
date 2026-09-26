/** Actionable entry points from saved practices, review recommendations and the calendar. */
import { useInterviewQuery } from '../shared/hooks.js'
import { h, ErrorNotice, Button, Icon } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'

export function TodayActions({ onPractice, onReview, onSchedule }) {
  const query = useInterviewQuery('today-actions', async () => {
    const response = await fetch('/interview/api/today')
    if (!response.ok) throw new Error(t('todayFailed'))
    return response.json()
  }, [], { cache: false })
  const data = query.data, upcoming = data?.upcoming
  return h('section', { className: 'sz-today', 'aria-label': t('todayTitle'), 'aria-busy': query.loading },
    h('div', { className: 'sz-today-heading' }, h('h2', null, t('todayTitle')), h(Button, { onClick: query.reload }, t('todayRefresh'))),
    h(ErrorNotice, null, query.error),
    h('div', { className: 'sz-today-grid' },
      [[t('resumeLast'), data?.recent?.topic || t('noRecentPractice'), 'book', () => onPractice(data?.recent?.id)],
        [t('reviewToday'), data ? `${data.reviewCount} ${t('todayReviewUnit')}` : '', 'swap', onReview],
        [t('upcomingInterview'), upcoming ? `${upcoming.company} · ${upcoming.date} ${upcoming.time || ''} (${upcoming.zone})` : t('noUpcomingInterview'), 'clock', onSchedule],
      ].map(([title, detail, icon, action]) => h('button', { type: 'button', key: title, onClick: action, disabled: query.loading || Boolean(query.error) },
        h(Icon, { name: icon, size: 22 }), h('span', null, h('strong', null, title), h('small', null, query.loading ? t('draftLoading') : detail)), h(Icon, { name: 'arrowRight', size: 18 })))))
}
