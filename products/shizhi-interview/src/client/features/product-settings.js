/** Common product settings, with framework tools available through an advanced entry. */
import React from 'react'
import { h, Button, ErrorNotice } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'
import { flushAnswerDrafts } from '../shared/answer-draft.js'
import { interviewApi } from '../shared/api.js'

export function ProductSettings({ renderSlot, theme }) {
  const dialog = React.useRef(null), trigger = React.useRef(null), advanced = React.useRef(null)
  const [tab, setTab] = React.useState('model'), [status, setStatus] = React.useState(null)
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(''), [notice, setNotice] = React.useState('')
  const [password, setPassword] = React.useState(''), [confirmation, setConfirmation] = React.useState('')
  const [deepseekKey, setDeepseekKey] = React.useState(''), [qwenKey, setQwenKey] = React.useState('')
  const [clearModel, setClearModel] = React.useState(false), [clearVoice, setClearVoice] = React.useState(false)
  const [mode, setMode] = React.useState(theme?.getTheme().preference || 'light')
  const desktop = window.shizhiDesktop
  async function open() {
    setMode(theme?.getTheme().preference || 'light')
    setError(''); setNotice(''); dialog.current.showModal()
    if (desktop) { try { setStatus(await desktop.status()) } catch (failure) { setError(failure.message) } }
  }
  async function perform(action) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      await flushAnswerDrafts()
      let input = { deepseekKey, qwenKey, cleardeepseekKey: clearModel, clearqwenKey: clearVoice }
      if (action !== 'configure') {
        if (password.length < 10) throw new Error(t('backupPasswordHint'))
        if (action === 'backup' && password !== confirmation) throw new Error(t('backupPasswordMismatch'))
        const preferences = {}
        for (const key of ['qiuzhao-appearance-v1', 'qiuzhao-theme']) {
          try { preferences[key] = localStorage.getItem(key) } catch (failure) { /* Theme settings in the data home remain included. */ }
        }
        input = { password, preferences }
      }
      const result = await desktop[action](input)
      if (result.error) throw new Error(result.error)
      if (!result.cancelled) { setPassword(''); setConfirmation(''); setDeepseekKey(''); setQwenKey(''); setNotice(t('settingsSaved')) }
    } catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  const openAdvanced = () => { dialog.current.close(); advanced.current?.querySelector('button')?.click() }
  const field = (label, value, change, hint) => h('label', { className: 'sz-settings-field' }, h('span', null, label),
    h('input', { type: 'password', autoComplete: 'new-password', value, disabled: busy, onChange: (event) => change(event.target.value) }), h('small', null, hint))
  return h(React.Fragment, null,
    h('button', { type: 'button', ref: trigger, className: 'sz-open-settings', 'aria-haspopup': 'dialog', 'aria-label': t('productSettings'), onClick: open },
      h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, 'aria-hidden': true },
        h('path', { d: 'm9 3-1 3-3 1v4l-2 1 2 2v3l3 1 1 3h6l1-3 3-1v-3l2-2-2-1V7l-3-1-1-3Z' }), h('circle', { cx: 12, cy: 12, r: 3 }))),
    h('div', { ref: advanced, className: 'sz-advanced-trigger' }, renderSlot('sidebar.settings', { wide: false })),
    h('dialog', { ref: dialog, className: 'sz-settings-dialog', 'aria-labelledby': 'sz-settings-title', onCancel: (event) => { if (busy) event.preventDefault() },
      onClose: () => { setPassword(''); setConfirmation(''); setDeepseekKey(''); setQwenKey(''); trigger.current?.focus() } },
      h('header', null, h('div', null, h('h2', { id: 'sz-settings-title' }, t('productSettings')), h('p', null, t('settingsIntro'))),
        h(Button, { disabled: busy, onClick: () => dialog.current.close(), 'aria-label': t('closeSettings') }, '×')),
      h('nav', { 'aria-label': t('productSettings') }, [['model', 'settingsModel'], ['appearance', 'settingsAppearance'], ['data', 'settingsData'], ['advanced', 'settingsAdvanced']].map(([id, label]) =>
        h('button', { type: 'button', key: id, disabled: busy, 'aria-pressed': tab === id, onClick: () => { setTab(id); setError('') } }, t(label)))),
      h('div', { className: 'sz-settings-content', 'aria-busy': busy },
        tab === 'model' ? h('section', null, desktop ? h(React.Fragment, null,
          field(t('deepseekLabel'), deepseekKey, setDeepseekKey, t(status?.deepseek ? 'keyConfigured' : 'keyMissing')),
          h('label', { className: 'sz-settings-check' }, h('input', { type: 'checkbox', checked: clearModel, disabled: busy, onChange: (event) => setClearModel(event.target.checked) }), t('removeModelKey')),
          field(t('qwenLabel'), qwenKey, setQwenKey, t(status?.qwen ? 'keyConfigured' : 'keyMissing')),
          h('label', { className: 'sz-settings-check' }, h('input', { type: 'checkbox', checked: clearVoice, disabled: busy, onChange: (event) => setClearVoice(event.target.checked) }), t('removeVoiceKey')),
          h('p', { className: 'sz-hint' }, t('settingsRestartHint')), h(Button, { tone: 'primary', disabled: busy || !status, onClick: () => perform('configure') }, t('saveSettingsRestart')))
          : h(React.Fragment, null, h('p', null, t('webSettingsHint')), h(Button, { onClick: openAdvanced }, t('openAdvanced'))),
          h('hr'), h('p', null, t('careerModelHint')), h(Button, { disabled: busy, onClick: () => { dialog.current.close(); interviewApi.navigateWorkspace('models') } }, t('careerModelSettings'))) : null,
        tab === 'appearance' ? h('section', null, h('h3', null, t('settingsAppearance')), h('p', null, t('globalThemeHint')),
          h('div', { className: 'sz-theme-options' }, [['light', 'lightTheme'], ['dark', 'darkTheme'], ['system', 'systemTheme']].map(([id, label]) =>
            h(Button, { key: id, 'aria-pressed': mode === id, onClick: () => { theme.setTheme(id); setMode(id) } }, t(label))))) : null,
        tab === 'data' ? h('section', null, h('h3', null, t('completeBackup')), h('p', null, t('backupScope')),
          desktop ? h(React.Fragment, null,
            field(t('backupPassword'), password, setPassword, t('backupPasswordHint')),
            field(t('backupPasswordConfirm'), confirmation, setConfirmation, t('backupConfirmHint')),
            h('p', { className: 'sz-hint' }, t('backupRestartHint')),
            h('div', { className: 'sz-settings-actions' }, h(Button, { tone: 'primary', disabled: busy, onClick: () => perform('backup') }, t('exportComplete')),
              h(Button, { disabled: busy, onClick: () => perform('restore') }, t('restoreComplete')),
              h(Button, { disabled: busy, onClick: () => desktop.openData().catch((failure) => setError(failure.message)) }, t('openDataDirectory'))))
          : h('p', null, t('desktopBackupHint'))) : null,
        tab === 'advanced' ? h('section', null, h('h3', null, t('settingsAdvanced')), h('p', null, t('advancedHint')),
          h(Button, { onClick: openAdvanced }, t('openAdvanced'))) : null,
        busy ? h('p', { role: 'status' }, t('settingsWorking')) : null,
        h(ErrorNotice, null, error), notice ? h('p', { role: 'status' }, notice) : null)))
}
