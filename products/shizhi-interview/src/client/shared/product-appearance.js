/** Shared colors for the workbench iframe and the interview workspace. */
import { paletteFor, readAppearance, SKINS } from '../../../../../src/client/appearance-model.ts'

/** Reads the workbench's existing preference without introducing another storage key.
 * @returns {object} Saved appearance, or the workbench default when storage is blocked.
 */
export function readProductAppearance() {
  let storage
  try { storage = window.localStorage } catch (error) { /* Blocked storage uses the workbench's in-memory default. */ }
  return readAppearance(storage)
}

/** Accepts only supported skin and mode identifiers from the same-origin frame message.
 * @param {unknown} data Message payload; callers must verify the event origin and source.
 * @returns {object|null} Appearance selection or null for unrelated or invalid messages.
 */
export function appearanceFromMessage(data) {
  if (!data || data.type !== 'shizhi-career-appearance' || !SKINS.some((skin) => skin.id === data.skin)
    || !['light', 'dark'].includes(data.mode)) return null
  return { skin: data.skin, mode: data.mode }
}

/** Resolves the workbench skin into colors shared by both integrated pages.
 * @param {object} appearance Supported skin and color mode.
 * @returns {object} Workbench CSS token values.
 */
export function productPalette({ skin, mode }) {
  const palette = paletteFor(skin, mode)
  if (skin === 'mint' && mode === 'light') Object.assign(palette, {
    bg: '#f3f6f8', 'paper-2': '#f7f9fb', ink: '#1b2d3c', muted: '#5f7180', faint: '#5f7180',
    line: '#dce5e9', 'line-strong': '#8b9fab', accent: '#245665', 'accent-ink': '#286576', 'accent-soft': '#e6f0f2',
  })
  return palette
}

/** Projects the shared palette into the coach's semantic CSS variables.
 * @param {object} appearance Supported skin and color mode.
 * @returns {object} Inline style properties scoped to the integrated product.
 */
export function coachTheme(appearance) {
  const palette = productPalette(appearance)
  const dark = appearance.mode === 'dark'
  const mapping = { page: 'bg', paper: 'paper', wash: 'paper-2', input: 'paper-2', ink: 'ink', muted: 'muted',
    green: 'accent', accent: 'accent-ink', selected: 'accent-soft', line: 'line', border: 'line-strong', 'on-accent': 'on-accent' }
  return { ...Object.fromEntries(Object.entries(mapping).map(([key, value]) => [`--sz-${key}`, palette[value]])),
    '--sz-mode': appearance.mode,
    '--sz-hover': `color-mix(in srgb, ${palette.accent} 88%, ${dark ? '#ffffff' : '#102938'})`,
    '--sz-error': dark ? '#ffb0a5' : '#ab3c3c', '--sz-error-bg': dark ? '#402d2b' : '#fff0ee',
    '--sz-amber': dark ? '#efc382' : '#8b6228', '--sz-amber-bg': dark ? '#3c3327' : '#fff8eb',
    '--sz-info': dark ? '#aacbff' : '#536b8c',
  }
}

/** Default tokens for practice cards rendered outside the integrated home. */
export const DEFAULT_COACH_TOKENS = Object.entries(coachTheme({ skin: 'mint', mode: 'light' })).map(([key, value]) => `${key}:${value};`).join('')
