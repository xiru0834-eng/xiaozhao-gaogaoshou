import test from 'node:test'
import assert from 'node:assert/strict'
import { installProductAppearance } from '../../src/client/shared/appearance-bridge.js'
import { coachTheme } from '../../src/client/shared/product-appearance.js'

function fixture(t) {
  const styles = new Map([['--sz-page', ['original', 'important']]])
  const attributes = new Map([['data-shizhi-mode', 'original']])
  const listeners = new Map(), messages = [], requests = []
  const origin = 'http://localhost:4318'
  const frame = { postMessage: (data, target) => messages.push({ data, target }) }
  let snapshot = { preference: 'system', active: { colorScheme: 'dark' } }
  let change, subscribed = true
  const ctx = {
    get: () => ({
      getTheme: () => snapshot,
      setTheme: (preference) => { requests.push(preference); update(preference, preference) },
    }),
    on: (event, callback) => {
      assert.equal(event, 'theme/change'); change = callback
      return () => { subscribed = false }
    },
  }
  function update(preference, mode) {
    snapshot = { preference, active: { colorScheme: mode } }; change(snapshot)
  }
  for (const [key, value] of Object.entries({
    document: {
      querySelector: () => ({ contentWindow: frame }),
      documentElement: {
        getAttribute: (name) => attributes.get(name) ?? null,
        setAttribute: (name, value) => attributes.set(name, value),
        removeAttribute: (name) => attributes.delete(name),
        style: {
          getPropertyValue: (name) => styles.get(name)?.[0] ?? '',
          getPropertyPriority: (name) => styles.get(name)?.[1] ?? '',
          setProperty: (name, value, priority = '') => styles.set(name, [value, priority]),
          removeProperty: (name) => styles.delete(name),
        },
      },
    },
    window: {
      localStorage: { getItem: () => null },
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name, callback) => { assert.equal(listeners.get(name), callback); listeners.delete(name) },
    },
    location: { origin },
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, value })
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key])
  }
  const dispose = installProductAppearance(ctx)
  return { styles, attributes, messages, requests, listeners, dispose, update,
    subscribed: () => subscribed, snapshot: () => snapshot,
    receive: (data, overrides = {}) => listeners.get('message')({ source: frame, origin, data, ...overrides }),
  }
}

test('settings and system changes repaint every product surface without converting system to a fixed preference', (t) => {
  const f = fixture(t)
  assert.equal(f.styles.get('--sz-page')[0], coachTheme({ skin: 'mint', mode: 'dark' })['--sz-page'])
  f.receive({ type: 'shizhi-career-appearance', skin: 'blue', mode: 'light' })
  assert.equal(f.snapshot().preference, 'system')
  assert.deepEqual(f.requests, [])
  assert.equal(f.messages.at(-1).data.mode, 'dark', 'a stale iframe cache receives the resolved host mode')
  f.update('system', 'light')
  assert.equal(f.styles.get('--sz-green')[0], coachTheme({ skin: 'blue', mode: 'light' })['--sz-green'])
  assert.equal(f.attributes.get('data-shizhi-mode'), 'light')
  assert.equal(f.messages.at(-1).data.mode, 'light')
  const count = f.messages.length
  f.receive({ type: 'shizhi-career-appearance', skin: 'blue', mode: 'light' })
  assert.equal(f.messages.length, count, 'matching acknowledgements do not echo')
  f.dispose()
  assert.equal(f.subscribed(), false)
  assert.equal(f.listeners.size, 0)
  assert.deepEqual([...f.styles], [['--sz-page', ['original', 'important']]])
  assert.equal(f.attributes.get('data-shizhi-mode'), 'original')
})

test('only an explicit mode request from the owned iframe changes the saved settings preference', (t) => {
  const f = fixture(t)
  const request = { type: 'shizhi-theme-request', mode: 'light' }
  f.receive(request, { origin: 'https://example.com' })
  f.receive(request, { source: {} })
  f.receive({ ...request, mode: 'invalid' })
  assert.deepEqual(f.requests, [])
  f.receive(request)
  assert.deepEqual(f.requests, ['light'])
  assert.equal(f.snapshot().preference, 'light')
  assert.equal(f.attributes.get('data-shizhi-mode'), 'light')
  f.dispose()
})
