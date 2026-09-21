"""Read-only shortcut to the existing TypeScript profile; never stores another event copy."""
import datetime
import json
import re
import time
import urllib.request
import urllib.error

SCHEDULE_BASE = 'http://127.0.0.1:18765'

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, 'Redirect refused', headers, fp)

class ScheduleClient:
    def __init__(self):
        self._until = 0
        self._cached = dict(available=False, label='面试日程 · 打开完整版查看')

    def _read(self, path, headers=None):
        request = urllib.request.Request(SCHEDULE_BASE + path, headers=headers or {})
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=2) as response:
            # Do not follow a local service redirect to an arbitrary destination.
            if response.geturl() != SCHEDULE_BASE + path:
                raise ValueError('Unexpected redirect')
            data = response.read(4_000_001)
            if len(data) > 4_000_000:
                raise ValueError('Response too large')
            return data

    def summary(self):
        if time.monotonic() < self._until:
            return self._cached
        self._until = time.monotonic() + 30
        try:
            page = self._read('/').decode('utf-8')
            token = re.search(r'name="app-token" content="([a-f0-9]{64})"', page)
            profile = re.search(r'name="profile-id" content="([a-f0-9-]{36})"', page)
            if not token or not profile:
                raise ValueError('Missing service identity')
            data = json.loads(self._read('/api/schedules', {'X-App-Token': token[1], 'X-Profile-Id': profile[1]}))
            items = data['items']
            if not isinstance(items, list):
                raise ValueError('Invalid schedule list')
            china = datetime.timezone(datetime.timedelta(hours=8))
            today = datetime.datetime.now(china).date().isoformat()
            upcoming = []
            for item in items:
                if item.get('status') != 'planned':
                    continue
                start = item.get('start')
                when = datetime.datetime.fromisoformat(start).astimezone(china) if start else None
                day = when.date().isoformat() if when else item.get('date', '')
                if day and day >= today:
                    upcoming.append((day, when.strftime('%H:%M') if when else '时间待定', item))
            upcoming.sort(key=lambda v: (v[0], v[1]))
            if upcoming:
                day, clock, item = upcoming[0]
                company = item['company']
                if not isinstance(company, str):
                    raise ValueError('Invalid company')
                kind = '笔试' if item.get('kind') == 'written' else '面试'
                label = f'{"今日" if day == today else day[5:]} {clock} · {company[:60]} · {kind}（北京）'
            else:
                pending = sum(1 for i in items if i.get('status') == 'planned')
                label = f'面试日程 · {pending} 场待定／待确认' if pending else '面试日程 · 添加下一场安排'
            self._cached = dict(available=True, label=label)
        except (OSError, ValueError, KeyError, TypeError):
            self._cached = dict(available=False, label='面试日程 · 服务未连接，点击查看')
        return self._cached
