"""Desktop entry point. Business handlers and database logic stay in app.py."""
import contextlib
import json
import logging
import msvcrt
import os
import pathlib
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser

from desktop_paths import REPOSITORY_ROOT as ROOT, SOURCE_DIR
PORT = 18763
BASE = f'http://127.0.0.1:{PORT}'
LOG = ROOT / 'launcher.log'
local_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
logger = logging.getLogger('ledger.launcher')


def service_state():
    try:
        with local_opener.open(BASE + '/health', timeout=1) as response:
            data = json.load(response)
        return 'healthy' if data.get('app') == 'qiuzhao-ledger-v1' else 'foreign'
    except Exception:
        try:
            with socket.create_connection(('127.0.0.1', PORT), timeout=0.3):
                return 'foreign'
        except OSError:
            return 'offline'


@contextlib.contextmanager
def launch_lock(path=None, timeout=25):
    path = path or ROOT / 'launcher.lock'
    with open(path, 'a+b') as handle:
        handle.seek(0, 2)
        if handle.tell() == 0:
            handle.write(b'0')
            handle.flush()
        deadline = time.monotonic() + timeout
        while True:
            try:
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
                break
            except OSError:
                if time.monotonic() >= deadline:
                    raise TimeoutError('另一个启动过程仍在运行，请稍后重试。')
                time.sleep(0.1)
        try:
            yield
        finally:
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)


def spawn_server():
    runtime = pathlib.Path(sys.executable)
    windowless = runtime.with_name('pythonw.exe')
    if windowless.exists():
        runtime = windowless
    with open(ROOT / 'server-errors.log', 'ab') as errors:
        process = subprocess.Popen(
            [str(runtime), str(SOURCE_DIR / 'launcher.py'), '--serve'],
            cwd=ROOT, stdin=subprocess.DEVNULL, stdout=errors, stderr=errors,
            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
        )
    logger.info('Detached server pid=%s runtime=%s', process.pid, runtime)
    return process


def ensure_server(timeout=20):
    state = service_state()
    if state == 'healthy':
        logger.info('Reuse healthy service')
        return
    if state == 'foreign':
        raise RuntimeError('端口 18763 已被占用或台账服务无响应。没有结束任何进程；请查看启动日志。')
    process = spawn_server()
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if service_state() == 'healthy':
            logger.info('Service is ready')
            return
        if process.poll() is not None:
            raise RuntimeError('后台启动退出。请查看 launcher.log 和 server-errors.log 日志。')
        time.sleep(0.2)
    raise RuntimeError('后台启动超时，请查看日志；不要重复结束或删除数据库。')


def find_edge():
    for base in (os.environ.get('ProgramFiles(x86)'), os.environ.get('ProgramFiles'), os.environ.get('LOCALAPPDATA')):
        if base:
            candidate = pathlib.Path(base) / 'Microsoft/Edge/Application/msedge.exe'
            if candidate.is_file():
                return candidate
    return None


def open_window():
    edge = find_edge()
    if edge:
        try:
            process = subprocess.Popen([str(edge), '--new-window', BASE + '/'])
            try:
                result = process.wait(timeout=2)
                if result != 0:
                    raise OSError(f'Edge launch exit code {result}')
            except subprocess.TimeoutExpired:
                pass  # A newly started browser keeps running normally.
            logger.info('Requested Edge new window pid=%s', process.pid)
            return
        except OSError:
            logger.exception('Edge launch failed; trying default browser')
    if not webbrowser.open(BASE + '/', new=1):
        raise RuntimeError('后台已启动，但浏览器没有打开。请在 Edge 输入 ' + BASE + '/')
    logger.info('Requested default browser window')


def serve():
    import app
    # No endpoint, schema, status validation or persistence change.
    with app.http.server.ThreadingHTTPServer(('127.0.0.1', PORT), app.Handler) as server:
        app.initialize()
        logger.info('Server ready on %s', BASE)
        server.serve_forever()


def main():
    logging.basicConfig(filename=LOG, level=logging.INFO, encoding='utf-8',
                        format='%(asctime)s %(levelname)s %(message)s')
    logger.info('Launcher invoked pid=%s mode=%s', os.getpid(), sys.argv[1:])
    try:
        if '--serve' in sys.argv:
            serve()
        else:
            with launch_lock():
                ensure_server()
            if '--companion' in sys.argv:
                try:
                    import companion
                    companion.run(BASE)
                except Exception:
                    logger.exception('Companion failed; opening full ledger instead')
                    open_window()
            else:
                open_window()
    except Exception as error:
        logger.exception('Launch failed')
        if '--serve' not in sys.argv:
            import ctypes
            ctypes.windll.user32.MessageBoxW(
                0, str(error) + '\n\n日志：' + str(LOG) + '\n手动入口：' + BASE + '/',
                '校招高高手启动未完成', 16,
            )
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
