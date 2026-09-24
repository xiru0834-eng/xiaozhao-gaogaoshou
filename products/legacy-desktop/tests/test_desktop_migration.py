import json
from contextlib import closing
import pathlib
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from desktop_migration import import_legacy_catalog


class CatalogMigrationTests(unittest.TestCase):
    def test_personal_note_preserved_and_locked_profile_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            runtime = sqlite3.connect(root / 'runtime.db')
            runtime.execute('CREATE TABLE identity(value TEXT)')
            runtime.commit()
            (root / 'desktop-migration.json').write_text('{}')
            with closing(sqlite3.connect(root / 'catalog.db')) as db:
                db.executescript("CREATE TABLE companies(name TEXT PRIMARY KEY,row_json TEXT,ownership TEXT,first_seen TEXT);CREATE TABLE metadata(key TEXT PRIMARY KEY,value INTEGER);INSERT INTO metadata VALUES('revision',1);")
                db.execute('INSERT INTO companies VALUES(?,?,?,?)', ('示例公司', '[]', 'private', None))
                db.commit()
            class Source:
                rows = [['示例公司', 'ai', '', '', '', '', '', '', '', '本人备注：已确认过的申请']]
                by_name = {rows[0][0]: rows[0]}
                dates = {'示例公司': '2026-09-21'}
                def owner(self, row):
                    return 'private'
            with patch('desktop_migration.Catalog.read', return_value=Source()):
                runtime.execute('BEGIN EXCLUSIVE')
                with self.assertRaises(sqlite3.OperationalError):
                    import_legacy_catalog('unused.html', root)
                runtime.rollback()
                report = import_legacy_catalog('unused.html', root)
            runtime.close()
            self.assertTrue(report['allFieldsPreserved'])
            with closing(sqlite3.connect(root / 'catalog.db')) as db:
                row, date = db.execute('SELECT row_json,first_seen FROM companies').fetchone()
                self.assertEqual(json.loads(row)[9], Source.rows[0][9])
                self.assertEqual(date, '2026-09-21')
                self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
            self.assertTrue(pathlib.Path(report['backup']).exists())
