"""Window management for this application's own native window only."""
import ctypes
from ctypes import wintypes

# ctypes.windll caches function objects process-wide. Keep our strict signatures
# private: pywebview passes None for ignored SetWindowPos width/height when moving.
user32 = ctypes.WinDLL('user32')


def enable_dpi():
    try:
        user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4))
    except AttributeError:
        user32.SetProcessDPIAware()


class MonitorInfo(ctypes.Structure):
    _fields_ = [('size', wintypes.DWORD), ('monitor', wintypes.RECT), ('work', wintypes.RECT), ('flags', wintypes.DWORD)]


user32.GetParent.argtypes = [wintypes.HWND]
user32.GetParent.restype = wintypes.HWND
user32.MonitorFromPoint.argtypes = [wintypes.POINT, wintypes.DWORD]
user32.MonitorFromPoint.restype = wintypes.HANDLE
user32.GetMonitorInfoW.argtypes = [wintypes.HANDLE, ctypes.POINTER(MonitorInfo)]
user32.SetWindowPos.argtypes = [wintypes.HWND, wintypes.HWND, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, wintypes.UINT]
user32.SetWindowPos.restype = wintypes.BOOL
user32.GetWindowRect.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.RECT)]
user32.GetWindowRect.restype = wintypes.BOOL
user32.GetDpiForWindow.argtypes = [wintypes.HWND]
user32.GetDpiForWindow.restype = wintypes.UINT
user32.GetCursorPos.argtypes = [ctypes.POINTER(wintypes.POINT)]
user32.GetCursorPos.restype = wintypes.BOOL
user32.GetAsyncKeyState.argtypes = [ctypes.c_int]
user32.GetAsyncKeyState.restype = ctypes.c_short
user32.GetForegroundWindow.restype = wintypes.HWND
user32.IsChild.argtypes = [wintypes.HWND, wintypes.HWND]


def handle(root):
    return user32.GetParent(root.winfo_id()) or root.winfo_id()


def work_area(x=0, y=0):
    monitor = user32.MonitorFromPoint(wintypes.POINT(int(x), int(y)), 2)
    info = MonitorInfo()
    info.size = ctypes.sizeof(info)
    if not user32.GetMonitorInfoW(monitor, ctypes.byref(info)):
        raise ctypes.WinError()
    r = info.work
    return r.left, r.top, r.right, r.bottom


def place(root, rect):
    # SWP_NOACTIVATE: merely hovering the edge must not steal browser focus.
    if not user32.SetWindowPos(handle(root), wintypes.HWND(-1), *map(int, rect), 0x10 | 0x40):
        raise ctypes.WinError()


def active(root):
    foreground = user32.GetForegroundWindow()
    return foreground == handle(root) or bool(user32.IsChild(handle(root), foreground))
