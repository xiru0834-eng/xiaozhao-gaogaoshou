/** Explicit settings for targeted practice and timed mock interviews. */
import React from 'react'
import { h, Button } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'

/** Collects user-supplied job and project context before any model request.
 * @param {object} props Selected company role, operation state and start callback.
 * @returns {object} Expandable preparation form.
 */
export function CoachPreparation({ targetRole = '', busy, onStart }) {
  const [role, setRole] = React.useState(targetRole)
  const [job, setJob] = React.useState('')
  const [project, setProject] = React.useState('')
  const [duration, setDuration] = React.useState(15)
  const [limit, setLimit] = React.useState(6)
  const [difficulty, setDifficulty] = React.useState('junior')
  const [style, setStyle] = React.useState(t('professionalStyle'))
  const id = React.useId()
  React.useEffect(() => { setRole(targetRole) }, [targetRole])
  const preparation = { targetRole: role, jobDescription: job, projectExperience: project }
  const field = (key, value, setter, maxLength, multiline) => h('label', { htmlFor: `${id}-${key}` }, t(key),
    h(multiline ? 'textarea' : 'input', { id: `${id}-${key}`, className: multiline ? 'sz-textarea' : 'di-input',
      value, maxLength, disabled: busy, placeholder: t(`${key}Placeholder`), onChange: (event) => setter(event.target.value) }))
  const select = (key, value, setter, options) => h('label', { htmlFor: `${id}-${key}` }, t(key),
    h('select', { id: `${id}-${key}`, value, disabled: busy, onChange: (event) => setter(event.target.value) },
      options.map(([item, label]) => h('option', { key: item, value: item }, label))))
  const valid = role.trim() && (job.trim() || project.trim())
  return h('details', { className: 'sz-preparation' }, h('summary', null, t('preparationTitle')),
    h('p', { className: 'sz-hint' }, t('preparationHint')),
    h('div', { className: 'sz-preparation-fields' }, field('prepRole', role, setRole, 200),
      field('prepJob', job, setJob, 12000, true), field('prepProject', project, setProject, 12000, true)),
    h(Button, { disabled: busy || !valid, onClick: () => onStart({ kind: 'targeted', preparation, targetRole: role }) }, t('targetedStart')),
    h('h3', null, t('mockTitle')),
    h('div', { className: 'sz-settings-row' },
      select('mockDuration', duration, (value) => setDuration(Number(value)), [10, 15, 20].map((value) => [value, `${value} ${t('minutes')}`])),
      select('mockLimit', limit, (value) => setLimit(Number(value)), [4, 6, 8].map((value) => [value, `${value} ${t('questions')}`])),
      select('mockDifficulty', difficulty, setDifficulty, ['junior', 'intermediate', 'senior'].map((value) => [value, t(value)])),
      select('mockStyle', style, setStyle, [t('professionalStyle'), t('friendlyStyle')].map((value) => [value, value]))),
    h('p', { className: 'sz-hint' }, t('mockSetupHint')),
    h(Button, { tone: 'primary', disabled: busy || !valid || !project.trim(), onClick: () => onStart({ kind: 'mock', preparation,
      targetRole: role, durationMinutes: duration, questionLimit: limit, difficulty, interviewerStyle: style }) }, t('mockStart')))
}
