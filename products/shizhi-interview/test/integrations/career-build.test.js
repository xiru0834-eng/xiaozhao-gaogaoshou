import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareCareerHtml, assertCareerAdapters } from '../../scripts/career-html.mjs'

const source = `<!doctype html><html><head><title>新工作台标题</title>
<meta content='__APP_TOKEN__' name='app-token'><meta name='profile-id' content='__PROFILE_ID__'>
</head><body><header class='custom header-tools'></header><span id='savenote'></span>
<main id='board'></main><dialog id='company-detail'><h2 id='detail-title'></h2></dialog>
<a href='/api/backup?kind=catalog'>备份</a><a href='https://example.com/job'>岗位</a>
<footer>上游保存说明</footer><script src='/main.ts' type='module'></script></body></html>`

test('workbench layout and copy changes preserve integrated entry, identity and backup routes', () => {
  const output = prepareCareerHtml(source)
  assert.match(output, /<title>校招高高手 × 拾知<\/title>/)
  assert.match(output, /src="\/interview\/career\/assets\/workbench.js"/)
  assert.match(output, /href="\/interview\/career\/assets\/workbench.css"/)
  assert.match(output, /href="\/interview\/career\/api\/backup\?kind=catalog"/)
  assert.match(output, /href="https:\/\/example.com\/job"/)
  assert.match(output, /__APP_TOKEN__/)
  assert.match(output, /__PROFILE_ID__/)
  assert.match(output, /name="asset-prefix" content="\/interview\/career"/)
  assert.doesNotMatch(output, /上游保存说明/)
})

test('missing or duplicate integration elements fail before publishing workbench HTML', () => {
  for (const id of ['board', 'savenote', 'company-detail', 'detail-title']) {
    assert.throws(() => prepareCareerHtml(source.replace(`id='${id}'`, `id='renamed-${id}'`)), new RegExp(`#${id}`))
  }
  assert.throws(() => prepareCareerHtml(source.replace('custom header-tools', 'new-header')), /header-tools/)
  assert.throws(() => prepareCareerHtml(source.replace('/main.ts', '/new-main.ts')), /module entry/)
  assert.throws(() => prepareCareerHtml(source.replace('__APP_TOKEN__', 'hardcoded')), /__APP_TOKEN__/)
  assert.throws(() => prepareCareerHtml(source.replace('</body>', '<main id="board"></main></body>')), /#board/)
})

test('a changed workbench import cannot silently bypass either Harness adapter', () => {
  const paths = ['src/integrations/career-session.js', 'src/integrations/career-navigation.js']
  assert.doesNotThrow(() => assertCareerAdapters(paths))
  assert.doesNotThrow(() => assertCareerAdapters(paths.map((path) => path.replaceAll('/', '\\'))))
  for (const path of paths) assert.throws(() => assertCareerAdapters([path]), /did not load/)
})
