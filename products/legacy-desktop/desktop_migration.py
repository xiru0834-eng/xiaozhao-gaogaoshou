"""Offline preservation of personal catalog annotations during desktop cutover."""
import datetime
from contextlib import closing
import json
import pathlib
import sqlite3
from floating_model import Catalog


def import_legacy_catalog(source_html, target_dir):
    target = pathlib.Path(target_dir).resolve()
    source = Catalog.read(source_html)
    for name in ('runtime.db', 'catalog.db', 'desktop-migration.json'):
        if not (target / name).is_file():
            raise ValueError('Expected an explicitly migrated desktop profile')
    lock = sqlite3.connect((target / 'runtime.db').as_uri()+'?mode=rw', uri=True, timeout=0)
    try:
        lock.execute('BEGIN EXCLUSIVE')  # Never change a running profile's catalog.
        db = sqlite3.connect((target / 'catalog.db').as_uri()+'?mode=rw', uri=True)
        try:
            current = {r[0] for r in db.execute('SELECT name FROM companies')}
            if current != set(source.by_name):
                raise ValueError('Company sets differ; manual review required')
            stamp = datetime.datetime.now().strftime('%Y%m%dT%H%M%S%f')
            backup_path = target / 'backups' / f'before-desktop-notes-{stamp}.db'
            backup_path.parent.mkdir(exist_ok=True)
            with closing(sqlite3.connect(backup_path)) as backup:
                db.backup(backup)
            with db:
                for row in source.rows:
                    db.execute('UPDATE companies SET row_json=?,ownership=?,first_seen=? WHERE name=?', (json.dumps(row, ensure_ascii=False), source.owner(row), source.dates.get(row[0]), row[0]))
                db.execute("UPDATE metadata SET value=value+1 WHERE key='revision'")
                actual = {name: json.loads(row) for name, row in db.execute('SELECT name,row_json FROM companies')}
                if actual != source.by_name or db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                    raise ValueError('Catalog verification failed')
            return {'companies': len(current), 'allFieldsPreserved': True, 'backup': str(backup_path)}
        finally:
            db.close()
    finally:
        lock.close()
