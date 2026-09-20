import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { openCareerRepository } from '../../src/infrastructure/career-repository.js'

test('the upstream catalog and progress persist independently and export a usable backup', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'shizhi-career-test-'))
  let repository
  try {
    repository = await openCareerRepository(directory)
    const catalog = repository.catalog.snapshot()
    assert.ok(catalog.companies.length > 0)
    assert.equal(catalog.metadata.length, catalog.companies.length)
    const name = catalog.companies[0][0]
    const identity = repository.profileId
    const company = repository.company(name)
    assert.equal(company.companyId, catalog.metadata[0].id)
    repository.save({ [name]: '面试' })
    assert.throws(() => repository.save({ [name]: 'Offer', 'Not in catalog': '已投' }))
    assert.equal(repository.store.statuses()[name], '面试')
    assert.throws(() => repository.save({ [name]: 'unknown status' }))
    const backupPath = join(directory, 'export.db')
    await repository.store.backup(backupPath)
    const backup = new DatabaseSync(backupPath, { readOnly: true })
    try { assert.equal(backup.prepare('SELECT status FROM applications WHERE name=?').get(name).status, '面试') }
    finally { backup.close() }
    repository.close(); repository = await openCareerRepository(directory)
    assert.equal(repository.profileId, identity)
    assert.equal(repository.store.statuses()[name], '面试')
    assert.equal(repository.catalog.snapshot().companies.length, catalog.companies.length)
  } finally { repository?.close(); await rm(directory, { recursive: true, force: true }) }
})
