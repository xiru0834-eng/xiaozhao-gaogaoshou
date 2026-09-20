import test from 'node:test'
import assert from 'node:assert/strict'
import { scopeCurrentRequest } from '../../src/adapters/dsh/conversation-policy.js'
import { instructionFor } from '../../src/adapters/dsh/agent-event-bridge.js'

const user = { id: 'greeting', role: 'user', content: [{ type: 'text', text: '你好' }], source: { kind: 'user' } }
const review = { id: 'review', role: 'user', content: [{ type: 'text', text: instructionFor({
  type: 'coach.review', practiceId: 'practice-one', questionId: 'question-one', attemptId: 'attempt-one', answer: 'GET 是幂等的。',
}) }], source: { kind: 'plugin', plugin: 'shizhi-interview' } }

test('a greeting after a failed review admits a new request reminder without replaying the review', async () => {
  let delegated = 0
  const decision = await scopeCurrentRequest({ messages: [user] }, async () => {
    delegated++
    return { kind: 'enter', messages: [user], startsRequestSeries: true }
  })
  assert.equal(delegated, 1)
  assert.equal(decision.startsRequestSeries, true)
  assert.equal(decision.messages.length, 2)
  assert.equal(decision.messages[0], user)
  assert.match(decision.messages[1].content[0].text, /若本条只是问候.*不调用工具/)
  assert.doesNotMatch(JSON.stringify(decision.messages), /practice-one|attempt-one/)
  assert.equal(decision.messages[1].source.plugin, 'shizhi-request-scope')
})

test('an explicit review request still permits the current practice operation', async () => {
  const result = await scopeCurrentRequest({ messages: [review] }, async () => ({ kind: 'enter', messages: [review] }))
  assert.equal(result.messages[0], review)
  assert.match(result.messages[1].content[0].text, /只处理本条请求指定的练习/)
  assert.match(review.content[0].text, /后续聊天不自动重试/)
})

test('a newer user message takes priority when a practice request shares the admission batch', async () => {
  const messages = [review, user]
  const result = await scopeCurrentRequest({ messages }, async () => ({ kind: 'enter', messages }))
  assert.match(result.messages.at(-1).content[0].text, /用户刚发送的新消息/)
})

test('tool continuation, rejection and withdrawn requests do not receive a new user reminder', async () => {
  const enter = { kind: 'enter', messages: [] }
  assert.equal(await scopeCurrentRequest({ messages: [] }, async () => enter), enter)
  const rejected = { kind: 'reject' }
  assert.equal(await scopeCurrentRequest({ messages: [user] }, async () => rejected), rejected)
  assert.equal(await scopeCurrentRequest({ messages: [user] }, async () => enter), enter)
})
