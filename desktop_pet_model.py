"""Pure animation and placement rules for the Windows pet host."""
import json
import pathlib


def load_cast(directory):
    root = pathlib.Path(directory).resolve()
    data = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    if not isinstance(data, list) or {c['id'] for c in data} != {'mint', 'blue', 'sakura', 'violet', 'amber'}:
        raise ValueError('桌宠角色清单无效')
    for character in data:
        if {a['id'] for a in character['actions']} != {'idle', 'greet'}:
            raise ValueError('桌宠动作不完整')
        for action in character['actions']:
            if not action['frames'] or len(action['frames']) != len(action['durations']) or any(type(t) is not int or not 16 <= t <= 10000 for t in action['durations']):
                raise ValueError('动画帧时长无效')
            for frame in action['frames']:
                file = (root / frame).resolve()
                if not file.is_relative_to(root) or file.suffix != '.png' or not file.is_file():
                    raise ValueError('动画帧越界或缺失')
    return data


class Animation:
    def __init__(self, durations):
        self.durations = durations
        self.paused = False
        self.start('idle', 0)

    def start(self, action, now):
        self.action, self.index, self.changed = action, 0, now

    def tick(self, now):
        if self.paused:
            self.changed = now
        elif (now - self.changed) * 1000 >= self.durations[self.action][self.index]:
            self.changed = now  # Do not accumulate a sleep/resume backlog.
            self.index += 1
            if self.index >= len(self.durations[self.action]):
                self.start('idle', now)
        return self.action, self.index


def clamp_position(x, y, width, height, area):
    left, top, right, bottom = area
    return max(left, min(int(x), max(left, right-width))), max(top, min(int(y), max(top, bottom-height)))
