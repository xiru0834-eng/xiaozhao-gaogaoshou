"""The existing compact UI backed only by the new TypeScript profile."""
import base64
import logging
import os
import pathlib
import sys
import webbrowser
from companion import CompanionAPI, DesktopShell, ROOT
from companion_schedule import ScheduleClient
from desktop_client import DesktopCatalog
from launcher import launch_lock


class ProfileSchedule(ScheduleClient):
    def __init__(self, client):
        super().__init__()
        self.client = client

    def _read(self, path, headers=None):
        return self.client.read(path)


class DesktopAPI(CompanionAPI):
    def __init__(self, client, directory):
        super().__init__(client.base, directory)
        self._client = client
        self._catalog = DesktopCatalog(client.catalog())
        self._schedules = ProfileSchedule(client)

    def snapshot(self):
        with self._lock:
            self._catalog = DesktopCatalog(self._client.catalog())
            result = self._response(self._client.statuses(), catalog=True)
            result['schedule'] = self._schedules.summary()
            try:
                result['navigation'] = self.load_navigation()
            except (OSError, ValueError):
                result['navigationError'] = '浏览位置读取失败，原文件已保留。'
            return result

    def window_action(self, action):
        if action in ('full', 'schedules'):
            destination = self._base + '/' + ('#schedules' if action == 'schedules' else '')
            if not webbrowser.open(destination, new=2):
                raise RuntimeError('浏览器未响应，请打开 ' + destination)
            return self._shell.state() if self._shell else {}
        return super().window_action(action)


def page_html(base):
    html = (ROOT / 'companion.html').read_text(encoding='utf-8')
    mascot = base64.b64encode((ROOT / 'assets/mascot-48.png').read_bytes()).decode()
    result = html.replace('__MASCOT__', 'data:image/png;base64,' + mascot).replace('__CAST__', base + '/assets/companion-cast.png')
    result = result.replace('与完整版共用进度', '新版桌面 · 与完整版共用进度')
    if len(result.encode('utf-8')) > 1_000_000:
        raise ValueError('桌面页面过大，停止启动以避免黑窗')
    return result


def run(client, directory, seconds=None):
    directory = pathlib.Path(directory)
    lock = launch_lock(directory / 'companion.lock', timeout=.2)
    try:
        lock.__enter__()
    except TimeoutError:
        (directory / 'companion-show.signal').touch()
        return
    try:
        # Reuse the user's installed WebView2 runtime; no package downloads at startup.
        vendor = pathlib.Path(os.environ.get('LOCALAPPDATA', '')) / 'QiuzhaoLedger/vendor'
        if vendor.is_dir():
            sys.path.append(str(vendor))
        shell = DesktopShell(DesktopAPI(client, directory), html=page_html(client.base))
        shell.window.events.loaded += lambda: logging.info('New desktop companion loaded profile=%s', client.profile_id)
        shell.run(seconds)
    finally:
        lock.__exit__(None, None, None)
