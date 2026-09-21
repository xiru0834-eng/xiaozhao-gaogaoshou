"""Local desktop adapter for the TypeScript profile, never the legacy DB."""
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from floating_model import STATUSES


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('桌面服务重定向已拒绝')


class DesktopClient:
    def __init__(self, base, profile_id=None):
        parts = urllib.parse.urlsplit(base)
        if parts.scheme != 'http' or parts.hostname != '127.0.0.1' or not parts.port or parts.username or parts.password or parts.path not in ('', '/') or parts.query or parts.fragment:
            raise ValueError('桌面版只连接明确的本机端口')
        self.base, self.profile_id, self.token = base.rstrip('/'), profile_id, None
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())

    def read(self, path, data=None):
        if path not in ('/', '/health', '/api/status', '/api/catalog', '/api/schedules'):
            raise ValueError('未知桌面接口')
        headers = {'Origin': self.base, 'Content-Type': 'application/json'}
        if self.profile_id:
            headers['X-Profile-Id'] = self.profile_id
        if self.token:
            headers['X-App-Token'] = self.token
        req = urllib.request.Request(self.base + path, data=None if data is None else json.dumps(data).encode(), headers=headers)
        with self.opener.open(req, timeout=8) as response:
            raw = response.read(5_000_001)
            if len(raw) > 5_000_000:
                raise ValueError('桌面响应过大')
            return raw

    def _json(self, path, data=None):
        result = json.loads(self.read(path, data))
        if not isinstance(result, dict) or (self.profile_id and result.get('profileId') != self.profile_id):
            raise ValueError('资料身份不一致，停止读写')
        return result

    def connect(self):
        # Read health without an old profile header, then explicitly compare identities.
        probe = DesktopClient(self.base)
        health = probe._json('/health')
        if health.get('app') != 'xiaozhao-gaogaoshou-ts' or health.get('features', {}).get('recruitmentTasks', 0) < 2:
            raise ValueError('不是最新版桌面服务')
        identity = health.get('profileId', '')
        if not re.fullmatch(r'[a-f0-9-]{36}', identity) or self.profile_id and identity != self.profile_id:
            raise ValueError('资料身份不一致，停止读写')
        self.profile_id = identity
        html = self.read('/').decode('utf-8')
        token = re.search(r'name="app-token" content="([a-f0-9]{64})"', html)
        profile = re.search(r'name="profile-id" content="([a-f0-9-]{36})"', html)
        if not token or not profile or profile[1] != identity:
            raise ValueError('资料连接凭据无效')
        self.token = token[1]
        return self.statuses()

    def statuses(self):
        result = self._json('/api/status').get('statuses')
        if not isinstance(result, dict) or any(not isinstance(k, str) or v not in STATUSES for k, v in result.items()):
            raise ValueError('进度响应无效')
        return result

    def catalog(self):
        return self._json('/api/catalog')

    def save(self, updates):
        if not isinstance(updates, dict) or any(not isinstance(k, str) or v not in STATUSES for k, v in updates.items()):
            raise ValueError('进度无效')
        try:
            result = self._json('/api/status', {'updates': updates})
        except urllib.error.HTTPError as error:
            if error.code != 403:
                raise
            self.connect()  # Only idempotent progress saves may reconnect, never model calls.
            result = self._json('/api/status', {'updates': updates})
        if result.get('ok') is not True:
            raise ValueError('没有收到保存确认')


class DesktopCatalog:
    cats = dict(net='互联网平台', ai='AI 原生 · 大模型', fin='金融科技', soe='国企央企', car='车企', hw='硬件', b2b='企业软件', game='游戏', frn='外企')
    owners = dict(private='私企', foreign='外企', state='央国企', public='科研/事业单位')

    def __init__(self, snapshot):
        self.rows = snapshot.get('companies')
        meta = snapshot.get('metadata')
        if not isinstance(self.rows, list) or not isinstance(meta, list) or len(meta) != len(self.rows) or not self.rows:
            raise ValueError('公司目录无效')
        self.by_name, self._owners = {}, {}
        for row, entry in zip(self.rows, meta):
            if not isinstance(row, list) or len(row) != 10 or not all(isinstance(x, str) for x in row) or row[0] in self.by_name or row[1] not in self.cats or not isinstance(entry, dict) or entry.get('name') != row[0] or entry.get('ownership') not in self.owners:
                raise ValueError('公司目录不一致')
            self.by_name[row[0]], self._owners[row[0]] = row, entry['ownership']
        self.dates = dict(snapshot.get('appendDates', []))

    def owner(self, row):
        return self._owners[row[0]]
