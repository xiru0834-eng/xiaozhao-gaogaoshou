import { existsSync } from "node:fs";
import { rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { acquireProfile, backupDir, safeFile } from "./runtime-config.ts";
import { Store } from "./store.ts";
import { CatalogStore } from "./catalog-store.ts";
import { ScheduleStore } from "./schedule-store.ts";

export async function openDataProfile(dataDir: string) {
  return openProfileData(acquireProfile(dataDir));
}

/** Opens and backs up a locked profile, including one owned by an embedding host.
 * @param profile Exclusive lock whose ownership transfers to the returned stores.
 * @returns Profile stores and their idempotent close operation.
 */
export async function openProfileData(profile: ReturnType<typeof acquireProfile>) {
  let progress: Store | undefined;
  let catalog: CatalogStore | undefined;
  let schedules: ScheduleStore | undefined;
  try {
    progress = new Store(safeFile(profile.dataDir, "qiuzhao.db"));
    catalog = new CatalogStore(safeFile(profile.dataDir, "catalog.db"));
    schedules = new ScheduleStore(safeFile(profile.dataDir, "schedules.db"));
    const backups = backupDir(profile.dataDir);
    const date = new Date().toISOString().slice(0, 10);
    for (const [name, database] of [
      ["progress", progress],
      ["catalog", catalog],
      ["schedules", schedules],
    ] as const) {
      const target = safeFile(backups, `${date}-${name}.db`);
      if (existsSync(target)) continue;
      const temporary = join(backups, `pending-${randomUUID()}.tmp`);
      try {
        await database.backup(temporary);
        const check = new DatabaseSync(temporary, { readOnly: true });
        try {
          if (
            check.prepare("PRAGMA integrity_check").get()?.integrity_check !==
            "ok"
          )
            throw new Error("Backup integrity check failed");
        } finally {
          check.close();
        }
        await rename(temporary, target);
      } finally {
        await rm(temporary, { force: true });
      }
    }
    const store = progress;
    const companies = catalog;
    let closed = false;
    return {
      profile,
      store,
      catalog: companies,
      backups,
      schedules,
      close() {
        if (closed) return;
        closed = true;
        schedules?.close();
        try {
          companies.close();
        } finally {
          try {
            store.close();
          } finally {
            profile.close();
          }
        }
      },
    };
  } catch (error) {
    schedules?.close();
    try {
      catalog?.close();
    } finally {
      try {
        progress?.close();
      } finally {
        profile.close();
      }
    }
    throw error;
  }
}
