/** Builds the same-repository workbench through checked UI and data adapters. */
import { build } from 'esbuild'
import { readFile, mkdir, writeFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prepareCareerHtml, assertCareerAdapters } from './career-html.mjs'

const root = resolve('../..')
const out = resolve('client/career')
const source = await readFile(resolve(root, 'web/index.html'), 'utf8').catch(() => {
  throw new Error('Missing workbench source. Run this package inside the xiaozhao-gaogaoshou repository.')
})
const html = prepareCareerHtml(source)
await mkdir(out, { recursive: true })
const result = await build({ entryPoints: [resolve(root, 'src/client/main.ts')], outfile: resolve(out, 'workbench.js'),
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022', logLevel: 'info', metafile: true,
  plugins: [{ name: 'shizhi-career-adapters', setup(builder) {
    builder.onResolve({ filter: /^\.\/(session|model-settings)\.ts$/ }, (args) => {
      if (args.importer.replaceAll('\\', '/') !== `${root.replaceAll('\\', '/')}/src/client/main.ts`) return undefined
      return { path: resolve(args.path === './session.ts' ? 'src/integrations/career-session.js' : 'src/integrations/career-navigation.js') }
    })
  } }],
})
assertCareerAdapters(Object.keys(result.metafile.inputs))
if (!Object.keys(result.metafile.outputs).some((path) => path.endsWith('workbench.css'))) {
  throw new Error('Workbench build must emit workbench.css; keep its stylesheet imported by src/client/main.ts.')
}
await access(resolve(out, 'workbench.css'))
await writeFile(resolve(out, 'index.html'), html)
await build({ stdin: { contents: `export { CatalogStore } from ${JSON.stringify(resolve(root, 'src/server/catalog-store.ts'))};\nexport { Store } from ${JSON.stringify(resolve(root, 'src/server/store.ts'))};\nexport { parseStatuses } from ${JSON.stringify(resolve(root, 'src/shared/types.ts'))};`,
  resolveDir: root, sourcefile: 'shizhi-career-data.ts' }, outfile: 'lib/career-data.js', bundle: true,
  format: 'esm', platform: 'node', target: 'node22', logLevel: 'info' })
