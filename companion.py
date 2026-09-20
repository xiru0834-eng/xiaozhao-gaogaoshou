"""WebView2 desktop frontend. Existing backend, DB and catalog remain authoritative."""
import base64
import ctypes
from ctypes import wintypes
import datetime
import json
import logging
import os
import pathlib
import re
import sys
import threading
import time
import webbrowser

from companion_activity import ActivityJournal
from floating_model import Catalog, DockState, LedgerClient, STATUSES, fit_rect, safe_url
from floating_native import user32, work_area

ROOT = pathlib.Path(__file__).resolve().parent


def page_html():
    html = (ROOT / 'companion.html').read_text(encoding='utf-8')
    mascot = base64.b64encode((ROOT / 'assets/mascot-48.png').read_bytes()).decode()
    return html.replace('__MASCOT__', 'data:image/png;base64,' + mascot)


class CompanionAPI:
    def __init__(self, base, directory=ROOT):
        self._directory = pathlib.Path(directory)
        self._base = base
        self._client = LedgerClient(base)
        self._catalog = Catalog.read(ROOT / 'index.html')
        self._journal = None
        self._journal_error = ''
        try:
            self._journal = ActivityJournal(self._directory / 'companion-activity.json')
        except ValueError as error:
            self._journal_error = str(error)
        self._lock = threading.RLock()
        self._origins = {}
        self._shell = None

    def snapshot(self):
        with self._lock:
            self._catalog = Catalog.read(ROOT / 'index.html')
            statuses = self._client.statuses()
            return self._response(statuses, catalog=True)

    def _response(self, statuses, catalog=False):
        result = dict(statuses=statuses, today=self._journal.names() if self._journal else [],
                      todayUnavailable=bool(self._journal_error), warning=self._journal_error,
                      date=datetime.date.today().isoformat(), shell=self._shell.state() if self._shell else {})
        if catalog:
            result['companies'] = [dict(name=r[0], industry=self._catalog.cats[r[1]], roles=r[2], city=r[3],
                                       code=r[4], source=r[5], url=r[6], deadline=r[7], deadlineText=r[8], note=r[9],
                                       owner=self._catalog.owners[self._catalog.owner(r)], added=self._catalog.dates.get(r[0], ''))
                                   for r in self._catalog.rows]
        return result

    def save_status(self, name, status):
        with self._lock:
            if name not in self._catalog.by_name or status not in STATUSES:
                raise ValueError('公司或状态无效')
            before = self._client.statuses()
            origin = self._origins.setdefault(name, before.get(name, '未投'))
            self._client.save({name: status})
            before[name] = status
            try:
                if self._journal:
                    self._journal.record(name, origin, status)
                    self._journal_error = ''
            except OSError:
                logging.exception('State saved but daily diary could not be written')
                self._journal_error = '投递状态已保存，但今日计数保存失败。'
            self._origins.pop(name, None)
            return self._response(before)

    def copy_code(self, name):
        row = self._catalog.by_name.get(name)
        if not row or not re.fullmatch(r'[A-Za-z0-9]{4,24}', row[4]):
            raise ValueError('没有可复制的内推码')
        # The WinForms clipboard call runs on its owning STA UI thread.
        if self._shell:
            self._shell.clipboard(row[4])
        return row[4]

    def open_role(self, name):
        row = self._catalog.by_name.get(name)
        if not row or not safe_url(row[6]):
            raise ValueError('此项没有可直接打开的网址，请查看原始备注。')
        if not webbrowser.open(row[6], new=2):
            raise RuntimeError('浏览器没有响应，请复制详情中的入口。')
        return True

    def window_action(self, action):
        if action not in ('pin', 'collapse', 'expand', 'full', 'close', 'left', 'right'):
            raise ValueError('不支持的窗口操作')
        if action == 'full':
            webbrowser.open(self._base + '/', new=2)
        elif self._shell:
            self._shell.action(action)
        return self._shell.state() if self._shell else {}

    def interaction(self, editing, dirty):
        if self._shell:
            self._shell.dock.editing = bool(editing)
            self._shell.dock.blocked = bool(dirty)


class DesktopShell:
    def __init__(self, api, test=False):
        sys.path.insert(0, str(ROOT / 'vendor'))
        import webview
        self.webview = webview
        self.api = api
        self.api._shell = self
        self.test = test
        self.path = api._directory / 'companion-window.json'
        try:
            prefs = json.loads(self.path.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            prefs = {}
        if not isinstance(prefs, dict):
            prefs = {}
        self.side = prefs.get('side', 'right')
        if self.side not in ('left', 'right'):
            self.side = 'right'
        self.dock = DockState(pinned=bool(prefs.get('pinned', False)))
        self.width, self.height = 380, 680
        self.stop = threading.Event()
        self.hwnd = None
        self.last_signal = 0
        self.signal = api._directory / 'companion-show.signal'
        self.window = webview.create_window('校招高高手' + (' · UI 测试' if test else ''), html=page_html(), js_api=api,
            width=self.width, height=self.height, min_size=(28, 88), frameless=True, easy_drag=False,
            on_top=True, shadow=True, resizable=False, background_color='#F3F6F5')
        self.window.events.loaded += self.loaded
        self.window.events.closed += self.stop.set
        self.window.events.closing += self.can_close

    def state(self):
        return dict(pinned=self.dock.pinned, collapsed=not self.dock.expanded, side=self.side, test=self.test)

    def can_close(self):
        return not self.dock.blocked

    def persist(self):
        temp = self.path.with_suffix('.tmp')
        temp.write_text(json.dumps(dict(pinned=self.dock.pinned, side=self.side)), encoding='utf-8')
        os.replace(temp, self.path)

    def clipboard(self, text):
        from System import Action
        from System.Windows.Forms import Clipboard
        self.window.native.Invoke(Action(lambda: Clipboard.SetText(text)))

    def loaded(self):
        self.hwnd = self.window.native.Handle.ToInt64()
        self.dock.left = time.monotonic() + 3
        self.place(initial=True)
        threading.Thread(target=self.monitor, daemon=True).start()

    def rect(self):
        rect = wintypes.RECT()
        user32.GetWindowRect(wintypes.HWND(self.hwnd), ctypes.byref(rect))
        return rect.left, rect.top, rect.right, rect.bottom

    def place(self, initial=False):
        if not self.hwnd:
            return
        scale = user32.GetDpiForWindow(self.hwnd) / 96 or 1
        x, y, right, bottom = self.rect()
        area = work_area(x, y)
        if initial:
            y = area[1] + int(60*scale)
        w, h = (self.width, self.height) if self.dock.expanded else (28, 88)
        if not self.dock.pinned or initial:
            x = area[0] if self.side == 'left' else area[2] - int(w*scale)
        rect = fit_rect(x, y, int(w*scale), int(h*scale), area)
        user32.SetWindowPos(wintypes.HWND(self.hwnd), wintypes.HWND(-1), *rect, 0x10 | 0x40)
        self.window.run_js('window.shellState && window.shellState(' + json.dumps(self.state()) + ')')

    def action(self, action):
        if action == 'close':
            if not self.dock.blocked:
                self.window.destroy()
            return
        if action == 'collapse':
            if self.dock.blocked:
                return
            self.dock.pinned, self.dock.expanded = False, False
            self.dock.entered = time.monotonic() + .5
        elif action == 'expand':
            self.dock.expanded = True
            self.dock.left = time.monotonic() + 2
        elif action == 'pin':
            self.dock.pinned = not self.dock.pinned
            self.dock.expanded = True
        elif action in ('left', 'right'):
            self.side, self.dock.pinned = action, False
        self.place()
        self.persist()

    def monitor(self):
        # Only the app's own geometry is read or moved. Hover never activates it.
        last_rect = None
        while not self.stop.wait(.1):
            try:
                point = wintypes.POINT()
                user32.GetCursorPos(ctypes.byref(point))
                rect = self.rect()
                x, y, right, bottom = rect
                inside = x <= point.x < right and y <= point.y < bottom
                dragging = bool(user32.GetAsyncKeyState(1) & 0x8000)
                self.dock.dragging = dragging
                # Input focus only blocks auto-hide while our own window is active.
                if user32.GetForegroundWindow() != self.hwnd:
                    self.dock.editing = False
                if rect != last_rect and dragging:
                    area = work_area(x, y)
                    self.side = 'left' if (x+right)/2 < (area[0]+area[2])/2 else 'right'
                last_rect = rect
                if self.dock.tick(time.monotonic(), inside):
                    self.place()
                if self.signal.exists():
                    stamp = self.signal.stat().st_mtime_ns
                    if stamp != self.last_signal:
                        self.last_signal = stamp
                        self.action('expand')
            except Exception:
                logging.exception('Companion docking error')
                self.stop.wait(1)

    def run(self, seconds=None):
        self.webview.settings['ALLOW_FILE_URLS'] = False
        self.webview.settings['OPEN_EXTERNAL_LINKS_IN_BROWSER'] = True
        if seconds:
            timer = threading.Timer(seconds, self.window.destroy)
            timer.daemon = True
            timer.start()
        self.webview.start(gui='edgechromium', private_mode=False, storage_path=str(self.api._directory / 'webview-profile'),
                           icon=str(ROOT / 'assets/qiuzhao-mascot.ico'))


def run(base='http://127.0.0.1:18763', directory=ROOT, test=False, seconds=None):
    from launcher import launch_lock
    directory = pathlib.Path(directory)
    directory.mkdir(exist_ok=True, parents=True)
    logging.basicConfig(filename=directory / 'companion.log', level=logging.INFO, encoding='utf-8')
    lock = launch_lock(directory / 'companion.lock', timeout=.2)
    try:
        lock.__enter__()
    except TimeoutError:
        (directory / 'companion-show.signal').touch()
        return
    try:
        DesktopShell(CompanionAPI(base, directory), test).run(seconds)
    finally:
        lock.__exit__(None, None, None)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', action='store_true')
    parser.add_argument('--seconds', type=int)
    args = parser.parse_args()
    run('http://127.0.0.1:18764' if args.test else 'http://127.0.0.1:18763', ROOT / 'qa-companion' if args.test else ROOT, args.test, args.seconds)
