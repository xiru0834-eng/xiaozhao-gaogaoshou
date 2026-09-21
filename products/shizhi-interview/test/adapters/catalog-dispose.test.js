import test from 'node:test'
import assert from 'node:assert/strict'
import { ModeToolCatalog } from '../../src/adapters/dsh/mode-tool-catalog.js'

test('unloading releases tool restrictions and waits for an outstanding database read', async () => {
  let resolveRead, disposed = 0, registered = 0
  const read = new Promise((resolve) => { resolveRead = resolve })
  const application = { readAtomicSession: () => read }
  const agent = { id: 'one', ctx: { tools: { restrict: () => { registered++; return () => { disposed++ } } } } }
  const catalog = new ModeToolCatalog({ application })
  catalog.attach(agent)
  let done = false
  const teardown = catalog.dispose().then(() => { done = true })
  await Promise.resolve()
  assert.equal(done, false)
  assert.equal(disposed, 1)
  resolveRead({ resource: { data: { selected: true, practice: { mode: 'bagu', config: { topic: '拾知 · Java 基础' } } } } })
  await teardown
  assert.equal(registered, 1)
  assert.equal(await catalog.refresh('one'), false)
})
