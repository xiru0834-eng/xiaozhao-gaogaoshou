import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { acquireProfile, prepareDataDir } from '../src/server/runtime-config.ts';

test('profiles have stable independent identities and exclude duplicate writers', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xiaozhao-profiles-'));
  try {
    const a = acquireProfile(join(root, 'a')); const b = acquireProfile(join(root, 'b'));
    assert.notEqual(a.profileId, b.profileId);
    assert.throws(() => acquireProfile(join(root, 'a')), /already in use/);
    const id = a.profileId; a.close(); b.close();
    const again = acquireProfile(join(root, 'a')); assert.equal(again.profileId, id); again.close();
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('legacy path and junction to legacy path are rejected before writing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xiaozhao-path-'));
  try {
    const legacy = join(root, 'QiuzhaoLedger'); await mkdir(legacy);
    await symlink(legacy, join(root, 'alias'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => prepareDataDir(legacy), /legacy/);
    assert.throws(() => prepareDataDir(join(root, 'alias', 'new')), /legacy/);
    assert.throws(() => prepareDataDir(resolve('.')), /source/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('operating system releases the profile lock after a real child process is killed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xiaozhao-crash-'));
  const moduleUrl = new URL('../src/server/runtime-config.ts', import.meta.url).href;
  const child = spawn(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e',
    `import {acquireProfile} from ${JSON.stringify(moduleUrl)}; const p=acquireProfile(${JSON.stringify(root)}); console.log(p.profileId); setInterval(()=>{},1000);`], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  try {
    const [chunk] = await once(child.stdout!, 'data'); const id = String(chunk).trim();
    assert.match(id, /^[0-9a-f-]{36}$/);
    assert.throws(() => acquireProfile(root), /already in use/);
    const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited;
    const recovered = acquireProfile(root); assert.equal(recovered.profileId, id); recovered.close();
  } finally { child.kill(); await rm(root, { recursive: true, force: true }); }
});
