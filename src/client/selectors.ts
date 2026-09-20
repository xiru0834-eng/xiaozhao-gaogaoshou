import {
  DATA,
  CATS,
  CATNAME,
  OWNERSHIPS,
  OWNERSHIPNAME,
  RECRUIT_CHANNEL_NAME,
  APPEND_DATES,
  ownershipOf,
  recruitChannelOf,
  recruitChannelEvidence,
  F,
  hasCode,
} from "../shared/catalog.ts";
import {
  APPLIED_STATUSES,
  type CompanyRow,
  type StatusMap,
} from "../shared/types.ts";
export interface Filters {
  state: StatusMap;
  filterStatus: string;
  onlySoon: boolean;
  onlyCode: boolean;
  onlyRecent: boolean;
  filterCat: string;
  filterOwnership: string;
  filterChannel: string;
  query: string;
}
export function daysLeft(dl: string) {
  if (!dl) return null;
  const t = new Date(dl + "T23:59:59");
  if (Number.isNaN(t.getTime())) return null;
  return Math.floor((t.getTime() - Date.now()) / 86400000);
}

export const DLGROUPS: [
  string,
  string,
  (d: number | null) => boolean,
  string,
][] = [
  [
    "w1",
    "7 天内截止",
    (d) => d !== null && d >= 0 && d <= 7,
    "先核对官网，再安排这一批",
  ],
  [
    "w3",
    "三周内截止",
    (d) => d !== null && d > 7 && d <= 21,
    "还有时间，把匹配的公司留下",
  ],
  [
    "m2",
    "一到两个月内",
    (d) => d !== null && d > 21 && d <= 60,
    "按你的节奏继续准备",
  ],
  ["late", "更晚截止", (d) => d !== null && d > 60, "长窗口不代表一直开放"],
  ["open", "未标截止日期", (d) => d === null, "是否仍开放，以招聘官网为准"],
  [
    "past",
    "已过期 · 待核实补招",
    (d) => d !== null && d < 0,
    "不代表仍可申请，请先回官网核对",
  ],
];
export function groupOf(row: CompanyRow, groupBy: string) {
  if (groupBy === "none") return "all";
  if (groupBy === "owner") return ownershipOf(row);
  if (groupBy === "cat") return row[F.cat];
  const d = daysLeft(row[F.dl]);
  for (const g of DLGROUPS) {
    if (g[2](d)) return g[0];
  }
  return "open";
}
export function groupList(groupBy: string) {
  if (groupBy === "none") return [["all", "公司清单", ""]];
  if (groupBy === "owner") return OWNERSHIPS.map(([k, t]) => [k, t, ""]);
  if (groupBy === "cat") return CATS.map(([k, t]) => [k, t, ""]);
  return DLGROUPS.map((g) => [g[0], g[1], g[3]]);
}
export function sortedRows(rows: CompanyRow[], mode: string) {
  const copy = rows.slice();
  if (mode === "original") {
    const order = new Map(DATA.map((r, i) => [r[F.n], i]));
    return copy.sort(
      (a, b) =>
        (order.get(a[F.n]) ?? Infinity) - (order.get(b[F.n]) ?? Infinity),
    );
  }
  if (mode === "name")
    return copy.sort((a, b) => a[F.n].localeCompare(b[F.n], "zh-CN"));
  return copy.sort((a, b) => {
    const da = daysLeft(a[F.dl]),
      db = daysLeft(b[F.dl]),
      tier = (d: number | null) => (d === null ? 1 : d < 0 ? 2 : 0);
    return tier(da) - tier(db) || (da === null || db === null ? 0 : da - db);
  });
}

export function matches(r: CompanyRow, filters: Filters) {
  const {
    state,
    filterStatus,
    onlySoon,
    onlyCode,
    onlyRecent,
    filterCat,
    filterOwnership,
    filterChannel,
    query,
  } = filters;
  const s = state[r[F.n]] || "未投";
  if (filterStatus === "todo" && s !== "未投") return false;
  if (filterStatus === "applied" && !APPLIED_STATUSES.has(s)) return false;
  if (filterStatus === "unsuitable" && s !== "无合适岗位") return false;
  if (filterStatus === "interview" && s !== "面试") return false;
  if (onlySoon) {
    const d = daysLeft(r[F.dl]);
    if (d === null || d < 0 || d > 7) return false;
  }
  if (onlyCode && !hasCode(r)) return false;
  if (onlyRecent && !APPEND_DATES.has(r[F.n])) return false;
  if (filterCat !== "all" && r[F.cat] !== filterCat) return false;
  if (filterOwnership !== "all" && ownershipOf(r) !== filterOwnership)
    return false;
  if (filterChannel !== "all" && recruitChannelOf(r) !== filterChannel)
    return false;
  if (query) {
    const hay = (
      r[F.n] +
      " " +
      r[F.roles] +
      " " +
      r[F.city] +
      " " +
      r[F.code] +
      " " +
      r[F.alt] +
      " " +
      r[F.note] +
      " " +
      CATNAME[r[F.cat]] +
      " " +
      OWNERSHIPNAME[ownershipOf(r)] +
      " " +
      (RECRUIT_CHANNEL_NAME[recruitChannelOf(r)] || "") +
      " " +
      recruitChannelEvidence(r)
    ).toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}
