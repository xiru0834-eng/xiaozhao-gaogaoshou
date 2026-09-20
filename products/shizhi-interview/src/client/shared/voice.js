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
    const recognition = new this.Recognition()
    this.recognition = recognition
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      const text = Array.from(event.results, (result) => result[0].transcript).join('')
      this.onText(`${draft}${draft && text ? '\n' : ''}${text}`)
    }
    recognition.onerror = (event) => this.onError(event.error)
    recognition.onend = () => { this.recognition = null; this.onState('idle') }
    try { recognition.start(); this.onState('recording') } catch (error) {
      this.recognition = null
      this.onState('idle')
      this.onError(error.name)
    }
  }
  /** Requests the final transcript before the recognition session ends. */
  stop() { this.recognition?.stop() }
  /** Releases the microphone and prevents late callbacks from changing another draft. */
  dispose() {
    if (!this.recognition) return
    const recognition = this.recognition
    this.recognition = null
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognition.abort()
  }
}
