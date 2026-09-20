import React from 'react'
import { h, Button, ErrorNotice } from '../shared/ui.js'
import { BrowserVoice } from '../shared/voice.js'
import { AudioRecording } from '../shared/recording.js'
import { t } from '../shared/coach-locale.js'

/** Renders an explicitly started, cancellable browser speech-synthesis control.
 * @param {object} props Text to speak.
 * @returns {object} React element.
 */
export function SpeakButton({ text, disabled = false }) {
  const [speaking, setSpeaking] = React.useState(false)
  const [error, setError] = React.useState('')
  const utterance = React.useRef(null)
  const stop = () => {
    if (utterance.current) { utterance.current.onend = null; utterance.current.onerror = null; utterance.current = null }
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }
  React.useEffect(() => () => {
    if (utterance.current) { utterance.current.onend = null; utterance.current.onerror = null; window.speechSynthesis?.cancel() }
  }, [text])
  const toggle = () => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return setError(t('noPlayback'))
    if (speaking) { stop(); return }
    window.speechSynthesis.cancel()
    const speech = new window.SpeechSynthesisUtterance(text)
    speech.lang = 'zh-CN'
    speech.onend = () => { if (utterance.current === speech) { utterance.current = null; setSpeaking(false) } }
    speech.onerror = (event) => {
      if (utterance.current !== speech) return
      utterance.current = null; setSpeaking(false)
      if (event.error !== 'interrupted' && event.error !== 'canceled') setError(t('noPlayback'))
    }
    utterance.current = speech
    setError(''); setSpeaking(true); window.speechSynthesis.speak(speech)
  }
  return h(React.Fragment, null,
    h(Button, { onClick: toggle, disabled, 'aria-pressed': speaking }, speaking ? t('stopPlayback') : t('playback')),
    h(ErrorNotice, null, error))
}

/** Editable voice transcript and text submission; recording never submits an answer.
 * @param {object} props Draft, save callback and operation state.
 * @returns {object} React element.
 */
export function VoiceAnswer({ value, onChange, onSubmit, onActiveChange, busy = false, submitLabel = t('submit') }) {
  const [state, setState] = React.useState('idle')
  const [error, setError] = React.useState('')
  const [config, setConfig] = React.useState(null)
  const [configError, setConfigError] = React.useState(false)
  const [configRequest, setConfigRequest] = React.useState(0)
  const [notice, setNotice] = React.useState('')
  const [elapsed, setElapsed] = React.useState(0)
  const voice = React.useRef(null)
  const active = React.useRef(false)
  const receivedText = React.useRef(false)
  const beforeRecording = React.useRef('')
  const draftId = React.useId()
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const keyMissing = config?.configured && config.ready === false
  React.useEffect(() => {
    const controller = new AbortController()
    setConfig(null); setConfigError(false)
    fetch('/interview/api/voice', { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error(t('speechError'))
      return response.json()
    }).then((result) => { if (!controller.signal.aborted) setConfig(result) })
      .catch(() => { if (!controller.signal.aborted) setConfigError(true) })
    return () => controller.abort()
  }, [configRequest])
  React.useEffect(() => () => { voice.current?.dispose(); onActiveChange?.(false) }, [onActiveChange])
  React.useEffect(() => {
    if (state !== 'recording') return undefined
    const started = performance.now()
    setElapsed(0)
    const timer = setInterval(() => setElapsed(Math.floor((performance.now() - started) / 1000)), 500)
    return () => clearInterval(timer)
  }, [state])
  const reportError = (failure) => {
    const code = typeof failure === 'string' ? failure : failure.name
    const key = { 'not-allowed': 'permission', 'service-not-allowed': 'permission', NotAllowedError: 'permission',
      'no-speech': 'noSpeech', network: 'network', 'audio-capture': 'noMicrophone', NotFoundError: 'noMicrophone',
      NotReadableError: 'microphoneBusy', SecurityError: 'permission' }[code]
    setNotice(''); setError(key ? t(key) : failure.message || t('speechError'))
  }
  const onState = (next) => {
    active.current = next !== 'idle'
    onActiveChange?.(active.current)
    setState(next)
    if (next === 'idle' && receivedText.current) setNotice(t('voiceReady'))
  }
  const onText = (text) => { receivedText.current = text !== beforeRecording.current; onChange(text) }
  const start = () => {
    if (active.current || busy || !config || keyMissing) return
    if (config.configured && (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)) {
      setError(t('noRecordingFormat')); return
    }
    voice.current?.dispose()
    window.speechSynthesis?.cancel()
    setError(''); setNotice(''); receivedText.current = false; beforeRecording.current = value
    if (config?.configured) {
      voice.current = new AudioRecording({
        getUserMedia: (options) => navigator.mediaDevices.getUserMedia(options), Recorder: window.MediaRecorder, config,
        onText: (text) => onText(`${value}${value ? '\n' : ''}${text}`), onState,
        onError: reportError,
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
    voice.current = new BrowserVoice({ Recognition, onText, onState, onError: reportError })
    voice.current.start(value)
  }
  const cancel = () => {
    voice.current?.dispose(); voice.current = null; active.current = false
    onActiveChange?.(false)
    setState('idle'); onChange(beforeRecording.current); setError(''); setNotice(t('voiceCancelled'))
  }
  const tooLong = value.length > 16000
  const time = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
  return h('section', { className: 'sz-answer' },
    h('div', { className: 'sz-answer-heading' }, h('label', { htmlFor: draftId }, t('answer')),
      h('span', { role: 'status' }, state !== 'idle' ? t(state) : `${value.length} / 16000`),
      state === 'recording' ? h('span', { className: 'sz-recording-time', 'aria-hidden': true }, time) : null),
    h('textarea', { id: draftId, className: 'sz-textarea', value, maxLength: 16000, 'aria-invalid': tooLong,
      readOnly: state !== 'idle' || busy, placeholder: t('placeholder'), onChange: (event) => { setNotice(''); onChange(event.target.value) } }),
    h('p', { className: 'sz-hint' }, t('check')),
    h('div', { className: 'sz-answer-actions' },
      Recognition || config?.configured ? h(Button, { disabled: busy || !config || keyMissing || (state !== 'idle' && state !== 'recording'), className: state === 'recording' ? 'sz-recording' : '', onClick: () => state === 'recording' ? voice.current?.stop() : start() }, state === 'recording' ? t('stop') : t('record')) : null,
      state !== 'idle' ? h(Button, { onClick: cancel }, t('cancel')) : null,
      configError ? h(Button, { onClick: () => setConfigRequest((request) => request + 1) }, t('voiceRetry')) : null,
      h(Button, { tone: 'primary', disabled: busy || state !== 'idle' || !value.trim() || tooLong, busy, onClick: () => { if (!active.current && !busy && !tooLong && value.trim()) onSubmit() } }, submitLabel)),
    h('p', { className: 'sz-hint' }, configError ? t('voiceConfigError') : !config ? t('voiceLoading') : config.configured ? `${t('providerPrivacy')} ${config.provider} · ${config.maxSeconds} ${t('seconds')}` : Recognition ? t('browserPrivacy') : t('noVoice')),
    keyMissing ? h('p', { className: 'sz-notice', role: 'status' }, t('voiceKeyMissing')) : null,
    notice ? h('p', { className: 'sz-hint', role: 'status' }, notice) : null,
    h(ErrorNotice, null, tooLong ? t('answerTooLong') : error))
}
