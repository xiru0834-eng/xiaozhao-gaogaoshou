import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AnswerDrafts } from '../../src/infrastructure/answer-drafts.js'
import { DatabaseSync } from 'node:sqlite'

test('a newer draft schema is refused without downgrading it', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'sz-draft-version-')), file = join(directory, 'drafts.sqlite')
  t.after(() => rm(directory, { recursive: true, force: true }))
  let database = new DatabaseSync(file)
  database.exec('PRAGMA user_version=2'); database.close()
  assert.throws(() => new AnswerDrafts(file), /升级/)
  database = new DatabaseSync(file)
  assert.equal(database.prepare('PRAGMA user_version').get().user_version, 2); database.close()
})

test('drafts survive reopening and reject stale tab revisions without overwriting text', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'sz-drafts-'))
  const file = join(directory, 'drafts.sqlite')
  let store = new AnswerDrafts(file)
  t.after(async () => { store.close(); await rm(directory, { recursive: true, force: true }) })
  assert.equal(store.save('p', 'q', 0, 0, '尚未说完的回答').revision, 1)
  store.close(); store = new AnswerDrafts(file)
  assert.equal(store.read('p', 'q', 0).text, '尚未说完的回答')
  assert.throws(() => store.save('p', 'q', 0, 0, '旧窗口'), /其他窗口/)
  assert.equal(store.read('p', 'q', 0).text, '尚未说完的回答')
  assert.equal(store.read('p', 'q', 1).text, '', 'a submitted attempt invalidates its old draft')
  store.save('p', 'q', 1, 1, '第二次回答')
  assert.equal(store.read('p', 'q', 1).text, '第二次回答')
  assert.equal(store.read('p', 'other', 1).text, '')
  assert.throws(() => store.save('p', 'missing', 0, 8, 'stale'), /其他窗口/)
})
