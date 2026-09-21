"""Per-pixel transparent Win32 rendering; no WebView or extra image runtime."""
import ctypes as c
from ctypes import wintypes as w

user = c.WinDLL('user32', use_last_error=True)
gdi = c.WinDLL('gdi32', use_last_error=True)
gdip = c.WinDLL('gdiplus')
kernel = c.WinDLL('kernel32', use_last_error=True)
P = c.c_void_p


def signature(dll, name, result, *args):
    method = getattr(dll, name)
    method.restype, method.argtypes = result, args
    return method


WNDPROC = c.WINFUNCTYPE(c.c_ssize_t, w.HWND, w.UINT, w.WPARAM, w.LPARAM)


class WindowClass(c.Structure):
    _fields_ = [('style', w.UINT), ('proc', WNDPROC), ('clsExtra', c.c_int), ('wndExtra', c.c_int), ('instance', w.HINSTANCE), ('icon', w.HICON), ('cursor', w.HANDLE), ('background', w.HBRUSH), ('menu', w.LPCWSTR), ('name', w.LPCWSTR)]


class BitmapHeader(c.Structure):
    _fields_ = [('size', w.DWORD), ('width', w.LONG), ('height', w.LONG), ('planes', w.WORD), ('bits', w.WORD), ('compression', w.DWORD), ('imageSize', w.DWORD), ('xppm', w.LONG), ('yppm', w.LONG), ('used', w.DWORD), ('important', w.DWORD)]


class BitmapData(c.Structure):
    _fields_ = [('width', w.UINT), ('height', w.UINT), ('stride', c.c_int), ('format', c.c_int), ('pixels', P), ('reserved', c.c_size_t)]


class GdiStartup(c.Structure):
    _fields_ = [('version', w.UINT), ('debug', P), ('background', w.BOOL), ('codecs', w.BOOL)]


class Blend(c.Structure):
    _fields_ = [('operation', c.c_ubyte), ('flags', c.c_ubyte), ('alpha', c.c_ubyte), ('format', c.c_ubyte)]


signature(kernel, 'GetModuleHandleW', w.HMODULE, w.LPCWSTR)
signature(user, 'RegisterClassW', w.WORD, c.POINTER(WindowClass))
signature(user, 'UnregisterClassW', w.BOOL, w.LPCWSTR, w.HINSTANCE)
signature(user, 'CreateWindowExW', w.HWND, w.DWORD, w.LPCWSTR, w.LPCWSTR, w.DWORD, c.c_int, c.c_int, c.c_int, c.c_int, w.HWND, w.HMENU, w.HINSTANCE, P)
signature(user, 'DefWindowProcW', c.c_ssize_t, w.HWND, w.UINT, w.WPARAM, w.LPARAM)
signature(user, 'DestroyWindow', w.BOOL, w.HWND)
signature(user, 'ShowWindow', w.BOOL, w.HWND, c.c_int)
signature(user, 'SetTimer', c.c_size_t, w.HWND, c.c_size_t, w.UINT, P)
signature(user, 'KillTimer', w.BOOL, w.HWND, c.c_size_t)
signature(user, 'GetMessageW', w.BOOL, c.POINTER(w.MSG), w.HWND, w.UINT, w.UINT)
signature(user, 'TranslateMessage', w.BOOL, c.POINTER(w.MSG))
signature(user, 'DispatchMessageW', c.c_ssize_t, c.POINTER(w.MSG))
signature(user, 'PostQuitMessage', None, c.c_int)
signature(user, 'GetCursorPos', w.BOOL, c.POINTER(w.POINT))
signature(user, 'SetCapture', w.HWND, w.HWND)
signature(user, 'ReleaseCapture', w.BOOL)
signature(user, 'CreatePopupMenu', w.HMENU)
signature(user, 'DestroyMenu', w.BOOL, w.HMENU)
signature(user, 'AppendMenuW', w.BOOL, w.HMENU, w.UINT, c.c_size_t, w.LPCWSTR)
signature(user, 'TrackPopupMenu', w.UINT, w.HMENU, w.UINT, c.c_int, c.c_int, c.c_int, w.HWND, P)
signature(user, 'SetForegroundWindow', w.BOOL, w.HWND)
signature(user, 'UpdateLayeredWindow', w.BOOL, w.HWND, w.HDC, c.POINTER(w.POINT), c.POINTER(w.SIZE), w.HDC, c.POINTER(w.POINT), w.DWORD, c.POINTER(Blend), w.DWORD)
signature(gdi, 'CreateCompatibleDC', w.HDC, w.HDC)
signature(gdi, 'DeleteDC', w.BOOL, w.HDC)
signature(gdi, 'CreateDIBSection', w.HBITMAP, w.HDC, P, w.UINT, c.POINTER(P), w.HANDLE, w.DWORD)
signature(gdi, 'SelectObject', w.HANDLE, w.HDC, w.HANDLE)
signature(gdi, 'DeleteObject', w.BOOL, w.HANDLE)
signature(gdip, 'GdiplusStartup', c.c_int, c.POINTER(c.c_size_t), c.POINTER(GdiStartup), P)
signature(gdip, 'GdiplusShutdown', None, c.c_size_t)
signature(gdip, 'GdipCreateBitmapFromFile', c.c_int, w.LPCWSTR, c.POINTER(P))
signature(gdip, 'GdipCreateBitmapFromScan0', c.c_int, c.c_int, c.c_int, c.c_int, c.c_int, P, c.POINTER(P))
signature(gdip, 'GdipGetImageGraphicsContext', c.c_int, P, c.POINTER(P))
signature(gdip, 'GdipSetInterpolationMode', c.c_int, P, c.c_int)
signature(gdip, 'GdipDrawImageRectI', c.c_int, P, P, c.c_int, c.c_int, c.c_int, c.c_int)
signature(gdip, 'GdipBitmapLockBits', c.c_int, P, c.POINTER(w.RECT), w.UINT, c.c_int, c.POINTER(BitmapData))
signature(gdip, 'GdipBitmapUnlockBits', c.c_int, P, c.POINTER(BitmapData))
signature(gdip, 'GdipDeleteGraphics', c.c_int, P)
signature(gdip, 'GdipDisposeImage', c.c_int, P)


def check(status):
    if status != 0:
        raise RuntimeError(f'GDI+ image operation failed ({status})')


class Renderer:
    def __init__(self):
        self.token = c.c_size_t()
        startup = GdiStartup(1, None, False, False)
        check(gdip.GdiplusStartup(c.byref(self.token), c.byref(startup), None))
        self.dc = gdi.CreateCompatibleDC(None)
        if not self.dc:
            gdip.GdiplusShutdown(self.token)
            raise c.WinError(c.get_last_error())
        self.bitmaps = []

    def load(self, path, width, height):
        original, scaled, graphics = P(), P(), P()
        bitmap = None
        try:
            check(gdip.GdipCreateBitmapFromFile(str(path), c.byref(original)))
            check(gdip.GdipCreateBitmapFromScan0(width, height, 0, 0xE200B, None, c.byref(scaled)))
            check(gdip.GdipGetImageGraphicsContext(scaled, c.byref(graphics)))
            check(gdip.GdipSetInterpolationMode(graphics, 7))
            check(gdip.GdipDrawImageRectI(graphics, original, 0, 0, width, height))
            check(gdip.GdipDeleteGraphics(graphics))
            graphics = P()
            header = BitmapHeader(c.sizeof(BitmapHeader), width, -height, 1, 32, 0, 0, 0, 0, 0, 0)
            bits = P()
            bitmap = gdi.CreateDIBSection(self.dc, c.byref(header), 0, c.byref(bits), None, 0)
            if not bitmap:
                raise c.WinError(c.get_last_error())
            data = BitmapData()
            rect = w.RECT(0, 0, width, height)  # GDI+ Rect is x,y,width,height.
            check(gdip.GdipBitmapLockBits(scaled, c.byref(rect), 1, 0xE200B, c.byref(data)))
            try:
                for row in range(height):
                    c.memmove(bits.value + row*width*4, data.pixels + row*data.stride, width*4)
            finally:
                check(gdip.GdipBitmapUnlockBits(scaled, c.byref(data)))
            self.bitmaps.append(bitmap)
            return bitmap, c.string_at(bits, width*height*4)
        except Exception:
            if bitmap:
                gdi.DeleteObject(bitmap)
            raise
        finally:
            if graphics:
                gdip.GdipDeleteGraphics(graphics)
            for item in (original, scaled):
                if item:
                    gdip.GdipDisposeImage(item)

    def draw(self, hwnd, bitmap, x, y, width, height):
        previous = gdi.SelectObject(self.dc, bitmap)
        try:
            position, size, source, blend = w.POINT(x, y), w.SIZE(width, height), w.POINT(0, 0), Blend(0, 0, 255, 1)
            if not user.UpdateLayeredWindow(hwnd, None, c.byref(position), c.byref(size), self.dc, c.byref(source), 0, c.byref(blend), 2):
                raise c.WinError(c.get_last_error())
        finally:
            gdi.SelectObject(self.dc, previous)

    def close(self):
        for bitmap in self.bitmaps:
            gdi.DeleteObject(bitmap)
        self.bitmaps.clear()
        if self.dc:
            gdi.DeleteDC(self.dc)
            self.dc = None
            gdip.GdiplusShutdown(self.token)
