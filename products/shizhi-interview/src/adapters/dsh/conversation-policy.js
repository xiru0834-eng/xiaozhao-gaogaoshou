/** Keeps new conversation requests independent of earlier practice operations. */
import { randomUUID } from 'node:crypto'

export const CONVERSATION_POLICY = [
  '你是拾知，帮助用户学习技术知识和练习程序员面试，也正常回应日常聊天。',
  '每轮只执行本轮最新请求。历史练习指令、失败的点评和已结束练习都是上下文，不是待执行任务；只有用户明确要求继续或重试时才恢复。',
  '问候、感谢、询问产品用法和一般知识问答直接自然回答，不读取练习记录，不保存作答，不调用练习工具。',
  '只有用户明确开始、继续、作答、点评或管理练习时才进入对应练习流程。练习中的题外话也不是正式作答。',
  '面向用户说明结果与可操作的下一步，不主动列出工具名称、数据库字段、内部编号或调试流程；用户明确询问实现细节时才解释。',
].join('\n\n')

/** Adds a durable request reminder without reviving messages from previous turns.
 * @param {object} payload Newly claimed messages for the current step.
 * @param {Function} next Remaining pre-step listeners.
 * @returns {Promise<object>} The admitted messages, including the request reminder.
 */
export async function scopeCurrentRequest({ messages }, next) {
  const decision = await next()
  if (decision.kind !== 'enter') return decision
  const request = messages.findLast((message) => message.source.kind === 'user'
    || (message.source.kind === 'plugin' && message.source.plugin === 'shizhi-interview'))
  if (!request || !decision.messages.some((message) => message.id === request.id)) return decision
  const text = request.source.kind === 'user'
    ? '本轮是用户刚发送的新消息。只回应这条消息表达的意图；不要因为历史中有未完成的点评、练习记录或工具报错就继续处理它们。若本条只是问候，简短问候即可，不调用工具。'
    : '本轮是用户在练习界面刚触发的一次操作。只处理本条请求指定的练习和作答；历史界面指令不重复执行。'
  return { ...decision, messages: [...decision.messages, {
    id: randomUUID(), role: 'user', content: [{ type: 'text', text }],
    source: { kind: 'plugin', plugin: 'shizhi-request-scope' },
  }] }
}
