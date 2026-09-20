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
} from "./catalog.ts";
import {
  APPLIED_STATUSES,
  type CompanyRow,
  type StatusMap,
} from "../shared/types.ts";
/* ---- 导出 ---- */
function download(filename: string, text: string, mime?: string) {
  const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export function csvCell(v: unknown) {
  const value = String(v == null ? "" : v);
  return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
}
export function csvText(state: StatusMap) {
  const head = [
    "公司",
    "状态",
    "公司性质",
    "国有体系招聘渠道",
    "渠道核验依据",
    "行业分类",
    "岗位方向",
    "城市",
    "内推码",
    "备用码",
    "入口",
    "截止",
    "截止说明",
    "备注",
  ];
  const lines = [head.map(csvCell).join(",")];
  for (const r of DATA) {
    lines.push(
      [
        r[F.n],
        state[r[F.n]] || "未投",
        OWNERSHIPNAME[ownershipOf(r)] || "",
        RECRUIT_CHANNEL_NAME[recruitChannelOf(r)] || "",
        recruitChannelEvidence(r),
        CATNAME[r[F.cat]] || "",
        r[F.roles],
        r[F.city],
        r[F.code],
        r[F.alt],
        r[F.url],
        r[F.dl],
        r[F.dlTxt],
        r[F.note],
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return '\ufeff' + lines.join('\r\n');
}
export function exportCsv(state: StatusMap) {
  download(
    "秋招投递进度.csv",
    csvText(state),
    "text/csv;charset=utf-8",
  );
}
export function exportSql(state: StatusMap) {
  const q = (v: unknown) => "'" + String(v).replace(/'/g, "''") + "'";
  const out = [
    "-- 把这份进度写回 qiuzhao.db：",
    "--   sqlite3 qiuzhao.db < status.sql",
    "BEGIN;",
  ];
  for (const r of DATA) {
    const st = state[r[F.n]] || "未投";
    out.push(
      "INSERT INTO applications(name,status,updated_at) VALUES(" +
        q(r[F.n]) +
        "," +
        q(st) +
        "," +
        q(new Date().toISOString()) +
        ") ON CONFLICT(name) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at;",
    );
  }
  out.push("COMMIT;");
  download("status.sql", out.join("\n"), "application/sql");
}
