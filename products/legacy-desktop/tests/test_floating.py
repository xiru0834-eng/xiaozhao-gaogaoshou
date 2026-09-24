import pathlib
import tempfile
import unittest
from floating_model import Catalog, DockState, fit_rect, LedgerClient, SaveState, safe_url

ROOT = pathlib.Path(__file__).resolve().parents[1]


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.catalog = Catalog.read(ROOT / 'index.html')

    def test_existing_catalog_and_ownership(self):
        self.assertEqual(len(self.catalog.rows), 315)
        self.assertEqual(self.catalog.rows[0][0], '腾讯')
        self.assertEqual(self.catalog.owner(next(r for r in self.catalog.rows if r[0] == '酷睿程 CARIZON')), 'foreign')
        self.assertEqual(len(self.catalog.dates), 7)

    def test_combined_filters_keep_original_order(self):
        rows = self.catalog.filter({'腾讯': '已投'}, owner='private', status='未投', query='Agent')
        self.assertTrue(rows)
        self.assertNotIn('腾讯', [r[0] for r in rows])
        self.assertTrue(all(self.catalog.owner(r) == 'private' for r in rows))
        self.assertEqual(rows, [r for r in self.catalog.rows if r in rows])

    def test_parser_does_not_execute_javascript(self):
        with tempfile.TemporaryDirectory() as folder:
            p = pathlib.Path(folder) / 'bad.html'
            p.write_text('const DATA = [alert(1)];', encoding='utf-8')
            with self.assertRaises(ValueError):
                Catalog.read(p)

    def test_urls_are_http_only(self):
        self.assertTrue(safe_url('https://join.qq.com/'))
        for url in ('javascript:alert(1)', 'file:///C:/test', 'https://', 'mailto:x@y.com'):
            self.assertFalse(safe_url(url))


class DockTests(unittest.TestCase):
    def test_delayed_hover_and_leave(self):
        d = DockState(expanded=False)
        self.assertIsNone(d.tick(0, inside=True))
        self.assertIsNone(d.tick(.15, inside=True))
        self.assertEqual(d.tick(.23, inside=True), 'expand')
        self.assertIsNone(d.tick(.3, inside=False))
        self.assertIsNone(d.tick(.95, inside=False))
        self.assertEqual(d.tick(1.11, inside=False), 'collapse')

    def test_pin_edit_drag_and_failed_save_prevent_collapse(self):
        for flag in ('pinned', 'editing', 'dragging', 'blocked'):
            d = DockState(expanded=True)
            setattr(d, flag, True)
            d.tick(0, inside=False)
            self.assertIsNone(d.tick(5, inside=False))
            self.assertTrue(d.expanded)

    def test_clamp_removed_monitor_and_small_workarea(self):
        self.assertEqual(fit_rect(-4000, 5000, 352, 560, (0, 0, 1920, 1040)), (0, 480, 352, 560))
        self.assertEqual(fit_rect(0, 0, 352, 560, (-800, 0, 0, 450)), (-352, 0, 352, 450))


class SaveTests(unittest.TestCase):
    def test_latest_edit_wins_during_write_failure(self):
        s = SaveState({'腾讯': '未投'})
        s.change('腾讯', '已投')
        batch = s.begin()
        s.change('腾讯', '面试')
        s.failed(batch)
        self.assertEqual(s.pending, {'腾讯': '面试'})
        s.merge({'腾讯': '未投', '阿里': '面试'})
        self.assertEqual(s.values['腾讯'], '面试')
        self.assertEqual(s.values['阿里'], '面试')

    def test_success_does_not_drop_new_edit(self):
        s = SaveState({})
        s.change('腾讯', '已投')
        batch = s.begin()
        s.change('腾讯', '面试')
        s.succeeded(batch)
        self.assertEqual(s.pending, {'腾讯': '面试'})
        self.assertTrue(s.dirty)

    def test_invalid_status_rejected(self):
        with self.assertRaises(ValueError):
            SaveState({}).change('腾讯', '随便')

    def test_client_rejects_remote_backend(self):
        with self.assertRaises(ValueError):
            LedgerClient('https://example.com')


if __name__ == '__main__':
    unittest.main()
