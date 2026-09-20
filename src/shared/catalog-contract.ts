import type { CompanyRow } from "./types.ts";
export const OWNERSHIP_VALUES = [
  "private",
  "foreign",
  "state",
  "public",
] as const;
export const CHANNEL_VALUES = [
  "none",
  "online",
  "hybrid",
  "offline",
  "verify",
] as const;
export type Ownership = (typeof OWNERSHIP_VALUES)[number];
export type Channel = (typeof CHANNEL_VALUES)[number];
export interface NewCompany {
  row: CompanyRow;
  ownership: Ownership;
  aliases: string[];
  firstSeenDate: string | null;
  channel: Channel;
  channelEvidence: string;
}
export interface CompanyMeta {
  id: string;
  name: string;
  sequence: number;
  ownership: Ownership;
  aliases: string[];
  channel: Channel;
  channelEvidence: string;
}
export interface CatalogSnapshot {
  schemaVersion: 1;
  revision: number;
  companies: CompanyRow[];
  appendDates: [string, string][];
  metadata: CompanyMeta[];
}
export class DataError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
export function normalizedName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}
export function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function parseCompany(value: unknown): NewCompany {
  if (
    !value ||
    typeof value !== "object" ||
    !("row" in value) ||
    !("ownership" in value) ||
    !("aliases" in value) ||
    !("firstSeenDate" in value) ||
    !("channel" in value) ||
    !("channelEvidence" in value)
  )
    throw new DataError("VALIDATION", "Invalid company");
  const { row, ownership, aliases, firstSeenDate, channel, channelEvidence } =
    value;
  if (
    !Array.isArray(row) ||
    row.length !== 10 ||
    !row.every((x: unknown) => typeof x === "string" && x.length <= 20000)
  )
    throw new DataError("VALIDATION", "Expected ten string fields");
  if (
    !normalizedName(row[0]) ||
    row[0].length > 200 ||
    /[\x00-\x1f]/.test(row[0]) ||
    !["net", "ai", "fin", "soe", "car", "hw", "b2b", "game", "frn"].includes(
      row[1],
    )
  )
    throw new DataError("VALIDATION", "Invalid company name or category");
  if (row[7] !== "" && !validDate(row[7]))
    throw new DataError("VALIDATION", "Invalid deadline");
  if (row[6]) {
    let url: URL;
    try {
      url = new URL(row[6]);
    } catch {
      throw new DataError("VALIDATION", "Invalid entry URL");
    }
    if (
      !["https:", "http:", "mailto:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new DataError("VALIDATION", "Unsafe entry URL");
  }
  if (
    typeof ownership !== "string" ||
    !(OWNERSHIP_VALUES as readonly string[]).includes(ownership) ||
    typeof channel !== "string" ||
    !(CHANNEL_VALUES as readonly string[]).includes(channel)
  )
    throw new DataError("VALIDATION", "Invalid classification");
  if (
    !Array.isArray(aliases) ||
    aliases.length > 20 ||
    !aliases.every(
      (x: unknown) =>
        typeof x === "string" &&
        x.length <= 200 &&
        normalizedName(x).length > 0 &&
        !/[\x00-\x1f]/.test(x),
    )
  )
    throw new DataError("VALIDATION", "Invalid aliases");
  if (firstSeenDate !== null && !validDate(firstSeenDate))
    throw new DataError("VALIDATION", "Invalid first seen date");
  if (typeof channelEvidence !== "string" || channelEvidence.length > 20000)
    throw new DataError("VALIDATION", "Invalid evidence");
  return {
    row: row.slice() as CompanyRow,
    ownership: ownership as Ownership,
    aliases: aliases.slice(),
    firstSeenDate,
    channel: channel as Channel,
    channelEvidence,
  };
}
export function parseCatalog(value: unknown): CatalogSnapshot {
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 1 ||
    !("revision" in value) ||
    typeof value.revision !== "number" ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 0 ||
    !("companies" in value) ||
    !Array.isArray(value.companies) ||
    value.companies.length > 10000 ||
    !("metadata" in value) ||
    !Array.isArray(value.metadata) ||
    value.companies.length !== value.metadata.length ||
    !("appendDates" in value) ||
    !Array.isArray(value.appendDates)
  )
    throw new DataError("VALIDATION", "Invalid catalog snapshot");
  const dates = new Map<string, string>();
  for (const item of value.appendDates) {
    if (
      !Array.isArray(item) ||
      item.length !== 2 ||
      typeof item[0] !== "string" ||
      !validDate(item[1]) ||
      dates.has(item[0])
    )
      throw new DataError("VALIDATION", "Invalid append dates");
    dates.set(item[0], item[1]);
  }
  const companies: CompanyRow[] = [],
    metadata: CompanyMeta[] = [];
  const ids = new Set<string>(),
    names = new Set<string>();
  let seq = 0;
  for (let i = 0; i < value.companies.length; i++) {
    const m: unknown = value.metadata[i];
    if (
      !m ||
      typeof m !== "object" ||
      !("id" in m) ||
      typeof m.id !== "string" ||
      !/^co_[a-f0-9]{32}$/.test(m.id) ||
      ids.has(m.id) ||
      !("name" in m) ||
      typeof m.name !== "string" ||
      !("sequence" in m) ||
      !Number.isSafeInteger(m.sequence) ||
      typeof m.sequence !== "number" ||
      m.sequence <= seq
    )
      throw new DataError("VALIDATION", "Invalid company identity");
    const c = parseCompany({
      ...m,
      row: value.companies[i],
      firstSeenDate: dates.get(m.name) ?? null,
    });
    if (c.row[0] !== m.name || names.has(m.name))
      throw new DataError("VALIDATION", "Duplicate company");
    ids.add(m.id);
    names.add(m.name);
    seq = m.sequence;
    companies.push(c.row);
    metadata.push({
      id: m.id,
      name: m.name,
      sequence: seq,
      ownership: c.ownership,
      aliases: c.aliases,
      channel: c.channel,
      channelEvidence: c.channelEvidence,
    });
  }
  if ([...dates.keys()].some((n) => !names.has(n)))
    throw new DataError("VALIDATION", "Unknown dated company");
  return {
    schemaVersion: 1,
    revision: value.revision,
    companies,
    metadata,
    appendDates: [...dates],
  };
}
