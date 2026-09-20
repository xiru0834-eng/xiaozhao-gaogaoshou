import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DATA,APPEND_DATES } from '../src/shared/catalog.ts';
import { CatalogStore } from '../src/server/catalog-store.ts';
import type { NewCompany } from '../src/shared/catalog-contract.ts';

const company=(name: string, aliases: string[]=[]):NewCompany=>({row:[name,'ai','Agent','上海','','','https://example.org/jobs','','','合成测试'],ownership:'private',aliases,firstSeenDate:'2026-09-20',channel:'none',channelEvidence:''});
test('catalog seed preserves every field/order/date and initialization is idempotent after restart', async()=>{
  const root=await mkdtemp(join(tmpdir(),'xiaozhao-catalog-')); const path=join(root,'catalog.db');
  let store=new CatalogStore(path);
  try {
    const first=store.snapshot(); assert.deepEqual(first.companies,DATA); assert.deepEqual(first.appendDates,[...APPEND_DATES]);
    assert.equal(first.metadata.length,315); assert.equal(new Set(first.metadata.map(x=>x.id)).size,315);
    store.close(); store=new CatalogStore(path); assert.deepEqual(store.snapshot(),first);
  }finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('append keeps history; normalized aliases deduplicate; conflicts and stale revisions do not mutate', async()=>{
  const root=await mkdtemp(join(tmpdir(),'xiaozhao-alias-'));const store=new CatalogStore(join(root,'catalog.db'));
  try{
    const before=store.snapshot(); const added=store.append(company('测试公司',['Test Co']),before.revision);
    assert.equal(added.inserted,true); const after=store.snapshot();assert.deepEqual(after.companies.slice(0,315),before.companies);
    assert.equal(after.metadata.at(-1)?.sequence,316);
    const duplicate=store.append(company('  ＴＥＳＴ  CO  '),after.revision);assert.equal(duplicate.id,added.id);assert.equal(duplicate.inserted,false);
    assert.deepEqual(store.snapshot(),after);
    assert.throws(()=>store.append(company('另一家'),before.revision),/revision/);
    assert.throws(()=>store.append(company('冲突',['Test Co','腾讯']),after.revision),/alias/);
    const invalid=company('无效日期');invalid.firstSeenDate='2026-02-30';assert.throws(()=>store.append(invalid,after.revision));
    const url=company('危险链接');url.row[6]='javascript:alert(1)';assert.throws(()=>store.append(url,after.revision));
    assert.deepEqual(store.snapshot(),after);assert.equal(store.integrity(),'ok');
  }finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('unknown catalog version is refused without rewriting the file',async()=>{
  const root=await mkdtemp(join(tmpdir(),'xiaozhao-version-'));const path=join(root,'catalog.db');
  try{const db=new DatabaseSync(path);db.exec('PRAGMA user_version=99');db.close();const before=await readFile(path);assert.throws(()=>new CatalogStore(path),/version/);assert.deepEqual(await readFile(path),before);}
  finally{await rm(root,{recursive:true,force:true});}
});
test('alias insert failure rolls back company and revision together',async()=>{
  const root=await mkdtemp(join(tmpdir(),'xiaozhao-catalog-failure-'));const path=join(root,'catalog.db');const store=new CatalogStore(path);
  try{
    const before=store.snapshot();const db=new DatabaseSync(path);
    db.exec("CREATE TRIGGER reject_alias BEFORE INSERT ON aliases WHEN NEW.key='reject-me' BEGIN SELECT RAISE(ABORT,'alias write failed'); END");db.close();
    assert.throws(()=>store.append(company('模拟失败',['reject-me']),before.revision),/alias write failed/);
    assert.deepEqual(store.snapshot(),before);
    const added=store.append(company('合法二十别名',Array.from({length:20},(_,i)=>'alias'+i)),before.revision);
    assert.equal(added.inserted,true);assert.equal(store.snapshot().metadata.at(-1)?.aliases.length,20);
  }finally{store.close();await rm(root,{recursive:true,force:true});}
});
