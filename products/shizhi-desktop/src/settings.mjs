/** Desktop-only credentials, encrypted by Electron's OS-backed safeStorage. */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

/** Accepts only supported settings and leaves stored keys unchanged for blank inputs.
 * @param {object} input Untrusted renderer input.
 * @param {object} previous Decrypted saved settings.
 * @returns {object} Validated settings.
 */
export function mergeSettings(input, previous = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('配置格式不正确')
  const result = { ...previous, configured: true }
  for (const name of ['deepseekKey', 'qwenKey']) {
    const value = input[name]
    if (value !== undefined && (typeof value !== 'string' || value.length > 4096 || /[\r\n\0]/.test(value))) throw new Error('密钥格式不正确')
    if (input[`clear${name}`] === true) delete result[name]
    else if (value?.trim()) result[name] = value.trim()
  }
  return result
}

/** Reads encrypted credentials; a decryption error never silently discards saved keys.
 * @param {string} file Settings filename.
 * @param {object} storage Electron safeStorage.
 * @returns {Promise<object>} Saved keys or an empty first-run configuration.
 */
export async function readSettings(file, storage) {
  let raw
  try { raw = await readFile(file, 'utf8') } catch (error) { if (error.code === 'ENOENT') return {}; throw error }
  const envelope = JSON.parse(raw)
  if (envelope.version !== 1) throw new Error('配置版本不受支持，请升级桌面版')
  return JSON.parse(storage.decryptString(Buffer.from(envelope.encrypted, 'base64')))
}

/** Atomically replaces an encrypted settings document.
 * @param {string} file Settings filename.
 * @param {object} value Validated settings.
 * @param {object} storage Electron safeStorage.
 */
export async function saveSettings(file, value, storage) {
  if (!storage.isEncryptionAvailable()) throw new Error('Windows 安全存储不可用，暂时无法保存密钥')
  await mkdir(dirname(file), { recursive: true })
  const encrypted = storage.encryptString(JSON.stringify(value)).toString('base64')
  await writeFile(`${file}.tmp`, JSON.stringify({ version: 1, encrypted }), { mode: 0o600 })
  await rename(`${file}.tmp`, file)
}

/** Renderer-visible status deliberately excludes key material.
 * @param {object} settings Saved settings.
 * @returns {object} Nonsecret flags.
 */
export function settingsStatus(settings) {
  return { configured: Boolean(settings.configured), deepseek: Boolean(settings.deepseekKey), qwen: Boolean(settings.qwenKey) }
}
