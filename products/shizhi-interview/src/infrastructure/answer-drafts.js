/** Answer drafts survive session rebinding and cannot overwrite a newer tab's revision. */
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DomainError } from '../domain/errors.js'

export class AnswerDrafts {
  constructor(file) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
    this.db = new DatabaseSync(file)
    try {
      if (this.db.prepare('PRAGMA user_version').get().user_version > 1) throw new Error('草稿数据库版本较新，请升级应用')
      this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS drafts (practice TEXT, question TEXT, attempts INTEGER, revision INTEGER, text TEXT, updated INTEGER, PRIMARY KEY(practice,question)); PRAGMA user_version=1')
    } catch (error) { this.db.close(); throw error }
  }
  /** Returns only a draft for the current answer attempt; submitted drafts become empty. */
  read(practice, question, attempts) {
    const row = this.db.prepare('SELECT * FROM drafts WHERE practice=? AND question=?').get(practice, question)
    return { text: row?.attempts === attempts ? row.text : '', revision: row?.revision || 0, attempts, updatedAt: row?.updated || null }
  }
  /** Uses a revision check so a stale browser cannot replace a more recent draft. */
  save(practice, question, attempts, revision, text) {
    if (typeof text !== 'string' || text.length > 30000 || !Number.isSafeInteger(revision) || revision < 0) throw new TypeError('草稿格式不正确，最多 30000 字')
    const saved = this.db.prepare(`INSERT INTO drafts SELECT ?,?,?,?,?,? WHERE ?=0 OR EXISTS(SELECT 1 FROM drafts WHERE practice=? AND question=?)
      ON CONFLICT(practice,question) DO UPDATE SET attempts=excluded.attempts,revision=excluded.revision,text=excluded.text,updated=excluded.updated
      WHERE drafts.revision=? RETURNING revision`).get(practice, question, attempts, revision + 1, text, Date.now(), revision, practice, question, revision)
    if (!saved) throw new DomainError('DRAFT_CONFLICT', '草稿已在其他窗口更新，请复制当前回答后刷新页面')
    return this.read(practice, question, attempts)
  }
  close() { this.db.close() }
  /** Removes draft text when its practice or question is explicitly deleted. */
  remove(practice, question) {
    if (question) this.db.prepare('DELETE FROM drafts WHERE practice=? AND question=?').run(practice, question)
    else this.db.prepare('DELETE FROM drafts WHERE practice=?').run(practice)
  }
}
