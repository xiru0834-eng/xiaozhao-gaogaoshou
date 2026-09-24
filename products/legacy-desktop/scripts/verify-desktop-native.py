"""Opt-in native acceptance using an isolated profile, never personal progress."""
import ctypes
import json
import pathlib
import socket
import subprocess
import sys
import tempfile
import threading
import time
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from desktop_paths import REPOSITORY_ROOT as ROOT
from desktop_client import DesktopClient
from desktop_companion import DesktopAPI, page_html
from desktop_pet import PetWindow
from desktop_pet_native import user
from floating_native import enable_dpi

output = pathlib.Path(tempfile.mkdtemp(prefix='xiaozhao-desktop-native-'))
report = {'output': str(output)}


def pet_test():
    class CheckedPet(PetWindow):
        verified = False

        def callback(self, hwnd, message, wp, lp):
            if message == 0x113 and not self.verified:
                self.verified = True
                try:
                    for i in range(5):
                        self.set_character(i)
                        self.paint()
                    self.set_character(0)
                    start = self.x, self.y
                    cursor = [self.x+80, self.y+80]

                    def position(pointer):
                        pointer._obj.x, pointer._obj.y = cursor
                        return True

                    with patch.object(user, 'GetCursorPos', side_effect=position):
                        super().callback(hwnd, 0x201, 0, 0)
                        cursor[0] -= 50
                        cursor[1] -= 40
                        super().callback(hwnd, 0x200, 0, 0)
                        super().callback(hwnd, 0x202, 0, 0)
                    assert self.moved and (self.x, self.y) != start
                    saved = json.loads(self.path.read_text(encoding='utf-8'))
                    assert (saved['x'], saved['y']) == (self.x, self.y)
                    report['pet'] = {'fiveCharactersRendered': True, 'dragHandlerMovedNativeWindow': True, 'persisted': True, 'hwnd': self.hwnd, 'rect': [self.x, self.y, self.width, self.height]}
                    capture = output / 'pet.png'
                    command = f"Add-Type -AssemblyName System.Drawing; $b=New-Object System.Drawing.Bitmap({self.width},{self.height}); $g=[System.Drawing.Graphics]::FromImage($b); try {{$g.CopyFromScreen({self.x},{self.y},0,0,$b.Size);$b.Save('{capture}',[System.Drawing.Imaging.ImageFormat]::Png)}} finally {{$g.Dispose();$b.Dispose()}}"
                    subprocess.run(['powershell', '-NoProfile', '-Command', command], creationflags=subprocess.CREATE_NO_WINDOW, check=True, timeout=10)
                    print(json.dumps(report, ensure_ascii=False), flush=True)
                except Exception as error:
                    report['error'] = str(error)
                    user.DestroyWindow(hwnd)
            return super().callback(hwnd, message, wp, lp)

    enable_dpi()
    CheckedPet(dict(dataDir=str(output), port=18766), output / 'test-config.json', seconds=18).run()


def companion_test():
    vendor = pathlib.Path.home() / 'AppData/Local/QiuzhaoLedger/vendor'
    sys.path.append(str(vendor))
    from companion import DesktopShell
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    profile = output / 'profile'
    server = subprocess.Popen(['node', str(ROOT / 'dist/server/server/main.js'), '--data-dir', str(profile), '--port', str(port)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    client = DesktopClient(base)
    try:
        for _ in range(100):
            try:
                client.connect()
                break
            except OSError:
                time.sleep(.1)
        api = DesktopAPI(client, profile)
        shell = DesktopShell(api, test=True, html=page_html(base))
        shell.place = lambda *args, **kwargs: None
        shell.dock.pinned = True

        def verify():
            try:
                for _ in range(120):
                    state = shell.window.evaluate_js("({ready, count:companies.length, rows:document.querySelectorAll('.company-row').length})")
                    if state and state.get('ready') and state.get('rows', 0):
                        break
                    time.sleep(.2)
                else:
                    raise RuntimeError('Native companion did not load')
                api.save_status('腾讯', '面试')
                assert DesktopClient(base).connect()['腾讯'] == '面试'
                with patch('desktop_companion.webbrowser.open', return_value=True) as browser:
                    api.window_action('full')
                    api.window_action('schedules')
                    assert [call.args[0] for call in browser.call_args_list] == [base+'/', base+'/#schedules']
                from System import Action
                from System.IO import MemoryStream
                from Microsoft.Web.WebView2.Core import CoreWebView2CapturePreviewImageFormat
                stream, tasks = MemoryStream(), []
                shell.window.native.Invoke(Action(lambda: tasks.append(shell.window.native.browser.webview.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, stream))))
                assert tasks[0].Wait(5000)
                (output / 'companion.png').write_bytes(bytes(stream.ToArray()))
                stream.Dispose()
                report['companion'] = dict(state, savedAndReadBack=True, sameProfileLinks=True, htmlBytes=len(page_html(base).encode()))
            except Exception as error:
                report['error'] = str(error)
            finally:
                shell.window.destroy()

        shell.window.events.loaded += lambda: threading.Thread(target=verify, daemon=True).start()
        shell.run(seconds=35)
    finally:
        server.terminate()
        server.wait(timeout=10)
    assert 'companion' in report, report


if __name__ == '__main__':
    try:
        if '--pet' in sys.argv:
            pet_test()
        else:
            companion_test()
    finally:
        (output / 'result.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False), flush=True)
    raise SystemExit(1 if 'error' in report else 0)
