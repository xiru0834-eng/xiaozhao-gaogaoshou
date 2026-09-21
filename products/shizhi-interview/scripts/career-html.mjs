/** Validates the workbench elements used by the product adapters and rewrites local assets. */
import { parse, parseFragment, serialize } from 'parse5'
import { t } from '../src/client/shared/coach-locale.js'

function* elements(node) {
  if (node.tagName) yield node
  for (const child of node.childNodes || []) yield* elements(child)
}

const attribute = (node, name) => node.attrs.find((item) => item.name === name)

/** Produces same-origin workbench HTML, failing when a required integration element is missing.
 * @param {string} source Source web/index.html, independent of its Git revision.
 * @returns {string} HTML with Harness routes and product help.
 */
export function prepareCareerHtml(source) {
  const document = parse(source)
  const nodes = [...elements(document)]
  const requireOne = (label, predicate) => {
    const found = nodes.filter(predicate)
    if (found.length !== 1) throw new Error(`Workbench web/index.html must contain exactly one ${label}; update the workbench and its interview adapters together.`)
    return found[0]
  }
  for (const id of ['savenote', 'board', 'company-detail', 'detail-title']) {
    requireOne(`#${id}`, (node) => attribute(node, 'id')?.value === id)
  }
  requireOne('.header-tools', (node) => attribute(node, 'class')?.value.split(/\s+/).includes('header-tools'))
  for (const [name, placeholder] of [['app-token', '__APP_TOKEN__'], ['profile-id', '__PROFILE_ID__']]) {
    const meta = requireOne(`meta[name="${name}"]`, (node) => node.tagName === 'meta' && attribute(node, 'name')?.value === name)
    if (attribute(meta, 'content')?.value !== placeholder) throw new Error(`Workbench ${name} must use the ${placeholder} placeholder.`)
  }
  const script = requireOne('module entry /main.ts', (node) => node.tagName === 'script' && attribute(node, 'type')?.value === 'module' && attribute(node, 'src')?.value === '/main.ts')
  attribute(script, 'src').value = '/interview/career/assets/workbench.js'
  const head = requireOne('head', (node) => node.tagName === 'head')
  head.childNodes.push(...parseFragment('<meta name="asset-prefix" content="/interview/career">').childNodes)
  head.childNodes.push(...parseFragment('<link rel="stylesheet" href="/interview/career/assets/workbench.css">').childNodes)
  const title = requireOne('title', (node) => node.tagName === 'title')
  title.childNodes = [{ nodeName: '#text', value: t('careerBrand'), parentNode: title }]
  const footer = requireOne('footer', (node) => node.tagName === 'footer')
  footer.childNodes = parseFragment(`<details><summary>${t('careerHelp')}</summary><p class="src">${t('careerFooter')}</p></details>`).childNodes
  for (const node of nodes) {
    const href = attribute(node, 'href')
    if (href && /^\/api\/backup(?:[?#]|$)/.test(href.value)) href.value = `/interview/career${href.value}`
  }
  return `${serialize(document).trimEnd()}\n`
}

/** Confirms that workbench sessions and coach navigation use the Harness adapters.
 * @param {Iterable<string>} inputs Bundler input paths.
 * @returns {void} Throws if a workbench import change bypasses an adapter.
 */
export function assertCareerAdapters(inputs) {
  const paths = [...inputs].map((path) => path.replaceAll('\\', '/'))
  for (const name of ['career-session.js', 'career-navigation.js']) {
    if (!paths.some((path) => path.endsWith(`src/integrations/${name}`))) {
      throw new Error(`Workbench build did not load ${name}; update scripts/build-career.mjs for the workbench imports.`)
    }
  }
}
