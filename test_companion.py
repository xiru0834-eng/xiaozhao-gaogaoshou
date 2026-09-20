import pathlib
import tempfile
import unittest
from unittest.mock import Mock, patch
from companion_activity import ActivityJournal
from companion import CompanionAPI


class ActivityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = pathlib.Path(self.tmp.name) / 'activity.json'
        self.journal = ActivityJournal(self.path)

    def tearDown(self):
        self.tmp.cleanup()

    def test_today_success_is_deduplicated_and_reopens(self):
        self.journal.record('腾讯', '未投', '已投', '2026-09-20')
        self.journal.record('腾讯', '已投', '面试', '2026-09-20')
        self.assertEqual(ActivityJournal(self.path).names('2026-09-20'), ['腾讯'])

    def test_existing_applications_are_not_guessed_as_today(self):
        self.journal.record('腾讯', '已投', '面试', '2026-09-20')
        self.assertEqual(self.journal.names('2026-09-20'), [])

    def test_undo_removes_today_but_not_yesterday(self):
        self.journal.record('腾讯', '未投', '已投', '2026-09-19')
        self.journal.record('腾讯', '未投', '已投', '2026-09-20')
        self.journal.record('腾讯', '已投', '未投', '2026-09-20')
        self.assertEqual(self.journal.names('2026-09-19'), ['腾讯'])
        self.assertEqual(self.journal.names('2026-09-20'), [])

    def test_new_day_starts_at_zero(self):
        self.journal.record('腾讯', '未投', '已投', '2026-09-20')
        self.assertEqual(self.journal.names('2026-09-21'), [])

    def test_malformed_file_is_preserved_not_silently_reset(self):
        self.path.write_text('corrupted', encoding='utf-8')
        with self.assertRaises(ValueError):
            ActivityJournal(self.path)
        self.assertEqual(self.path.read_text(), 'corrupted')


class CompanionAPITests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.api = CompanionAPI('http://127.0.0.1:18764', pathlib.Path(self.tmp.name))
        self.client = Mock()
        self.client.statuses.return_value = {}
        self.api._client = self.client

    def tearDown(self):
        self.tmp.cleanup()

    def test_failed_save_never_counts_and_retry_counts_once(self):
        self.client.save.side_effect = OSError('network lost')
        with self.assertRaises(OSError):
            self.api.save_status('腾讯', '已投')
        self.assertEqual(self.api._journal.names(), [])
        # Lost acknowledgement: the server may already have saved the status.
        self.client.statuses.return_value = {'腾讯': '已投'}
        self.client.save.side_effect = None
        result = self.api.save_status('腾讯', '已投')
        self.assertEqual(result['today'], ['腾讯'])
        self.assertEqual(self.api.save_status('腾讯', '面试')['today'], ['腾讯'])

    def test_unknown_company_and_invalid_status_cannot_write(self):
        for company, status in [('not-in-catalog', '已投'), ('腾讯', 'invalid')]:
            with self.assertRaises(ValueError):
                self.api.save_status(company, status)
        self.client.save.assert_not_called()

    def test_opening_url_never_marks_applied(self):
        with patch('companion.webbrowser.open', return_value=True) as browser:
            self.api.open_role('腾讯')
        browser.assert_called_once()
        self.client.save.assert_not_called()
        self.assertEqual(self.api._journal.names(), [])

    def test_copy_only_returns_catalog_code(self):
        self.assertEqual(self.api.copy_code('腾讯'), 'TECCED77Z1')
        with self.assertRaises(ValueError):
            self.api.copy_code('unknown')
        self.client.save.assert_not_called()

    def test_navigation_reopens_without_touching_statuses(self):
        point = dict(name='腾讯', anchor='腾讯', offset=7, scroll=57,
                     query='', owner='全部性质', stage='全部进度', tab='all', onlyCode=False, recent=False)
        self.api.save_navigation('bookmark', point)
        self.api.save_navigation('browse', {**point, 'name': '百度'})
        reopened = CompanionAPI('http://127.0.0.1:18764', pathlib.Path(self.tmp.name))
        self.assertEqual(reopened.load_navigation()['bookmark'], point)
        self.assertEqual(reopened.load_navigation()['browse']['name'], '百度')
        self.api.save_navigation('bookmark', None)
        self.assertIsNone(self.api.load_navigation()['bookmark'])
        self.assertEqual(self.api.load_navigation()['browse']['name'], '百度')
        self.client.save.assert_not_called()

    def test_navigation_rejects_unknown_fields_and_preserves_corrupt_file(self):
        with self.assertRaises(ValueError):
            self.api.save_navigation('../other', {})
        with self.assertRaises(ValueError):
            self.api.save_navigation('bookmark', {'name': '腾讯', 'statuses': {'腾讯': '已投'}})
        path = pathlib.Path(self.tmp.name) / 'companion-navigation-preferences.json'
        path.write_text('broken', encoding='utf-8')
        with self.assertRaises(ValueError):
            self.api.load_navigation()
        with self.assertRaises(ValueError):
            self.api.save_navigation('bookmark', None)
        self.assertEqual(path.read_text(), 'broken')

    def test_undo_removes_confirmed_daily_count(self):
        self.api.save_status('腾讯', '已投')
        self.client.statuses.return_value = {'腾讯': '已投'}
        result = self.api.save_status('腾讯', '未投')
        self.assertEqual(result['today'], [])
        self.assertEqual(result['statuses']['腾讯'], '未投')

if __name__ == '__main__':
    unittest.main()
