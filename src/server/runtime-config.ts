import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { homedir } from 'node:os';

function canonical(path: string): string {
  const absolute = resolve(path);
  if (existsSync(absolute)) return realpathSync.native(absolute);
  const parent = dirname(absolute);
  if (parent === absolute) throw new Error('Invalid data root');
  return join(canonical(parent), basename(absolute));
}
export function prepareDataDir(path: string, sourceRoot = process.cwd()): string {
  if (!isAbsolute(path)) throw new Error('Data directory must be absolute');
  const dataDir = canonical(path);
  if (/[/\\]QiuzhaoLedger(?:[/\\]|$)/i.test(dataDir)) throw new Error('Refusing legacy data directory');
  const rel = relative(canonical(sourceRoot), dataDir);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) throw new Error('Data must be outside the source directory');
  if (dirname(dataDir) === dataDir || dataDir.toLowerCase() === canonical(homedir()).toLowerCase()) throw new Error('Refusing broad data root');
  mkdirSync(dataDir, { recursive: true });
  return dataDir;
}
export function safeFile(directory: string, name: string): string {
  if (basename(name) !== name) throw new Error('Invalid data filename');
  const path = join(directory, name);
  // Includes dangling links; never follow another database through a link/hard link.
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error('Unsafe linked data file');
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  return path;
}
export function backupDir(directory: string): string {
  const path = join(directory, 'backups');
  if (existsSync(path) && (lstatSync(path).isSymbolicLink() || !lstatSync(path).isDirectory())) throw new Error('Unsafe backups directory');
  mkdirSync(path, { recursive: true });
  return path;
}
export function acquireProfile(path: string) {
  const dataDir = prepareDataDir(path);
  const db = new DatabaseSync(safeFile(dataDir, 'runtime.db'), { timeout: 0 });
  try {
    db.exec('BEGIN EXCLUSIVE');
    db.exec('CREATE TABLE IF NOT EXISTS identity (id TEXT PRIMARY KEY CHECK(id=\'profile\'), value TEXT NOT NULL)');
    db.prepare('INSERT OR IGNORE INTO identity VALUES (?,?)').run('profile', randomUUID());
    const profileId = db.prepare('SELECT value FROM identity WHERE id=?').get('profile')?.value;
    if (typeof profileId !== 'string' || !/^[0-9a-f-]{36}$/.test(profileId)) throw new Error('Invalid profile identity');
    db.exec('COMMIT');
    db.exec('BEGIN EXCLUSIVE');
    let closed = false;
    return { dataDir, profileId, instanceId: randomUUID(), close() {
      if (!closed) { db.close(); closed = true; }
    }};
  } catch (error) {
    db.close();
    if (error instanceof Error && /locked|busy/i.test(error.message)) throw new Error('Profile already in use; close its server before continuing');
    throw error;
  }
}
