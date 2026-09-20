import test from 'node:test'
import assert from 'node:assert/strict'
import { BrowserVoice } from '../../src/client/shared/voice.js'
import { AudioRecording } from '../../src/client/shared/recording.js'

test('browser recognition keeps the existing draft and waits for explicit submission', () => {
  let recognizer
  class Recognition {
    constructor() { recognizer = this }
    start() {}
    stop() { this.onend() }
    abort() {}
  }
  const texts = [], states = []
  const voice = new BrowserVoice({ Recognition, onText: (text) => texts.push(text), onState: (state) => states.push(state), onError: assert.fail })
  voice.start('之前的回答')
  recognizer.onresult({ results: [[{ transcript: 'Redis 是内存数据存储。' }]] })
  voice.stop()
  assert.deepEqual(texts, ['之前的回答\nRedis 是内存数据存储。'])
  assert.deepEqual(states, ['recording', 'idle'])
  voice.dispose()
})

test('disposing recognition detaches callbacks and aborts the microphone session', () => {
  let recognizer, aborted = false
  class Recognition { constructor() { recognizer = this } start() {} abort() { aborted = true } }
  const voice = new BrowserVoice({ Recognition, onText: assert.fail, onState: () => {}, onError: assert.fail })
  voice.start()
  voice.dispose()
  assert.equal(aborted, true)
  assert.equal(recognizer.onresult, null)
  assert.equal(recognizer.onend, null)
})

test('permission resolving after cancellation releases its tracks without recording', async () => {
  let resolveMedia
  const media = new Promise((resolve) => { resolveMedia = resolve })
  let stopped = 0
  const recording = new AudioRecording({ getUserMedia: () => media, Recorder: class { constructor() { assert.fail('must not record') } },
    config: { maxSeconds: 180, maxBytes: 1000 }, upload: assert.fail, onText: assert.fail, onState: () => {}, onError: assert.fail })
  const start = recording.start()
  recording.dispose()
  resolveMedia({ getTracks: () => [{ stop() { stopped++ } }] })
  await start
  assert.equal(stopped, 1)
})

test('a transcript arriving after upload cancellation never changes the draft', async () => {
  let recorder, resolveUpload
  const upload = new Promise((resolve) => { resolveUpload = resolve })
  let tracksStopped = 0
  class Recorder {
    static isTypeSupported() { return true }
    constructor() { recorder = this; this.state = 'inactive' }
    start() { this.state = 'recording' }
    stop() { this.state = 'inactive' }
  }
  const recording = new AudioRecording({ getUserMedia: async () => ({ getTracks: () => [{ stop() { tracksStopped++ } }] }), Recorder,
    config: { maxSeconds: 180, maxBytes: 1000 }, upload: () => upload, onText: assert.fail, onState: () => {}, onError: assert.fail })
  await recording.start()
  recorder.ondataavailable({ data: new Blob(['audio']) })
  recording.stop()
  const completion = recorder.onstop()
  recording.dispose()
  resolveUpload('晚到的转写')
  await completion
  assert.equal(tracksStopped, 1)
})
