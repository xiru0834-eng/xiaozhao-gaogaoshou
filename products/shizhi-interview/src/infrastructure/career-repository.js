/** Owns the integrated company's catalog and progress stores, separate from interview data. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { defaultDataDirectory } from './paths.js'

/** Opens the upstream SQLite stores under the product's existing local data home.
 * @param {string} directory Isolated directory for the company catalog and progress.
 * @returns {Promise<object>} Company lookup, status updates, backups, and disposal.
 */
export async function openCareerRepository(directory = join(defaultDataDirectory(), 'career')) {
  const { lockProfile, openProfileData, createWorkbench, parseStatuses } = await import('../../lib/career-data.js')
  mkdirSync(directory, { recursive: true })
  const identityPath = join(directory, 'profile-id')
  let profileId
  try { profileId = readFileSync(identityPath, 'utf8').trim() } catch (error) {
    if (error.code !== 'ENOENT') throw error
    profileId = randomUUID(); writeFileSync(identityPath, `${profileId}\n`, { flag: 'wx' })
  }
  if (!/^[0-9a-f-]{36}$/.test(profileId)) throw new Error('Invalid career profile identity')
  const context = await openProfileData(lockProfile(directory, profileId))
  const { catalog, store } = context
  const workbench = await createWorkbench({ webDir: fileURLToPath(new URL('../../client/career/', import.meta.url)), embedded: true }, context)
  const company = (name) => {
    const snapshot = catalog.snapshot()
    const index = snapshot.companies.findIndex((row) => row[0] === name)
    if (index < 0) throw new TypeError('公司不在当前目录中，请刷新后选择')
    const row = snapshot.companies[index]
    return { companyId: snapshot.metadata[index].id, companyName: row[0], roles: row[2], city: row[3], url: row[6] }
  }
  return { profileId, directory, catalog, store, schedules: context.schedules, company, workbench,
    save(updates) {
      let checked
      try { checked = parseStatuses(updates) } catch (error) { throw new TypeError('投递进度格式不正确', { cause: error }) }
      for (const name of Object.keys(checked)) company(name)
      store.save(checked)
    },
    close() { return workbench.close() },
  }
}
