/** Portable encrypted backups of a stopped product home, excluding installed dependencies. */
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto'
import { gzip, gunzip } from 'node:zlib'
import { promisify } from 'node:util'
import { lstat, readdir, readFile, writeFile, mkdir, rename, rm, mkdtemp } from 'node:fs/promises'
import { join, dirname } from 'node:path'

const derive = promisify(scrypt), compress = promisify(gzip), decompress = promisify(gunzip)
const MAGIC = Buffer.from('SZBACK01'), MAX = 256 * 1024 * 1024, MAX_FILES = 20000
const excluded = new Set(['node_modules', 'desktop-port.json'])

function password(value) {
  if (typeof value !== 'string' || value.length < 10 || value.length > 1024) throw new Error('备份密码需要 10 至 1024 个字符')
  return value
}
function safePath(path) {
  if (typeof path !== 'string' || path.length > 1000) return false
  return path.split('/').every((part) => part && part !== '.' && part !== '..' && !excluded.has(part) &&
    !/[\\:\x00-\x1f<>"|?*]/.test(part) && !/[. ]$/.test(part) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))
}

/** Reads regular files only; the caller must stop all database writers first. */
export async function createBackup(home, settings, passphrase, preferences = {}) {
  password(passphrase)
  const files = []
  let total = 0
  async function visit(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (excluded.has(entry.name)) continue
      const path = prefix + entry.name, file = join(directory, entry.name)
      if (!safePath(path)) throw new Error('数据路径不支持备份')
      const info = await lstat(file)
      if (info.isSymbolicLink()) throw new Error('数据目录包含链接，请先移除该链接再备份')
      if (info.isDirectory()) { await visit(file, `${path}/`); continue }
      if (!info.isFile() || (total += info.size) > MAX || files.length >= MAX_FILES) throw new Error('备份数据超过 256 MB 或文件数量限制')
      files.push({ path, data: (await readFile(file)).toString('base64') })
    }
  }
  await visit(home)
  const payload = Buffer.from(JSON.stringify({ version: 1, createdAt: new Date().toISOString(), settings, preferences, files }))
  if (payload.length > MAX) throw new Error('备份内容超过 256 MB 限制')
  const salt = randomBytes(16), iv = randomBytes(12), key = await derive(passphrase, salt, 32)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(await compress(payload)), cipher.final()])
  key.fill(0)
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), encrypted])
}

/** Authenticates and validates the complete archive before touching existing records. */
export async function decodeBackup(bytes, passphrase) {
  password(passphrase)
  if (bytes.length < 53 || bytes.length > MAX || !bytes.subarray(0, 8).equals(MAGIC)) throw new Error('不是受支持的拾知备份文件')
  const key = await derive(passphrase, bytes.subarray(8, 24), 32)
  let payload
  try {
    const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(24, 36))
    cipher.setAuthTag(bytes.subarray(36, 52))
    const packed = Buffer.concat([cipher.update(bytes.subarray(52)), cipher.final()])
    payload = JSON.parse((await decompress(packed, { maxOutputLength: MAX })).toString('utf8'))
  } catch (error) { throw new Error('备份密码不正确，或文件已损坏', { cause: error }) }
  finally { key.fill(0) }
  if (payload?.version !== 1 || !Array.isArray(payload.files) || payload.files.length > MAX_FILES || !payload.settings || typeof payload.settings !== 'object') throw new Error('备份数据格式不受支持')
  const paths = new Set()
  let size = 0
  for (const file of payload.files) {
    if (!safePath(file.path) || paths.has(file.path.toLowerCase()) || typeof file.data !== 'string' || Buffer.from(file.data, 'base64').toString('base64') !== file.data) throw new Error('备份包含非法或重复文件')
    paths.add(file.path.toLowerCase())
    size += Buffer.byteLength(file.data, 'base64')
    if (size > MAX) throw new Error('备份数据超过大小限制')
  }
  if (!paths.has('profiles/web/package.json')) throw new Error('备份缺少桌面运行配置')
  return payload
}

/** Replaces a stopped home and retains its previous contents until startup succeeds.
 * The caller must either commit or rollback, and restore its encrypted credentials on rollback.
 */
export async function stageRestore(home, payload) {
  const staging = await mkdtemp(join(dirname(home), '.restore-'))
  const previous = `${staging}-previous`
  const moved = [], installed = []
  const rollback = async () => {
    for (const name of installed) await rm(join(home, name), { recursive: true, force: true })
    for (const name of moved) await rename(join(previous, name), join(home, name))
    await rm(staging, { recursive: true, force: true })
    await rm(previous, { recursive: true, force: true })
  }
  try {
    for (const file of payload.files) {
      const destination = join(staging, ...file.path.split('/'))
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, Buffer.from(file.data, 'base64'), { flag: 'wx', mode: 0o600 })
    }
    await mkdir(previous)
    // Windows can retain the working-directory handle after the child exits.
    // Preserve that directory and swap its data entries while all writers are stopped.
    for (const name of await readdir(home)) {
      if (excluded.has(name)) continue
      await rename(join(home, name), join(previous, name)); moved.push(name)
    }
    for (const name of await readdir(staging)) {
      await rename(join(staging, name), join(home, name)); installed.push(name)
    }
  } catch (error) { await rollback(); throw error }
  return {
    commit: async () => { await rm(previous, { recursive: true, force: true }); await rm(staging, { recursive: true, force: true }) },
    rollback,
  }
}

/** Rejects oversized input before allocating its contents. */
export async function readBackup(file, passphrase) {
  if ((await lstat(file)).size > MAX) throw new Error('备份文件超过 256 MB 限制')
  return decodeBackup(await readFile(file), passphrase)
}
