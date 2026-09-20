import type { DatabaseSync } from 'node:sqlite';
import { isStatus, type Status } from '../shared/types.ts';
export interface ApplicationRecord { name: string; status: Status; updated_at: string }
export function readRecords(db: DatabaseSync): ApplicationRecord[] {
  const version=Number(db.prepare('PRAGMA user_version').get()?.user_version);
  if (![0,1].includes(version)) throw new Error('Unsupported progress schema version');
  const table=db.prepare("SELECT type FROM sqlite_master WHERE name='applications'").get();
  if (table?.type!=='table') throw new Error('Missing applications table');
  const columns=db.prepare('PRAGMA table_info(applications)').all();
  if (columns.length!==3 || columns.map(c=>c.name).join(',')!=='name,status,updated_at' || columns[0].pk!==1) throw new Error('Unsupported applications schema');
  if (Number(db.prepare('SELECT count(*) AS n FROM applications').get()?.n)>100000) throw new Error('Too many progress records');
  return db.prepare('SELECT name,status,updated_at FROM applications ORDER BY name').all().map(r=>{
    if (typeof r.name!=='string' || !r.name.trim() || r.name.length>200 || !isStatus(r.status) || typeof r.updated_at!=='string' || !r.updated_at.trim() || r.updated_at.length>100) throw new Error('Invalid progress record');
    return {name:r.name,status:r.status,updated_at:r.updated_at};
  });
}
