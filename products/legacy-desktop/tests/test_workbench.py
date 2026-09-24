"""Workbench redesign contract tests. No browser/network or production DB writes.

Pure functions are evaluated from the shipped page, not reimplemented in Python.
The real-browser visual/keyboard checks remain a separate acceptance gate.
"""
import json
import os
from html.parser import HTMLParser
import pathlib
import re
import shutil
import subprocess
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
BUNDLED_NODE = pathlib.Path(os.environ.get('USERPROFILE', str(pathlib.Path.home()))) / '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'


class PageStructure(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.elements = {}
        self.class_elements = {}
        self.options = {}
        self.current_select = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.elements[attrs['id']] = (tag, attrs)
        for class_name in attrs.get('class', '').split():
            self.class_elements.setdefault(class_name, []).append((tag, attrs))
        if tag == 'select':
            self.current_select = attrs.get('id')
        elif tag == 'option' and self.current_select:
            self.options.setdefault(self.current_select, []).append(attrs.get('value'))

    def handle_endtag(self, tag):
        if tag == 'select':
            self.current_select = None


class WorkbenchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / 'index.html').read_text(encoding='utf-8')
        cls.structure = PageStructure(cls.html)
        cls.node = str(BUNDLED_NODE) if BUNDLED_NODE.exists() else shutil.which('node')
        cls.script = next(
            script for script in re.findall(r'<script(?:\s[^>]*)?>([\s\S]*?)</script>', cls.html)
            if 'const DATA =' in script
        )
        # All shared pure helpers precede the delegated DOM handlers. Nothing in
        # this prefix invokes startup fetch/render or any persistent browser API.
        cls.logic = re.split(r'^\s*document\.addEventListener\(', cls.script, maxsplit=1, flags=re.M)[0]

    def evaluate(self, expression):
        self.assertIsNotNone(self.node, 'Node is required to execute shipped JS logic')
        runner = r'''
const fs = require('node:fs');
const vm = require('node:vm');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
class FrozenDate extends Date {
  constructor(...args) { super(...(args.length ? args : ['2026-09-20T12:00:00Z'])); }
  static now() { return Date.parse('2026-09-20T12:00:00Z'); }
}
const sandbox = {
  Date: FrozenDate,
  window: {addEventListener() {}},
  console: {log() {}, warn() {}, error() {}},
  localStorage: {getItem() {return null;}, setItem() {throw new Error('Unexpected storage write');}},
  fetch() {throw new Error('Network not permitted in pure tests');},
};
vm.createContext(sandbox);
vm.runInContext(input.logic, sandbox, {timeout: 1500});
Promise.resolve(vm.runInContext(input.expression, sandbox, {timeout: 1500}))
  .then(result => process.stdout.write(JSON.stringify(result)))
  .catch(error => { process.stderr.write(String(error.stack || error)); process.exitCode=1; });
'''
        result = subprocess.run(
            [self.node, '-e', runner],
            input=json.dumps({'logic': self.logic, 'expression': expression}, ensure_ascii=False),
            text=True, encoding='utf-8', capture_output=True, timeout=8,
            env={**os.environ, 'TZ': 'UTC'},
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def save_scenario(self, body):
        # Only the outside-world boundaries are fakes. save(), note(), pending
        # merge/retry logic, and the state machine are the actual shipped code.
        harness = '''(async () => {
          const nodes={};
          globalThis.document={getElementById:id=>nodes[id]||(nodes[id]={textContent:'',dataset:{},style:{},hidden:false})};
          const cache=new Map();
          globalThis.localStorage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value)};
          const timers=new Map();let timerID=0;
          globalThis.setTimeout=(fn,delay)=>{const id=++timerID;timers.set(id,{fn,delay});return id;};
          globalThis.clearTimeout=id=>timers.delete(id);
          const tick=async delay=>{
            const entry=Array.from(timers).find(([,timer])=>timer.delay===delay);
            if(!entry)throw new Error('Missing timer: '+delay);
            timers.delete(entry[0]);return await entry[1].fn();
          };
          const snapshot=()=>({pending:JSON.parse(JSON.stringify(pending)),writing,
            header:nodes.savenote.textContent,kind:nodes.savenote.dataset.kind,
            detail:nodes['detail-save-note'].textContent});
          backend='sqlite';window.APP_TOKEN='isolated-test-token';
        '''
        return self.evaluate(harness + body + '\n})()')

    def test_http_failure_keeps_pending_and_reports_error_in_page_and_dialog(self):
        result = self.save_scenario('''
          const requests=[];globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:false,status:503};};
          state={'测试公司':'已投'};save('测试公司');
          const before=snapshot();await tick(400);
          return {before,after:snapshot(),requests};
        ''')
        self.assertEqual(result['before']['kind'], 'saving')
        self.assertEqual(result['after']['kind'], 'error')
        self.assertIn('写库失败', result['after']['header'])
        self.assertEqual(result['after']['detail'], result['after']['header'])
        self.assertNotIn('已写入', result['after']['header'])
        self.assertEqual(result['after']['pending'], {'测试公司': '已投'})
        self.assertFalse(result['after']['writing'])
        self.assertEqual(result['requests'], [{'updates': {'测试公司': '已投'}}])

    def test_failed_inflight_batch_retry_keeps_latest_edits_and_all_companies(self):
        result = self.save_scenario('''
          const requests=[];let respond;
          globalThis.fetch=(url,options)=>{requests.push(JSON.parse(options.body));return new Promise(resolve=>respond=resolve);};
          state={'测试甲':'已投'};save('测试甲');const inflight=tick(400);
          state['测试甲']='面试';save('测试甲');state['测试乙']='笔试';save('测试乙');
          respond({ok:false,status:500});await inflight;const failed=snapshot();
          globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,status:200};};
          await tick(1500);await tick(400);
          return {failed,after:snapshot(),requests,values:state};
        ''')
        expected = {'测试甲': '面试', '测试乙': '笔试'}
        self.assertEqual(result['failed']['pending'], expected)
        self.assertEqual(result['failed']['kind'], 'error')
        self.assertEqual(result['requests'], [{'updates': {'测试甲': '已投'}}, {'updates': expected}])
        self.assertEqual(result['values'], expected)
        self.assertEqual(result['after']['pending'], {})
        self.assertFalse(result['after']['writing'])
        self.assertEqual(result['after']['kind'], 'ready')
        self.assertIn('已写入', result['after']['header'])
        self.assertEqual(result['after']['header'], result['after']['detail'])

    def test_successful_inflight_batch_does_not_claim_all_saved_with_new_edits_pending(self):
        result = self.save_scenario('''
          const requests=[];let respond;
          globalThis.fetch=(url,options)=>{requests.push(JSON.parse(options.body));return new Promise(resolve=>respond=resolve);};
          state={'测试甲':'已投'};save('测试甲');const inflight=tick(400);
          state['测试甲']='面试';save('测试甲');respond({ok:true,status:200});await inflight;
          const firstSuccess=snapshot();
          globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,status:200};};
          await tick(1500);await tick(400);
          return {firstSuccess,after:snapshot(),requests};
        ''')
        self.assertEqual(result['firstSuccess']['pending'], {'测试甲': '面试'})
        self.assertEqual(result['firstSuccess']['kind'], 'saving', 'A newer edit still needs saving; do not report a fully saved state')
        self.assertEqual(result['firstSuccess']['header'], result['firstSuccess']['detail'])
        self.assertEqual(result['requests'], [{'updates': {'测试甲': '已投'}}, {'updates': {'测试甲': '面试'}}])
        self.assertEqual(result['after']['pending'], {})
        self.assertEqual(result['after']['kind'], 'ready')

    def test_expired_group_is_last_in_deadline_view(self):
        self.assertEqual(self.evaluate('DLGROUPS.map(g => g[0])'), ['w1', 'w3', 'm2', 'late', 'open', 'past'])

    def test_summary_counts_deadline_boundaries_codes_and_offers_for_supplied_rows(self):
        result = self.evaluate('''(() => {
          const rows=[['过期','2026-09-19','ABCD'],['今天','2026-09-20','无码'],
            ['第七天','2026-09-27','AB12'],['第八天','2026-09-28','abc'],
            ['未标日期','','<x>'],['异常日期','invalid','Z'.repeat(25)]].map(([n,dl,code])=>{
              const r=Array(10).fill('');r[F.n]=n;r[F.dl]=dl;r[F.code]=code;return r;
            });
          state={'今天':'Offer','第七天':'Offer','未传入的公司':'Offer'};
          return summarizeRows(rows);
        })()''')
        self.assertEqual(result, {'total': 6, 'soon': 2, 'codes': 2, 'offers': 2})

    def test_summary_empty_and_subset_do_not_leak_catalog_or_mutate_rows_and_state(self):
        result = self.evaluate('''(() => {
          const r=Array(10).fill('');r[F.n]='仅此公司';r[F.code]='ONLY12';r[F.dl]='2026-10-20';
          const rows=Object.freeze([Object.freeze(r)]);
          state=Object.freeze({...Object.fromEntries(DATA.map(r=>[r[F.n],'Offer'])),'仅此公司':'已投'});
          const beforeRows=JSON.stringify(rows),beforeState=JSON.stringify(state),beforeData=JSON.stringify(DATA);
          const summary=summarizeRows(rows),empty=summarizeRows([]);
          return {summary,empty,rowsUnchanged:beforeRows===JSON.stringify(rows),
            stateUnchanged:beforeState===JSON.stringify(state),dataUnchanged:beforeData===JSON.stringify(DATA)};
        })()''')
        self.assertEqual(result['summary'], {'total': 1, 'soon': 0, 'codes': 1, 'offers': 0})
        self.assertEqual(result['empty'], {'total': 0, 'soon': 0, 'codes': 0, 'offers': 0})
        self.assertTrue(result['rowsUnchanged'])
        self.assertTrue(result['stateUnchanged'])
        self.assertTrue(result['dataUnchanged'])

    def test_summary_shortcuts_are_real_buttons_with_exposed_toggle_state(self):
        for control_id in ('summary-soon', 'summary-code'):
            with self.subTest(control=control_id):
                self.assertIn(control_id, self.structure.elements.keys())
                tag, attrs = self.structure.elements[control_id]
                self.assertEqual(tag, 'button')
                self.assertEqual(attrs.get('type'), 'button')
                self.assertIn(attrs.get('aria-pressed'), ('true', 'false'))

    def test_summary_container_identifies_current_filter_scope(self):
        containers = self.structure.class_elements.get('summary-stats', [])
        self.assertTrue(containers, 'Current filter summary must be present')
        self.assertTrue(any(attrs.get('role') == 'group' and attrs.get('aria-label') == '当前筛选概览'
                            for _, attrs in containers),
                        'Summary must communicate that its counts only cover the current filters')

    def test_expired_group_starts_collapsed_without_hiding_active_groups(self):
        self.assertEqual(self.evaluate("Array.from(foldedGroups)"), ['dl:past'])

    def test_deadline_grouping_preserves_expired_and_boundary_days(self):
        result = self.evaluate('''(() => {
          groupBy = 'dl';
          return ['2026-09-19','2026-09-20','2026-09-27','2026-09-28','2026-10-11','2026-10-12','2026-11-19','2026-11-20',''].map(dl => {
            const r = Array(10).fill(''); r[F.dl] = dl; return groupOf(r);
          });
        })()''')
        self.assertEqual(result, ['past', 'w1', 'w1', 'w3', 'w3', 'm2', 'm2', 'late', 'open'])

    def test_name_sort_returns_new_array_and_preserves_source(self):
        result = self.evaluate('''(() => {
          const rows = ['Zulu','Alpha','Beta'].map(n => { const r=Array(10).fill(''); r[F.n]=n; return r; });
          const before=JSON.stringify(rows), out=sortedRows(rows,'name');
          return {names:out.map(r=>r[F.n]), unchanged:JSON.stringify(rows)===before, distinct:out!==rows};
        })()''')
        self.assertEqual(result, {'names': ['Alpha', 'Beta', 'Zulu'], 'unchanged': True, 'distinct': True})

    def test_deadline_sort_places_unknown_after_known_and_does_not_mutate(self):
        result = self.evaluate('''(() => {
          const rows = [['Unknown',''],['Later','2026-10-10'],['Soon','2026-09-22']].map(([n,d]) => {
            const r=Array(10).fill(''); r[F.n]=n; r[F.dl]=d; return r;
          });
          const before=JSON.stringify(rows), out=sortedRows(rows,'deadline');
          return {names:out.map(r=>r[F.n]), unchanged:JSON.stringify(rows)===before};
        })()''')
        self.assertEqual(result, {'names': ['Soon', 'Later', 'Unknown'], 'unchanged': True})

    def test_original_sort_restores_catalog_order_without_reordering_catalog(self):
        result = self.evaluate('''(() => {
          const before=JSON.stringify(DATA), expected=DATA.slice(0,5).map(r=>r[F.n]);
          const out=sortedRows(DATA.slice(0,5).reverse(),'original');
          return {names:out.map(r=>r[F.n]), expected, unchanged:JSON.stringify(DATA)===before};
        })()''')
        self.assertEqual(result['names'], result['expected'])
        self.assertTrue(result['unchanged'])

    def test_private_unapplied_and_referral_filters_intersect(self):
        result = self.evaluate('''(() => {
          const rows=DATA.filter(r=>ownershipOf(r)==='private' && hasCode(r));
          state={[rows[0][F.n]]:'已投',[rows[1][F.n]]:'无合适岗位'};
          filterStatus='todo'; filterOwnership='private'; onlyCode=true;
          const names=DATA.filter(matches).map(r=>r[F.n]);
          const expected=rows.slice(2).map(r=>r[F.n]);
          return {names,expected};
        })()''')
        self.assertEqual(result['names'], result['expected'])

    def test_applied_filter_includes_later_stages_but_not_unsuitable(self):
        result = self.evaluate('''(() => {
          const stages=['未投','已投','笔试','面试','Offer','结束','无合适岗位'];
          const rows=DATA.slice(0,7); state=Object.fromEntries(rows.map((r,i)=>[r[F.n],stages[i]]));
          filterStatus='applied';
          return rows.filter(matches).map(r=>state[r[F.n]]);
        })()''')
        self.assertEqual(result, ['已投', '笔试', '面试', 'Offer', '结束'])

    def test_referral_validation_excludes_notes_and_escapes_unsafe_text(self):
        result = self.evaluate('''(() => {
          const r=Array(10).fill('');
          return {valid:['AB12','无公开码','abc','A'.repeat(25),'<img>'].map(c=>{r[F.code]=c;return hasCode(r);}),
            escaped:esc('<script>"&</script>')};
        })()''')
        self.assertEqual(result['valid'], [True, False, False, False, False])
        self.assertEqual(result['escaped'], '&lt;script&gt;&quot;&amp;&lt;/script&gt;')

    def test_company_row_escapes_untrusted_catalog_fields_and_disables_unsaved_status(self):
        result = self.evaluate('''(() => {
          backend='local';
          const r = ['<img src=x onerror=alert(1)>','ai','<script>bad</script>','测试城市','ABCD12','','','','',''];
          const html=rowHtml(r);
          return {rawName:html.includes('<img src=x'),rawRole:html.includes('<script>bad'),
            escapedName:html.includes('&lt;img src=x'), disabled:/<select[^>]*disabled/.test(html)};
        })()''')
        self.assertEqual(result, {'rawName': False, 'rawRole': False, 'escapedName': True, 'disabled': True})

    def test_details_uses_named_native_dialog(self):
        self.assertIn('company-detail', self.structure.elements)
        tag, attrs = self.structure.elements['company-detail']
        self.assertEqual(tag, 'dialog')
        self.assertTrue(attrs.get('aria-label') or attrs.get('aria-labelledby'), 'Dialog needs an accessible name')
        if attrs.get('aria-labelledby'):
            for name_id in attrs['aria-labelledby'].split():
                self.assertIn(name_id, self.structure.elements)

    def test_search_clear_and_density_are_labeled_buttons(self):
        for control_id in ('clear-search', 'density-toggle'):
            with self.subTest(control=control_id):
                self.assertIn(control_id, self.structure.elements)
                tag, attrs = self.structure.elements[control_id]
                self.assertEqual(tag, 'button')
                self.assertTrue(attrs.get('aria-label') or attrs.get('title'), f'{control_id} needs a descriptive name')
        if 'density-toggle' in self.structure.elements:
            self.assertIn('aria-pressed', self.structure.elements['density-toggle'][1])

    def test_sort_select_exposes_all_three_orders(self):
        self.assertIn('sort-order', self.structure.elements)
        self.assertEqual(self.structure.elements['sort-order'][0], 'select')
        self.assertEqual(set(self.structure.options.get('sort-order', [])), {'deadline', 'name', 'original'})


if __name__ == '__main__':
    unittest.main()
