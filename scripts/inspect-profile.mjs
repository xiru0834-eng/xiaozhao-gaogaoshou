// Read-only logical fingerprints; optional SQLite snapshot before a local upgrade.
// Never outputs records, credentials, notes, or API keys.
import { DatabaseSync, backup } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, realpathSync, lstatSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
const directory=process.argv[2];
if(!directory||!isAbsolute(directory)||/[/\\]QiuzhaoLedger(?:[/\\]|$)/i.test(directory))throw Error('Explicit non-legacy profile required');
const root=realpathSync(directory),snapshot=process.argv.includes('--snapshot');
const result={};
const prefix=`before-daily-${new Date().toISOString().replace(/[:.]/g,'-')}`;
for(const name of ['qiuzhao','catalog','schedules','mail']){
  const path=join(root,`${name}.db`);if(!existsSync(path))continue;
  if(lstatSync(path).isSymbolicLink())throw Error('Linked database refused');
  const db=new DatabaseSync(path,{readOnly:true});
  try{
    const integrity=db.prepare('PRAGMA integrity_check').get().integrity_check;if(integrity!=='ok')throw Error(`${name} integrity failed`);
    const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'daily_%' ORDER BY name").all();
    const count={},hash=createHash('sha256');
    for(const {name:table} of tables){if(!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(table))throw Error('Unexpected table');const rows=db.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all();count[table]=rows.length;hash.update(JSON.stringify([table,rows]));}
    if(snapshot){
      const backups=join(root,'backups');if(existsSync(backups)&&lstatSync(backups).isSymbolicLink())throw Error('Linked backup directory refused');
      mkdirSync(backups,{recursive:true});await backup(db,join(backups,`${prefix}-${name}.db`));
    }
    result[name]={integrity,schema:db.prepare('PRAGMA user_version').get().user_version,tables:count,logicalSha256:hash.digest('hex')};
  }finally{db.close();}
}
console.log(JSON.stringify({profile:root,snapshot: snapshot?prefix:null,databases:result},null,2));
