/** Builds the invited upstream checkout through explicit UI and data adapters. */
import { build } from 'esbuild'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { t } from '../src/client/shared/coach-locale.js'

const root = resolve('../..')
const out = resolve('client/career')
const upstream = JSON.parse(await readFile(new URL('./career-upstream.json', import.meta.url), 'utf8'))
const source = await readFile(resolve(root, 'web/index.html'), 'utf8').catch(() => {
  throw new Error('Missing workbench source. Run this package inside the xiaozhao-gaogaoshou repository.')
})
try {
  execFileSync('git', ['-C', root, 'diff', '--quiet', upstream.commit, '--', 'src', 'web'])
} catch (error) {
  throw new Error('Workbench source differs from the tested revision. Review the adapters and update scripts/career-upstream.json before building; use a full Git clone so the pinned revision is available.', { cause: error })
}
await mkdir(out, { recursive: true })
await build({ entryPoints: [resolve(root, 'src/client/main.ts')], outfile: resolve(out, 'workbench.js'),
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022', logLevel: 'info',
  plugins: [{ name: 'shizhi-career-adapters', setup(builder) {
    builder.onResolve({ filter: /^\.\/(session|model-settings)\.ts$/ }, (args) => {
      if (args.importer.replaceAll('\\', '/') !== `${root.replaceAll('\\', '/')}/src/client/main.ts`) return undefined
      return { path: resolve(args.path === './session.ts' ? 'src/integrations/career-session.js' : 'src/integrations/career-navigation.js') }
    })
  } }],
})
const html = source.replace('<title>校招高高手 · TypeScript 预览</title>', '<title>校招高高手 · 拾知面试陪练</title>')
  .replace(/<footer><details>[\s\S]*?<\/details><\/footer>/, `<footer><details><summary>${t('careerHelp')}</summary><p class="src">${t('careerFooter')}</p></details></footer>`)
  .replaceAll('href="/api/backup', 'href="/interview/career/api/backup')
  .replace('<script type="module" src="/main.ts"></script>', '<link rel="stylesheet" href="/interview/career/assets/workbench.css">\n<script type="module" src="/interview/career/assets/workbench.js"></script>')
await writeFile(resolve(out, 'index.html'), html)
await build({ stdin: { contents: `export { CatalogStore } from ${JSON.stringify(resolve(root, 'src/server/catalog-store.ts'))};\nexport { Store } from ${JSON.stringify(resolve(root, 'src/server/store.ts'))};\nexport { parseStatuses } from ${JSON.stringify(resolve(root, 'src/shared/types.ts'))};`,
  resolveDir: root, sourcefile: 'shizhi-career-data.ts' }, outfile: 'lib/career-data.js', bundle: true,
  format: 'esm', platform: 'node', target: 'node22', logLevel: 'info' })
