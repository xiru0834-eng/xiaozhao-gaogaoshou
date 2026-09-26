import React from 'react'
import { COACH_STYLES } from './shared/coach-styles.js'
import { WORKSPACE_STYLES } from './shared/workspace-styles.js'
import { flushAnswerDrafts } from './shared/answer-draft.js'
import {
  CompactResultCard,
  PracticeSummaryCard,
  QuestionResourceCard,
  ReviewResourceCard,
  ToolErrorCard,
} from './features/live-interview.js'
import { InsightsCard, PracticeLibrary } from './features/practice-library.js'
import { PracticeSetupCard } from './features/practice-config.js'
import { TimelinePanel } from './features/timeline.js'
import { LeetcodeCatalog } from './features/leetcode.js'
import { ProductConversation } from './features/product-home.js'
import { ProductShell, SHELL_STYLES } from './features/product-shell.js'
import { createHomeActions, registerProductHome } from './shared/home-session.js'
import { installProductAppearance } from './shared/appearance-bridge.js'
import { interviewApi } from './shared/api.js'
import { INTERVIEW_TOOL_NAMES } from '../protocol/interview-tool-names.js'
import { installStyles } from './shared/styles.js'
import { h, parseInteractionResult, toolCallState, toolErrorAudience, toolErrorMessage } from './shared/ui.js'

export const name = 'shizhi-interview'
export const inject = ['slots', 'sessions', 'uiWorkspace', 'layout', 'theme']

/** The product skips the framework's developer notice and keeps model onboarding. */
function ProductWelcomeStep({ complete }) {
  React.useEffect(() => { complete() }, [complete])
  return null
}

export function resolveToolView(toolName, block) {
  const state = toolCallState(block)
  if (state === 'running') return { kind: 'hidden' }
  if (state === 'error' && toolErrorAudience(block) === 'agent') return { kind: 'hidden' }
  if (state === 'error') return { kind: 'error', message: toolErrorMessage(block) }
  const result = parseInteractionResult(block)
  if (!result || result.error?.audience === 'agent' || !result.artifact) return { kind: 'hidden' }
  return { ...result.artifact, revision: result.revision, toolName }
}

function ToolResourceView({ toolName, sessionId, block }) {
  const view = resolveToolView(toolName, block)
  switch (view.kind) {
    case 'error': return h(ToolErrorCard, { message: view.message })
    case 'practice-setup': return h(PracticeSetupCard, { key: view.presentationId, sessionId })
    case 'question': return h(QuestionResourceCard, { key: view.presentationId, artifact: view, revision: view.revision, sessionId })
    case 'review': return h(ReviewResourceCard, { key: view.presentationId, artifact: view, revision: view.revision, sessionId })
    case 'library': return h(PracticeLibrary, { sessionId, initialPracticeId: view.practiceId })
    case 'insights': return h(InsightsCard)
    case 'leetcode-catalog': return h(LeetcodeCatalog, { sessionId })
    case 'deleted': return h(CompactResultCard, { title: '练习已删除', detail: '档案和对应会话游标已经清理。' })
    case 'exported': return h(CompactResultCard, { title: 'Markdown 已生成', detail: '打开练习档案可以下载本次导出。' })
    case 'finished': return h(PracticeSummaryCard, { artifact: view, revision: view.revision })
    default: return null
  }
}

export function apply(ctx) {
  window.shizhiSaveDrafts = flushAnswerDrafts
  ctx.effect(() => () => { delete window.shizhiSaveDrafts })
  const coachStyle = document.createElement('style')
  coachStyle.textContent = COACH_STYLES + SHELL_STYLES + WORKSPACE_STYLES
  document.head.appendChild(coachStyle)
  ctx.effect(() => () => coachStyle.remove())
  installStyles()
  ctx.effect(() => installProductAppearance(ctx))
  const slots = ctx.get('slots')
  if (!slots) return
  slots.inject('settings.onboarding', () => slots.register({
    name: 'settings.onboarding', id: 'welcome-notice', order: -100, priority: -10,
  }, ProductWelcomeStep))
  if (window.shizhiDesktop) slots.inject('settings.onboarding', () => slots.register({
    name: 'settings.onboarding', id: 'deepseek-official', order: 0, priority: -10,
  }, ProductWelcomeStep))
  const actions = createHomeActions(ctx.get('sessions'), ctx.get('uiWorkspace'), interviewApi)
  slots.inject('sidebar', () => slots.register({
    name: 'sidebar', priority: -10,
    children: {
      'sidebar.workspaces': { kind: 'single', scope: 'root' },
      'sidebar.settings': { kind: 'single', scope: 'root' },
    },
  }, (props) => h(ProductShell, { ...props, createSession: actions.createSession,
    theme: ctx.get('theme'),
    openPlugins: () => ctx.get('layout').selectPanel('plugins'),
  })))
  slots.inject('main.conversation', () => registerProductHome(slots, ctx.get('sessions'),
    (props) => h(ProductConversation, { ...props, actions }), interviewApi))

  for (const toolName of INTERVIEW_TOOL_NAMES) {
    slots.inject('tool.call.toolview', () => slots.register(
      { name: 'tool.call.toolview', key: toolName },
      (props) => h(ToolResourceView, { toolName, sessionId: props.sessionId, block: props.block }),
    ))
  }

  slots.inject('conversation.input.dock', () => slots.register(
    { name: 'conversation.input.dock', id: 'interview-timeline', order: 25 },
    (props) => {
      const revisionSignal = typeof props.useSession === 'function'
        ? props.useSession((snapshot) => {
            const order = snapshot?.chat?.order || []
            return `${order.length}:${order.at(-1) || ''}`
          })
        : ''
      return h(TimelinePanel, { sessionId: props.sessionId, revisionSignal })
    },
  ))
}

export { ToolResourceView }
