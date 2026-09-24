import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { INTERVIEW_TOOL_NAMES } from '../../src/protocol/interview-tool-names.js'
import { INTERACTION_PROTOCOL } from '../../src/protocol/interaction-protocol.js'

function loadPlugin(reactOverrides = {}) {
  const source = readFileSync(new URL('../../client/client.js', import.meta.url), 'utf8')
  let plugin = null
  const appended = []
  const fakeReact = {
    Fragment: Symbol('Fragment'),
    createElement: (...args) => ({ args }),
    useState: () => [null, () => {}],
    useEffect: () => {},
    useCallback: (callback) => callback,
    ...reactOverrides,
  }
  vm.runInNewContext(source, {
    console,
    URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    setTimeout,
    clearTimeout,
    document: {
      documentElement: {
        getAttribute: () => null, setAttribute: () => {}, removeAttribute: () => {},
        style: { getPropertyValue: () => '', getPropertyPriority: () => '', setProperty: () => {}, removeProperty: () => {} },
      },
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => ({}),
      head: { appendChild: (node) => appended.push(node) },
    },
    window: { addEventListener: () => {}, removeEventListener: () => {},
      __ModuleLoader__: { load(definition) { plugin = definition.factory((name) => name === 'react' ? fakeReact : {}) } } },
  })
  const apply = plugin.apply
  plugin = { ...plugin, apply: (ctx) => apply({ ...ctx, on: () => () => {},
    get: (name) => name === 'theme' ? { getTheme: () => ({ active: { colorScheme: 'light' } }) } : ctx.get(name),
  }) }
  return { plugin, appended }
}

test('new users can reach the practice workflows before a session or query result exists', () => {
  const { plugin } = loadPlugin({
    useState: (initial) => [initial === 'career' ? 'practice' : typeof initial === 'function' ? initial() : initial, () => {}],
    useRef: (initial) => ({ current: initial }),
    useMemo: (callback) => callback(),
    useId: () => 'initial-render',
  })
  let home
  const slots = {
    inject(_name, callback) { callback() },
    register(config, component) { if (config.name === 'main.conversation') home = component; return () => {} },
  }
  plugin.apply({ get: (name) => name === 'sessions'
    ? { list: { getSnapshot: () => ({ byId: {} }), subscribe: () => () => {} } }
    : slots, effect: (factory) => factory() })
  const renderText = (element) => {
    if (element === null || element === undefined || typeof element === 'boolean') return ''
    if (Array.isArray(element)) return element.map(renderText).join(' ')
    if (typeof element !== 'object') return String(element)
    const [component, props, ...children] = element.args
    return typeof component === 'function' ? renderText(component({ ...props, children })) : renderText(children)
  }
  const text = renderText(home({ sessionId: undefined }))
  assert.match(text, /进入题库/)
  assert.match(text, /模拟面试/)
  assert.match(text, /岗位专项/)
})

test('each coach navigation page renders only its own form and controls', () => {
  const expected = JSON.parse(readFileSync(new URL('../fixtures/coach-page-layout.json', import.meta.url), 'utf8'))
  for (const [page, snapshot] of Object.entries(expected)) {
    const { plugin } = loadPlugin({
      useState: (initial) => [initial === 'career' ? 'practice' : initial === 'studio' ? page : typeof initial === 'function' ? initial() : initial, () => {}],
      useRef: (initial) => ({ current: initial }), useMemo: (callback) => callback(), useId: () => 'page-test',
    })
    let home
    const slots = { inject(_name, callback) { callback() }, register(config, component) {
      if (config.name === 'main.conversation') home = component
      return () => {}
    } }
    plugin.apply({ get: (name) => name === 'sessions'
      ? { list: { getSnapshot: () => ({ byId: {} }), subscribe: () => () => {} } } : slots, effect: (factory) => factory() })
    const observed = { headings: [], inputs: [], textareas: 0, selects: 0, startButtons: [] }
    const visit = (element) => {
      if (element == null || typeof element === 'boolean') return ''
      if (Array.isArray(element)) return element.map(visit).join(' ')
      if (typeof element !== 'object') return String(element)
      const [component, props, ...children] = element.args
      if (props?.hidden || component === 'iframe') return ''
      if (typeof component === 'function') return visit(component({ ...props, children }))
      const text = visit(children).trim()
      if (/^h[1-6]$/.test(String(component))) observed.headings.push(text)
      if (component === 'input') observed.inputs.push(props.type || 'text')
      if (component === 'textarea') observed.textareas++
      if (component === 'select') observed.selects++
      if (component === 'button' && text.startsWith('开始')) observed.startButtons.push(text)
      return text
    }
    visit(home({ sessionId: undefined }))
    assert.deepEqual(observed, snapshot, page)
  }
})

function settled(interaction, extra = {}) {
  return {
    kind: 'tool-result',
    content: [{ type: 'text', text: JSON.stringify({ protocol: INTERACTION_PROTOCOL, ...interaction }) }],
    ...extra,
  }
}

test('overview direction counts exclude mastered questions and open that bank filter', () => {
  let overview, catalog
  const { plugin } = loadPlugin({
    useState: (initial) => [initial === 'career' ? 'practice' : typeof initial === 'function' ? initial() : initial, () => {}],
    useRef: (initial) => ({ current: initial }), useMemo: (callback) => callback(), useId: () => 'overview-test',
  })
  let home
  const slots = { inject(_name, callback) { callback() }, register(config, component) {
    if (config.name === 'main.conversation') home = component
    return () => {}
  } }
  plugin.apply({ get: (name) => name === 'sessions'
    ? { list: { getSnapshot: () => ({ byId: {} }), subscribe: () => () => {} } } : slots, effect: (factory) => factory() })
  const nodes = []
  const visit = (element) => {
    if (element == null || typeof element === 'boolean') return ''
    if (Array.isArray(element)) return element.map(visit).join(' ')
    if (typeof element !== 'object') return String(element)
    const [component, props, ...children] = element.args
    if (typeof component === 'function') {
      if (props?.onOpenBank) overview = component
      if (props?.onRestore && 'initialTrack' in props) catalog = component
      return visit(component({ ...props, children }))
    }
    const text = visit(children).trim()
    nodes.push({ type: component, ...props, text })
    return text
  }
  visit(home({ sessionId: undefined }))
  assert.equal(typeof overview, 'function')
  const opened = []
  const items = [
    { key: 'network-open', track: 'network', topic: '计算机网络', section: '', prompt: 'TCP 问题', mastered: false },
    { key: 'network-done', track: 'network', topic: '计算机网络', section: '', prompt: 'HTTP 问题', mastered: true },
    { key: 'database-open', track: 'database', topic: '数据库', section: '', prompt: '索引问题', mastered: false },
  ]
  nodes.length = 0
  visit(overview({ items, loading: false, disabled: false, onOpenBank: (track) => opened.push(track), onNavigate: (page) => opened.push(page) }))
  const direction = nodes.find((node) => node.type === 'button' && node.text.startsWith('计算机网络'))
  assert.match(direction.text, /计算机网络\s+1/)
  direction.onClick()
  nodes.find((node) => node.type === 'button' && node.text.startsWith('已斩题')).onClick()
  assert.deepEqual(opened, ['network', 'mastered'])

  const { plugin: bankPlugin } = loadPlugin({
    useState: (initial) => [initial === 'career' ? 'practice' : initial === 'studio' ? 'bank' : typeof initial === 'function' ? initial() : initial, () => {}],
    useRef: (initial) => ({ current: initial }), useMemo: (callback) => callback(), useId: () => 'filter-test',
  })
  bankPlugin.apply({ get: (name) => name === 'sessions'
    ? { list: { getSnapshot: () => ({ byId: {} }), subscribe: () => () => {} } } : slots, effect: (factory) => factory() })
  visit(home({ sessionId: undefined }))
  assert.equal(typeof catalog, 'function')
  nodes.length = 0
  visit(catalog({ items, initialTrack: 'network', loading: false, mastered: false, onStart: () => {}, onRestore: () => {} }))
  assert.deepEqual(nodes.filter((node) => node.type === 'h3').map((node) => node.text), ['TCP 问题'])
  assert.equal(nodes.find((node) => node.type === 'button' && node.text.startsWith('计算机网络'))['aria-pressed'], true)
})

test('preparation validates before starting and sends the selected interview settings', () => {
  let stateful = false, cursor = 0
  const states = []
  const { plugin } = loadPlugin({
    useState(initial) {
      if (!stateful) return [typeof initial === 'function' ? initial() : initial, () => {}]
      const index = cursor++
      if (!(index in states)) states[index] = initial
      return [states[index], (value) => { states[index] = value }]
    },
    useRef: (initial) => ({ current: initial }), useMemo: (callback) => callback(), useId: () => 'preparation-test',
  })
  let home, prepare
  const slots = { inject(_name, callback) { callback() }, register(config, component) {
    if (config.name === 'main.conversation') home = component
    return () => {}
  } }
  plugin.apply({ get: (name) => name === 'sessions'
    ? { list: { getSnapshot: () => ({ byId: {} }), subscribe: () => () => {} } } : slots, effect: (factory) => factory() })
  const discover = (element) => {
    if (Array.isArray(element)) { element.forEach(discover); return }
    if (!element?.args) return
    const [component, props, ...children] = element.args
    if (typeof component === 'function') {
      if (props?.kind === 'mock' && 'onStart' in props && 'targetRole' in props) prepare = component
      else discover(component({ ...props, children }))
    } else children.forEach(discover)
  }
  discover(home({ sessionId: undefined }))
  assert.equal(typeof prepare, 'function')
  stateful = true
  const requests = [], focused = []
  const render = (kind = 'mock') => {
    cursor = 0
    const nodes = []
    const visit = (element) => {
      if (Array.isArray(element)) { element.forEach(visit); return }
      if (!element?.args) return
      const [component, props, ...children] = element.args
      if (typeof component === 'function') visit(component({ ...props, children }))
      else { nodes.push({ type: component, ...props }); children.forEach(visit) }
    }
    visit(prepare({ kind, busy: false, onStart: (payload) => requests.push(payload) }))
    return nodes
  }
  const submit = (nodes) => nodes.find((node) => node.type === 'form').onSubmit({ preventDefault() {},
    currentTarget: { elements: { namedItem: (key) => ({ focus: () => focused.push(key) }) } } })
  let nodes = render()
  assert.equal(nodes.find((node) => node.type === 'submit').disabled, false)
  submit(nodes)
  assert.deepEqual(focused, ['prepRole'])
  assert.equal(requests.length, 0)
  nodes = render()
  assert.equal(nodes.find((node) => node.name === 'prepRole')['aria-invalid'], true)
  nodes.find((node) => node.name === 'prepRole').onChange({ target: { value: '智能体工程师' } })
  submit(render())
  assert.equal(focused.at(-1), 'prepProject')
  nodes = render()
  nodes.find((node) => node.name === 'prepProject').onChange({ target: { value: '做过 RAG 文档问答和评估。' } })
  for (const [name, value] of [['mockDuration', 20], ['mockLimit', 8], ['mockDifficulty', 'senior']]) {
    nodes.find((node) => node.name === `preparation-test-${name}` && node.value === value).onChange()
  }
  nodes.find((node) => node.name === 'interviewer-style').onChange({ target: { value: '友好、引导表达' } })
  submit(render())
  assert.deepEqual(JSON.parse(JSON.stringify(requests)), [{ kind: 'mock', targetRole: '智能体工程师',
    preparation: { targetRole: '智能体工程师', jobDescription: '', projectExperience: '做过 RAG 文档问答和评估。' },
    durationMinutes: 20, questionLimit: 8, difficulty: 'senior', interviewerStyle: '友好、引导表达' }])
  nodes = render('targeted')
  nodes.find((node) => node.name === 'prepProject').onChange({ target: { value: '' } })
  submit(render('targeted'))
  assert.equal(requests.length, 1)
  nodes = render('targeted')
  nodes.find((node) => node.name === 'prepJob').onChange({ target: { value: '要求掌握向量检索。' } })
  submit(render('targeted'))
  assert.equal(requests[1].kind, 'targeted')
  assert.equal(requests[1].preparation.jobDescription, '要求掌握向量检索。')
})

test('构建后的 Client 注册工具视图、产品顶部栏和时间轴槽位', () => {
  const { plugin, appended } = loadPlugin()
  const registrations = []
  const slots = {
    inject(_name, callback) { callback() },
    register(config) { registrations.push(config); return () => {} },
  }
  plugin.apply({ get: (name) => name === 'sessions'
    ? { list: { getSnapshot: () => ({ byId: {} }), subscribe: () => () => {} } }
    : slots, effect: (factory) => factory() })

  assert.equal(appended.length, 2)
  assert.deepEqual(
    registrations.filter((item) => item.name === 'tool.call.toolview').map((item) => item.key),
    INTERVIEW_TOOL_NAMES,
  )
  const sidebarIds = registrations.filter((item) => item.name === 'sidebar.footer.action').map((item) => item.id)
  const dockIds = registrations.filter((item) => item.name === 'conversation.input.dock').map((item) => item.id)
  assert.deepEqual(sidebarIds, [])
  assert.equal(registrations.filter((item) => item.name === 'sidebar').length, 1)
  assert.deepEqual(dockIds, ['interview-timeline'])
})

test('Client 只使用 DSH 当前会话身份且不共享练习游标', () => {
  const source = readFileSync(new URL('../../src/client/index.js', import.meta.url), 'utf8')
  const leetcode = readFileSync(new URL('../../src/client/features/leetcode.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /sessionId\s*\|\|\s*['"]global['"]/)
  assert.doesNotMatch(leetcode, /sessionId\s*=\s*['"]global['"]/)
  assert.match(source, /sessionId: props\.sessionId/)
  assert.match(source, /ProductShell, \{ \.\.\.props/)
})

test('工具视图只按结构化 artifact 渲染用户可见卡片', () => {
  const { plugin } = loadPlugin()
  assert.equal(plugin.resolveToolView('interview_practice', { argsRaw: '{}' }).kind, 'hidden')
  assert.equal(plugin.resolveToolView('interview_practice', settled({ revision: 1, artifact: null })).kind, 'hidden')

  const setup = plugin.resolveToolView('interview_show_practice_setup', settled({
    revision: 0,
    artifact: { kind: 'practice-setup', presentationId: 'setup-1' },
  }))
  assert.deepEqual(JSON.parse(JSON.stringify(setup)), {
    kind: 'practice-setup', presentationId: 'setup-1', revision: 0, toolName: 'interview_show_practice_setup',
  })

  const question = plugin.resolveToolView('interview_show_question', settled({
    revision: 2,
    artifact: { kind: 'question', practiceId: 'p1', questionId: 'q1' },
  }))
  assert.deepEqual(JSON.parse(JSON.stringify(question)), {
    kind: 'question', practiceId: 'p1', questionId: 'q1', revision: 2, toolName: 'interview_show_question',
  })

  const review = plugin.resolveToolView('interview_show_review', settled({
    revision: 5,
    artifact: { kind: 'review', practiceId: 'p1', questionId: 'q1', attemptId: 'a1' },
  }))
  assert.deepEqual(JSON.parse(JSON.stringify(review)), {
    kind: 'review', practiceId: 'p1', questionId: 'q1', attemptId: 'a1', revision: 5, toolName: 'interview_show_review',
  })

  const recoverable = plugin.resolveToolView('interview_show_question', settled({
    revision: 0,
    artifact: null,
    error: { audience: 'agent', recoverable: true },
  }))
  assert.equal(recoverable.kind, 'hidden')

  const failed = plugin.resolveToolView('interview_show_question', {
    kind: 'tool-result', isError: true, content: [{ type: 'text', text: 'schema validation failed' }],
  })
  assert.equal(failed.kind, 'error')

  const invalidArguments = plugin.resolveToolView('interview_question', {
    kind: 'tool-result',
    isError: true,
    error: { code: 'INVALID_ARGS' },
    content: [{ type: 'text', text: 'Error: invalid arguments: prompt is required' }],
  })
  assert.equal(invalidArguments.kind, 'hidden')
})

test('Client 与服务端共享交互协议版本并拒绝过期结果', () => {
  const { plugin } = loadPlugin()
  const artifact = { kind: 'question', practiceId: 'p1', questionId: 'q1' }

  assert.equal(
    plugin.resolveToolView('interview_show_question', settled({ revision: 1, artifact })).kind,
    'question',
  )
  assert.equal(
    plugin.resolveToolView('interview_show_question', {
      kind: 'tool-result',
      content: [{ type: 'text', text: JSON.stringify({ protocol: 'shizhi-interview/interaction-v1', revision: 1, artifact }) }],
    }).kind,
    'hidden',
  )
})

test('界面只对主标题使用粗体且不渲染装饰性副标题', () => {
  const featureFiles = [
    '../../src/client/features/leetcode.js',
    '../../src/client/features/live-interview.js',
    '../../src/client/features/practice-config.js',
    '../../src/client/features/practice-library.js',
    '../../src/client/features/timeline.js',
    '../../src/client/features/workspace-dock.js',
    '../../src/client/shared/ui.js',
  ]
  const components = featureFiles
    .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
    .join('\n')
  const styles = readFileSync(new URL('../../src/client/shared/styles.js', import.meta.url), 'utf8')

  assert.doesNotMatch(components, /di-(?:eyebrow|subtitle)/)
  assert.doesNotMatch(components, /h\('strong'/)
  assert.doesNotMatch(styles, /font-weight:\s*[5-9]\d{2}/)
  assert.match(styles, /--di-weight-text:400/)
  assert.match(styles, /--di-weight-title:600/)
})

test('工作台按进行中与已结束状态分离练习', () => {
  const workspace = readFileSync(new URL('../../src/client/features/workspace-dock.js', import.meta.url), 'utf8')
  const library = readFileSync(new URL('../../src/client/features/practice-library.js', import.meta.url), 'utf8')
  const entry = readFileSync(new URL('../../src/client/index.js', import.meta.url), 'utf8')
  const interactionArtifact = readFileSync(new URL('../../src/application/interaction-artifact.js', import.meta.url), 'utf8')

  assert.match(workspace, /id: 'active', label: '进行中'/)
  assert.match(workspace, /statusScope: 'active'/)
  assert.match(workspace, /statusScope: 'completed'/)
  assert.doesNotMatch(workspace, /label: '当前练习'/)
  assert.doesNotMatch(workspace, /LiveInterviewCard/)
  assert.doesNotMatch(entry, /LiveInterviewCard|live-session/)
  assert.doesNotMatch(interactionArtifact, /LIVE_SESSION|live-session/)
  assert.match(library, /statusScope = 'completed'/)
  assert.match(library, /statusScope === 'active' \? 'active' : 'completed'/)
  assert.doesNotMatch(library, /全部状态/)
})

test('工作台可变查询每次直接读取后端数据', () => {
  const library = readFileSync(new URL('../../src/client/features/practice-library.js', import.meta.url), 'utf8')

  assert.match(library, /interviewApi\.practices\(filters\)[\s\S]{0,160}\{ cache: false \}/)
  assert.match(library, /interviewApi\.practice\(visibleSelectedId\)[\s\S]{0,180}\{ cache: false \}/)
  assert.match(library, /interviewApi\.insights\(\), \[\], \{ cache: false \}/)
})

test('力扣题目卡使用讲解入口且不重复展示题目列表入口', () => {
  const leetcode = readFileSync(new URL('../../src/client/features/leetcode.js', import.meta.url), 'utf8')
  const liveInterview = readFileSync(new URL('../../src/client/features/live-interview.js', import.meta.url), 'utf8')
  assert.doesNotMatch(leetcode, /查看题目列表|收起题目列表/)
  assert.match(leetcode, /run\('question\.reveal'/)
  assert.match(leetcode, /}, '讲解'\)/)
  assert.match(leetcode, /'解题要点'/)
  assert.match(liveInterview, /isLeetcode \? '解题要点' : '直接背'/)
  assert.match(liveInterview, /!isLeetcode \? h\(Button/)
})

test('力扣练习表单必须显式选择编程语言', () => {
  const config = readFileSync(new URL('../../src/client/features/practice-config.js', import.meta.url), 'utf8')
  assert.match(config, /initial\?\.config\?\.language \|\| ''/)
  assert.match(config, /mode === 'leetcode'[\s\S]*Boolean\(language\)/)
  assert.match(config, /h\('span', null, '编程语言'\)/)
  assert.match(config, /config: \{ language \}/)
})

test('力扣结束卡和档案只展示本次刷题汇总', () => {
  const liveInterview = readFileSync(new URL('../../src/client/features/live-interview.js', import.meta.url), 'utf8')
  const library = readFileSync(new URL('../../src/client/features/practice-library.js', import.meta.url), 'utf8')
  assert.match(liveInterview, /summary\?\.kind === 'leetcode'/)
  assert.match(liveInterview, /本次共记录/)
  assert.match(library, /刷题汇总/)
})

test('力扣切题不使用本地临时卡片槽位', () => {
  const leetcode = readFileSync(new URL('../../src/client/features/leetcode.js', import.meta.url), 'utf8')
  const api = readFileSync(new URL('../../src/client/shared/api.js', import.meta.url), 'utf8')
  const index = readFileSync(new URL('../../src/client/index.js', import.meta.url), 'utf8')

  assert.match(leetcode, /transition\.run\('question\.next'\)/)
  assert.match(leetcode, /const current = initialQuestion/)
  assert.match(leetcode, /const active = artifactActive/)
  assert.doesNotMatch(index, /interview-latest-question/)
  assert.doesNotMatch(api, /subscribeLocalQuestions/)
})

test('会话中的下一题不会改变先前力扣消息卡片', () => {
  const leetcode = readFileSync(new URL('../../src/client/features/leetcode.js', import.meta.url), 'utf8')
  const liveInterview = readFileSync(new URL('../../src/client/features/live-interview.js', import.meta.url), 'utf8')
  const cardActivity = readFileSync(new URL('../../src/client/shared/card-activity.js', import.meta.url), 'utf8')

  assert.match(leetcode, /const current = initialQuestion/)
  assert.match(leetcode, /isCardActive\(session, artifact\)/)
  assert.match(cardActivity, /session\.revision === artifact\?\.sessionRevision/)
  assert.match(leetcode, /const transition = useCardTransition\(command\.run, artifact, !artifactActive\)/)
  assert.doesNotMatch(leetcode, /live = false|sessionQuestion/)
  assert.match(liveInterview, /LeetcodeProblemCard, \{ sessionId, initialQuestion: question, artifact, language: practice\.config\?\.language/)
})

test('重新作答创建新题卡且不主动打开练习工作台', () => {
  const liveInterview = readFileSync(new URL('../../src/client/features/live-interview.js', import.meta.url), 'utf8')
  const library = readFileSync(new URL('../../src/client/features/practice-library.js', import.meta.url), 'utf8')

  assert.doesNotMatch(liveInterview, /navigateWorkspace\('active'\)/)
  assert.doesNotMatch(library, /question\.retry[\s\S]{0,160}navigateWorkspace/)
  assert.match(liveInterview, /answerDisabled: !active/)
  assert.doesNotMatch(liveInterview, /session\.stage/)
})

test('力扣随机下一题点击后立即锁定为已出下一题', () => {
  const leetcodeSource = readFileSync(new URL('../../src/client/features/leetcode.js', import.meta.url), 'utf8')
  assert.match(leetcodeSource, /transition\.consumedBy === 'question\.next'/)
  assert.match(leetcodeSource, /disabled: transition\.locked/)
  assert.doesNotMatch(leetcodeSource, /nextRequestedRef|nextRequested/)
})

test('任一流程操作都会消费并锁定整张卡片', () => {
  const liveInterview = readFileSync(new URL('../../src/client/features/live-interview.js', import.meta.url), 'utf8')
  const transition = readFileSync(new URL('../../src/client/shared/card-transition.js', import.meta.url), 'utf8')
  assert.match(transition, /consumedRef\.current = true/)
  assert.match(transition, /setConsumedBy\(action\)/)
  assert.match(transition, /const locked = disabled \|\| Boolean\(consumedBy\)/)
  assert.doesNotMatch(transition, /catch|setConsumedBy\(''\)/)
  assert.match(liveInterview, /transition\.run\('question\.reveal'\)/)
  assert.match(liveInterview, /transition\.run\('question\.next'\)/)
  assert.match(liveInterview, /transition\.run\('question\.retry'\)/)
  assert.match(liveInterview, /transition\.run\('session\.finish'\)/)
  assert.doesNotMatch(liveInterview, /revealRequestedRef|nextRequestedRef|nextRequested/)
})

test('新建练习配置卡复用工作台表单且提交后消费整张卡片', () => {
  const config = readFileSync(new URL('../../src/client/features/practice-config.js', import.meta.url), 'utf8')
  const entry = readFileSync(new URL('../../src/client/index.js', import.meta.url), 'utf8')
  assert.match(config, /export function PracticeConfigForm/)
  assert.match(config, /export function PracticeSetupCard/)
  assert.match(config, /lifecycle\.enter\('session\.start'/)
  assert.match(config, /disabled: lifecycle\.locked/)
  assert.match(config, /if \(lifecycle\.consumedBy\)/)
  assert.match(config, /className: 'di-setup-complete-icon'/)
  assert.match(config, /h\(Icon, \{ name: 'check', size: 18 \}\)/)
  assert.match(config, /'练习配置已就绪'/)
  assert.match(config, /completedConfigText\(completedConfig\)/)
  assert.match(config, /setCompletedConfig\(payload\)/)
  assert.match(entry, /case 'practice-setup': return h\(PracticeSetupCard/)
})

test('练习配置先选择模式再填写配置且下拉层不被卡片裁切', () => {
  const config = readFileSync(new URL('../../src/client/features/practice-config.js', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../../src/client/shared/styles.js', import.meta.url), 'utf8')
  assert.match(config, /useState\(initial \? 'config' : 'mode'\)/)
  assert.match(config, /setStep\('config'\)/)
  assert.match(config, /'选择模式'/)
  assert.match(config, /'填写配置'/)
  assert.match(config, /className: 'di-mode-options'/)
  assert.match(config, /jobDescriptionProvided/)
  assert.match(config, /targetRole/)
  assert.match(config, /'JD'/)
  assert.match(config, /step === 'config' \? h\(Button, \{ disabled, onClick: \(\) => setStep\('mode'\) \}, '上一步'\)/)
  assert.doesNotMatch(config, /value: mode, options: PRACTICE_MODE_OPTIONS/)
  assert.match(styles, /\.di-setup-card\{overflow:visible\}/)
})

test('每次展示卡片都绕过资源缓存并使用独立展示标识', () => {
  const liveInterview = readFileSync(new URL('../../src/client/features/live-interview.js', import.meta.url), 'utf8')
  const entry = readFileSync(new URL('../../src/client/index.js', import.meta.url), 'utf8')
  assert.match(liveInterview, /artifact\?\.presentationId/)
  assert.match(liveInterview, /\{ version: revision, cache: false \}/)
  assert.match(entry, /key: view\.presentationId/)
})

test('练习工作台使用模态布局、图标导航和居中删除确认', () => {
  const workspace = readFileSync(new URL('../../src/client/features/workspace-dock.js', import.meta.url), 'utf8')
  const library = readFileSync(new URL('../../src/client/features/practice-library.js', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../../src/client/shared/styles.js', import.meta.url), 'utf8')
  assert.match(workspace, /di-workspace-backdrop/)
  assert.match(workspace, /role: 'dialog'/)
  assert.match(workspace, /name: item\.icon/)
  assert.match(library, /di-confirm-modal/)
  assert.match(styles, /width:min\(1024px,calc\(100vw - 64px\)\)/)
  assert.match(styles, /grid-template-columns:208px minmax\(0,1fr\)/)
  assert.match(styles, /di-mode-badge/)
})

test('工作台配置与筛选统一使用自定义下拉组件', () => {
  const library = readFileSync(new URL('../../src/client/features/practice-library.js', import.meta.url), 'utf8')
  const ui = readFileSync(new URL('../../src/client/shared/ui.js', import.meta.url), 'utf8')
  assert.doesNotMatch(library, /h\('select'/)
  assert.match(library, /h\(Select/)
  assert.match(ui, /role: 'combobox'/)
  assert.match(ui, /role: 'listbox'/)
  assert.match(ui, /document\.addEventListener\('pointerdown'/)
  assert.match(ui, /event\.key === 'ArrowDown'/)
})

test('长时间轴使用独立滚动区且详情浮层位于滚动区之外', () => {
  const timeline = readFileSync(new URL('../../src/client/features/timeline.js', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../../src/client/shared/styles.js', import.meta.url), 'utf8')

  assert.match(timeline, /className: 'di-time-list'/)
  assert.match(timeline, /selectedQuestion && selectedView \? h\('section', \{ className: 'di-time-flyout'/)
  assert.match(styles, /\.di-time-list\{[^}]*max-height:calc\(100vh - 144px\)[^}]*overflow-y:auto/)
  assert.match(styles, /\.di-time-list\{[^}]*scrollbar-width:none[^}]*-ms-overflow-style:none/)
  assert.match(styles, /\.di-time-list::\-webkit-scrollbar\{display:none\}/)
  assert.doesNotMatch(styles, /\.di-timeline\{[^}]*max-height:/)
})
