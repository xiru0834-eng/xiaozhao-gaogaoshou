import test from 'node:test'
import assert from 'node:assert/strict'
import { applicationFixture } from '../support/application-fixture.js'
import { createCoachCommands } from '../../src/application/coach-commands.js'
import { instructionFor } from '../../src/adapters/dsh/agent-event-bridge.js'
import { renderPracticeMarkdown } from '../../src/infrastructure/markdown-practice-exporter.js'

const company = { companyId: 'company-one', companyName: '示例公司', roles: '后端开发', city: '上海', url: 'https://example.com/jobs' }
test('company preparation retains catalog identity and uses the confirmed role in review requests', async () => {
  const { application } = applicationFixture()
  const events = []
  const run = createCoachCommands({ application, resolveCompany: (name) => { assert.equal(name, company.companyName); return company },
    eventBridge: { refresh: async () => {}, dispatch: (session, event) => { events.push(event); return true } } })
  await assert.rejects(run('one', 'start', { track: 'database', companyName: company.companyName, targetRole: '' }))
  assert.equal((await application.repository.listPractices()).length, 0)
  const start = await run('one', 'start', { track: 'database', companyName: company.companyName, targetRole: 'Java 后端工程师', companyId: 'forged' })
  const data = start.resource.data
  assert.equal(data.practice.config.target.companyId, company.companyId)
  const payload = { practiceId: data.practice.id, questionId: data.currentQuestion.id, revision: data.revision }
  await run('one', 'submit', { ...payload, answer: '索引用有序结构缩小扫描范围，但增加存储和写维护成本。' })
  const saved = await application.getPractice(data.practice.id)
  assert.equal(saved.resource.data.config.target.targetRole, 'Java 后端工程师')
  assert.match(instructionFor(events[0]), /示例公司/)
  assert.match(instructionFor(events[0]), /Java 后端工程师/)
  assert.match(instructionFor(events[0]), /不得声称题目是该公司的真题/)
  await application.updatePractice(data.practice.id, { mode: 'bagu', config: { topic: '数据库索引复习' } })
  const edited = (await application.getPractice(data.practice.id)).resource.data
  assert.deepEqual(edited.config.target, saved.resource.data.config.target)
  const report = renderPracticeMarkdown(edited).markdown
  assert.match(report, /目标公司：示例公司/)
  assert.match(report, /目标岗位：Java 后端工程师/)
  const ordinary = await run('two', 'start', { track: 'network' })
  assert.equal(ordinary.resource.data.practice.config.target, undefined)
})
