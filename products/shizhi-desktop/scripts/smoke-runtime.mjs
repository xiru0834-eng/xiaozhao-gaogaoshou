/** Exercises the shipped dsh entry with no package manager or developer Node on PATH. */
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve, delimiter } from 'node:path'
import { startBackend } from '../src/backend.mjs'
import { createServer } from 'node:net'
import { once } from 'node:events'

const root = fileURLToPath(new URL('../', import.meta.url))
const runtime = process.argv[2] ? resolve(process.argv[2]) : join(root, 'build', 'backend')
const home = await mkdtemp(join(root, 'build', 'smoke-home-'))
const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === 'path') || 'PATH'
process.env[pathKey] = [join(process.env.SystemRoot, 'System32'), join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0')].join(delimiter)
let first, second, restarted, fallback, occupied
async function connect(server) {
  const response = await fetch(server.url, { redirect: 'manual' })
  const cookie = response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  assert.ok(cookie, 'official launch-token exchange returned a session cookie')
  const origin = new URL(server.url).origin
  const request = async (path, body) => {
    const result = await fetch(new URL(path, origin), { headers: { cookie, origin, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }) })
    assert.equal(result.status, 200, `${path} returned HTTP ${result.status}`)
    return result.json()
  }
  return { request, origin, cookie }
}
try {
  console.log('Starting bundled dsh with a fresh data home and no developer tools on PATH…')
  first = await startBackend({ runtime, home })
  const a = await connect(first)
  const bank = await a.request('/interview/api/question-bank')
  assert.equal(bank.items.length, 56)
  assert.equal((await fetch(`${a.origin}/interview/api/question-bank`)).status, 401)
  await a.request('/interview/api/question-bank', { key: bank.items[0].key, mastered: true })
  const career = await fetch(`${a.origin}/interview/career/`, { headers: { cookie: a.cookie } })
  assert.equal(career.status, 200)
  assert.match(await career.text(), /校招/)
  const voice = await a.request('/interview/api/voice')
  assert.equal(voice.ready, false)
  second = await startBackend({ runtime, home: join(home, 'other') })
  assert.notEqual(new URL(second.url).port, new URL(first.url).port)
  assert.deepEqual(await second.stop(), { code: 0, forced: false })
  assert.deepEqual(await first.stop(), { code: 0, forced: false })
  await assert.rejects(fetch(a.origin, { signal: AbortSignal.timeout(3000) }))
  restarted = await startBackend({ runtime, home })
  const restored = await connect(restarted)
  assert.equal(new URL(restarted.url).port, new URL(first.url).port)
  const again = await restored.request('/interview/api/question-bank')
  assert.equal(again.items.find((item) => item.key === bank.items[0].key).mastered, true)
  assert.deepEqual(await restarted.stop(), { code: 0, forced: false })
  occupied = createServer()
  occupied.listen(Number(new URL(restarted.url).port), '127.0.0.1')
  await once(occupied, 'listening')
  fallback = await startBackend({ runtime, home, timeoutMs: 15000 })
  assert.notEqual(new URL(fallback.url).port, new URL(restarted.url).port)
  assert.deepEqual(await fallback.stop(), { code: 0, forced: false })
  console.log('PASS: offline runtime, authentication, 56 questions, workbench, speech status, independent ports, graceful exit and persisted mastery after restart.')
} finally {
  await Promise.allSettled([first?.stop(), second?.stop(), restarted?.stop(), fallback?.stop()])
  if (occupied?.listening) await new Promise((done) => occupied.close(done))
  // mkdtemp created this exact directory under the desktop build tree.
  await rm(home, { recursive: true, force: true })
}
