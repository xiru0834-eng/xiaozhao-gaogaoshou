import http.client
import json
import pathlib
import tempfile
import threading
import unittest
import app

class PersistenceTest(unittest.TestCase):
    def test_post_accepts_no_suitable_role_status(self):
        original_root, original_db = app.ROOT, app.DB
        original_port, original_base = app.PORT, app.BASE
        server = None
        try:
            with tempfile.TemporaryDirectory() as folder:
                app.ROOT = pathlib.Path(folder)
                app.DB = app.ROOT / 'qiuzhao.db'
                app.initialize()
                server = app.http.server.ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
                app.PORT = server.server_address[1]
                app.BASE = f'http://127.0.0.1:{app.PORT}'
                thread = threading.Thread(target=server.serve_forever, daemon=True)
                thread.start()

                conn = http.client.HTTPConnection('127.0.0.1', app.PORT, timeout=3)
                body = json.dumps({'updates': {'测试公司': '无合适岗位'}}, ensure_ascii=False).encode('utf-8')
                conn.request('POST', '/api/status', body=body, headers={
                    'Content-Type': 'application/json',
                    'Content-Length': str(len(body)),
                    'X-App-Token': app.TOKEN,
                    'Origin': app.BASE,
                })
                response = conn.getresponse()
                self.assertEqual(response.status, 200, response.read().decode('utf-8'))
                conn.close()
                with app.connect() as db:
                    self.assertEqual(
                        db.execute('SELECT status FROM applications WHERE name=?', ('测试公司',)).fetchone()[0],
                        '无合适岗位',
                    )
        finally:
            if server is not None:
                server.shutdown()
                server.server_close()
            app.ROOT, app.DB = original_root, original_db
            app.PORT, app.BASE = original_port, original_base

    def test_reopen(self):
        with tempfile.TemporaryDirectory() as folder:
            app.ROOT = pathlib.Path(folder)
            app.DB = app.ROOT / 'qiuzhao.db'
            app.initialize()
            with app.connect() as db:
                db.execute('INSERT INTO applications VALUES (?,?,?)', ('测试公司', '面试', 'now'))
            app.initialize()
            with app.connect() as db:
                self.assertEqual(db.execute('SELECT status FROM applications').fetchone()[0], '面试')
                db.execute('UPDATE applications SET status=?', ('未投',))
            with app.connect() as db:
                self.assertEqual(db.execute('SELECT status FROM applications').fetchone()[0], '未投')
                self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')

    def test_ownership_filter_is_shipped(self):
        html = (pathlib.Path(__file__).resolve().parent / 'index.html').read_text(encoding='utf-8')
        self.assertIn('id="ownership-filters"', html)
        self.assertIn('["private","私企"]', html)
        self.assertIn('["foreign","外企"]', html)
        self.assertIn('["state","央国企"]', html)
        self.assertIn('["public","科研/事业单位"]', html)
        self.assertIn('filterOwnership', html)
        self.assertIn('OWNERSHIPNAME[ownershipOf(r)]', html)

    def test_state_recruitment_channel_filter_is_shipped(self):
        html = (pathlib.Path(__file__).resolve().parent / 'index.html').read_text(encoding='utf-8')
        self.assertIn('id="channel-filters"', html)
        self.assertIn('["online","线上可投"]', html)
        self.assertIn('["hybrid","线上 + 线下"]', html)
        self.assertIn('["verify","待核验"]', html)
        self.assertIn('filterChannel !== "all"', html)
        self.assertIn('recruitChannelEvidence', html)
        self.assertIn('PUBLIC_RESEARCH_ORGS', html)
        self.assertIn('中国电子云（中电云计算）', html)

    def test_recent_ai_company_additions_are_shipped(self):
        html = (pathlib.Path(__file__).resolve().parent / 'index.html').read_text(encoding='utf-8')
        for company in ('途游游戏', '苏州科达', '北方华创', '中景芯创', '威迈斯新能源'):
            self.assertIn(company, html)
        self.assertIn('DS6wt6FY', html)
        self.assertIn('J16415', html)

    def test_daily_updates_are_append_only_and_visible(self):
        html = (pathlib.Path(__file__).resolve().parent / 'index.html').read_text(encoding='utf-8')
        marker = '// ---- 每日追加区：新公司只能追加到这里，禁止插入或重排上方历史数据 ----'
        self.assertIn(marker, html)
        append_block = html.split(marker, 1)[1].split('];', 1)[0]
        for company in ('途游游戏', '苏州科达', '北方华创', '中景芯创', '威迈斯新能源'):
            self.assertIn(company, append_block)
        self.assertIn('id="recent-chip"', html)
        self.assertIn('APPEND_DATES', html)
        self.assertIn('added-badge', html)

    def test_no_suitable_role_status_is_shipped(self):
        # Assert the shipped JS result, not an obsolete CSS selector spelling.
        import test_workbench
        probe = test_workbench.WorkbenchTests()
        probe.setUpClass()
        result = probe.evaluate('''(() => {
          const r=DATA[0]; state={[r[F.n]]:'无合适岗位'}; backend='sqlite';
          const html=rowHtml(r); filterStatus='unsuitable'; const unsuitable=matches(r);
          filterStatus='applied'; const applied=matches(r); filterStatus='todo';
          return {html,unsuitable,applied,todo:matches(r),included:STATUSES.includes('无合适岗位')};
        })()''')
        self.assertIn('<option selected>无合适岗位</option>', result['html'])
        self.assertTrue(result['included'])
        self.assertTrue(result['unsuitable'])
        self.assertFalse(result['applied'])
        self.assertFalse(result['todo'])

    def test_status_filter_combines_with_other_filters(self):
        # Status buttons are now generated from STATUS_VIEWS; check the output.
        import test_workbench
        probe = test_workbench.WorkbenchTests()
        probe.setUpClass()
        result = probe.evaluate('''(() => {
          const nodes={};globalThis.document={getElementById:id=>nodes[id]||(nodes[id]={innerHTML:''})};
          buildFilters();
          const privateRows=DATA.filter(r=>ownershipOf(r)==='private');
          state={[privateRows[0][F.n]]:'已投'};filterStatus='todo';filterOwnership='private';
          return {buttons:nodes['status-filters'].innerHTML,names:DATA.filter(matches).map(r=>r[F.n]),
            expected:privateRows.slice(1).map(r=>r[F.n])};
        })()''')
        self.assertIn('data-status="todo"', result['buttons'])
        self.assertIn('data-status="applied"', result['buttons'])
        self.assertEqual(result['names'], result['expected'])

if __name__ == '__main__':
    unittest.main()
