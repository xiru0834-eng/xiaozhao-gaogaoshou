import { DatabaseSync, backup } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { basename,dirname } from 'node:path';
import { DATA,APPEND_DATES,ownershipOf,recruitChannelOf,recruitChannelEvidence } from '../shared/catalog.ts';
import { DataError,normalizedName,parseCompany,parseCatalog,type NewCompany,type CatalogSnapshot } from '../shared/catalog-contract.ts';
import { safeFile } from './runtime-config.ts';

export class CatalogStore {
  private db:DatabaseSync;
  constructor(path:string){
    mkdirSync(dirname(path),{recursive:true});this.db=new DatabaseSync(safeFile(dirname(path),basename(path)),{timeout:3000});
    try{
      this.db.exec('PRAGMA foreign_keys=ON');
      const version=Number(this.db.prepare('PRAGMA user_version').get()?.user_version);
      if(![0,1].includes(version))throw new Error('Unsupported catalog schema version');
      if(version===0){
        if(this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").get())throw new Error('Unrecognized catalog schema');
        this.db.exec('BEGIN IMMEDIATE');
        try{
          this.db.exec(`CREATE TABLE companies(sequence INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,name TEXT UNIQUE NOT NULL,row_json TEXT NOT NULL,ownership TEXT NOT NULL,first_seen TEXT,channel TEXT NOT NULL,evidence TEXT NOT NULL);
            CREATE TABLE aliases(key TEXT PRIMARY KEY,display TEXT NOT NULL,company_id TEXT NOT NULL REFERENCES companies(id));
            CREATE TABLE metadata(key TEXT PRIMARY KEY,value INTEGER NOT NULL);
            INSERT INTO metadata VALUES ('revision',0); PRAGMA user_version=1;`);
          this.db.exec('COMMIT');
        }catch(error){this.db.exec('ROLLBACK');throw error;}
      }
      this.snapshot();
      this.db.exec('BEGIN IMMEDIATE');
      try{
        for(const row of DATA)this.insert(parseCompany({row,ownership:ownershipOf(row),aliases:[],firstSeenDate:APPEND_DATES.get(row[0])??null,channel:recruitChannelOf(row),channelEvidence:recruitChannelEvidence(row)}));
        this.snapshot();
        this.db.exec('COMMIT');
      }catch(error){this.db.exec('ROLLBACK');throw error;}
      this.snapshot();
    }catch(error){this.db.close();throw error;}
  }
  private revision():number{return Number(this.db.prepare("SELECT value FROM metadata WHERE key='revision'").get()?.value);}
  private insert(input:NewCompany){
    const aliases=new Map([input.row[0],...input.aliases].map(a=>[normalizedName(a),a]));
    const matches=new Set<string>();
    for(const key of aliases.keys()){const existing=this.db.prepare('SELECT company_id FROM aliases WHERE key=?').get(key);if(existing)matches.add(String(existing.company_id));}
    if(matches.size>1)throw new DataError('CONFLICT','Company alias conflict; explicit review required');
    if(matches.size===1)return {id:[...matches][0],inserted:false,revision:this.revision()};
    if(Number(this.db.prepare('SELECT count(*) AS n FROM companies').get()?.n)>=10000)throw new DataError('LIMIT','Catalog limit reached');
    const id='co_'+createHash('sha256').update(normalizedName(input.row[0])).digest('hex').slice(0,32);
    this.db.prepare('INSERT INTO companies(id,name,row_json,ownership,first_seen,channel,evidence) VALUES(?,?,?,?,?,?,?)').run(id,input.row[0],JSON.stringify(input.row),input.ownership,input.firstSeenDate,input.channel,input.channelEvidence);
    for(const [key,display] of aliases)this.db.prepare('INSERT INTO aliases VALUES (?,?,?)').run(key,display,id);
    this.db.exec("UPDATE metadata SET value=value+1 WHERE key='revision'");
    return {id,inserted:true,revision:this.revision()};
  }
  append(value:unknown,expectedRevision:number){
    const input=parseCompany(value);
    this.db.exec('BEGIN IMMEDIATE');
    try{
      if(expectedRevision!==this.revision())throw new DataError('CONFLICT','Catalog revision conflict; reload before retry');
      const result=this.insert(input);this.db.exec('COMMIT');return result;
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  snapshot():CatalogSnapshot{
    const rows=this.db.prepare('SELECT * FROM companies ORDER BY sequence').all();
    const aliases=new Map<string,{key:string;display:string}[]>();
    for(const alias of this.db.prepare('SELECT company_id,key,display FROM aliases ORDER BY key').all()){
      const id=String(alias.company_id);const list=aliases.get(id)??[];
      list.push({key:String(alias.key),display:String(alias.display)});aliases.set(id,list);
    }
    return parseCatalog({schemaVersion:1,revision:this.revision(),companies:rows.map(r=>JSON.parse(String(r.row_json)) as unknown),
      appendDates:rows.filter(r=>r.first_seen!==null).map(r=>[r.name,r.first_seen]),
      metadata:rows.map(r=>({id:r.id,name:r.name,sequence:r.sequence,ownership:r.ownership,channel:r.channel,channelEvidence:r.evidence,aliases:(aliases.get(String(r.id))??[]).filter(a=>a.key!==normalizedName(String(r.name))).map(a=>a.display)}))});
  }
  integrity():string{return String(this.db.prepare('PRAGMA integrity_check').get()?.integrity_check);}
  async backup(path:string){await backup(this.db,path);}
  close(){this.db.close();}
}
