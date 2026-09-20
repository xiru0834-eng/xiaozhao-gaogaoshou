import { assertDomain } from '../../domain/errors.js'
import { ATOMIC_BUSINESS_TOOL_NAMES } from './atomic-tool-definitions.js'
import { PRESENTATION_TOOL_NAMES } from './presentation-tool-definitions.js'
import { coachTrack } from '../../domain/coach-catalog.js'

const COMMON_TOOLS = Object.freeze([
  'interview_session',
  'interview_practice',
  'interview_show_practice_setup',
  'interview_show_practice_list',
  'interview_show_practice',
  'interview_show_insights',
  'interview_show_leetcode_catalog',
])

const SUMMARY_TOOLS = Object.freeze(['interview_show_summary'])

const QUESTION_TOOLS = Object.freeze([
  'interview_question',
  'interview_attempt',
  'interview_show_question',
])

const COACHING_TOOLS = Object.freeze([
  'interview_evaluation',
  'interview_explanation',
  'interview_show_review',
])

const MODE_TOOL_NAMES = Object.freeze({
  none: Object.freeze([...COMMON_TOOLS, ...SUMMARY_TOOLS]),
  mock: Object.freeze([...COMMON_TOOLS, ...QUESTION_TOOLS]),
  bagu: Object.freeze([...COMMON_TOOLS, ...QUESTION_TOOLS, ...COACHING_TOOLS, ...SUMMARY_TOOLS]),
  resume_drill: Object.freeze([...COMMON_TOOLS, ...QUESTION_TOOLS, ...COACHING_TOOLS, ...SUMMARY_TOOLS]),
  scenario: Object.freeze([...COMMON_TOOLS, ...QUESTION_TOOLS, ...COACHING_TOOLS, ...SUMMARY_TOOLS]),
  leetcode: Object.freeze([...COMMON_TOOLS, ...QUESTION_TOOLS, ...COACHING_TOOLS, ...SUMMARY_TOOLS, 'interview_leetcode']),
})

const PLUGIN_TOOL_NAMES = Object.freeze([
  ...ATOMIC_BUSINESS_TOOL_NAMES,
  ...PRESENTATION_TOOL_NAMES,
])

export function toolNamesForMode(mode = null) {
  const names = MODE_TOOL_NAMES[mode || 'none']
  assertDomain(names, 'INVALID_MODE', `不支持的面试模式：${String(mode)}`)
  return [...names]
}

export function deniedToolNamesForMode(mode = null) {
  const allowed = new Set(toolNamesForMode(mode))
  return PLUGIN_TOOL_NAMES.filter((name) => !allowed.has(name))
}

function restrictPluginTools(agent, mode, coach = false) {
  if (coach) return agent.ctx.tools.restrict({ allow: toolNamesForMode(mode) })
  const denied = deniedToolNamesForMode(mode)
  return denied.length === 0 ? null : agent.ctx.tools.restrict({ deny: denied })
}

export class ModeToolCatalog {
  constructor({ context, application }) {
    this.context = context
    this.application = application
    this.scopes = new Map()
    this.pending = new Set()
    this.stopped = false
  }

  attach(agent) {
    if (this.stopped || !agent?.id || this.scopes.has(agent.id)) return
    const restriction = restrictPluginTools(agent)
    this.scopes.set(agent.id, { agent, mode: null, restriction })
    void this.refresh(agent.id).catch((error) => {
      if (!this.stopped) this.context?.logger?.warn?.(`读取面试练习失败：${error.message}`)
    })
  }

  detach(agent) {
    const state = this.scopes.get(agent?.id)
    if (!state) return
    state.restriction?.()
    this.scopes.delete(agent.id)
  }

  setMode(sessionId, mode = null, coach = false) {
    const state = this.scopes.get(sessionId)
    if (!state || (state.mode === mode && Boolean(state.coach) === coach)) return false
    const restriction = restrictPluginTools(state.agent, mode, coach)
    state.restriction?.()
    state.restriction = restriction
    state.mode = mode
    state.coach = coach
    return true
  }

  refresh(sessionId) {
    const state = this.scopes.get(sessionId)
    if (this.stopped || !state) return Promise.resolve(false)
    const task = this.application.readAtomicSession(sessionId).then((result) => {
      if (this.stopped || this.scopes.get(sessionId) !== state) return false
      const data = result.resource.data
      return this.setMode(sessionId, data.selected ? data.practice.mode : null, Boolean(data.selected && coachTrack(data.practice.config.topic)))
    })
    this.pending.add(task)
    void task.then(() => this.pending.delete(task), () => this.pending.delete(task))
    return task
  }

  /** Releases restrictions and waits for database reads before repository teardown. */
  async dispose() {
    this.stopped = true
    for (const state of this.scopes.values()) this.detach(state.agent)
    await Promise.allSettled([...this.pending])
  }

  modeFor(sessionId) {
    return this.scopes.get(sessionId)?.mode || null
  }
}

export { COMMON_TOOLS, SUMMARY_TOOLS, QUESTION_TOOLS, COACHING_TOOLS, MODE_TOOL_NAMES, PLUGIN_TOOL_NAMES }
