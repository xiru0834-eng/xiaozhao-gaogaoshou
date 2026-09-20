import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, realpathSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { acquireProfile, backupDir, safeFile } from './runtime-config.ts';
import { readRecords } from './application-records.ts';
import { Store } from './store.ts';

export async function importProfile(source: string, target: string) {
  if (!isAbsolute(source)) throw new Error('Source must be an explicit absolute path');
  const profile=acquireProfile(target);
  let store: Store | undefined;
  try {
    const destination=safeFile(profile.dataDir,'qiuzhao.db');
    const realSource=realpathSync.native(source);
    if (existsSync(destination)) {
      if (realSource.toLowerCase()===realpathSync.native(destination).toLowerCase()) throw new Error('Source and target are the same');
      const existing=new DatabaseSync(destination,{readOnly:true});
      try { if (readRecords(existing).length) throw new Error('Target progress is not empty'); } finally { existing.close(); }
    }
    const original=new DatabaseSync(realSource,{readOnly:true,timeout:3000});
    const snapshot=join(backupDir(profile.dataDir),`import-${randomUUID()}.db`);
    try {
      original.exec('PRAGMA trusted_schema=OFF');
      readRecords(original);
      await backup(original,snapshot);
    } finally { original.close(); }
    const saved=new DatabaseSync(snapshot,{readOnly:true});
    let records;
    try {
      saved.exec('PRAGMA trusted_schema=OFF');
      if (saved.prepare('PRAGMA integrity_check').get()?.integrity_check!=='ok') throw new Error('Snapshot integrity failed');
      records=readRecords(saved);
    } finally { saved.close(); }
    store=new Store(destination);
    const checksum=store.importRecords(records);
    return {profileId:profile.profileId,count:records.length,checksum,snapshot};
  } finally { store?.close(); profile.close(); }
}
