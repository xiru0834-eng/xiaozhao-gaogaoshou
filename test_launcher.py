import io
import json
import pathlib
import tempfile
import socket
import subprocess
import sys
import unittest
from unittest.mock import patch, Mock

import launcher


class LauncherTests(unittest.TestCase):
    def test_companion_entry_reuses_backend_and_opens_new_frontend(self):
        with patch.object(sys, 'argv', ['launcher.py', '--companion']), patch.object(launcher, 'launch_lock'), patch.object(launcher, 'ensure_server') as ensure, patch('companion.run') as run, patch.object(launcher, 'open_window') as full:
            self.assertEqual(launcher.main(), 0)
        ensure.assert_called_once()
        run.assert_called_once_with(launcher.BASE)
        full.assert_not_called()

    def test_companion_failure_falls_back_to_full_ledger(self):
        with patch.object(sys, 'argv', ['launcher.py', '--companion']), patch.object(launcher, 'launch_lock'), patch.object(launcher, 'ensure_server'), patch('companion.run', side_effect=RuntimeError('test missing renderer')), patch.object(launcher, 'open_window') as full:
            self.assertEqual(launcher.main(), 0)
        full.assert_called_once()

    def test_real_cold_service_and_html_ready(self):
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        process = None
        def spawn():
            nonlocal process
            process = subprocess.Popen([sys.executable, str(launcher.ROOT / 'preview_isolated.py'), '--seconds', '2', '--port', str(port)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return process
        try:
            with patch.object(launcher, 'PORT', port), patch.object(launcher, 'BASE', f'http://127.0.0.1:{port}'), patch.object(launcher, 'spawn_server', side_effect=spawn) as spawned:
                launcher.ensure_server(timeout=5)
                launcher.ensure_server(timeout=5)
                spawned.assert_called_once()
                with launcher.local_opener.open(launcher.BASE + '/', timeout=2) as response:
                    html = response.read().decode()
                    self.assertIn('<title>校招高高手', html)
                    self.assertIn('id="board"', html)
                    self.assertRegex(html, r'window\.APP_TOKEN="[a-f0-9]{64}";')
        finally:
            if process:
                out, err = process.communicate(timeout=8)
                self.assertEqual(process.returncode, 0, err.decode(errors='replace'))

    def test_healthy_service_does_not_spawn_another_backend(self):
        with patch.object(launcher, 'service_state', return_value='healthy'), patch.object(launcher, 'spawn_server') as spawn:
            launcher.ensure_server()
        spawn.assert_not_called()

    def test_occupied_port_is_not_replaced(self):
        with patch.object(launcher, 'service_state', return_value='foreign'), patch.object(launcher, 'spawn_server') as spawn:
            with self.assertRaisesRegex(RuntimeError, '18763'):
                launcher.ensure_server()
        spawn.assert_not_called()

    def test_cold_start_waits_until_service_ready(self):
        with patch.object(launcher, 'service_state', side_effect=['offline', 'offline', 'healthy']), patch.object(launcher, 'spawn_server', return_value=Mock(poll=Mock(return_value=None))) as spawn, patch.object(launcher.time, 'sleep'):
            launcher.ensure_server()
        spawn.assert_called_once()

    def test_crashed_server_has_actionable_error(self):
        with patch.object(launcher, 'service_state', return_value='offline'), patch.object(launcher, 'spawn_server', return_value=Mock(poll=Mock(return_value=1))):
            with self.assertRaisesRegex(RuntimeError, '日志'):
                launcher.ensure_server()

    def test_invalid_health_response_is_foreign(self):
        response = io.BytesIO(json.dumps({'app': 'other'}).encode())
        with patch.object(launcher, 'local_opener') as opener:
            opener.open.return_value = response
            self.assertEqual(launcher.service_state(), 'foreign')

    def test_edge_uses_explicit_new_window(self):
        with patch.object(launcher, 'find_edge', return_value=pathlib.Path('edge.exe')), patch.object(launcher.subprocess, 'Popen') as popen:
            popen.return_value.wait.return_value = 0
            launcher.open_window()
        self.assertEqual(popen.call_args.args[0][1:], ['--new-window', launcher.BASE + '/'])

    def test_edge_failure_falls_back_to_default_browser(self):
        with patch.object(launcher, 'find_edge', return_value=pathlib.Path('edge.exe')), patch.object(launcher.subprocess, 'Popen', side_effect=OSError('unavailable')), patch.object(launcher.webbrowser, 'open', return_value=True) as fallback:
            launcher.open_window()
        fallback.assert_called_once()

    def test_same_launcher_lock_is_exclusive(self):
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / 'launch.lock'
            with launcher.launch_lock(path, timeout=0.1):
                with self.assertRaises(TimeoutError):
                    with launcher.launch_lock(path, timeout=0.05):
                        pass
            with launcher.launch_lock(path, timeout=0.1):
                pass


if __name__ == '__main__':
    unittest.main()
