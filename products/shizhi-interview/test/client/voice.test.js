import test from 'node:test'
import assert from 'node:assert/strict'
import { BrowserVoice } from '../../src/client/shared/voice.js'
import { AudioRecording } from '../../src/client/shared/recording.js'

test('browser recognition keeps the existing draft and waits for explicit submission', () => {
  let recognizer
  class Recognition {
    constructor() { recognizer = this }
    start() { this.onstart() }
    stop() { this.onend() }
    abort() {}
  }
  const texts = [], states = []
  const voice = new BrowserVoice({ Recognition, onText: (text) => texts.push(text), onState: (state) => states.push(state), onError: assert.fail })
  voice.start('之前的回答')
  recognizer.onresult({ results: [Object.assign([{ transcript: 'Redis 是内存数据存储。' }], { isFinal: true })] })
  voice.stop()
  assert.equal(texts.at(-1), '之前的回答\nRedis 是内存数据存储。')
  assert.deepEqual(states, ['opening', 'recording', 'finishing', 'idle'])
  voice.dispose()
})

test('stopping recognition waits for its final result and ignores a second stop', () => {
  let recognizer, stops = 0
  class Recognition { constructor() { recognizer = this } start() {} stop() { stops++ } abort() {} }
  const states = [], texts = []
  const voice = new BrowserVoice({ Recognition, onText: (text) => texts.push(text), onState: (state) => states.push(state), onError: assert.fail })
  voice.start('已有文字')
  assert.equal(states.at(-1), 'opening')
  recognizer.onstart()
  voice.stop(); voice.stop()
  assert.equal(stops, 1)
  assert.equal(states.at(-1), 'finishing')
  recognizer.onresult({ results: [Object.assign([{ transcript: 'HTTP 不等于 HTTPS' }], { isFinal: true })] })
  recognizer.onend()
  assert.equal(texts.at(-1), '已有文字\nHTTP 不等于 HTTPS')
  assert.equal(states.at(-1), 'idle')
  assert.equal(recognizer.onresult, null)
})

test('recognition errors preserve confirmed text and reject late callbacks', () => {
  let recognizer, aborted = 0
  class Recognition { constructor() { recognizer = this } start() {} abort() { aborted++ } }
  const states = [], texts = [], errors = []
  const voice = new BrowserVoice({ Recognition, onText: (text) => texts.push(text), onState: (state) => states.push(state), onError: (error) => errors.push(error) })
  voice.start('原始草稿')
  recognizer.onstart()
  const lateResult = recognizer.onresult, lateEnd = recognizer.onend
  lateResult({ results: [Object.assign([{ transcript: '已确认' }], { isFinal: true }), Object.assign([{ transcript: '未确认' }], { isFinal: false })] })
  recognizer.onerror({ error: 'network' })
  assert.equal(states.at(-1), 'idle')
  assert.equal(texts.at(-1), '原始草稿\n已确认')
  const count = texts.length
  lateResult({ results: [[{ transcript: '晚到结果' }]] }); lateEnd()
  assert.equal(texts.length, count)
  assert.deepEqual(errors, ['network'])
  assert.equal(aborted, 1)
})

test('recognition constructor and start failures return to idle', () => {
  for (const Recognition of [class { constructor() { throw new Error('constructor failed') } }, class { start() { throw new Error('start failed') } abort() {} }]) {
    const states = [], errors = []
    const voice = new BrowserVoice({ Recognition, onText: () => {}, onState: (state) => states.push(state), onError: (error) => errors.push(error) })
    assert.doesNotThrow(() => voice.start('保留'))
    assert.equal(states.at(-1), 'idle')
    assert.equal(errors.length, 1)
    assert.equal(voice.recognition, null)
  }
})

test('an empty recording releases the microphone without uploading', async (context) => {
  let recorder, stopped = 0
  class Recorder {
    static isTypeSupported() { return true }
    constructor() { recorder = this; this.state = 'inactive' }
    start() { this.state = 'recording' }
    stop() { this.state = 'inactive' }
  }
  const errors = [], states = [], uploads = []
  const recording = new AudioRecording({ getUserMedia: async () => ({ getTracks: () => [{ stop() { stopped++ } }] }), Recorder,
    config: { maxSeconds: 180, maxBytes: 1000 }, upload: (...args) => { uploads.push(args); return '不应上传' }, onText: assert.fail, onState: (state) => states.push(state), onError: (error) => errors.push(error) })
  context.after(() => recording.dispose())
  await recording.start()
  recording.stop()
  await recorder.onstop()
  assert.equal(stopped, 1)
  assert.equal(states.at(-1), 'idle')
  assert.deepEqual(uploads, [])
  assert.match(errors[0].message, /没有录到音频/)
})

test('disposing recognition detaches callbacks and aborts the microphone session', () => {
  let recognizer, aborted = false
  class Recognition { constructor() { recognizer = this } start() {} abort() { aborted = true } }
  const voice = new BrowserVoice({ Recognition, onText: assert.fail, onState: () => {}, onError: assert.fail })
  voice.start()
  const lateResult = recognizer.onresult
  voice.dispose()
  lateResult({ results: [[{ transcript: '已取消的口述' }]] })
  assert.equal(aborted, true)
  assert.equal(recognizer.onresult, null)
  assert.equal(recognizer.onend, null)
})

test('recording failures release tracks even when the recorder rejects stop', async (context) => {
  let stopped = 0
  class Recorder {
    static isTypeSupported() { return true }
    constructor() { this.state = 'inactive' }
    start() { this.state = 'recording' }
    stop() { throw new Error('device lost') }
  }
  const states = [], errors = []
  const recording = new AudioRecording({ getUserMedia: async () => ({ getTracks: () => [{ stop() { stopped++ } }] }), Recorder,
    config: { maxSeconds: 180, maxBytes: 1000 }, upload: assert.fail, onText: assert.fail,
    onState: (state) => states.push(state), onError: (error) => errors.push(error) })
  context.after(() => recording.dispose())
  await recording.start()
  recording.stop()
  assert.equal(stopped, 1)
  assert.equal(states.at(-1), 'idle')
  assert.equal(errors[0].message, 'device lost')
})

test('oversize recording cancels upload and detaches a late recorder event', async (context) => {
  let recorder, stopped = 0
  class Recorder {
    static isTypeSupported() { return true }
    constructor() { recorder = this; this.state = 'inactive' }
    start() { this.state = 'recording' }
    stop() { this.state = 'inactive' }
  }
  const states = [], errors = []
  const recording = new AudioRecording({ getUserMedia: async () => ({ getTracks: () => [{ stop() { stopped++ } }] }), Recorder,
    config: { maxSeconds: 180, maxBytes: 2 }, upload: assert.fail, onText: assert.fail,
    onState: (state) => states.push(state), onError: (error) => errors.push(error) })
  context.after(() => recording.dispose())
  await recording.start()
  const lateStop = recorder.onstop
  recorder.ondataavailable({ data: new Blob(['too big']) })
  await lateStop()
  assert.equal(stopped, 1)
  assert.equal(states.at(-1), 'idle')
  assert.equal(errors.length, 1)
  assert.match(errors[0].message, /录音过大/)
})

test('recording reaches the configured duration limit before releasing audio for transcription', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  let recorder, stopped = 0, trackStops = 0
  class Recorder {
    static isTypeSupported() { return true }
    constructor() { recorder = this; this.state = 'inactive' }
    start() { this.state = 'recording' }
    stop() { this.state = 'inactive'; stopped++ }
  }
  const texts = []
  const recording = new AudioRecording({ getUserMedia: async () => ({ getTracks: () => [{ stop() { trackStops++ } }] }), Recorder,
    config: { maxSeconds: 3, maxBytes: 1000 }, upload: async () => '  Redis  ', onText: (text) => texts.push(text), onState: () => {}, onError: assert.fail })
  context.after(() => recording.dispose())
  await recording.start()
  recorder.ondataavailable({ data: new Blob(['audio']) })
  context.mock.timers.tick(2999)
  assert.equal(stopped, 0)
  context.mock.timers.tick(1)
  assert.equal(stopped, 1)
  await recorder.onstop()
  assert.equal(trackStops, 1)
  assert.deepEqual(texts, ['Redis'])
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

test('recording selects a format accepted by both the browser and configured provider', async (context) => {
  let selected
  class Recorder {
    static isTypeSupported(type) { return type !== 'audio/webm;codecs=opus' }
    constructor(stream, { mimeType }) { selected = mimeType; this.state = 'inactive' }
    start() { this.state = 'recording' }
    stop() { this.state = 'inactive' }
  }
  const recording = new AudioRecording({ getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }), Recorder,
    config: { maxSeconds: 180, maxBytes: 1000, mimeTypes: ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus'] },
    upload: assert.fail, onText: assert.fail, onState: () => {}, onError: assert.fail })
  context.after(() => recording.dispose())
  await recording.start()
  assert.equal(selected, 'audio/ogg;codecs=opus')
})

test('a browser with no provider-compatible recording format releases its microphone', async () => {
  let stopped = 0
  const errors = []
  class Recorder {
    static isTypeSupported(type) { return type === 'audio/mp4' }
    constructor() { assert.fail('MP4 must not reach the Qwen provider') }
  }
  const recording = new AudioRecording({ getUserMedia: async () => ({ getTracks: () => [{ stop() { stopped++ } }] }), Recorder,
    config: { maxSeconds: 180, maxBytes: 1000, mimeTypes: ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus'] },
    upload: assert.fail, onText: assert.fail, onState: () => {}, onError: (error) => errors.push(error) })
  await recording.start()
  assert.equal(stopped, 1)
  assert.match(errors[0].message, /不支持录音格式/)
})
