import React from 'react'
import { h, Button, ErrorNotice } from '../shared/ui.js'
import { BrowserVoice } from '../shared/voice.js'
import { AudioRecording } from '../shared/recording.js'
import { t } from '../shared/coach-locale.js'

/** Renders an explicitly started, cancellable browser speech-synthesis control.
 * @param {object} props Text to speak.
 * @returns {object} React element.
 */
export function SpeakButton({ text }) {
  const [speaking, setSpeaking] = React.useState(false)
  const [error, setError] = React.useState('')
  const utterance = React.useRef(null)
  React.useEffect(() => () => {
    if (utterance.current) { utterance.current.onend = null; utterance.current.onerror = null; window.speechSynthesis?.cancel() }
  }, [text])
  const toggle = () => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return setError(t('noPlayback'))
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    window.speechSynthesis.cancel()
    const speech = new window.SpeechSynthesisUtterance(text)
    speech.lang = 'zh-CN'
    speech.onend = () => setSpeaking(false)
    speech.onerror = () => { setSpeaking(false); setError(t('noPlayback')) }
    utterance.current = speech
    setError(''); setSpeaking(true); window.speechSynthesis.speak(speech)
  }
  return h(React.Fragment, null,
    h(Button, { onClick: toggle, 'aria-pressed': speaking }, speaking ? t('stopPlayback') : t('playback')),
    h(ErrorNotice, null, error))
}

/** Editable voice transcript and text submission; recording never submits an answer.
 * @param {object} props Draft, save callback and operation state.
 * @returns {object} React element.
 */
export function VoiceAnswer({ value, onChange, onSubmit, busy = false }) {
  const [state, setState] = React.useState('idle')
  const [error, setError] = React.useState('')
  const [config, setConfig] = React.useState(null)
  const voice = React.useRef(null)
  const beforeRecording = React.useRef('')
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
  React.useEffect(() => {
    const controller = new AbortController()
    fetch('/interview/api/voice', { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error(t('speechError'))
      return response.json()
    }).then(setConfig).catch((failure) => { if (failure.name !== 'AbortError') setConfig({ configured: false }) })
    return () => controller.abort()
  }, [])
  React.useEffect(() => () => { voice.current?.dispose() }, [])
  const start = () => {
    if (state !== 'idle') return
    window.speechSynthesis?.cancel()
    setError(''); beforeRecording.current = value
    if (config?.configured) {
      voice.current = new AudioRecording({
        getUserMedia: (options) => navigator.mediaDevices.getUserMedia(options), Recorder: window.MediaRecorder, config,
        onText: (text) => onChange(`${value}${value ? '\n' : ''}${text}`), onState: setState,
        onError: (failure) => setError(failure.name === 'NotAllowedError' ? t('permission') : failure.message),
        upload: async (blob, signal) => {
          const response = await fetch('/interview/api/voice', { method: 'POST', headers: { 'content-type': blob.type }, body: blob, signal })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error?.message || t('speechError'))
          return result.text
        },
      })
      void voice.current.start()
      return
    }
    if (!Recognition) return
    voice.current = new BrowserVoice({ Recognition, onText: onChange, onState: setState,
      onError: (code) => setError(t(code === 'not-allowed' || code === 'service-not-allowed' ? 'permission' : code === 'no-speech' ? 'noSpeech' : code === 'network' ? 'network' : 'speechError')) })
    voice.current.start(value)
  }
  const cancel = () => { voice.current?.dispose(); setState('idle'); onChange(beforeRecording.current) }
  return h('section', { className: 'sz-answer' },
    h('div', { className: 'sz-answer-heading' }, h('label', { htmlFor: 'sz-answer-draft' }, t('answer')),
      h('span', { role: 'status' }, state === 'recording' ? t('recording') : state !== 'idle' ? t('transcribing') : `${value.length} / 16000`)),
    h('textarea', { id: 'sz-answer-draft', className: 'sz-textarea', value, maxLength: 16000,
      readOnly: state !== 'idle' || busy, placeholder: t('placeholder'), onChange: (event) => onChange(event.target.value) }),
    h('p', { className: 'sz-hint' }, t('check')),
    h('div', { className: 'sz-answer-actions' },
      Recognition || config?.configured ? h(Button, { disabled: busy || (state !== 'idle' && state !== 'recording'), className: state === 'recording' ? 'sz-recording' : '', onClick: () => state === 'recording' ? voice.current?.stop() : start() }, state === 'recording' ? t('stop') : t('record')) : null,
      state !== 'idle' ? h(Button, { onClick: cancel }, t('cancel')) : null,
      h(Button, { tone: 'primary', disabled: busy || state !== 'idle' || !value.trim(), busy, onClick: onSubmit }, t('submit'))),
    h('p', { className: 'sz-hint' }, config?.configured ? `${t('providerPrivacy')} ${config.provider} · ${config.maxSeconds} ${t('seconds')}` : Recognition ? t('browserPrivacy') : t('noVoice')),
    h(ErrorNotice, null, error))
}
