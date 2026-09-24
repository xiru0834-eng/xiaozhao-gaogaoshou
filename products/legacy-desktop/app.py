import http.server
import json
import pathlib
import secrets
import sqlite3
import subprocess
import threading
import urllib.request
import webbrowser
import logging
from datetime import datetime

from desktop_paths import REPOSITORY_ROOT as ROOT, SOURCE_DIR
logging.basicConfig(filename=str(ROOT / 'startup.log'), level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s', encoding='utf-8')
DB = ROOT / 'qiuzhao.db'
PORT = 18763
BASE = f'http://127.0.0.1:{PORT}'
TOKEN = secrets.token_hex(32)
STATUSES = {'未投', '已投', '笔试', '面试', 'Offer', '结束', '无合适岗位'}

class Connection(sqlite3.Connection):
    def __exit__(self, *args):
        try:
            return super().__exit__(*args)
        finally:
            self.close()

def connect():
    return sqlite3.connect(DB, timeout=10, factory=Connection)

def initialize():
    with connect() as db:
        db.execute('CREATE TABLE IF NOT EXISTS applications (name TEXT PRIMARY KEY, status TEXT NOT NULL, updated_at TEXT NOT NULL)')
    backups = ROOT / 'backups'
    backups.mkdir(exist_ok=True)
    target = backups / (datetime.now().strftime('%Y-%m-%d') + '.db')
    if not target.exists():
        with connect() as source, sqlite3.connect(target, factory=Connection) as dest:
            source.backup(dest)

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send(self, code, data, mime='application/json; charset=utf-8'):
        if not isinstance(data, bytes):
            data = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.headers.get('Host') != f'127.0.0.1:{PORT}':
            return self.send(403, {'error': 'invalid host'})
        if self.path == '/health':
            return self.send(200, {'app': 'qiuzhao-ledger-v1'})
        if self.path == '/':
            html = (SOURCE_DIR / 'index.html').read_text(encoding='utf-8')
            html = html.replace('<script>', '<script>window.APP_TOKEN=' + json.dumps(TOKEN) + ';', 1)
            return self.send(200, html.encode(), 'text/html; charset=utf-8')
        if self.path == '/api/status':
            with connect() as db:
                rows = dict(db.execute('SELECT name,status FROM applications'))
            return self.send(200, {'statuses': rows})
        if self.path == '/api/backup':
            with connect() as source, sqlite3.connect(':memory:', factory=Connection) as dest:
                source.backup(dest)
                data = dest.serialize()
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Disposition', 'attachment; filename="qiuzhao-backup.db"')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        self.send(404, {'error': 'not found'})

    def do_POST(self):
        if (self.headers.get('Host') != f'127.0.0.1:{PORT}' or
                self.headers.get('X-App-Token') != TOKEN or
                self.headers.get('Origin', BASE) != BASE):
            return self.send(403, {'error': 'forbidden'})
        if self.path != '/api/status':
            return self.send(404, {'error': 'not found'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 200000:
                raise ValueError('invalid size')
            updates = json.loads(self.rfile.read(length)).get('updates')
            if not isinstance(updates, dict) or any(not isinstance(k, str) or not 0 < len(k) <= 200 or v not in STATUSES for k,v in updates.items()):
                raise ValueError('invalid statuses')
            with connect() as db:
                db.executemany('INSERT INTO applications VALUES (?,?,?) ON CONFLICT(name) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at', [(k,v,datetime.now().isoformat()) for k,v in updates.items()])
            self.send(200, {'ok': True})
        except (ValueError, TypeError):
            self.send(400, {'error': 'invalid request'})
        except sqlite3.Error:
            logging.exception('Database write failed')
            self.send(500, {'error': 'database write failed'})

def open_window():
    logging.info('Opening ledger window')
    edge = pathlib.Path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
    if edge.exists():
        subprocess.Popen([str(edge), '--app=' + BASE])
    else:
        webbrowser.open(BASE)

def main():
    logging.info('Launcher started')
    try:
        with urllib.request.urlopen(BASE + '/health', timeout=2) as r:
            existing = json.load(r)
        if existing.get('app') == 'qiuzhao-ledger-v1':
            logging.info('Existing server healthy')
            open_window()
            return
    except Exception:
        pass
    initialize()
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    except OSError:
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, '本地端口 18763 被占用，请联系维护者检查。', '秋招台账启动失败', 16)
        return
    threading.Thread(target=server.serve_forever, daemon=True).start()
    open_window()
    logging.info('Server ready on port %s', PORT)
    threading.Event().wait()

if __name__ == '__main__':
    try:
        main()
    except Exception:
        logging.exception('Startup failed')
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, '启动失败，详情已保存到：' + str(ROOT / 'startup.log'), '秋招台账', 16)
