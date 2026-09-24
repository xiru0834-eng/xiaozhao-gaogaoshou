"""Verified desktop entry: one TypeScript service/profile for every surface."""
import argparse
import json
import logging
import os
import pathlib
import shutil
import socket
import subprocess
import sys
import time
import webbrowser
from desktop_client import DesktopClient
from launcher import launch_lock

from desktop_paths import REPOSITORY_ROOT as ROOT, SOURCE_DIR
CONFIG = pathlib.Path(os.environ.get('LOCALAPPDATA', pathlib.Path.home())) / 'XiaozhaoGaogaoshou/desktop-settings.json'


def read_settings(path=CONFIG):
    try:
        data = json.loads(pathlib.Path(path).read_text(encoding='utf-8'))
        profile = pathlib.Path(data['dataDir'])
        if not profile.is_absolute() or not (profile / 'qiuzhao.db').is_file() or not isinstance(data['profileId'], str) or type(data['port']) is not int or not 1024 <= data['port'] <= 65535 or data['port'] in (18763, 18765):
            raise ValueError('Invalid desktop profile')
        return data
    except (OSError, ValueError, KeyError, TypeError) as error:
        raise RuntimeError('新版桌面配置未完成，未创建空白资料；请先完成迁移。') from error


def validate_health(data, expected):
    if data.get('app') != 'xiaozhao-gaogaoshou-ts' or data.get('profileId') != expected or data.get('features', {}).get('recruitmentTasks', 0) < 2:
        raise RuntimeError('端口不是此资料的最新版服务；未接管其他程序或写入数据。')


def ensure_server(settings, timeout=25):
    base = f"http://127.0.0.1:{settings['port']}"
    directory = pathlib.Path(settings['dataDir'])
    client = DesktopClient(base, settings['profileId'])
    with launch_lock(directory / 'desktop-start.lock', timeout=30):
        try:
            with socket.create_connection(('127.0.0.1', settings['port']), timeout=.5):
                pass
        except OSError:
            node = settings.get('node') or shutil.which('node')
            if not node or not pathlib.Path(node).is_file() or not (ROOT / 'dist/server/server/main.js').is_file():
                raise RuntimeError('缺少 Node 或新版构建文件；未修改数据。')
            with (directory / 'desktop-server.log').open('ab') as log:
                process = subprocess.Popen([node, str(ROOT / 'dist/server/server/main.js'), '--port', str(settings['port']), '--data-dir', str(directory)], cwd=ROOT, stdin=subprocess.DEVNULL, stdout=log, stderr=log, creationflags=subprocess.CREATE_NO_WINDOW)
            deadline = time.monotonic() + timeout
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    raise RuntimeError('新版后台启动失败，请查看 desktop-server.log；没有删除任何数据。')
                try:
                    validate_health(DesktopClient(base)._json('/health'), settings['profileId'])
                    break
                except OSError:
                    time.sleep(.2)
            else:
                raise RuntimeError('新版后台启动超时，请查看日志。')
        validate_health(DesktopClient(base)._json('/health'), settings['profileId'])
        client.connect()
    return client


def open_page(settings, section=''):
    if section not in ('', '#schedules'):
        raise ValueError('Unknown workbench destination')
    if not webbrowser.open(f"http://127.0.0.1:{settings['port']}/{section}", new=2):
        raise RuntimeError('系统浏览器未响应')


def launch_companion(settings, config_path=CONFIG):
    runtime = pathlib.Path(sys.executable).with_name('pythonw.exe')
    return subprocess.Popen([str(runtime if runtime.exists() else sys.executable), str(SOURCE_DIR / 'desktop_runtime.py'), '--config', str(config_path), '--companion'], cwd=ROOT, creationflags=subprocess.CREATE_NO_WINDOW)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=pathlib.Path, default=CONFIG)
    parser.add_argument('--companion', action='store_true')
    parser.add_argument('--full', action='store_true')
    parser.add_argument('--seconds', type=int)
    args = parser.parse_args()
    try:
        settings = read_settings(args.config)
        directory = pathlib.Path(settings['dataDir'])
        logging.basicConfig(filename=directory / 'desktop.log', encoding='utf-8', level=logging.INFO)
        client = ensure_server(settings)
        if args.full:
            open_page(settings)
        elif args.companion:
            from desktop_companion import run
            run(client, directory, args.seconds)
        else:
            from desktop_pet import run
            run(settings, args.config, seconds=args.seconds)
    except Exception as error:
        logging.exception('Desktop launch failed')
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, str(error) + '\n\n旧版数据已保留。', '校招高高手 · 启动未完成', 0x10)
        raise


if __name__ == '__main__':
    main()
