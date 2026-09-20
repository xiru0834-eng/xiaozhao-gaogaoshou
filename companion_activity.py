"""Frontend-only confirmation diary; never infers application dates from SQLite."""
import datetime
import json
import os
import pathlib
from floating_model import APPLIED, STATUSES


class ActivityJournal:
    def __init__(self, path):
        self.path = pathlib.Path(path)
        self.data = json.loads(self.path.read_text(encoding='utf-8')) if self.path.exists() else {}
        if not isinstance(self.data, dict) or any(not isinstance(k, str) or not isinstance(v, list) or not all(isinstance(n, str) for n in v) for k, v in self.data.items()):
            raise ValueError('今日计数文件格式异常，原文件已保留。')

    def names(self, day=None):
        day = day or datetime.date.today().isoformat()
        return list(self.data.get(day, []))

    def record(self, name, before, after, day=None):
        if before not in STATUSES or after not in STATUSES:
            raise ValueError('无效状态')
        day = day or datetime.date.today().isoformat()
        names = self.names(day)
        if before not in APPLIED and after in APPLIED and name not in names:
            names.append(name)
        if after not in APPLIED and name in names:
            names.remove(name)
        if names == self.names(day):
            return
        updated = {**self.data, day: names}
        temporary = self.path.with_suffix('.tmp')
        temporary.write_text(json.dumps(updated, ensure_ascii=False, indent=2), encoding='utf-8')
        os.replace(temporary, self.path)
        self.data = updated
