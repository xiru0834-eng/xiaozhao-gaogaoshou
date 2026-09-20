/** Review recommendations from saved evaluations, without changing archived answers. */
import { h, Button, ErrorNotice } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'
import { useInterviewQuery } from '../shared/hooks.js'

/** Loads due and weak questions; a new practice preserves the source archive.
 * @param {object} props Busy state, refresh version and review callback.
 * @returns {object} Review queue or empty-state guidance.
 */
export function CoachRevision({ busy, version, onReview }) {
  const query = useInterviewQuery('coach-review-queue', async () => {
    const response = await fetch('/interview/api/review-queue')
    if (!response.ok) throw new Error(t('reviewQueueError'))
    return response.json()
  }, [version], { cache: false })
  const items = query.data?.items || []
  const visible = items.filter((item) => item.due || item.needsWork || item.uncertain).slice(0, 6)
  return h('section', { className: 'sz-revision' }, h('h2', null, t('reviewToday')),
    h('p', { className: 'sz-hint' }, t('reviewScheduleHint')),
    h(ErrorNotice, null, query.error), query.error ? h(Button, { onClick: query.reload }, t('refresh')) : null,
    query.loading ? h('p', null, t('loadingReviews')) : !visible.length ? h('p', null, t('noReviews')) :
      h('div', { className: 'sz-review-grid' }, visible.map((item) => h('article', { key: `${item.practiceId}:${item.questionId}` },
        h('span', { className: 'sz-hint' }, item.uncertain ? t('needsConfirmation') : item.due ? t('dueNow') : `${t('nextReview')} ${new Date(item.dueAt).toLocaleDateString()}`),
        h('h3', null, item.prompt), h('p', null, `${t('lastScore')} ${item.score}/10 · ${item.attempts} ${t('reviewedAttempts')}`),
        item.weakPoints.length ? h('ul', null, item.weakPoints.map((point) => h('li', { key: point.point }, point.point,
          point.occurrences > 1 ? ` · ${t('recurring')} ${point.occurrences} ${t('times')}` : ''))) : !item.structured ? h('p', { className: 'sz-hint' }, t('legacyReviewHint')) : null,
        item.nextStep ? h('p', { className: 'sz-hint' }, item.nextStep) : null,
        h(Button, { disabled: busy, onClick: () => onReview(item) }, t('reviewThis'))))))
}
