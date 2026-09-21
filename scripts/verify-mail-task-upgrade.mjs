// Read-only comparison against an explicit pre-upgrade SQLite snapshot.
// Prints counts only: never records, credentials, mail bodies or personal notes.
import {DatabaseSync} from 'node:sqlite';
import {join,isAbsolute,basename} from 'node:path';
import {realpathSync} from 'node:fs';
import assert from 'node:assert/strict';
const [directory,prefix]=process.argv.slice(2);
if(!directory||!isAbsolute(directory)||!prefix||prefix!==basename(prefix)||/QiuzhaoLedger/i.test(directory))throw Error('Explicit preview profile and safe snapshot prefix required');
const root=realpathSync(directory),results={};
for(const name of ['qiuzhao','catalog','schedules','mail']){
 const current=new DatabaseSync(join(root,name+'.db'),{readOnly:true}),before=new DatabaseSync(join(root,'backups',prefix+'-'+name+'.db'),{readOnly:true});
 try{
  assert.equal(current.prepare('PRAGMA integrity_check').get().integrity_check,'ok');const tables=before.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all(),counts={};
  for(const {name:table} of tables){if(!/^[A-Za-z_][A-Za-z_0-9]*$/.test(table))throw Error('Unexpected table');const rows=before.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all();assert.deepEqual(current.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all(),rows,'Changed original table: '+name+'.'+table);counts[table]=rows.length;}
  results[name]={integrity:'ok',originalTablesPreserved:counts,schema:current.prepare('PRAGMA user_version').get().user_version};
 }finally{before.close();current.close();}
}
console.log(JSON.stringify({passed:true,results},null,2));
