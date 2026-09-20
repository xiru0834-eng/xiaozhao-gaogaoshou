import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, link, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { acquireProfile, prepareDataDir, safeFile } from '../src/server/runtime-config.ts';
import { fileURLToPath } from 'node:url';

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

test('operating system releases the profile lock after a real child process is killed', {timeout:10000}, async () => {
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
  } finally {
    if(child.exitCode===null && child.signalCode===null){const exited=once(child,'exit');child.kill();await exited;}
    await rm(root, { recursive: true, force: true });
  }
});

test('source directory is protected regardless of launch cwd; linked database files are refused',async()=>{
  const root=await mkdtemp(join(tmpdir(),'xiaozhao-file-link-'));const before=process.cwd();
  try{
    process.chdir(root);
    assert.throws(()=>prepareDataDir(fileURLToPath(new URL('..',import.meta.url))),/source/);
    await writeFile(join(root,'source.db'),'fixture');await link(join(root,'source.db'),join(root,'linked.db'));
    assert.throws(()=>safeFile(root,'linked.db'),/linked/);
    // Windows file symlinks require a privilege not granted to ordinary test users.
    // A junction at the database filename exercises rejection without elevating permissions.
    await mkdir(join(root,'directory-target'));
    await symlink(process.platform==='win32'?join(root,'directory-target'):join(root,'source.db'),join(root,'symbolic.db'),process.platform==='win32'?'junction':'file');
    assert.throws(()=>safeFile(root,'symbolic.db'),/linked/);
  }finally{process.chdir(before);await rm(root,{recursive:true,force:true});}
});
