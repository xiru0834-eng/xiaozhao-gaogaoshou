"""Small transparent desktop pet. All recruitment data stays in TypeScript."""
import ctypes as c
from ctypes import wintypes as w
import json
import logging
import os
import pathlib
import time
from desktop_pet_model import Animation, clamp_position, load_cast
from desktop_pet_native import Renderer, WindowClass, WNDPROC, user, kernel
from floating_native import enable_dpi, work_area
from launcher import launch_lock

from desktop_paths import REPOSITORY_ROOT as ROOT


class PetWindow:
    def __init__(self, settings, config_path, seconds=None):
        self.settings, self.config_path = settings, config_path
        self.directory = pathlib.Path(settings['dataDir'])
        self.path = self.directory / 'pet-preferences.json'
        self.signal = self.directory / 'pet-show.signal'
        self.last_signal = self.signal.stat().st_mtime_ns if self.signal.exists() else 0
        self.cast = load_cast(ROOT / 'assets/pet')
        self.renderer = Renderer()
        self.frames, self.hwnd, self.error = {}, None, None
        self.drag, self.moved = None, False
        self.deadline = time.monotonic() + seconds if seconds else None
        try:
            prefs = json.loads(self.path.read_text(encoding='utf-8'))
            if not isinstance(prefs, dict):
                prefs = {}
        except (OSError, ValueError):
            prefs = {}
        ids = [item['id'] for item in self.cast]
        self.character = ids.index(prefs.get('character')) if prefs.get('character') in ids else 0
        self.width, self.height = 200, 240
        area = work_area()
        x, y = prefs.get('x', area[2]-250), prefs.get('y', area[3]-270)
        if type(x) is not int or type(y) is not int:
            x, y = area[2]-250, area[3]-270
        self.x, self.y = clamp_position(x, y, self.width, self.height, work_area(x, y))
        self.last_draw = None
        self.set_character(self.character)
        self.player.paused = prefs.get('paused') is True
        self.proc = WNDPROC(self.callback)
        self.instance = kernel.GetModuleHandleW(None)
        self.class_name = f'XiaozhaoDesktopPet-{os.getpid()}'

    def set_character(self, index):
        character = self.cast[index]
        if index not in self.frames:
            frames = {}
            for action in character['actions']:
                frames[action['id']] = [self.renderer.load(ROOT / 'assets/pet' / frame, self.width, self.height)[0] for frame in action['frames']]
            self.frames[index] = frames
        paused = self.player.paused if hasattr(self, 'player') else False
        self.character = index
        self.player = Animation({a['id']: a['durations'] for a in character['actions']})
        self.player.paused = paused
        self.player.start('idle', time.monotonic())
        self.last_draw = None

    def persist(self):
        value = dict(character=self.cast[self.character]['id'], x=self.x, y=self.y, paused=self.player.paused)
        temp = self.path.with_suffix('.tmp')
        temp.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
        os.replace(temp, self.path)

    def paint(self):
        action, index = self.player.tick(time.monotonic())
        state = self.character, action, index, self.x, self.y
        if state != self.last_draw:
            self.renderer.draw(self.hwnd, self.frames[self.character][action][index], self.x, self.y, self.width, self.height)
            self.last_draw = state

    def menu(self):
        from desktop_runtime import open_page, launch_companion
        point = w.POINT()
        user.GetCursorPos(c.byref(point))
        menu = user.CreatePopupMenu()
        entries = [(1, '打开悬浮台账'), (2, '打开完整工作台'), (3, '笔试 / 面试日程'), (4, '打个招呼'), (5, '继续动画' if self.player.paused else '暂停动画')]
        for code, label in entries:
            user.AppendMenuW(menu, 0, code, label)
        user.AppendMenuW(menu, 0x800, 0, None)
        for index, character in enumerate(self.cast):
            user.AppendMenuW(menu, 8 if index == self.character else 0, 20+index, character['name'])
        user.AppendMenuW(menu, 0x800, 0, None)
        user.AppendMenuW(menu, 0, 6, '回到屏幕右下角')
        user.AppendMenuW(menu, 0, 7, '退出桌宠（后台继续运行）')
        try:
            user.SetForegroundWindow(self.hwnd)
            choice = user.TrackPopupMenu(menu, 0x100 | 2, point.x, point.y, 0, self.hwnd, None)
        finally:
            user.DestroyMenu(menu)
        if choice == 1:
            launch_companion(self.settings, self.config_path)
        elif choice in (2, 3):
            open_page(self.settings, '#schedules' if choice == 3 else '')
        elif choice == 4:
            self.player.start('greet', time.monotonic())
        elif choice == 5:
            self.player.paused = not self.player.paused
        elif choice == 6:
            area = work_area()
            self.x, self.y = clamp_position(area[2]-250, area[3]-270, self.width, self.height, area)
        elif choice == 7:
            user.DestroyWindow(self.hwnd)
            return
        elif 20 <= choice < 20+len(self.cast):
            self.set_character(choice-20)
        if choice:
            self.persist()
            self.paint()

    def callback(self, hwnd, message, wp, lp):
        try:
            if message == 0x113:  # WM_TIMER
                if self.deadline and time.monotonic() >= self.deadline:
                    user.DestroyWindow(hwnd)
                    return 0
                if self.signal.exists():
                    stamp = self.signal.stat().st_mtime_ns
                    if stamp != self.last_signal:
                        self.last_signal = stamp
                        self.player.start('greet', time.monotonic())
                self.paint()
                return 0
            if message == 0x201:  # WM_LBUTTONDOWN
                point = w.POINT()
                user.GetCursorPos(c.byref(point))
                self.drag = point.x, point.y, self.x, self.y
                self.moved = False
                user.SetCapture(hwnd)
                return 0
            if message == 0x200 and self.drag:
                point = w.POINT()
                user.GetCursorPos(c.byref(point))
                sx, sy, x, y = self.drag
                self.moved = self.moved or abs(point.x-sx)+abs(point.y-sy) > 6
                if self.moved:
                    self.x, self.y = clamp_position(x+point.x-sx, y+point.y-sy, self.width, self.height, work_area(point.x, point.y))
                    self.paint()
                return 0
            if message == 0x202:  # Click greets; dragging must never open a browser.
                user.ReleaseCapture()
                if self.drag and not self.moved:
                    self.player.start('greet', time.monotonic())
                self.drag = None
                self.persist()
                return 0
            if message == 0x203:
                from desktop_runtime import launch_companion
                launch_companion(self.settings, self.config_path)
                return 0
            if message == 0x205:
                self.menu()
                return 0
            if message in (0x7E, 0x2E0):  # Monitor or DPI change: keep the pet reachable.
                self.x, self.y = clamp_position(self.x, self.y, self.width, self.height, work_area(self.x, self.y))
                self.last_draw = None
                self.paint()
                return 0
            if message == 0x10:
                user.DestroyWindow(hwnd)
                return 0
            if message == 2:
                self.persist()
                user.KillTimer(hwnd, 1)
                user.PostQuitMessage(0)
                return 0
        except Exception as error:
            self.error = error
            logging.exception('Desktop pet event failed')
            user.PostQuitMessage(1)
            return 0
        return user.DefWindowProcW(hwnd, message, wp, lp)

    def run(self):
        wc = WindowClass(8, self.proc, 0, 0, self.instance, None, None, None, None, self.class_name)
        registered = user.RegisterClassW(c.byref(wc))
        try:
            if not registered:
                raise c.WinError(c.get_last_error())
            self.hwnd = user.CreateWindowExW(0x80000 | 0x80 | 8, self.class_name, '校招高高手 · 桌宠', 0x80000000, self.x, self.y, self.width, self.height, None, None, self.instance, None)
            if not self.hwnd:
                raise c.WinError(c.get_last_error())
            self.paint()
            user.ShowWindow(self.hwnd, 4)
            if not user.SetTimer(self.hwnd, 1, 40, None):
                raise c.WinError(c.get_last_error())
            logging.info('Desktop pet loaded; character=%s hwnd=%s', self.cast[self.character]['id'], self.hwnd)
            msg = w.MSG()
            while True:
                result = user.GetMessageW(c.byref(msg), None, 0, 0)
                if result == -1:
                    raise c.WinError(c.get_last_error())
                if not result:
                    break
                user.TranslateMessage(c.byref(msg))
                user.DispatchMessageW(c.byref(msg))
            if self.error:
                raise self.error
        finally:
            if self.hwnd:
                user.DestroyWindow(self.hwnd)
            self.renderer.close()
            if registered:
                user.UnregisterClassW(self.class_name, self.instance)


def run(settings, config_path, seconds=None):
    enable_dpi()
    directory = pathlib.Path(settings['dataDir'])
    lock = launch_lock(directory / 'pet.lock', timeout=.2)
    try:
        lock.__enter__()
    except TimeoutError:
        (directory / 'pet-show.signal').touch()
        return
    try:
        PetWindow(settings, config_path, seconds).run()
    finally:
        lock.__exit__(None, None, None)
