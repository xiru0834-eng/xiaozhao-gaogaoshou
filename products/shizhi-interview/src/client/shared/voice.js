/** Owns one browser recognition session and detaches callbacks on disposal. */
export class BrowserVoice {
  /** @param {object} options Browser constructor and transcript/status callbacks. */
  constructor({ Recognition, onText, onState, onError }) {
    this.Recognition = Recognition
    this.onText = onText
    this.onState = onState
    this.onError = onError
    this.recognition = null
  }
  /** Starts a new recording; transcript updates include the existing draft.
   * @param {string} draft Text that precedes the new utterance.
   */
  start(draft = '') {
    if (this.recognition) return
    this.stopping = false
    this.onState('opening')
    let confirmed = ''
    const append = (text) => `${draft}${draft && text ? '\n' : ''}${text}`
    try {
      const recognition = new this.Recognition()
      this.recognition = recognition
      recognition.lang = 'zh-CN'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onstart = () => { if (this.recognition === recognition && !this.stopping) this.onState('recording') }
      recognition.onresult = (event) => {
        if (this.recognition !== recognition) return
        const results = Array.from(event.results)
        confirmed = results.filter((result) => result.isFinal).map((result) => result[0].transcript).join('')
        this.onText(append(results.map((result) => result[0].transcript).join('')))
      }
      recognition.onerror = (event) => {
        if (this.recognition !== recognition) return
        this.dispose()
        this.onText(append(confirmed))
        this.onState('idle')
        this.onError(event.error)
      }
      recognition.onend = () => {
        if (this.recognition !== recognition) return
        this.detach()
        this.onText(append(confirmed))
        this.onState('idle')
        if (!confirmed.trim()) this.onError('no-speech')
      }
      recognition.start()
    } catch (error) {
      this.dispose()
      this.onState('idle')
      this.onError(error.name)
    }
  }
  /** Requests the final transcript before the recognition session ends. */
  stop() {
    if (!this.recognition || this.stopping) return
    this.stopping = true
    this.onState('finishing')
    try { this.recognition.stop() } catch (error) {
      this.dispose(); this.onState('idle'); this.onError(error.name)
    }
  }
  /** Detaches all callbacks before releasing an ended or cancelled recognizer.
   * @returns {object|null} Previously owned browser recognizer.
   */
  detach() {
    const recognition = this.recognition
    this.recognition = null
    if (!recognition) return null
    recognition.onstart = null
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    return recognition
  }
  /** Releases the microphone and prevents late callbacks from changing another draft. */
  dispose() {
    const recognition = this.detach()
    if (!recognition) return
    try { recognition.abort() } catch (error) { /* Browsers can reject abort after a failed start; callbacks are already detached. */ }
  }
}
