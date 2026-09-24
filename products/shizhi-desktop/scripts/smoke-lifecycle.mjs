/** Parent-loss regression with real dsh processes and a unique temporary home. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { startBackend } from '../src/backend.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const runtime = join(root, 'build/backend')
if (process.argv[2] === '--child') {
  const backend = await startBackend({ runtime, home: process.argv[3] })
  process.send({ pid: backend.pid })
} else {
  const home = await mkdtemp(join(root, 'build', 'lifetime-home-'))
  const child = spawn(join(runtime, 'node.exe'), [fileURLToPath(import.meta.url), '--child', home], {
    windowsHide: true, stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  })
  const closed = new Promise((done) => child.once('close', done))
  let pid
  const alive = () => { try { process.kill(pid, 0); return true } catch (error) { if (error.code === 'ESRCH') return false; throw error } }
  try {
    pid = await new Promise((done, reject) => {
      const timeout = setTimeout(() => reject(new Error('Parent-loss fixture startup timed out')), 45000)
      child.once('message', (message) => { clearTimeout(timeout); done(message.pid) })
      child.once('error', (error) => { clearTimeout(timeout); reject(error) })
      child.once('exit', () => { clearTimeout(timeout); reject(new Error('Parent-loss fixture exited before readiness')) })
    })
    child.kill()
    await closed
    const deadline = Date.now() + 12000
    while (alive() && Date.now() < deadline) await delay(100)
    assert.equal(alive(), false, 'backend exits after the Electron owner disappears')
    const abort = new AbortController()
    abort.abort()
    await assert.rejects(startBackend({ runtime, home, signal: abort.signal }), { name: 'AbortError' })
    console.log('PASS: parent loss shuts down the real backend; cancelled startup does not reopen it.')
  } finally {
    child.kill(); await closed
    if (pid && alive()) process.kill(pid)
    await rm(home, { recursive: true, force: true })
  }
}
