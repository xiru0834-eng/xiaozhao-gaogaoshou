/** Captures one bounded recording and stops all media tracks on every terminal path. */
export class AudioRecording {
  /** @param {object} options Media APIs, limits, upload and UI callbacks. */
  constructor({ getUserMedia, Recorder, config, upload, onText, onState, onError }) {
    Object.assign(this, { getUserMedia, Recorder, config, upload, onText, onState, onError })
    this.cancelled = false
    this.stream = null
    this.recorder = null
    this.timer = null
    this.controller = new AbortController()
  }
  /** Opens the microphone and begins collecting encoded audio. */
  async start() {
    this.onState('opening')
    try {
      const stream = await this.getUserMedia({ audio: true })
      if (this.cancelled) { stream.getTracks().forEach((track) => track.stop()); return }
      this.stream = stream
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find((type) => this.Recorder.isTypeSupported(type))
      if (!mimeType) throw new Error('当前浏览器不支持录音格式，请改用文字作答')
      const recorder = new this.Recorder(stream, { mimeType })
      this.recorder = recorder
      let size = 0
      const chunks = []
      recorder.ondataavailable = (event) => {
        if (this.cancelled || !event.data.size) return
        size += event.data.size
        if (size > this.config.maxBytes) { this.fail(new Error('录音过大，请缩短后重试')); return }
        chunks.push(event.data)
      }
      recorder.onerror = () => this.fail(new Error('录音失败，请重试或直接输入'))
      recorder.onstop = async () => {
        this.release()
        if (this.cancelled) return
        this.onState('transcribing')
        try {
          const text = await this.upload(new Blob(chunks, { type: mimeType }), this.controller.signal)
          if (!this.cancelled) this.onText(text)
        } catch (error) { if (!this.cancelled) this.onError(error) }
        finally { if (!this.cancelled) this.onState('idle') }
      }
      recorder.start(1000)
      this.onState('recording')
      this.timer = setTimeout(() => this.stop(), this.config.maxSeconds * 1000)
    } catch (error) { if (!this.cancelled) this.fail(error) }
  }
  /** Ends collection and lets the final data event reach the transcription request. */
  stop() {
    if (this.recorder?.state === 'recording') { this.onState('transcribing'); this.recorder.stop() }
  }
  /** Releases microphone tracks and the duration timer. */
  release() { clearTimeout(this.timer); this.stream?.getTracks().forEach((track) => track.stop()); this.stream = null }
  /** Cancels audio upload and discards late permission or transcript results. */
  dispose() {
    this.cancelled = true
    this.controller.abort()
    if (this.recorder) {
      this.recorder.ondataavailable = null; this.recorder.onstop = null; this.recorder.onerror = null
      if (this.recorder.state !== 'inactive') this.recorder.stop()
    }
    this.release()
  }
  /** Stops a failed operation and reports a recoverable error.
   * @param {Error} error Recording failure.
   */
  fail(error) { this.dispose(); this.onError(error); this.onState('idle') }
}
