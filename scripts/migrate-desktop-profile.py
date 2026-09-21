"""Explicit one-time old-progress migration; sources and preview stay untouched."""
import argparse
from contextlib import closing
import hashlib
import json
import pathlib
import shutil
import sqlite3
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def records(path):
    with closing(sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        return db.execute('SELECT name,status,updated_at FROM applications ORDER BY name').fetchall()


def migrate(source, target, node):
    source, target = pathlib.Path(source).resolve(), pathlib.Path(target).resolve()
    if not source.is_file() or target.exists() or target.is_relative_to(ROOT) or target.is_relative_to(source.parent):
        raise ValueError('Source must exist; target must be a new external profile')
    before = records(source)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    result = subprocess.run([node, str(ROOT / 'dist/server/server/import-cli.js'), '--source', str(source), '--data-dir', str(target)], cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=True)
    receipt = json.loads(result.stdout)
    if records(target / 'qiuzhao.db') != before or records(source) != before or hashlib.sha256(source.read_bytes()).hexdigest() != digest:
        raise RuntimeError('迁移期间源记录发生变化，未切换入口；请重新核对，勿覆盖目标库。')
    for name in ('companion-navigation-preferences.json', 'companion-activity.json', 'companion-window.json'):
        file = source.parent / name
        if file.is_file():
            shutil.copy2(file, target / name)
    report = dict(count=len(before), profileId=receipt['profileId'], sourceHash=digest, sourceUnchanged=True, rowsAndTimestampsEqual=True, source=str(source), target=str(target))
    (target / 'desktop-migration.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--data-dir', required=True)
    parser.add_argument('--node', default=shutil.which('node'))
    args = parser.parse_args()
    print(json.dumps(migrate(args.source, args.data_dir, args.node), ensure_ascii=False))
