import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { startServer } from '../src/server/http.ts';
import { SKINS, readAppearance, saveAppearance, paletteFor, skinOf, characterArtwork } from '../src/client/appearance-model.ts';

function memory(values: Record<string, string> = {}) {
  return { getItem: (key: string) => values[key] ?? null, setItem: (key: string, value: string) => { values[key] = value; } };
}

test('all five companions use their existing art and keep atlas cells separate', () => {
  const original = 'data:image/png;base64,original';
  const art = SKINS.map(skin => characterArtwork(skin.id, original));
  assert.equal(new Set(art.map(a => `${a.image}|${a.position}|${a.size}`)).size, 5);
  assert.deepEqual(art[0], {image: original, position: '0% 0%', size: 'contain'});
  assert.equal(art[1].size, '210% 210%');
  assert.equal(art[2].position, '100% 0%');
  assert.equal(art[3].position, '0% 100%');
  assert.equal(art[4].position, '100% 100%');
  assert.ok(SKINS.every(skin => skin.caption.length > 0 && skin.mood.length > 0));
});
test('fresh appearance preserves mint and existing dark preference', () => {
  assert.deepEqual(readAppearance(memory()), { skin: 'mint', characters: true, mode: 'light' });
  assert.deepEqual(readAppearance(memory({ 'qiuzhao-theme': 'dark' })), { skin: 'mint', characters: true, mode: 'dark' });
});

test('character atlas is served as PNG by the unchanged production static route', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'xiaozhao-skin-route-'));
  const app = await startServer({ dataDir: dir, webDir: resolve('web/public'), port: 0 });
  try {
    const response = await fetch(`${app.url}${SKINS[1].image}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.ok(bytes.length < 3_000_000);
  } finally { await app.close(); await rm(dir, { recursive: true, force: true }); }
});
test('appearance round trips without changing unrelated preferences', () => {
  const values = { 'qiuzhao-density': 'compact', 'unrelated': 'preserve' };
  const store = memory(values);
  assert.equal(saveAppearance(store, { skin: 'sakura', mode: 'dark', characters: false }), true);
  assert.deepEqual(readAppearance(store), { skin: 'sakura', mode: 'dark', characters: false });
  assert.equal(values['qiuzhao-density'], 'compact');
  assert.equal(values.unrelated, 'preserve');
});
test('invalid persisted appearance cannot inject a skin, asset URL, or mode', () => {
  for (const value of ['null', '[]', 'broken', '{"skin":"https://evil.test","characters":"false"}', '{"skin":"__proto__"}']) {
    assert.deepEqual(readAppearance(memory({ 'qiuzhao-appearance-v1': value, 'qiuzhao-theme': 'invalid' })), { skin: 'mint', characters: true, mode: 'light' });
  }
  assert.equal(skinOf('unrecognized').id, 'mint');
});
test('blocked browser storage still permits session-only appearance', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.deepEqual(readAppearance(blocked), { skin: 'mint', characters: true, mode: 'light' });
  assert.equal(saveAppearance(blocked, { skin: 'blue', mode: 'light', characters: true }), false);
  assert.equal(saveAppearance(undefined, { skin: 'blue', mode: 'light', characters: true }), false);
});

function luminance(hex: string) {
  const rgb = hex.match(/[a-f0-9]{2}/gi)!.map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
test('five skins have distinct character positions and AA readable palettes in both modes', () => {
  assert.equal(SKINS.length, 5);
  assert.equal(new Set(SKINS.map(s => s.id)).size, 5);
  assert.equal(new Set(SKINS.map(s => s.image + s.position)).size, 5);
  for (const skin of SKINS) {
    if (skin.image) {
      assert.match(skin.image, /^\/assets\/skins\/[a-z]+\.png$/);
      const bytes = readFileSync(new URL(`../web/public${skin.image}`, import.meta.url));
      assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    }
    for (const mode of ['light', 'dark'] as const) {
      const p = paletteFor(skin.id, mode);
      for (const [fg, bg] of [['ink','paper'], ['muted','paper'], ['faint','paper-2'], ['accent','paper'], ['accent-ink','accent-soft'], ['on-accent','accent'], ['side-accent','sidebar'], ['side-active-ink','side-active']] as const) {
        assert.ok(contrast(p[fg], p[bg]) >= 4.5, `${skin.id}/${mode} ${fg}/${bg}: ${contrast(p[fg], p[bg])}`);
      }
    }
  }
});
