/** Form controls preserve preparation drafts while navigating between coach pages. */
import React from 'react'
import { h, Button, Icon } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'

/** Collects job and project context and focuses the first incomplete field on submission.
 * @param {object} props Selected company role, operation state and start callback.
 * @returns {object} Form for one selected practice mode.
 */
export function CoachPreparation({ targetRole = '', busy, pending, onStart, kind }) {
  const [role, setRole] = React.useState(targetRole)
  const [job, setJob] = React.useState('')
  const [project, setProject] = React.useState('')
  const [duration, setDuration] = React.useState(15)
  const [limit, setLimit] = React.useState(6)
  const [difficulty, setDifficulty] = React.useState('junior')
  const [style, setStyle] = React.useState(t('professionalStyle'))
  const [submitted, setSubmitted] = React.useState(false)
  const id = React.useId()
  React.useEffect(() => { setRole(targetRole) }, [targetRole])
  const mock = kind === 'mock'
  const errors = {
    prepRole: role.trim() ? '' : t('roleRequired'),
    prepProject: mock ? project.trim() ? '' : t('projectRequired') : job.trim() || project.trim() ? '' : t('contextRequired'),
  }
  const field = (key, value, setter, maxLength, multiline, required = false) => {
    const error = submitted && errors[key]
    return h('div', { className: `sz-field sz-field-${key}` },
      h('label', { htmlFor: `${id}-${key}` }, t(key), required ? h('span', { className: 'sz-required' }, t('required')) : null),
      h(multiline ? 'textarea' : 'input', { id: `${id}-${key}`, name: key, autoComplete: 'off',
        className: multiline ? 'sz-textarea' : 'di-input', value, maxLength, required, disabled: busy,
        'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-${key}-error` : undefined,
        placeholder: t(`${key}Placeholder`), onChange: (event) => setter(event.target.value) }),
      error ? h('p', { id: `${id}-${key}-error`, className: 'sz-field-error', role: 'alert' }, error) : null)
  }
  const segmented = (key, value, setter, options) => h('fieldset', { className: 'sz-segment-field', disabled: busy },
    h('legend', null, t(key)), h('div', { className: 'sz-segment-options' }, options.map(([item, label]) =>
      h('label', { key: item }, h('input', { type: 'radio', name: `${id}-${key}`, value: item,
        checked: value === item, onChange: () => setter(item) }), h('span', null, label)))))
  function submit(event) {
    event.preventDefault()
    if (busy) return
    setSubmitted(true)
    const firstError = Object.keys(errors).find((key) => errors[key])
    if (firstError) { event.currentTarget.elements.namedItem(firstError)?.focus(); return }
    onStart({ kind, preparation: { targetRole: role, jobDescription: job, projectExperience: project }, targetRole: role,
      ...(mock ? { durationMinutes: duration, questionLimit: limit, difficulty, interviewerStyle: style } : {}) })
  }
  return h('section', { className: 'sz-preparation sz-preparation-page' },
    h('header', { className: 'sz-preparation-header' },
      h('span', { className: 'sz-preparation-icon' }, h(Icon, { name: mock ? 'microphone' : 'code', size: 24 })),
      h('h2', null, t(mock ? 'mockPage' : 'targetedPage')),
      h('p', null, t(mock ? 'mockDescription' : 'targetedDescription'))),
    h('form', { onSubmit: submit, noValidate: true },
      h('div', { className: 'sz-preparation-fields' },
        field('prepRole', role, setRole, 200, false, true),
        field('prepJob', job, setJob, 12000, true), field('prepProject', project, setProject, 12000, true, mock)),
      mock ? h('div', { className: 'sz-settings-row' },
        segmented('mockDuration', duration, setDuration, [10, 15, 20].map((value) => [value, `${value} ${t('minutes')}`])),
        segmented('mockLimit', limit, setLimit, [4, 6, 8].map((value) => [value, `${value} ${t('questions')}`])),
        segmented('mockDifficulty', difficulty, setDifficulty, ['junior', 'intermediate', 'senior'].map((value) => [value, t(value)])),
        h('div', { className: 'sz-field' }, h('label', { htmlFor: `${id}-style` }, t('mockStyle')),
          h('select', { id: `${id}-style`, name: 'interviewer-style', value: style, disabled: busy, onChange: (event) => setStyle(event.target.value) },
            [t('professionalStyle'), t('friendlyStyle')].map((value) => h('option', { key: value, value }, value))))) : null,
      mock ? h('details', { className: 'sz-setup-details' }, h('summary', null, t('mockRules')), h('p', null, t('mockSetupHint'))) : null,
      h('footer', { className: 'sz-preparation-footer' },
        h('p', { className: 'sz-hint' }, t('preparationHint')),
        h(Button, { type: 'submit', tone: 'primary', disabled: busy, busy: pending }, h(Icon, { name: mock ? 'microphone' : 'play' }), t(mock ? 'mockStart' : 'targetedStart')))))
}
