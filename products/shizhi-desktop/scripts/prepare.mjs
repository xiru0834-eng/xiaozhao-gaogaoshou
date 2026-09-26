/** Produces an allowlisted, relocatable backend; no source home, .env or databases enter it. */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { writeIcon } from './write-icon.mjs'
import { trimRuntime } from './trim-runtime.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const product = resolve(root, '../shizhi-interview')
const backend = join(root, 'build', 'backend')
const cache = join(root, '.cache')
const nodeVersion = '24.21.0'
const archiveName = `node-v${nodeVersion}-win-x64.zip`
const archiveHash = '158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541'

function run(executable, args, cwd, env = process.env) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(executable, args, { cwd, env, windowsHide: true, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${executable} exited ${code}`)))
  })
}
if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('This release build requires Windows x64')
await mkdir(backend, { recursive: true })
await mkdir(cache, { recursive: true })
const runtimeManifest = JSON.parse(await readFile(join(root, 'runtime/package.json'), 'utf8'))
const repositoryManifest = JSON.parse(await readFile(resolve(root, '../../package.json'), 'utf8'))
for (const [name, version] of Object.entries(repositoryManifest.dependencies)) {
  if (runtimeManifest.dependencies[name] !== version) throw new Error(`Update desktop runtime and lockfile for ${name}@${version}`)
}
const archive = join(cache, archiveName)
let bytes
try { bytes = await readFile(archive) } catch (error) { if (error.code !== 'ENOENT') throw error }
if (!bytes) {
  console.log(`Downloading Node ${nodeVersion}…`)
  const response = await fetch(`https://nodejs.org/dist/v${nodeVersion}/${archiveName}`)
  if (!response.ok) throw new Error(`Node download failed: HTTP ${response.status}`)
  bytes = Buffer.from(await response.arrayBuffer())
  await writeFile(archive, bytes)
}
if (createHash('sha256').update(bytes).digest('hex') !== archiveHash) throw new Error(`Node SHA256 mismatch; remove only ${archive} and retry`)
// Paths are arguments, never interpolated PowerShell source.
await writeFile(join(cache, 'expand.ps1'), 'param([string]$Archive,[string]$Destination)\nExpand-Archive -LiteralPath $Archive -DestinationPath $Destination -Force\n')
await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', join(cache, 'expand.ps1'), archive, cache], root)
const nodeFolder = join(cache, `node-v${nodeVersion}-win-x64`)
await cp(join(nodeFolder, 'node.exe'), join(backend, 'node.exe'))
await cp(join(nodeFolder, 'LICENSE'), join(backend, 'NODE-LICENSE'))
const node = join(backend, 'node.exe')
console.log('Building both product clients…')
await run(node, ['scripts/build-client.mjs'], product)
await run(node, ['scripts/build-career.mjs'], product)
for (const file of ['package.json', 'package-lock.json']) await cp(join(root, 'runtime', file), join(backend, file))
const npmCli = join(nodeFolder, 'node_modules', 'npm', 'bin', 'npm-cli.js')
console.log('Installing pinned runtime dependencies…')
await run(node, [npmCli, 'ci', '--omit=dev', '--no-audit', '--no-fund', '--cache', join(cache, 'npm')], backend)
const target = join(backend, 'node_modules', '@deepseek-ai', 'dsh-shizhi-interview')
await mkdir(target, { recursive: true })
for (const name of ['src', 'lib', 'client', 'cordis.patch.yml', 'LICENSE', 'NOTICE.md', 'README.md', 'README.zh.md']) {
  await cp(join(product, name), join(target, name), { recursive: true })
}
const productManifest = JSON.parse(await readFile(join(product, 'package.json'), 'utf8'))
delete productManifest.devDependencies
delete productManifest.scripts
productManifest.dependencies = repositoryManifest.dependencies
await writeFile(join(target, 'package.json'), JSON.stringify(productManifest, null, 2) + '\n')
await cp(join(root, 'bridge'), join(backend, 'node_modules', '@shizhi', 'desktop-bridge'), { recursive: true })

const inventory = []
async function audit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Release contains a non-relocatable link: ${file}`)
    if (entry.isDirectory()) { if (entry.name === '.bin') continue; await audit(file); continue }
    if (/^\.env(?:\.|$)|\.(?:sqlite|db)(?:-|$)|^desktop-credentials\.json$/.test(entry.name)) throw new Error(`Unexpected personal data in release: ${file}`)
    if (entry.name === 'package.json') {
      const pkg = JSON.parse(await readFile(file, 'utf8'))
      if (pkg.name && pkg.version) inventory.push({ name: pkg.name, version: pkg.version, license: pkg.license || 'SEE PACKAGE NOTICE' })
    }
  }
}
await audit(backend)
const trimmed = await trimRuntime(join(backend, 'node_modules'))
console.log(`Removed ${trimmed.files} compiler/debug sidecars (${(trimmed.bytes / 1048576).toFixed(1)} MiB); runtime code and licenses retained.`)
await writeFile(join(backend, 'runtime-inventory.json'), JSON.stringify({ node: nodeVersion, archiveHash, packages: inventory }, null, 2) + '\n')

await writeIcon(join(root, 'build/icon.ico'))
console.log(`Prepared Windows x64 backend with ${inventory.length} package manifests; personal-data audit passed.`)
