import hashlib
import json
import pathlib
import unittest
from floating_model import Catalog

ROOT = pathlib.Path(__file__).resolve().parents[1]


class FrontendTests(unittest.TestCase):
    def setUp(self):
        self.html = (ROOT / 'index.html').read_text(encoding='utf-8')

    def test_desktop_workspace_and_clear_filters(self):
        for marker in ('class="workspace"', 'id="reset-filters"', 'id="result-count"', 'id="theme-toggle"'):
            self.assertIn(marker, self.html)

    def test_offline_page_does_not_depend_on_remote_fonts(self):
        self.assertNotIn('fonts.googleapis.com', self.html)
        self.assertNotIn('fonts.gstatic.com', self.html)

    def test_status_is_not_editable_before_database_ready(self):
        self.assertIn('backend !== "sqlite" ? " disabled" : ""', self.html)

    def test_copy_failure_is_not_reported_as_success(self):
        self.assertNotIn('.then(done).catch(done)', self.html)
        self.assertIn('复制失败', self.html)

    def test_existing_data_stays_at_repository_root_while_pages_live_with_the_product(self):
        import app
        import companion
        import launcher
        repository = pathlib.Path(__file__).resolve().parents[3]
        self.assertEqual(app.DB, repository / 'qiuzhao.db')
        self.assertEqual(companion.ROOT, repository)
        self.assertEqual(launcher.LOG, repository / 'launcher.log')
        self.assertEqual(app.SOURCE_DIR, ROOT)
        self.assertIn('data:image/png;base64,', companion.page_html())

    def test_shared_baseline_company_order_is_preserved(self):
        # Portable invariant: no dependency on the maintainer's private backups.
        # Notes may be corrected and new companies may be appended at the end.
        names = [row[0] for row in Catalog.read(ROOT / 'index.html').rows]
        self.assertGreaterEqual(len(names), 315)
        self.assertEqual(len(names), len(set(names)))
        baseline = json.dumps(names[:315], ensure_ascii=False, separators=(',', ':'))
        self.assertEqual(hashlib.sha256(baseline.encode()).hexdigest(),
                         '5dbde7cd97572cc75b882a0251233b25e39b65ac932092b37d35bf14a366ea6e')


if __name__ == '__main__':
    unittest.main()
