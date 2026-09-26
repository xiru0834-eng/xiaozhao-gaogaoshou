import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createBackup, decodeBackup, stageRestore } from '../src/backup.mjs'
import { prepareHome } from '../src/backend.mjs'
import { trimRuntime } from '../scripts/trim-runtime.mjs'
import { createCipheriv, scryptSync } from 'node:crypto'
import { gzipSync } from 'node:zlib'

function archiveWithFiles(files) {
  const salt = Buffer.alloc(16, 1), iv = Buffer.alloc(12, 2)
  const cipher = createCipheriv('aes-256-gcm', scryptSync('test-archive-password', salt, 32), iv)
  const data = gzipSync(Buffer.from(JSON.stringify({ version: 1, settings: {}, files })))
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  return Buffer.concat([Buffer.from('SZBACK01'), salt, iv, cipher.getAuthTag(), encrypted])
}

test('authenticated archives still reject traversal, Windows device names and duplicate paths', async () => {
  for (const path of ['../outside', 'C:/outside', 'x\\outside', 'x:stream', 'con.txt', 'folder./file', 'node_modules/plugin.js']) {
    await assert.rejects(decodeBackup(archiveWithFiles([{ path, data: '' }]), 'test-archive-password'), /非法/)
  }
  await assert.rejects(decodeBackup(archiveWithFiles([{ path: 'same', data: '' }, { path: 'SAME', data: '' }]), 'test-archive-password'), /重复/)
})

test('encrypted backup migrates records and keys, excludes runtime links, and supports rollback', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'sz-backup-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const home = join(dir, 'data'), secret = 'example-private-key'
  await prepareHome(home)
  await mkdir(join(home, 'profiles/web/data'), { recursive: true })
  await writeFile(join(home, 'profiles/web/data/draft.txt'), '未提交的草稿')
  await mkdir(join(home, 'node_modules'))
  await symlink(join(dir), join(home, 'node_modules/runtime'), 'junction')
  const archive = await createBackup(home, { deepseekKey: secret }, 'a-long-test-password')
  assert.equal(archive.includes(Buffer.from(secret)), false)
  await assert.rejects(decodeBackup(archive, 'wrong-long-password'), /密码/)
  const corrupt = Buffer.from(archive); corrupt[corrupt.length - 1] ^= 1
  await assert.rejects(decodeBackup(corrupt, 'a-long-test-password'), /损坏/)
  const payload = await decodeBackup(archive, 'a-long-test-password')
  assert.equal(payload.settings.deepseekKey, secret)
  assert.equal(payload.files.some((file) => file.path.includes('node_modules')), false)
  await writeFile(join(home, 'profiles/web/data/draft.txt'), '恢复前')
  const restore = await stageRestore(home, payload)
  assert.equal(await readFile(join(home, 'profiles/web/data/draft.txt'), 'utf8'), '未提交的草稿')
  await restore.rollback()
  assert.equal(await readFile(join(home, 'profiles/web/data/draft.txt'), 'utf8'), '恢复前')
  await (await stageRestore(home, payload)).commit()
  assert.equal(await readFile(join(home, 'profiles/web/data/draft.txt'), 'utf8'), '未提交的草稿')
})

test('backup refuses data symlinks and short passwords', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'sz-backup-link-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const home = join(dir, 'data')
  await prepareHome(home)
  await symlink(dir, join(home, 'unexpected'), 'junction')
  await assert.rejects(createBackup(home, {}, '123'), /10/)
  await assert.rejects(createBackup(home, {}, 'long-enough-password'), /链接/)
})

test('runtime trimming keeps executable code, data and license notices', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'sz-trim-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  for (const file of ['index.js', 'index.js.map', 'index.d.ts', 'source.ts', 'native.pdb', 'native.node', 'LICENSE', 'map.json']) await writeFile(join(dir, file), 'content')
  assert.equal((await trimRuntime(dir)).files, 3)
  for (const file of ['index.js', 'source.ts', 'native.node', 'LICENSE', 'map.json']) assert.equal(await readFile(join(dir, file), 'utf8'), 'content')
})
