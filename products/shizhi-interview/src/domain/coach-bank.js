/** Personal question bank built from the catalog, saved interviews and mastery choices. */
import { COACH_TRACKS } from './coach-catalog.js'

/** Identifies the same question across practices without depending on a practice ID.
 * @param {string} prompt Saved question text.
 * @returns {string} Whitespace-normalized question identifier.
 */
export function coachQuestionKey(prompt) { return prompt.trim().replace(/\s+/g, ' ') }

/** Combines fixed and personal questions without inferring mastery from model scores.
 * @param {object[]} practices Saved practices, newest first.
 * @param {object[]} states Explicit mastery choices, including restored questions.
 * @returns {object[]} Unique questions with topic, section and mastery state.
 */
export function buildCoachBank(practices, states) {
  const items = new Map()
  for (const track of COACH_TRACKS) for (const [index, [prompt]] of track.questions.entries()) {
    const key = coachQuestionKey(prompt)
    const section = track.sections?.find((group) => group.questions.some(([text]) => text === prompt))?.title || ''
    items.set(key, { key, prompt, topic: `拾知 · ${track.title}`, track: track.id, questionIndex: index, section, mastered: false })
  }
  for (const practice of practices) {
    if (!practice.config.coach || practice.mode === 'leetcode') continue
    for (const question of practice.questions) {
      const key = coachQuestionKey(question.prompt)
      if (!items.has(key)) items.set(key, { key, prompt: question.prompt, topic: practice.config.topic || practice.topic,
        track: 'personal', section: '', mastered: false })
    }
  }
  for (const state of states) {
    const existing = items.get(state.key) || { key: state.key, prompt: state.prompt, topic: state.topic, track: 'personal', section: '' }
    items.set(state.key, { ...existing, mastered: state.mastered, updatedAt: state.updatedAt })
  }
  return [...items.values()]
}
