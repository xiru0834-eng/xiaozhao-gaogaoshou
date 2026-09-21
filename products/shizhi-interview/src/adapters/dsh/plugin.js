import { InterviewApplication } from '../../application/interview-application.js'
import { MarkdownPracticeExporter } from '../../infrastructure/markdown-practice-exporter.js'
import { SqliteInterviewRepository } from '../../infrastructure/sqlite-interview-repository.js'
import { createSystemPorts } from '../../infrastructure/system-ports.js'
import { registerApiRoutes } from '../http/api-routes.js'
import { AgentEventBridge } from './agent-event-bridge.js'
import { createAtomicToolDefinitions } from './atomic-tool-definitions.js'
import { ModeToolCatalog } from './mode-tool-catalog.js'
import { createPresentationToolDefinitions } from './presentation-tool-definitions.js'
import { resolveSpeechConfig } from '../../infrastructure/speech-provider.js'
import { registerSpeechRoutes } from '../http/speech-routes.js'
import { CONVERSATION_POLICY, scopeCurrentRequest } from './conversation-policy.js'
import { openCareerRepository } from '../../infrastructure/career-repository.js'
import { registerCareerRoutes } from '../http/career-routes.js'

export const name = 'shizhi-interview'
export const inject = ['tools', 'agents']

export function createRuntime(ctx, options = {}) {
  const repository = options.repository || new SqliteInterviewRepository(options.databasePath)
  const exporter = options.exporter || new MarkdownPracticeExporter({ outputDirectory: options.exportDirectory })
  const system = createSystemPorts()
  const application = options.application || new InterviewApplication({
    repository,
    exporter,
    events: options.events || system.events,
    clock: options.clock || system.clock,
    ids: options.ids || system.ids,
    random: options.random || system.random,
  })
  const toolCatalog = new ModeToolCatalog({ context: ctx, application })
  const eventBridge = new AgentEventBridge(ctx, toolCatalog)
  return {
    application,
    repository,
    exporter,
    eventBridge,
    toolCatalog,
  }
}

export function apply(ctx, config = {}) {
  const speech = resolveSpeechConfig(config.speech)
  const runtime = createRuntime(ctx)
  ctx.inject(['systemPrompt'], (promptCtx) => {
    promptCtx.effect(() => promptCtx.systemPrompt.section({
      name: 'shizhi-conversation-policy',
      order: promptCtx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_SUFFIX'),
      text: CONVERSATION_POLICY,
    }))
  })
  ctx.on('agent/pre-step', scopeCurrentRequest)
  for (const tool of createAtomicToolDefinitions(runtime.application, {
    onComplete: (sessionId) => runtime.toolCatalog.refresh(sessionId),
  })) ctx.effect(() => ctx.tools.register(tool))
  for (const tool of createPresentationToolDefinitions(runtime.application)) ctx.effect(() => ctx.tools.register(tool))

  for (const agent of ctx.agents.list()) runtime.toolCatalog.attach(agent)
  ctx.on('agent/created', ({ agent }) => runtime.toolCatalog.attach(agent))
  ctx.on('agent/disposed', ({ agent }) => runtime.toolCatalog.detach(agent))

  ctx.inject(['webServer', 'connection'], async (hostCtx) => {
    const career = await openCareerRepository()
    registerCareerRoutes(hostCtx, career, runtime.application)
    registerApiRoutes(hostCtx, { ...runtime, career })
    registerSpeechRoutes(hostCtx, speech)
  })

  ctx.effect(() => async () => {
    await runtime.toolCatalog.dispose()
    runtime.repository.close()
  })
}
