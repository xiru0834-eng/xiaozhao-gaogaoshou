/** Uses the settings theme for every product surface; the workbench owns only its skin. */
import { appearanceFromMessage, coachTheme, readProductAppearance } from './product-appearance.js'

/** Synchronizes theme settings, product tokens, and the same-origin workbench iframe.
 * @param {object} ctx Client context with the theme service and scoped events.
 * @returns {Function} Restores owned document tokens and releases listeners.
 */
export function installProductAppearance(ctx) {
  const theme = ctx.get('theme')
  const root = document.documentElement
  let skin = readProductAppearance().skin
  const previousMode = root.getAttribute('data-shizhi-mode')
  const previous = new Map(Object.keys(coachTheme({ skin, mode: 'light' }))
    .map((key) => [key, [root.style.getPropertyValue(key), root.style.getPropertyPriority(key)]]))
  const frame = () => document.querySelector('.sz-career-frame')?.contentWindow
  const mode = () => theme.getTheme().active.colorScheme
  const sendMode = () => frame()?.postMessage({ type: 'shizhi-product-theme', mode: mode() }, location.origin)
  const paint = () => {
    root.setAttribute('data-shizhi-mode', mode())
    for (const [key, value] of Object.entries(coachTheme({ skin, mode: mode() }))) root.style.setProperty(key, value)
  }
  const receive = (event) => {
    if (event.origin !== location.origin || event.source !== frame()) return
    const appearance = appearanceFromMessage(event.data)
    if (appearance) {
      if (appearance.skin !== skin) { skin = appearance.skin; paint() }
      // An iframe's saved mode is only a cache; it cannot replace the system preference.
      if (appearance.mode !== mode()) sendMode()
    } else if (event.data?.type === 'shizhi-theme-request' && ['light', 'dark'].includes(event.data.mode)) {
      theme.setTheme(event.data.mode)
      sendMode()
    }
  }
  const unsubscribe = ctx.on('theme/change', () => { paint(); sendMode() })
  window.addEventListener('message', receive)
  paint()
  sendMode()
  return () => {
    unsubscribe()
    window.removeEventListener('message', receive)
    if (previousMode === null) root.removeAttribute('data-shizhi-mode')
    else root.setAttribute('data-shizhi-mode', previousMode)
    for (const [key, [value, priority]] of previous) {
      if (value) root.style.setProperty(key, value, priority)
      else root.style.removeProperty(key)
    }
  }
}
