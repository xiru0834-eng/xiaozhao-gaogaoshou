import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { parseStatuses, type StatusMap } from "../shared/types.ts";
import { readRecords, type ApplicationRecord } from "./application-records.ts";
import { createHash } from "node:crypto";
import { safeFile } from "./runtime-config.ts";
import { basename } from "node:path";

/** SQLite is contained here so the driver can change without touching the UI. */
export class Store {
  private db: DatabaseSync;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(safeFile(dirname(path), basename(path)), {
      timeout: 3000,
    });
    try {
      const version = Number(
        this.db.prepare("PRAGMA user_version").get()?.user_version,
      );
      if (![0, 1].includes(version))
        throw new Error("Unsupported progress schema version");
      if (version === 0) {
        const tables = this.db
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
          )
          .all();
        if (tables.length && !tables.some((t) => t.name === "applications"))
          throw new Error("Unrecognized progress database");
        if (tables.length) readRecords(this.db);
        this.db.exec("BEGIN IMMEDIATE");
        try {
          this.db.exec(
            "CREATE TABLE IF NOT EXISTS applications (name TEXT PRIMARY KEY, status TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE imports (id TEXT PRIMARY KEY,checksum TEXT NOT NULL,count INTEGER NOT NULL,imported_at TEXT NOT NULL); PRAGMA user_version=1",
          );
          this.db.exec("COMMIT");
        } catch (error) {
          this.db.exec("ROLLBACK");
          throw error;
        }
      }
      readRecords(this.db);
      this.db.prepare("SELECT id FROM imports LIMIT 1").get();
    } catch (error) {
      this.db.close();
      throw error;
    }
  }
  records(): ApplicationRecord[] {
    return readRecords(this.db);
  }
  assertImportable(): void {
    if (this.records().length) throw new Error("Target progress is not empty");
    if (this.db.prepare("SELECT id FROM imports LIMIT 1").get())
      throw new Error("Target already imported");
  }
  importRecords(records: ApplicationRecord[]): string {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.assertImportable();
      const insert = this.db.prepare("INSERT INTO applications VALUES (?,?,?)");
      for (const r of records) insert.run(r.name, r.status, r.updated_at);
      // Source and target are both read in SQLite BINARY name order; timestamps are not regenerated.
      const actual = this.records();
      if (
        JSON.stringify(actual) !== JSON.stringify(records) ||
        this.integrity() !== "ok"
      )
        throw new Error("Imported records did not match snapshot");
      const checksum = createHash("sha256")
        .update(JSON.stringify(actual))
        .digest("hex");
      this.db
        .prepare("INSERT INTO imports VALUES (?,?,?,?)")
        .run("legacy", checksum, actual.length, new Date().toISOString());
      this.db.exec("COMMIT");
      return checksum;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
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
