/** Refuses an installer whose copied runtime cannot boot independently. */
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { access, readdir } from 'node:fs/promises'

/** Checks final resource paths through the same official launcher used at runtime.
 * @param {object} context Electron-builder pack context.
 */
export default async function afterPack({ appOutDir, packager }) {
  // NSIS's ZIP reader interprets non-ASCII archive names using the Windows code page.
  // Keep payload names ASCII while localizing the shortcut, installer, and window titles.
  const incompatible = (await readdir(appOutDir, { recursive: true })).find((name) => /[^\x00-\x7f]/.test(name))
  if (incompatible) throw new Error(`NSIS ZIP payload requires an ASCII filename: ${incompatible}`)
  const runtime = join(appOutDir, 'resources/backend')
  await access(join(runtime, 'node_modules/@deepseek-ai/dsh/lib/bin.js'))
  await new Promise((done, reject) => {
    const child = spawn(join(runtime, 'node.exe'), [join(packager.projectDir, 'scripts/smoke-runtime.mjs'), runtime], {
      cwd: packager.projectDir, stdio: 'inherit', windowsHide: true,
    })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? done() : reject(new Error(`Packaged runtime check failed: ${code}`)))
  })
}
