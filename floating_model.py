"""Frontend model only: read existing catalog and call the unchanged local API."""
from dataclasses import dataclass
import json
import pathlib
import re
import urllib.error
import urllib.parse
import urllib.request

STATUSES = ('未投', '已投', '笔试', '面试', 'Offer', '结束', '无合适岗位')
APPLIED = frozenset(STATUSES[1:6])


def literal_array(source, name):
    match = re.search(r'const\s+' + re.escape(name) + r'\s*=\s*(?:new\s+(?:Set|Map)\s*\()?\s*\[', source)
    if not match:
        raise ValueError('台账缺少 ' + name + '，请打开完整版检查。')
    pos, result, decoder = match.end(), [], json.JSONDecoder()
    while True:
        trivia = re.match(r'(?:\s|//[^\n]*(?:\n|$))*', source[pos:])
        pos += trivia.end()
        if source[pos:pos + 1] == ']':
            return result
        value, end = decoder.raw_decode(source, pos)
        result.append(value)
        pos = end
        while pos < len(source) and source[pos].isspace():
            pos += 1
        if source[pos:pos + 1] == ',':
            pos += 1
        elif source[pos:pos + 1] != ']':
            raise ValueError('台账数组格式异常：' + name)


class Catalog:
    @classmethod
    def read(cls, path):
        text = pathlib.Path(path).read_text(encoding='utf-8')
        obj = cls()
        obj.rows = literal_array(text, 'DATA')
        if not obj.rows or any(not isinstance(row, list) or len(row) != 10 or not all(isinstance(v, str) for v in row) for row in obj.rows):
            raise ValueError('公司清单格式异常，未改动原文件。')
        obj.by_name = {r[0]: r for r in obj.rows}
        if len(obj.by_name) != len(obj.rows):
            raise ValueError('公司清单存在重复名称。')
        obj.cats = dict(literal_array(text, 'CATS'))
        obj.owners = dict(literal_array(text, 'OWNERSHIPS'))
        obj.foreign = set(literal_array(text, 'FOREIGN_COMPANIES'))
        obj.state = set(literal_array(text, 'STATE_COMPANIES'))
        obj.public = set(literal_array(text, 'PUBLIC_RESEARCH_ORGS'))
        obj.dates = dict(literal_array(text, 'APPEND_DATES'))
        return obj

    def owner(self, row):
        if row[0] in self.foreign or row[1] == 'frn':
            return 'foreign'
        if row[0] in self.public:
            return 'public'
        if row[0] in self.state or row[1] == 'soe':
            return 'state'
        return 'private'

    def filter(self, statuses, query='', owner='all', status='all', only_code=False, recent=False):
        result = []
        for row in self.rows:
            current = statuses.get(row[0], '未投')
            if status == 'applied' and current not in APPLIED:
                continue
            if status not in ('all', 'applied') and current != status:
                continue
            if owner != 'all' and self.owner(row) != owner:
                continue
            if only_code and not re.fullmatch(r'[A-Za-z0-9]{4,24}', row[4]):
                continue
            if recent and row[0] not in self.dates:
                continue
            hay = ' '.join(row + [self.cats.get(row[1], ''), self.owners[self.owner(row)]])
            if query.strip().casefold() not in hay.casefold():
                continue
            result.append(row)
        return result


def safe_url(url):
    parts = urllib.parse.urlsplit(url)
    return parts.scheme in ('http', 'https') and bool(parts.hostname) and not parts.username and not any(c in url for c in '\r\n')


class LedgerClient:
    def __init__(self, base):
        parts = urllib.parse.urlsplit(base)
        if parts.scheme != 'http' or parts.hostname != '127.0.0.1' or parts.path not in ('', '/') or parts.query or parts.username:
            raise ValueError('悬浮台账只连接本机服务。')
        self.base = base.rstrip('/')
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        self.token = None

    def _json(self, path, data=None):
        headers = {'Content-Type': 'application/json', 'Origin': self.base}
        if self.token:
            headers['X-App-Token'] = self.token
        request = urllib.request.Request(self.base + path, data=data, headers=headers)
        with self.opener.open(request, timeout=5) as response:
            return json.load(response)

    def connect(self):
        if self._json('/health').get('app') != 'qiuzhao-ledger-v1':
            raise ValueError('端口上的服务不是秋招台账。')
        with self.opener.open(self.base + '/', timeout=5) as response:
            html = response.read().decode('utf-8')
        match = re.search(r'window\.APP_TOKEN=("[a-f0-9]{64}");', html)
        if not match:
            raise ValueError('本地服务未提供保存凭据。')
        self.token = json.loads(match.group(1))
        return self.statuses()

    def statuses(self):
        result = self._json('/api/status').get('statuses')
        if not isinstance(result, dict) or any(not isinstance(k, str) or v not in STATUSES for k, v in result.items()):
            raise ValueError('投递状态响应无效。')
        return result

    def save(self, updates):
        if not self.token:
            self.connect()
        payload = json.dumps({'updates': updates}, ensure_ascii=False).encode()
        try:
            result = self._json('/api/status', payload)
        except urllib.error.HTTPError as error:
            if error.code != 403:
                raise
            self.connect()  # A restarted local backend has a fresh token.
            result = self._json('/api/status', payload)
        if result.get('ok') is not True:
            raise ValueError('服务器未确认保存。')


class SaveState:
    def __init__(self, values):
        self.values = dict(values)
        self.pending = {}
        self.inflight = {}

    @property
    def dirty(self):
        return bool(self.pending or self.inflight)

    def change(self, name, value):
        if value not in STATUSES or not 0 < len(name) <= 200:
            raise ValueError('状态无效')
        self.values[name] = value
        self.pending[name] = value

    def begin(self):
        if self.inflight:
            raise RuntimeError('已有正在提交的更新')
        self.inflight, self.pending = self.pending, {}
        return dict(self.inflight)

    def succeeded(self, batch):
        self.inflight = {}

    def failed(self, batch):
        self.pending = {**batch, **self.pending}
        self.inflight = {}

    def merge(self, remote):
        self.values = {**remote, **self.inflight, **self.pending}


@dataclass
class DockState:
    expanded: bool = True
    pinned: bool = False
    editing: bool = False
    dragging: bool = False
    blocked: bool = False
    entered: float | None = None
    left: float | None = None

    def tick(self, now, inside):
        if inside:
            self.left = None
            self.entered = now if self.entered is None else self.entered
            if not self.expanded and now - self.entered >= .22:
                self.expanded = True
                return 'expand'
        else:
            self.entered = None
            if self.pinned or self.editing or self.dragging or self.blocked:
                self.left = None
            else:
                self.left = now if self.left is None else self.left
                if self.expanded and now - self.left >= .8:
                    self.expanded = False
                    return 'collapse'
        return None


def fit_rect(x, y, width, height, work):
    left, top, right, bottom = work
    width, height = min(width, right - left), min(height, bottom - top)
    return max(left, min(x, right - width)), max(top, min(y, bottom - height)), width, height
