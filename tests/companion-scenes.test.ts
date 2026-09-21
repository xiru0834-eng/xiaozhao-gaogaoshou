import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKINS } from '../src/client/appearance-model.ts';
import { companionScene } from '../src/client/companion-scenes.ts';
import { readFileSync } from 'node:fs';

test('five companions use five independent local generated landscape paintings', () => {
  const scenes = SKINS.map(s => companionScene(s.id));
  assert.equal(new Set(scenes.map(s => s.name)).size, 5);
  assert.equal(new Set(scenes.map(s => s.art)).size, 5);
  for (const scene of scenes) {
    assert.match(scene.art, /^\/assets\/skins\/(mint|blue|sakura|violet|amber)-hero-v2\.png$/);
    const bytes = readFileSync(new URL(`../web/public${scene.art}`, import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    assert.ok(width >= 1500 && width / height > 2.8 && width / height < 3.2);
    assert.ok(scene.name.length <= 6);
  }
});

test('unknown scene preferences fall back to the original without interpolating input', () => {
  assert.equal(companionScene('bad').name, '晨光花园');
  assert.deepEqual(companionScene('__proto__'), companionScene('mint'));
  assert.doesNotMatch(companionScene('<script>').art, /<script>/);
});
