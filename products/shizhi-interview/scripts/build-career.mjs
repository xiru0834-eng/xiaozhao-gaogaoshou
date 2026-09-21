/** Builds the same-repository workbench through checked UI and data adapters. */
import { build } from 'esbuild'
import { readFile, mkdir, writeFile, access, cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prepareCareerHtml, assertCareerAdapters } from './career-html.mjs'

const root = resolve('../..')
const out = resolve('client/career')
const source = await readFile(resolve(root, 'web/index.html'), 'utf8').catch(() => {
  throw new Error('Missing workbench source. Run this package inside the xiaozhao-gaogaoshou repository.')
})
const html = prepareCareerHtml(source)
await mkdir(resolve(out, 'assets'), { recursive: true })
await cp(resolve(root, 'web/public/assets'), resolve(out, 'assets'), { recursive: true })
const result = await build({ entryPoints: [resolve(root, 'src/client/main.ts')], outfile: resolve(out, 'assets/workbench.js'),
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
await access(resolve(out, 'assets/workbench.css'))
await writeFile(resolve(out, 'index.html'), html)
await build({ stdin: { contents: `export { openProfileData } from ${JSON.stringify(resolve(root, 'src/server/data-context.ts'))};\nexport { lockProfile } from ${JSON.stringify(resolve(root, 'src/server/runtime-config.ts'))};\nexport { createWorkbench } from ${JSON.stringify(resolve(root, 'src/server/workbench.ts'))};\nexport { parseStatuses } from ${JSON.stringify(resolve(root, 'src/shared/types.ts'))};`,
  resolveDir: root, sourcefile: 'shizhi-career-data.ts' }, outfile: 'lib/career-data.js', bundle: true,
  format: 'esm', platform: 'node', packages: 'external', target: 'node22', logLevel: 'info' })
