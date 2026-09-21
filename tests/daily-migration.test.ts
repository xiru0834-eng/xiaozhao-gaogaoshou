import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CatalogStore } from '../src/server/catalog-store.ts';
import { DatabaseSync } from 'node:sqlite';
test('v3 migration backs up before adding tables, preserves catalog and survives physical reopen', async () => {
  const dir=await mkdtemp(join(tmpdir(),'daily-migration-')), backups=join(dir,'backups');await mkdir(backups);
  let catalog:CatalogStore|undefined;
  try {
    catalog=new CatalogStore(join(dir,'catalog.db'));await catalog.collections(backups,[]);
    const before=catalog.snapshot(),daily=await catalog.daily(backups,'fixture-profile');
    const run=daily.startManual('migration-request',0,'2026-09-21T00:00:00Z',1,1);
    daily.reserve('attempt-reopen',run.id,'search','2026-09-21T00:00:00Z');
    catalog.close();catalog=new CatalogStore(join(dir,'catalog.db'));await catalog.collections(backups,[]);
    const reopened=await catalog.daily(backups,'fixture-profile');reopened.recover('2026-09-21T01:00:00Z');
    assert.equal(reopened.usage('2026-09-21T01:00:00Z').search,1);
    assert.equal(reopened.run(run.id).state,'interrupted');assert.deepEqual(catalog.snapshot(),before);assert.equal(catalog.integrity(),'ok');
    const backup=(await readdir(backups)).find(n=>n.startsWith('before-catalog-v3-'))!;
    const old=new DatabaseSync(join(backups,backup),{readOnly:true});
    try {assert.equal(old.prepare('PRAGMA user_version').get()?.user_version,2);assert.equal(old.prepare("SELECT name FROM sqlite_master WHERE name='daily_runs'").get(),undefined);}finally{old.close();}
  } finally {catalog?.close();await rm(dir,{recursive:true,force:true});}
});
