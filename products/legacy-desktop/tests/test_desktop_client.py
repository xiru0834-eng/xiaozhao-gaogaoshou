import pathlib
import socket
import subprocess
import tempfile
import time
import unittest
from unittest.mock import patch
from desktop_client import DesktopClient, DesktopCatalog

ROOT = pathlib.Path(__file__).resolve().parents[3]


class DesktopClientTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            port = listener.getsockname()[1]
        cls.base = f'http://127.0.0.1:{port}'
        cls.process = subprocess.Popen(['node', str(ROOT / 'dist/server/server/main.js'), '--port', str(port), '--data-dir', cls.temp.name], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cls.client = DesktopClient(cls.base)
        for _ in range(100):
            try:
                cls.client.connect()
                break
            except OSError:
                time.sleep(.1)
        else:
            cls.process.terminate()
            raise AssertionError('Isolated TypeScript server did not start')

    @classmethod
    def tearDownClass(cls):
        cls.process.terminate()
        cls.process.wait(timeout=10)
        cls.temp.cleanup()

    def test_real_catalog_save_and_second_client_share_state(self):
        catalog = DesktopCatalog(self.client.catalog())
        self.assertGreaterEqual(len(catalog.rows), 315)
        name = catalog.rows[0][0]
        self.client.save({name: '面试'})
        second = DesktopClient(self.base, self.client.profile_id)
        self.assertEqual(second.connect()[name], '面试')
        self.assertEqual(catalog.owners[catalog.owner(catalog.rows[0])], '私企')

    def test_wrong_profile_is_refused(self):
        with self.assertRaisesRegex(ValueError, '资料'):
            DesktopClient(self.base, '00000000-0000-0000-0000-000000000000').connect()

    def test_non_local_and_ambiguous_addresses_are_refused(self):
        for url in ['https://example.com', 'http://user@127.0.0.1:1234', 'http://127.0.0.1:1234/?x=1', 'http://127.0.0.1:1234/#x']:
            with self.assertRaises(ValueError):
                DesktopClient(url)

    def test_unknown_status_never_written(self):
        before = self.client.statuses()
        with self.assertRaises(ValueError):
            self.client.save({'腾讯': 'bogus'})
        self.assertEqual(self.client.statuses(), before)

    def test_bad_catalog_is_refused(self):
        with self.assertRaises(ValueError):
            DesktopCatalog({'companies': [['x']], 'metadata': [], 'appendDates': []})

    def test_companion_uses_ts_catalog_and_one_workbench_origin(self):
        from desktop_companion import DesktopAPI, page_html
        with tempfile.TemporaryDirectory() as temp:
            api = DesktopAPI(self.client, pathlib.Path(temp))
            snapshot = api.snapshot()
            self.assertEqual(len(snapshot['companies']), len(self.client.catalog()['companies']))
            self.assertEqual(snapshot['statuses'], self.client.statuses())
            with patch('desktop_companion.webbrowser.open', return_value=True) as browser:
                api.window_action('full')
                api.window_action('schedules')
                self.assertEqual([c.args[0] for c in browser.call_args_list], [self.base+'/', self.base+'/#schedules'])
            html = page_html(self.base)
            self.assertLess(len(html.encode('utf-8')), 1_000_000)
            self.assertIn(self.base+'/assets/companion-cast.png', html)

    def test_runtime_reuses_matching_service_and_rejects_wrong_profile(self):
        from desktop_runtime import ensure_server
        settings = dict(port=int(self.base.rsplit(':', 1)[1]), dataDir=self.temp.name, profileId=self.client.profile_id)
        self.assertEqual(ensure_server(settings).profile_id, self.client.profile_id)
        with self.assertRaises(RuntimeError):
            ensure_server(dict(settings, profileId='00000000-0000-0000-0000-000000000000'))
