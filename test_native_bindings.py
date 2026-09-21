"""Regression checks for the shared ctypes contract used by pywebview.

Run in fresh processes: importing the app must not change another library's
cached function signatures. HWND=0 is deliberately invalid; no window moves.
"""
import pathlib
import subprocess
import sys
import unittest


ROOT = pathlib.Path(__file__).resolve().parent


@unittest.skipUnless(sys.platform == 'win32', 'Windows native bindings')
class NativeBindingTests(unittest.TestCase):
    def run_python(self, source):
        result = subprocess.run([sys.executable, '-X', 'utf8', '-c', source],
                                cwd=ROOT, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_import_does_not_mutate_shared_user32_signatures(self):
        self.run_python('''
import ctypes
names = ('SetWindowPos', 'GetParent', 'MonitorFromPoint', 'GetMonitorInfoW',
         'GetForegroundWindow', 'IsChild', 'GetDpiForWindow', 'GetWindowRect')
shared = ctypes.windll.user32
before = {name: (getattr(shared, name).argtypes, getattr(shared, name).restype)
          for name in names}
import companion
after = {name: (getattr(shared, name).argtypes, getattr(shared, name).restype)
         for name in names}
assert before == after, 'App import changed pywebview native call signatures'
''')

    def test_webview_move_accepts_ignored_dimensions_after_app_import(self):
        self.run_python('''
import ctypes
import companion
# pywebview WinForms move passes None for ignored width/height with SWP_NOSIZE.
# These are the same arguments as the logged failing call, with an invalid HWND.
for scale in (1, 1.5, 2):
    for x, y in ((240, 180), (-600, 90)):
        result = ctypes.windll.user32.SetWindowPos(
            0, None, int(x * scale), int(y * scale), None, None, 0x01 | 0x04 | 0x40)
        assert result == 0, 'Invalid HWND must not move a window'
''')

    def test_app_binding_still_validates_real_dimension_arguments(self):
        self.run_python('''
import ctypes
from ctypes import wintypes
from floating_native import user32
assert user32 is not ctypes.windll.user32
assert user32.SetWindowPos.argtypes == [wintypes.HWND, wintypes.HWND,
    ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, wintypes.UINT]
assert user32.SetWindowPos(0, None, 10, 20, 380, 680, 0x10 | 0x40) == 0
try:
    user32.SetWindowPos(0, None, 10, 20, None, None, 0)
except ctypes.ArgumentError:
    pass
else:
    raise AssertionError('App binding lost strict dimension validation')
''')


if __name__ == '__main__':
    unittest.main()
