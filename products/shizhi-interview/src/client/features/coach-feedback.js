/** Evidence-based feedback shared by live practice and archived answers. */
import { h, Markdown } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'
import { compareAttempts } from '../../domain/coach-progress.js'

/** Displays verified quotes and model judgments, with a legacy Markdown fallback.
 * @param {object} props Saved evaluation.
 * @returns {object} Feedback content.
 */
export function CoachFeedback({ evaluation }) {
  if (!evaluation.review) return h(Markdown, null, evaluation.feedback)
  return h('div', { className: 'sz-evidence' },
    h('section', { className: 'sz-next-step' }, h('h4', null, t('nextStep')), h('p', null, evaluation.review.nextStep)),
    ['met', 'partial', 'incorrect', 'missing', 'uncertain'].map((status) => {
      const items = evaluation.review.items.filter((item) => item.status === status)
      if (!items.length) return null
      return h('section', { key: status, className: `sz-evidence-group is-${status}` },
        h('h4', null, t(`evidence_${status}`)), items.map((item) => h('article', { key: item.point },
          h('strong', null, item.point), item.quote ? h('blockquote', null, item.quote) : null,
          h('p', null, item.comment))))
    }),
    h('details', null, h('summary', null, t('fullFeedback')), h(Markdown, null, evaluation.feedback)))
}

/** Shows the two answers and changes supported by their saved reviews.
 * @param {object} props Chronological attempts, optionally including an earlier review session.
 * @returns {object|null} Comparison when at least two evaluated attempts exist.
 */
export function AnswerComparison({ attempts }) {
  const change = compareAttempts(attempts)
  if (!change) return null
  return h('details', { className: 'sz-comparison', open: true }, h('summary', null, t('answerComparison')),
    h('p', { className: 'sz-hint' }, t('comparisonHint')),
    h('div', { className: 'sz-comparison-columns' }, [change.before, change.after].map((attempt, index) =>
      h('article', { key: attempt.id }, h('h4', null, t(index ? 'thisAnswer' : 'previous'), ` · ${attempt.evaluation.score}/10`),
        h(Markdown, null, attempt.answer)))),
    change.improved.length ? h('p', null, h('strong', null, t('improvedPoints')), change.improved.join('；')) : null,
    change.remaining.length ? h('p', null, h('strong', null, t('remainingPoints')), change.remaining.join('；')) : null)
}
