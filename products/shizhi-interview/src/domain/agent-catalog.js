/** Agent interview content loaded from versioned, topic-specific data files. */
import foundations from './question-data/agent/foundations.json' with { type: 'json' }
import tools from './question-data/agent/tools.json' with { type: 'json' }
import retrieval from './question-data/agent/retrieval.json' with { type: 'json' }
import context from './question-data/agent/context.json' with { type: 'json' }
import reliability from './question-data/agent/reliability.json' with { type: 'json' }
import evaluation from './question-data/agent/evaluation.json' with { type: 'json' }

/** Catalog metadata for content validation; difficulty and type do not affect grading. */
export const AGENT_QUESTION_SECTIONS = Object.freeze([
  foundations, tools, retrieval, context, reliability, evaluation,
])

function tuple(question) { return [question.prompt, question.cues, question.source] }

/** Agent track; ascending stable IDs preserve the original question indexes and wording. */
export const AGENT_TRACK = Object.freeze({
  id: 'agent', title: '智能体应用开发', subtitle: 'Agent · RAG · MCP · 工程落地', icon: '◎',
  sections: AGENT_QUESTION_SECTIONS.map((section) => ({
    title: section.title, questions: section.questions.map(tuple),
  })),
  questions: AGENT_QUESTION_SECTIONS.flatMap((section) => section.questions)
    .sort((a, b) => a.id.localeCompare(b.id)).map(tuple),
})
