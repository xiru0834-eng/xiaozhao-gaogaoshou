export type SkinId = 'mint' | 'blue' | 'sakura' | 'violet' | 'amber';
export type ColorMode = 'light' | 'dark';
export interface Appearance { skin: SkinId; mode: ColorMode; characters: boolean }
export interface AppearanceStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export const SKINS = [
  { id: 'mint', name: '薄荷石墨', subtitle: '熟悉的，刚刚好', mood: '温柔 · 原版', image: '', position: '0% 0%', caption: '每一步，都算数。', detail: '蓬松绿发、星星发饰和那块熟悉的清单。', swatch: '#176953' },
  { id: 'blue', name: '霁蓝', subtitle: '话很少，事情都记好了', mood: '三无 · 冰蓝', image: '/assets/skins/cast.png', position: '0% 0%', caption: '……整理好了。下一家。', detail: '深蓝姬发长直发，齐刘海，抱书的冷静派。', swatch: '#285da8' },
  { id: 'sakura', name: '绯樱', subtitle: '嘴上不说，心里很在意', mood: '傲娇 · 绯红', image: '/assets/skins/cast.png', position: '100% 0%', caption: '才不是催你，别错过截止啦。', detail: '红棕高侧马尾，短外套，抱臂微微鼓腮。', swatch: '#a63354' },
  { id: 'violet', name: '紫夜', subtitle: '慢一点，也有自己的节奏', mood: '慵懒 · 星紫', image: '/assets/skins/cast.png', position: '0% 100%', caption: '喝口热的，再看下一家吧。', detail: '银紫侧麻花辫，宽松针织衫，双手捧杯。', swatch: '#7048a5' },
  { id: 'amber', name: '琥珀', subtitle: '把一点元气，分给今天', mood: '元气 · 暖金', image: '/assets/skins/cast.png', position: '100% 100%', caption: '准备好了吗？一起冲下一家！', detail: '蜜金双丸子头，连帽卫衣，眨眼比耶。', swatch: '#8b5b1d' },
] as const;
export function skinOf(id: unknown) { return SKINS.find(s => s.id === id) ?? SKINS[0]; }

const KEY = 'qiuzhao-appearance-v1';
export function readAppearance(storage?: AppearanceStorage): Appearance {
  const result: Appearance = { skin: 'mint', characters: true, mode: 'light' };
  try { result.mode = storage?.getItem('qiuzhao-theme') === 'dark' ? 'dark' : 'light'; } catch { /* Session default. */ }
  try {
    const value: unknown = JSON.parse(storage?.getItem(KEY) ?? 'null');
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const raw = value as Record<string, unknown>;
      result.skin = skinOf(raw.skin).id;
      result.characters = typeof raw.characters === 'boolean' ? raw.characters : true;
    }
  } catch { /* A malformed preference must never stop the workbench. */ }
  return result;
}
export function saveAppearance(storage: AppearanceStorage | undefined, value: Appearance): boolean {
  if (!storage) return false;
  try {
    storage.setItem(KEY, JSON.stringify({ skin: value.skin, characters: value.characters }));
    storage.setItem('qiuzhao-theme', value.mode);
    return true;
  } catch { return false; }
}

// Only appearance tokens vary. Alarm/success/interview colors remain semantic.
const accents = {
  mint: { light: '#176953', dark: '#88d8b7', soft: '#e8f5ee', dim: '#263d36', side: '#17232c', tint: '#c2eadb', on: '#153a30', bg: '#f3f5f7' },
  blue: { light: '#285da8', dark: '#aacbff', soft: '#eaf1fc', dim: '#243448', side: '#162337', tint: '#d4e5ff', on: '#173454', bg: '#f2f5fa' },
  sakura: { light: '#a63354', dark: '#ffb1c3', soft: '#fbeef2', dim: '#422932', side: '#2c1f2a', tint: '#f6d6df', on: '#572037', bg: '#f8f3f5' },
  violet: { light: '#7048a5', dark: '#d4b9fa', soft: '#f1ebfa', dim: '#362c44', side: '#241e33', tint: '#e2d6f5', on: '#402760', bg: '#f5f3f9' },
  amber: { light: '#8b5b1d', dark: '#f0c68a', soft: '#fbf1e1', dim: '#3e3427', side: '#2c261f', tint: '#f3dfbd', on: '#513715', bg: '#f7f5f0' },
} as const;
export function paletteFor(id: SkinId, mode: ColorMode): Record<string, string> {
  const a = accents[id], dark = mode === 'dark';
  return {
    bg: dark ? '#11151b' : a.bg, paper: dark ? '#1a1f27' : '#ffffff', 'paper-2': dark ? '#222832' : '#f7f8fa',
    ink: dark ? '#eef1f5' : '#222b35', muted: dark ? '#b1bac7' : '#5c6572', faint: dark ? '#a5b1c0' : '#66717f',
    line: dark ? '#343d49' : '#e4e8ed', 'line-strong': dark ? '#5a6879' : '#bbc4cf',
    accent: dark ? a.dark : a.light, 'accent-ink': dark ? a.dark : a.light,
    'accent-soft': dark ? a.dim : a.soft, 'on-accent': dark ? a.on : '#ffffff',
    sidebar: a.side, 'side-accent': a.tint, 'side-active': a.tint, 'side-active-ink': a.on,
    'skin-wash': a.soft, 'skin-ink': a.on,
  };
}
