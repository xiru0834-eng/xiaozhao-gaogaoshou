"""Finite local UI test server. Never opens or writes the user's database."""
import argparse
import json
import pathlib
import sqlite3
import tempfile
import threading

import app


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--seconds', type=int, default=300)
    parser.add_argument('--port', type=int, default=18764)
    args = parser.parse_args()
    html = app.ROOT / 'index.html'
    with tempfile.TemporaryDirectory(prefix='qiuzhao-ui-test-') as folder:
        app.ROOT = pathlib.Path(folder)
        app.DB = app.ROOT / 'test.db'
        app.PORT = args.port
        app.BASE = f'http://127.0.0.1:{args.port}'
        app.initialize()
        class PreviewHandler(app.Handler):
            def do_GET(self):
                if self.path == '/' and self.headers.get('Host') == f'127.0.0.1:{args.port}':
                    text = html.read_text(encoding='utf-8').replace('<script>', '<script>window.APP_TOKEN=' + json.dumps(app.TOKEN) + ';', 1)
                    return self.send(200, text.encode(), 'text/html; charset=utf-8')
                return super().do_GET()
        with app.http.server.ThreadingHTTPServer(('127.0.0.1', app.PORT), PreviewHandler) as server:
            timer = threading.Timer(args.seconds, server.shutdown)
            timer.daemon = True
            timer.start()
            print('Isolated UI preview: ' + app.BASE, flush=True)
            try:
                server.serve_forever()
            finally:
                timer.cancel()
        with sqlite3.connect(app.DB, factory=app.Connection) as db:
            print('Isolated status records: ' + repr(db.execute('SELECT name,status FROM applications').fetchall()), flush=True)


if __name__ == '__main__':
    main()
