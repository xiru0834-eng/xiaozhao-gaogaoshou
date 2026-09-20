import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { parseStatuses, type StatusMap } from "../shared/types.ts";

/** SQLite is contained here so the driver can change without touching the UI. */
export class Store {
  private db: DatabaseSync;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path, { timeout: 3000 });
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS applications (name TEXT PRIMARY KEY, status TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
  }
  statuses(): StatusMap {
    return parseStatuses(
      Object.fromEntries(
        this.db
          .prepare("SELECT name,status FROM applications")
          .all()
          .map((row) => [row.name, row.status]),
      ),
    );
  }
  save(updates: StatusMap): void {
    const checked = parseStatuses(updates);
    const query = this.db.prepare(
      "INSERT INTO applications VALUES (?,?,?) ON CONFLICT(name) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at",
    );
    this.db.exec("BEGIN IMMEDIATE");
    try {
      for (const [name, status] of Object.entries(checked))
        query.run(name, status, new Date().toISOString());
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  async backup(path: string): Promise<void> {
    await backup(this.db, path);
  }
  integrity(): string {
    return String(
      this.db.prepare("PRAGMA integrity_check").get()?.integrity_check,
    );
  }
  close(): void {
    this.db.close();
  }
}
