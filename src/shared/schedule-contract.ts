export const ZONES = ["Asia/Shanghai", "Australia/Sydney", "UTC"] as const;
export type Zone = (typeof ZONES)[number];
const dateFormats = new Map<Zone, Intl.DateTimeFormat>(),
  timeFormats = new Map<Zone, Intl.DateTimeFormat>();
export interface Schedule {
  id: string;
  company: string;
  role: string;
  kind: "written" | "interview";
  round: string;
  date: string;
  time: string;
  endTime: string;
  zone: Zone;
  start: string | null;
  end: string | null;
  status: "planned" | "completed" | "cancelled";
  location: string;
  url: string;
  notes: string;
  review: string;
  tasks: Array<{ text: string; done: boolean }>;
}
export interface ScheduleSnapshot {
  revision: number;
  items: Schedule[];
}
export class ScheduleError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export function dateKey(instant: string, zone: Zone): string {
  if (!dateFormats.has(zone))
    dateFormats.set(
      zone,
      new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    );
  const p = dateFormats.get(zone)!.formatToParts(new Date(instant));
  return ["year", "month", "day"]
    .map((k) => p.find((v) => v.type === k)!.value)
    .join("-");
}
export function clockTime(instant: string, zone: Zone): string {
  if (!timeFormats.has(zone))
    timeFormats.set(
      zone,
      new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
    );
  return timeFormats.get(zone)!.format(new Date(instant));
}
export function wallTime(date: string, time: string, zone: Zone): string {
  if (
    !ZONES.includes(zone) ||
    !/^20\d\d-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    throw new ScheduleError("日期、时间或时区无效。");
  const base = Date.parse(`${date}T${time}:00Z`);
  if (
    !Number.isFinite(base) ||
    new Date(base).toISOString().slice(0, 10) !== date
  )
    throw new ScheduleError("日期不存在。");
  // These are all current offsets for the explicitly supported zones, never a fixed Sydney offset.
  const offsets =
    zone === "UTC" ? [0] : zone === "Asia/Shanghai" ? [480] : [600, 660];
  const matches = offsets
    .map((m) => new Date(base - m * 60000).toISOString())
    .filter((s) => dateKey(s, zone) === date && clockTime(s, zone) === time);
  if (matches.length !== 1)
    throw new ScheduleError(
      "该时间处于夏令时跳变或重复区间，请改用北京时间录入。",
    );
  return matches[0];
}
export function validateSchedule(value: unknown): Schedule {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ScheduleError("日程格式无效。");
  const v = value as Record<string, unknown>;
  const str = (k: string, max: number, required = false) => {
    if (
      typeof v[k] !== "string" ||
      (v[k] as string).length > max ||
      (required && !(v[k] as string).trim())
    )
      throw new ScheduleError(`请检查${k}字段。`);
    return (v[k] as string).trim();
  };
  const id = str("id", 36, true);
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new ScheduleError("日程标识无效。");
  const company = str("company", 120, true),
    role = str("role", 160),
    round = str("round", 80),
    date = str("date", 10),
    time = str("time", 5),
    endTime = str("endTime", 5);
  if (
    !["written", "interview"].includes(v.kind as string) ||
    !["planned", "completed", "cancelled"].includes(v.status as string) ||
    !ZONES.includes(v.zone as Zone)
  )
    throw new ScheduleError("日程类型、状态或时区无效。");
  const zone = v.zone as Zone;
  if (date) wallTime(date, "12:00", zone);
  if ((time && !date) || (endTime && !time))
    throw new ScheduleError("请先填写日期和开始时间。");
  const start = time ? wallTime(date, time, zone) : null,
    end = endTime ? wallTime(date, endTime, zone) : null;
  if (start && end && end <= start)
    throw new ScheduleError("结束时间必须晚于开始时间（同一天）。");
  const url = str("url", 2000);
  if (url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ScheduleError("会议链接格式无效。");
    }
    if (
      !["https:", "http:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    )
      throw new ScheduleError("会议链接仅支持 HTTP(S)，且不能包含账号密码。");
  }
  if (!Array.isArray(v.tasks) || v.tasks.length > 30)
    throw new ScheduleError("准备清单最多 30 项。");
  const tasks = v.tasks.map((t) => {
    if (
      !t ||
      typeof t.text !== "string" ||
      !t.text.trim() ||
      t.text.length > 200 ||
      typeof t.done !== "boolean"
    )
      throw new ScheduleError("准备清单格式无效。");
    return { text: t.text.trim(), done: t.done };
  });
  return {
    id,
    company,
    role,
    round,
    date,
    time,
    endTime,
    zone,
    start,
    end,
    kind: v.kind as Schedule["kind"],
    status: v.status as Schedule["status"],
    url,
    location: str("location", 300),
    notes: str("notes", 10000),
    review: str("review", 10000),
    tasks,
  };
}
export function scheduleDay(item: Schedule, zone: Zone): string {
  return item.start ? dateKey(item.start, zone) : item.date;
}
