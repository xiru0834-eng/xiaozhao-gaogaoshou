/** Built-in practice directions with a browsable agent-engineering question bank. */
import { COACH_TRACKS } from '../../domain/coach-catalog.js'
import { h, Button } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'

/** Starts an independent practice from the first question or a selected bank question.
 * @param {object} props Operation state and practice-start callback.
 * @returns {object} Catalog and grouped question picker.
 */
export function CoachCatalog({ disabled, onStart }) {
  const total = COACH_TRACKS.reduce((sum, track) => sum + track.questions.length, 0)
  return h('section', { className: 'sz-catalog' },
    h('div', { className: 'sz-section-heading' }, h('h2', null, t('catalog')), h('span', null, total, ' ', t('catalogHint'))),
    COACH_TRACKS.filter((track) => track.sections).map((track) => h('article', { key: track.id, className: 'sz-question-bank' },
      h('header', null, h('div', null, h('h3', null, track.title), h('p', null, track.subtitle), h('p', { className: 'sz-hint' }, t('agentBankHint'))),
        h(Button, { tone: 'primary', disabled, 'aria-label': `${t('start')} · ${track.title}`, onClick: () => onStart({ track: track.id }) }, t('start'), ' · ', track.questions.length, ' ', t('questions'))),
      h('details', null, h('summary', null, t('browseQuestions')),
        track.sections.map((section) => h('section', { key: section.title }, h('h4', null, section.title),
          h('ol', { className: 'sz-bank-questions' }, section.questions.map(([prompt]) => {
            const questionIndex = track.questions.findIndex((question) => question[0] === prompt)
            return h('li', { key: prompt }, h('button', { type: 'button', disabled,
              'aria-label': `${t('startHere')} · ${prompt}`, onClick: () => onStart({ track: track.id, questionIndex }) },
            h('span', { className: 'sz-bank-number', 'aria-hidden': true }, String(questionIndex + 1).padStart(2, '0')),
            h('span', null, prompt)))
          }))))))),
    h('div', { className: 'sz-tracks' }, COACH_TRACKS.filter((track) => !track.sections).map((track, index) => h('button', {
      type: 'button', key: track.id, className: `sz-track sz-track-${track.id}`, disabled,
      onClick: () => onStart({ track: track.id }), 'aria-label': `${t('start')} · ${track.title}`,
    }, h('div', { className: 'sz-track-top' }, h('span', null, track.icon), h('span', null, `${String(index + 1).padStart(2, '0')} ↗`)),
    h('h3', null, track.title), h('p', null, track.subtitle), h('span', null, track.questions.length, ' ', t('questions'))))))
}
