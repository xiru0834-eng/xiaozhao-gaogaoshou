"""Sharing boundary checks. Do not open the maintainer's live database."""
import pathlib
import re
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import app
from floating_model import Catalog

ROOT = pathlib.Path(__file__).resolve().parent


class SharingTests(unittest.TestCase):
    def test_new_profile_starts_empty_and_reinitialize_keeps_own_progress(self):
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            with patch.object(app, 'ROOT', root), patch.object(app, 'DB', root / 'qiuzhao.db'):
                app.initialize()
                with app.connect() as db:
                    self.assertEqual(db.execute('SELECT COUNT(*) FROM applications').fetchone()[0], 0)
                    db.execute('INSERT INTO applications VALUES (?,?,?)', ('分享测试公司', '面试', 'test'))
                app.initialize()
                with app.connect() as db:
                    self.assertEqual(db.execute('SELECT name,status FROM applications').fetchall(),
                                     [('分享测试公司', '面试')])
                    self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')

    def test_generated_personal_files_are_git_ignored(self):
        paths = ['qiuzhao.db', 'backups/daily.db', 'companion-activity.json',
                 'companion-window.json', 'startup.log', 'webview-profile/Default/Cookies',
                 'private/resume.pdf', 'interview_notes.db', '.env', '.venv/pyvenv.cfg',
                 'companion-activity.tmp']
        result = subprocess.run(['git', 'check-ignore', '-z', '--stdin'],
                                input='\0'.join(paths).encode(), cwd=ROOT,
                                capture_output=True, check=True)
        self.assertEqual(set(filter(None, result.stdout.decode().split('\0'))), set(paths))

    def test_pages_have_no_personal_profile_instructions(self):
        html = (ROOT / 'index.html').read_text(encoding='utf-8')
        for pattern in (r'C:[\\/]Users[\\/][^<\s]+', '毕业时间统一按', '你上传的',
                        r'应聘-岗位名-悉尼大学', r'[?&](?:userId|csrftoken|access_token)='):
            self.assertIsNone(re.search(pattern, html, re.I), pattern)
        catalog = Catalog.read(ROOT / 'index.html')
        for row in catalog.rows:
            self.assertNotRegex(row[9], '你|BossAI|悉尼|反馈|截图|Android GUI Agent')

    def test_share_has_no_user_state_in_tracked_files(self):
        result = subprocess.run(['git', 'ls-files', '-z'], cwd=ROOT,
                                capture_output=True, check=True)
        files = result.stdout.decode('utf-8').split('\0')
        for name in filter(None, files):
            self.assertNotRegex(name, r'(?i)\.(?:db|sqlite|pdf|docx?|csv|log|lnk)$')
            self.assertNotIn('webview-profile/', name)
            self.assertNotIn('backups/', name)


if __name__ == '__main__':
    unittest.main()
