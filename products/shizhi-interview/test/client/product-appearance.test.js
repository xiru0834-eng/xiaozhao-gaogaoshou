import test from 'node:test'
import assert from 'node:assert/strict'
import { appearanceFromMessage, coachTheme, productPalette } from '../../src/client/shared/product-appearance.js'
import { mountCareerAppearance } from '../../src/integrations/career-appearance.js'

const skins = ['mint', 'blue', 'sakura', 'violet', 'amber']
const luminance = (hex) => {
  const channels = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255)
    .map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
}
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)

test('every saved appearance gives both workspaces matching readable body and selected control colors', () => {
  for (const skin of skins) for (const mode of ['light', 'dark']) {
    const palette = productPalette({ skin, mode })
    const coach = coachTheme({ skin, mode })
    for (const [key, value] of Object.entries({ page: 'bg', paper: 'paper', ink: 'ink', muted: 'muted', green: 'accent', 'on-accent': 'on-accent' })) {
      assert.equal(coach[`--sz-${key}`], palette[value], `${skin}/${mode}: ${key}`)
    }
    for (const surface of ['bg', 'paper', 'paper-2']) for (const text of ['ink', 'muted']) {
      assert.ok(contrast(palette[text], palette[surface]) >= 4.5, `${skin}/${mode}: ${text}/${surface}`)
    }
    assert.ok(contrast(palette['on-accent'], palette.accent) >= 4.5, `${skin}/${mode}: selected control`)
  }
})

test('appearance messages accept supported identifiers, not arbitrary CSS or unrelated actions', () => {
  for (const data of [null, {}, [], { type: 'shizhi-career' },
    { type: 'shizhi-career-appearance', skin: 'red', mode: 'light' },
    { type: 'shizhi-career-appearance', skin: 'mint', mode: 'auto' }]) assert.equal(appearanceFromMessage(data), null)
  assert.deepEqual(appearanceFromMessage({ type: 'shizhi-career-appearance', skin: 'blue', mode: 'dark', color: 'url(example)' }), { skin: 'blue', mode: 'dark' })
})

test('the embedded workbench syncs committed themes and answers only its own parent origin', (t) => {
  const root = { dataset: { skin: 'mint', theme: 'light' } }
  const tokens = new Map(), messages = [], listeners = new Map(), dispatched = []
  const parent = { postMessage: (message, origin) => messages.push({ message, origin }) }
  let observerCallback
  for (const [key, value] of Object.entries({
    document: { documentElement: root, body: { classList: { add: (name) => assert.equal(name, 'sz-career') }, style: { setProperty: (name, color) => tokens.set(name, color) } } },
    window: { parent, addEventListener: (event, callback) => listeners.set(event, callback), dispatchEvent: (event) => dispatched.push(event) },
    location: { origin: 'http://localhost:4318' },
    MutationObserver: class { constructor(callback) { observerCallback = callback } observe(target, options) {
      assert.equal(target, root); assert.deepEqual(options.attributeFilter, ['data-skin', 'data-theme'])
    } },
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, value })
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key])
  }
  mountCareerAppearance()
  assert.equal(tokens.get('--accent'), coachTheme({ skin: 'mint', mode: 'light' })['--sz-green'])
  root.dataset = { skin: 'violet', theme: 'dark' }; observerCallback()
  assert.deepEqual(messages.at(-1), { message: { type: 'shizhi-career-appearance', skin: 'violet', mode: 'dark' }, origin: location.origin })
  const receive = listeners.get('message')
  const request = { source: parent, origin: location.origin, data: { type: 'shizhi-career-appearance-request' } }
  receive({ ...request, source: {} }); receive({ ...request, origin: 'https://example.com' })
  assert.equal(messages.length, 2)
  receive(request); assert.equal(messages.length, 3)
  const modeRequest = { ...request, data: { type: 'shizhi-product-theme', mode: 'dark' } }
  receive({ ...modeRequest, source: {} }); receive({ ...modeRequest, origin: 'https://example.com' })
  receive({ ...request, data: { type: 'shizhi-product-theme', mode: 'invalid' } })
  assert.equal(dispatched.length, 0)
  receive(modeRequest)
  assert.equal(dispatched[0].type, 'workbench:color-mode')
  assert.equal(dispatched[0].detail, 'dark')
  const toggle = new CustomEvent('workbench:color-mode-request', { cancelable: true, detail: 'light' })
  listeners.get(toggle.type)(toggle)
  assert.equal(toggle.defaultPrevented, true)
  assert.deepEqual(messages.at(-1), { message: { type: 'shizhi-theme-request', mode: 'light' }, origin: location.origin })
})
