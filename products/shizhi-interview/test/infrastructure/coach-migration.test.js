import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { SqliteInterviewRepository } from '../../src/infrastructure/sqlite-interview-repository.js'
import { InterviewApplication } from '../../src/application/interview-application.js'

test('version zero and one practices retain answers, bindings and structured reviews through bank migration', async () => {
  const root = mkdtempSync(join(tmpdir(), 'coach-migration-'))
  const file = join(root, 'test.sqlite')
  let repository
  try {
    repository = new SqliteInterviewRepository(file)
    const practice = { id: 'p', mode: 'bagu', topic: '数据库', source: { kind: 'topic', content: '数据库' }, config: { topic: '数据库' },
      status: 'active', createdAt: 1, updatedAt: 2, completedAt: null, summary: null,
      questions: [{ id: 'q', prompt: '索引有什么代价？', sequence: 1, createdAt: 2, explanation: null,
        attempts: [{ id: 'a', sequence: 1, submittedAt: 3, answer: '索引增加写入成本', evaluation: null }] }] }
    await repository.commit({ practice, binding: { sessionId: 's', practiceId: 'p', currentQuestionId: 'q', revision: 1, updatedAt: 1 } })
    // Remove only the new column in this owned fixture to reproduce the released schema.
    repository.database.exec('ALTER TABLE attempts DROP COLUMN evaluation_review_json; DROP TABLE coach_question_states; PRAGMA user_version = 0')
    repository.close(); repository = new SqliteInterviewRepository(file)
    assert.deepEqual(await repository.getPractice('p'), practice)
    assert.equal(repository.database.prepare('PRAGMA user_version').get().user_version, 2)
    const application = new InterviewApplication({ repository, clock: { now: () => 5 }, ids: { next: () => 'unused' }, random: { next: () => 0 }, events: { publish: async () => {} }, exporter: { export: async () => [] } })
    const review = { items: [{ point: '写入维护', status: 'met', quote: '增加写入成本', comment: '描述了维护代价。' }], nextStep: '补充空间开销。' }
    await application.createAtomicEvaluation('s', { questionId: 'q', attemptId: 'a', score: 6, feedback: '仍需补充。', review })
    repository.close(); repository = new SqliteInterviewRepository(file)
    assert.deepEqual((await repository.getPractice('p')).questions[0].attempts[0].evaluation.review, review)
    assert.equal((await repository.getSessionBinding('s')).currentQuestionId, 'q')
    const before = await repository.getPractice('p')
    const binding = await repository.getSessionBinding('s')
    repository.database.exec('DROP TABLE coach_question_states; PRAGMA user_version = 1')
    repository.close(); repository = new SqliteInterviewRepository(file)
    assert.equal(repository.database.prepare('PRAGMA user_version').get().user_version, 2)
    assert.deepEqual(await repository.getPractice('p'), before)
    assert.deepEqual(await repository.getSessionBinding('s'), binding)
    const mastered = { key: '索引有什么代价？', prompt: '索引有什么代价？', topic: '数据库', mastered: true, updatedAt: 10 }
    await repository.saveCoachQuestionState(mastered)
    repository.close(); repository = new SqliteInterviewRepository(file)
    assert.deepEqual(await repository.listCoachQuestionStates(), [mastered])
    await repository.saveCoachQuestionState({ ...mastered, mastered: false, updatedAt: 11 })
    repository.close(); repository = new SqliteInterviewRepository(file)
    assert.deepEqual(await repository.listCoachQuestionStates(), [{ ...mastered, mastered: false, updatedAt: 11 }])
    assert.deepEqual(await repository.getPractice('p'), before)
  } finally {
    repository?.close()
    assert.equal(dirname(resolve(root)), resolve(tmpdir()))
    rmSync(root, { recursive: true, force: true })
  }
})
