/** Practice entry points and available directions from the user's question bank. */
import { COACH_TRACKS } from '../../domain/coach-catalog.js'
import { h, Button, Icon } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'

/** Opens a preparation page or a filtered bank without creating a practice.
 * @param {object} props Navigation callbacks, operation state and saved bank items.
 * @returns {object} Practice overview with live question counts.
 */
export function CoachOverview({ onNavigate, onOpenBank, disabled, items, loading }) {
  const pending = items.filter((item) => !item.mastered)
  const tracks = [...COACH_TRACKS.filter((track) => track.sections), ...COACH_TRACKS.filter((track) => !track.sections)]
  return h('div', { className: 'sz-overview' },
    h('div', { className: 'sz-overview-top' },
      h('section', { className: 'sz-overview-intro' },
        h('h1', null, h('span', null, t('studioTitle')), h('span', null, t('studioTitleAccent'))),
        h('p', null, t('studioIntro')),
        h(Button, { tone: 'primary', disabled, onClick: () => onOpenBank('all') }, t('studioEnter'), h(Icon, { name: 'arrowRight', size: 18 })),
        h('p', { className: 'sz-overview-note' }, h(Icon, { name: 'microphone', size: 16 }), t('overviewAnswerModes'))),
      h('section', { className: 'sz-library', 'aria-busy': loading },
        h('header', null, h('h2', null, t('overviewLibrary')), h('span', null, loading ? '…' : pending.length, ' ', t('overviewPending'))),
        h('nav', { 'aria-label': t('allTopics') }, tracks.map((track) =>
          h('button', { type: 'button', key: track.id, disabled: disabled || loading, onClick: () => onOpenBank(track.id) },
            h('span', null, track.title),
            h('span', { className: 'sz-library-count' }, loading ? '…' : pending.filter((item) => item.track === track.id).length, h(Icon, { name: 'arrowRight', size: 16 }))))),
        h('footer', null, h('button', { type: 'button', disabled, onClick: () => onNavigate('mastered') }, h(Icon, { name: 'check', size: 16 }),
          t('masteredPage'), h('span', null, loading ? '…' : items.length - pending.length)),
        h('button', { type: 'button', disabled, onClick: () => onOpenBank('all') }, t('overviewAllQuestions'), h(Icon, { name: 'arrowRight', size: 16 }))))),
    h('section', { className: 'sz-overview-paths', 'aria-label': t('studioPaths') },
      h('div', { className: 'sz-overview-section-heading' }, h('h2', null, t('studioPaths')), h('p', null, t('studioPathsIntro'))),
      h('div', { className: 'sz-overview-tools' },
        h('section', { className: 'sz-mock-entry' },
          h('div', { className: 'sz-mock-title' }, h(Icon, { name: 'microphone', size: 26 }), h('h3', null, t('mockPage'))),
          h('p', null, t('studioMock')),
          h('ol', { className: 'sz-interview-steps' }, ['overviewStepContext', 'overviewStepAnswer', 'overviewStepReview'].map((key) => h('li', { key }, t(key)))),
          h('div', { className: 'sz-mock-entry-footer' }, h('span', null, h(Icon, { name: 'clock', size: 16 }), t('overviewMockDefault')),
            h(Button, { disabled, onClick: () => onNavigate('mock') }, t('overviewPrepare'), h(Icon, { name: 'arrowRight', size: 16 })))),
        h('div', { className: 'sz-overview-secondary' }, [['targeted', 'targetedPage', 'studioTargeted', 'code'], ['revision', 'revisionPage', 'studioRevision', 'swap']].map(([page, title, description, icon]) =>
          h('button', { type: 'button', key: page, disabled, onClick: () => onNavigate(page) },
            h(Icon, { name: icon, size: 22 }), h('span', null, h('strong', null, t(title)), h('span', null, t(description))), h(Icon, { name: 'arrowRight', size: 18 }))))))
  )
}
