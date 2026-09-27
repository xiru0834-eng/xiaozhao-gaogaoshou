import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DATA } from "../src/shared/catalog.ts";
import type { CompanyRow } from "../src/shared/types.ts";

interface SeedMeta {
  ownership: string;
  aliases: string[];
  firstSeenDate: string | null;
  channel: string;
  channelEvidence: string;
}

const databasePath = process.argv[2];
if (!databasePath) throw new Error("Usage: sync-catalog-seed.ts <catalog.db>");

const additionsModule = await import("../src/shared/catalog-additions.ts");
const existingAdditions = additionsModule.CATALOG_ADDITIONS as CompanyRow[];
const metadataPath = resolve("src/shared/catalog-metadata.ts");
const existingMetadata = existsSync(metadataPath)
  ? ((await import(pathToFileURL(metadataPath).href)).CATALOG_METADATA as Map<string, SeedMeta>)
  : new Map<string, SeedMeta>();
const knownNames = new Set(DATA.map((row) => row[0]));
const database = new DatabaseSync(resolve(databasePath), { readOnly: true });
try {
  const integrity = database.prepare("PRAGMA integrity_check").get()?.integrity_check;
  if (integrity !== "ok") throw new Error(`catalog.db integrity_check: ${integrity}`);

  const companies = database.prepare(
    "SELECT sequence, id, name, row_json, ownership, first_seen, channel, evidence FROM companies ORDER BY sequence",
  ).all() as Array<Record<string, unknown>>;
  if (companies.length < DATA.length)
    throw new Error(`Source has ${DATA.length} entries but catalog.db has ${companies.length}`);
  for (let i = 0; i < DATA.length; i++) {
    if (companies[i]?.name !== DATA[i]?.[0])
      throw new Error(`Historical order mismatch at sequence ${i + 1}`);
  }

  const aliasesById = new Map<string, string[]>();
  const aliases = database.prepare(
    "SELECT company_id, key, display FROM aliases ORDER BY company_id, key",
  ).all() as Array<Record<string, unknown>>;
  for (const alias of aliases) {
    const id = String(alias.company_id);
    const name = String(companies.find((company) => company.id === id)?.name ?? "");
    if (String(alias.key) === name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()) continue;
    const values = aliasesById.get(id) ?? [];
    values.push(String(alias.display));
    aliasesById.set(id, values);
  }

  const newRows: CompanyRow[] = [];
  const metadata: Array<[string, SeedMeta]> = [];
  for (const company of companies) {
    const name = String(company.name);
    const row = JSON.parse(String(company.row_json)) as CompanyRow;
    if (row[0] !== name) throw new Error(`Row/name mismatch for ${name}`);
    if (!knownNames.has(name)) newRows.push(row);
    metadata.push([
      name,
      existingMetadata.get(name) ?? {
        ownership: String(company.ownership),
        aliases: aliasesById.get(String(company.id)) ?? [],
        firstSeenDate: company.first_seen === null ? null : String(company.first_seen),
        channel: String(company.channel),
        channelEvidence: String(company.evidence),
      },
    ]);
  }

  const additions = [...existingAdditions, ...newRows];
  if (DATA.length + newRows.length !== companies.length)
    throw new Error("Catalog contains a gap or duplicate; refusing to export");
  const additionsPath = resolve("src/shared/catalog-additions.ts");
  const additionsSource = `import type { CompanyRow } from "./types.ts";\n\n// 公司目录的每日追加区：新公司只追加在数组末尾，不重排历史条目。\nexport const CATALOG_ADDITIONS: CompanyRow[] = ${JSON.stringify(additions, null, 2)};\n`;
  const metadataSource = `export interface CatalogSeedMeta {\n  ownership: "private" | "foreign" | "state" | "public";\n  aliases: string[];\n  firstSeenDate: string | null;\n  channel: "none" | "online" | "hybrid" | "offline" | "verify";\n  channelEvidence: string;\n}\n\n// 只含岗位目录元信息，不包含 qiuzhao.db 中的个人投递状态。\nexport const CATALOG_METADATA = new Map<string, CatalogSeedMeta>(${JSON.stringify(metadata, null, 2)});\n`;

  // Preserve existing appended row text/order; only add names absent from DATA.
  const source = await readFile(additionsPath, "utf8");
  if (existingAdditions.length && !source.includes("CATALOG_ADDITIONS"))
    throw new Error("Cannot verify existing append-only additions");
  await writeFile(additionsPath, additionsSource, "utf8");
  await writeFile(metadataPath, metadataSource, "utf8");
  console.log(JSON.stringify({
    databaseCompanies: companies.length,
    existingSourceCompanies: DATA.length,
    appendedCompanies: newRows.length,
    addedDates: metadata.filter(([, value]) => value.firstSeenDate !== null).length,
    aliases: aliases.length,
    integrity,
    output: [additionsPath, metadataPath],
  }, null, 2));
} finally {
  database.close();
}
