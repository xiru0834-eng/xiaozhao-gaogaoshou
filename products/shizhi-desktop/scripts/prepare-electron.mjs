/** Explicit official download with the Electron npm package's pinned SHA256. */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const root = fileURLToPath(new URL('../', import.meta.url))
const electron = join(root, 'node_modules/electron')
const { version } = JSON.parse(await readFile(join(electron, 'package.json'), 'utf8'))
const name = `electron-v${version}-win32-x64.zip`
const checksums = JSON.parse(await readFile(join(electron, 'checksums.json'), 'utf8'))
const cache = join(root, '.cache', name)
let bytes
try { bytes = await readFile(cache) } catch (error) { if (error.code !== 'ENOENT') throw error }
if (!bytes) {
  console.log(`Downloading Electron ${version} (verified against its official checksum)…`)
  const base = process.env.ELECTRON_MIRROR || `https://github.com/electron/electron/releases/download/v${version}/`
  if (new URL(base).protocol !== 'https:') throw new Error('Electron mirror must use HTTPS')
  const response = await fetch(new URL(name, base), { signal: AbortSignal.timeout(600000) })
  if (!response.ok) throw new Error(`Electron download: HTTP ${response.status}`)
  const chunks = []
  let size = 0, reported = 0
  for await (const chunk of response.body) {
    chunks.push(chunk); size += chunk.length
    if (size - reported >= 16 * 1024 * 1024) { console.log(`Downloaded ${Math.round(size / 1024 / 1024)} MiB`); reported = size }
  }
  bytes = Buffer.concat(chunks)
  await mkdir(join(root, '.cache'), { recursive: true })
  await writeFile(cache, bytes)
}
if (createHash('sha256').update(bytes).digest('hex') !== checksums[name]) throw new Error('Electron archive SHA256 mismatch')
const script = join(root, '.cache/expand-electron.ps1')
await writeFile(script, 'param([string]$Archive,[string]$Destination)\nExpand-Archive -LiteralPath $Archive -DestinationPath $Destination -Force\n')
await promisify(execFile)('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, cache, join(electron, 'dist')], { windowsHide: true })
await writeFile(join(electron, 'path.txt'), 'electron.exe')
console.log('Electron checksum verified and binary prepared.')
