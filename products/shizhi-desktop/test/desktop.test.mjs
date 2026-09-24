import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareHome, privateServerUrl } from '../src/backend.mjs'
import { mergeSettings, readSettings, saveSettings, settingsStatus } from '../src/settings.mjs'

test('blank settings retain keys, explicit removal clears only its selected key', () => {
  const saved = { deepseekKey: 'model-secret', qwenKey: 'voice-secret' }
  assert.deepEqual(mergeSettings({ deepseekKey: '', clearqwenKey: true }, saved), { configured: true, deepseekKey: 'model-secret' })
  assert.deepEqual(settingsStatus(saved), { configured: false, deepseek: true, qwen: true })
  assert.throws(() => mergeSettings({ deepseekKey: 'a\nb' }), /格式/)
})

test('configuration envelope uses OS encryption and retains the previous file on encryption failure', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'shizhi-settings-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const file = join(directory, 'credentials.json')
  const storage = { isEncryptionAvailable: () => true, encryptString: () => Buffer.from('encrypted-by-os'), decryptString: () => '{"qwenKey":"secret"}' }
  assert.deepEqual(await readSettings(file, storage), {})
  await saveSettings(file, { qwenKey: 'secret' }, storage)
  const original = await readFile(file, 'utf8')
  assert.ok(!original.includes('secret'))
  assert.deepEqual(await readSettings(file, storage), { qwenKey: 'secret' })
  await assert.rejects(saveSettings(file, {}, { isEncryptionAvailable: () => false }), /安全存储/)
  assert.equal(await readFile(file, 'utf8'), original)
})

test('profile preparation preserves records and refuses to replace incompatible configuration', async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'shizhi-profile-'))
  t.after(() => rm(home, { recursive: true, force: true }))
  await prepareHome(home)
  const record = join(home, 'records.json')
  await writeFile(record, 'my practice')
  await prepareHome(home)
  assert.equal(await readFile(record, 'utf8'), 'my practice')
  await writeFile(join(home, 'profiles/web/package.json'), '{}')
  await assert.rejects(prepareHome(home), /不兼容/)
  assert.equal(await readFile(record, 'utf8'), 'my practice')
})

test('only loopback HTTP with an explicit port can become the desktop origin', () => {
  assert.equal(privateServerUrl('http://127.0.0.1:1234/#token').origin, 'http://127.0.0.1:1234')
  for (const url of ['https://evil.example/', 'file:///C:/x', 'http://127.0.0.1/', 'http://user@127.0.0.1:4317/']) assert.throws(() => privateServerUrl(url))
})
