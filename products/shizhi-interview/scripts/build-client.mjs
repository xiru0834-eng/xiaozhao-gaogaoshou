import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'

await mkdir('lib', { recursive: true })
await writeFile('lib/index.js', [
  "export { apply, createRuntime, inject, name } from '../src/adapters/dsh/plugin.js'",
  "export { createAtomicToolDefinitions } from '../src/adapters/dsh/atomic-tool-definitions.js'",
  "export { createPresentationToolDefinitions } from '../src/adapters/dsh/presentation-tool-definitions.js'",
  '',
].join('\n'))

await build({
  entryPoints: ['src/client/index.js'],
  outfile: 'client/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  external: ['react', '@deepseek-ai/dsh-client-ui-primitives'],
  banner: {
    js: 'window.__ModuleLoader__.load({ id: "@deepseek-ai/dsh-shizhi-interview", factory: (require) => { var module = { exports: {} }; var exports = module.exports;',
  },
  footer: {
    js: 'return module.exports; }});',
  },
  logLevel: 'info',
})
