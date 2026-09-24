/** Keeps the integrated workbench and parent coach on the same appearance selection. */
import { productPalette, readProductAppearance } from '../client/shared/product-appearance.js'

/** Observes committed appearance changes, excluding the appearance dialog's preview.
 * @returns {void} Listeners and the observer live for this iframe document's lifetime.
 */
export function mountCareerAppearance() {
  const root = document.documentElement
  document.body.classList.add('sz-career')
  const sync = () => {
    const selected = root.dataset.skin && root.dataset.theme
      ? { skin: root.dataset.skin, mode: root.dataset.theme } : readProductAppearance()
    for (const [key, value] of Object.entries(productPalette(selected))) document.body.style.setProperty(`--${key}`, value)
    window.parent.postMessage({ type: 'shizhi-career-appearance', skin: selected.skin, mode: selected.mode }, location.origin)
  }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-skin', 'data-theme'] })
  window.addEventListener('message', (event) => {
    if (event.origin === location.origin && event.source === window.parent && event.data?.type === 'shizhi-career-appearance-request') sync()
  })
  sync()
}
