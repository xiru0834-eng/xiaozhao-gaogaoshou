import {
  ZONES,
  wallTime,
  dateKey,
  clockTime,
  type Zone,
} from "./schedule-contract.ts";

export type TaskKind = "interview" | "written" | "assessment";
export type TaskAction = "attend" | "complete" | "book" | "submit_materials";
export type TaskState = "pending" | "in_progress" | "completed" | "cancelled";
export type TimePoint =
  | { precision: "date"; date: string; zone: Zone | null }
  | { precision: "minute"; date: string; time: string; zone: Zone | null };
export type TaskTiming =
  | { mode: "unknown"; originalText: string }
  | { mode: "fixed"; start: TimePoint; end: TimePoint | null }
  | {
      mode: "deadline";
      due: TimePoint;
      boundary: "inclusive" | "exclusive" | "unspecified";
    }
  | {
      mode: "window";
      opens: TimePoint | null;
      closes: TimePoint;
      durationMinutes: number | null;
      cutoffRule: "finish_by" | "start_by" | "unknown";
    };
export interface TaskDraft {
  title: string;
  company: string;
  role: string;
  kind: TaskKind;
  action: TaskAction;
  round: string;
  timing: TaskTiming;
  plannedSlot: { start: TimePoint; end: TimePoint | null } | null;
  location: string;
  url: string;
  notes: string;
  checklist: { text: string; done: boolean }[];
  uncertainties: string[];
}
export interface RecruitmentTask extends TaskDraft {
  id: string;
  revision: number;
  state: TaskState;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export interface TaskMarker {
  date: string;
  time: string;
  instant: string | null;
  label: string;
  key: string;
}
export const TASK_KINDS = {
  interview: "面试",
  written: "笔试",
  assessment: "测评",
};
export const TASK_ACTIONS = {
  attend: "参加",
  complete: "完成",
  book: "预约",
  submit_materials: "提交材料",
};
export const TASK_STATES = {
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
};
export class TaskError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TaskError("VALIDATION", "数据格式无效。");
  return value as Record<string, unknown>;
}
export function fields(v: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(v).some((k) => !allowed.includes(k)))
    throw new TaskError("VALIDATION", "包含不支持的字段。");
}
export function text(v: unknown, max: number, required = false): string {
  if (typeof v !== "string" || v.length > max || (required && !v.trim()))
    throw new TaskError("VALIDATION", "文本为空或超过长度限制。");
  return v.trim();
}
export function choice<T extends string>(v: unknown, values: readonly T[]): T {
  if (typeof v !== "string" || !values.includes(v as T))
    throw new TaskError("VALIDATION", "类型或状态无效。");
  return v as T;
}
export function uuid(v: unknown): string {
  if (
    typeof v !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v)
  )
    throw new TaskError("VALIDATION", "记录标识无效。");
  return v;
}
export function validatePoint(value: unknown): TimePoint {
  const v = object(value),
    precision = choice(v.precision, ["date", "minute"] as const);
  fields(
    v,
    precision === "date"
      ? ["precision", "date", "zone"]
      : ["precision", "date", "zone", "time"],
  );
  const date = text(v.date, 10, true),
    zone = v.zone === null ? null : choice(v.zone, ZONES);
  try {
    wallTime(date, "12:00", "UTC");
  } catch {
    throw new TaskError("VALIDATION", "日期不存在。");
  }
  if (precision === "date") return { precision, date, zone };
  const time = text(v.time, 5, true);
  try {
    wallTime(date, time, zone ?? "UTC");
  } catch {
    throw new TaskError(
      "VALIDATION",
      "时间无效或处于夏令时跳变／重复区间，请核对。",
    );
  }
  return { precision, date, time, zone };
}
export function pointInstant(p: TimePoint): string | null {
  return p.precision === "minute" && p.zone
    ? wallTime(p.date, p.time, p.zone)
    : null;
}
/** Compare only supported facts: a date boundary stays a day, not an invented 23:59. */
function comparePoints(a: TimePoint, b: TimePoint): number | null {
  const ai = pointInstant(a), bi = pointInstant(b);
  if (ai && bi) return ai.localeCompare(bi);
  if (ai && b.precision === "date" && b.zone)
    return dateKey(ai, b.zone).localeCompare(b.date);
  if (bi && a.precision === "date" && a.zone)
    return a.date.localeCompare(dateKey(bi, a.zone));
  if (a.zone !== b.zone) return null;
  const dates = a.date.localeCompare(b.date);
  return dates || (a.precision === "minute" && b.precision === "minute"
    ? a.time.localeCompare(b.time) : 0);
}
function ordered(start: TimePoint, end: TimePoint) {
  const a = pointInstant(start),
    b = pointInstant(end);
  if (a && b) {
    if (b <= a) throw new TaskError("VALIDATION", "结束必须晚于开始。");
  } else if (start.zone === end.zone && end.date < start.date)
    throw new TaskError("VALIDATION", "结束必须晚于开始。");
  else if (
    start.zone === end.zone &&
    start.date === end.date &&
    start.precision === "minute" &&
    end.precision === "minute" &&
    end.time <= start.time
  )
    throw new TaskError("VALIDATION", "结束必须晚于开始。");
}
export function validateTiming(value: unknown): TaskTiming {
  const v = object(value),
    mode = choice(v.mode, ["unknown", "fixed", "deadline", "window"] as const);
  if (mode === "unknown") {
    fields(v, ["mode", "originalText"]);
    return { mode, originalText: text(v.originalText, 1000) };
  }
  if (mode === "fixed") {
    fields(v, ["mode", "start", "end"]);
    const start = validatePoint(v.start),
      end = v.end === null ? null : validatePoint(v.end);
    if (end) ordered(start, end);
    return { mode, start, end };
  }
  if (mode === "deadline") {
    fields(v, ["mode", "due", "boundary"]);
    return {
      mode,
      due: validatePoint(v.due),
      boundary: choice(v.boundary, [
        "inclusive",
        "exclusive",
        "unspecified",
      ] as const),
    };
  }
  fields(v, ["mode", "opens", "closes", "durationMinutes", "cutoffRule"]);
  const opens = v.opens === null ? null : validatePoint(v.opens),
    closes = validatePoint(v.closes);
  if (opens) ordered(opens, closes);
  if (
    v.durationMinutes !== null &&
    (!Number.isSafeInteger(v.durationMinutes) ||
      Number(v.durationMinutes) < 1 ||
      Number(v.durationMinutes) > 1440)
  )
    throw new TaskError("VALIDATION", "考试时长必须在 1～1440 分钟内。");
  return {
    mode,
    opens,
    closes,
    durationMinutes: v.durationMinutes as number | null,
    cutoffRule: choice(v.cutoffRule, [
      "finish_by",
      "start_by",
      "unknown",
    ] as const),
  };
}
export function timingPoints(t: TaskTiming): TimePoint[] {
  return t.mode === "unknown"
    ? []
    : t.mode === "fixed"
      ? [t.start, ...(t.end ? [t.end] : [])]
      : t.mode === "deadline"
        ? [t.due]
        : [...(t.opens ? [t.opens] : []), t.closes];
}
export function validateTaskDraft(value: unknown): TaskDraft {
  const v = object(value);
  fields(v, [
    "title",
    "company",
    "role",
    "kind",
    "action",
    "round",
    "timing",
    "plannedSlot",
    "location",
    "url",
    "notes",
    "checklist",
    "uncertainties",
  ]);
  const timing = validateTiming(v.timing),
    kind = choice(v.kind, ["interview", "written", "assessment"] as const),
    action = choice(v.action, [
      "attend",
      "complete",
      "book",
      "submit_materials",
    ] as const);
  let plannedSlot: TaskDraft["plannedSlot"] = null;
  if (v.plannedSlot !== null) {
    const p = object(v.plannedSlot);
    fields(p, ["start", "end"]);
    plannedSlot = {
      start: validatePoint(p.start),
      end: p.end === null ? null : validatePoint(p.end),
    };
    if (plannedSlot.end) ordered(plannedSlot.start, plannedSlot.end);
  }
  const url = text(v.url, 2000);
  if (url) {
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      throw new TaskError("VALIDATION", "入口链接格式无效。");
    }
    if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
      throw new TaskError(
        "VALIDATION",
        "入口仅支持无账号密码的 HTTP(S) 链接。",
      );
  }
  if (!Array.isArray(v.checklist) || v.checklist.length > 30)
    throw new TaskError("VALIDATION", "准备清单最多 30 项。");
  const checklist = v.checklist.map((raw) => {
    const p = object(raw);
    fields(p, ["text", "done"]);
    if (typeof p.done !== "boolean")
      throw new TaskError("VALIDATION", "准备清单状态无效。");
    return { text: text(p.text, 200, true), done: p.done };
  });
  const generated = [
    "时间待定，未安排具体时段。",
    "原通知时区未确认。",
    "仅明确日期，未补充具体时刻。",
  ];
  // Re-validating a saved draft must allow the warnings we added ourselves.
  if (!Array.isArray(v.uncertainties) || v.uncertainties.length > 20 + generated.length)
    throw new TaskError("VALIDATION", "疑点数量过多。");
  const uncertainties = v.uncertainties
    .map((s) => text(s, 300, true))
    .filter((s) => !generated.includes(s));
  if (uncertainties.length > 20)
    throw new TaskError("VALIDATION", "疑点数量过多。");
  if (timing.mode === "unknown")
    uncertainties.push("时间待定，未安排具体时段。");
  if (timingPoints(timing).some((p) => !p.zone))
    uncertainties.push("原通知时区未确认。");
  if (timingPoints(timing).some((p) => p.precision === "date"))
    uncertainties.push("仅明确日期，未补充具体时刻。");
  if (plannedSlot && timing.mode === "window") {
    const before = timing.opens && comparePoints(plannedSlot.start, timing.opens),
      after = comparePoints(plannedSlot.start, timing.closes),
      endAfter = plannedSlot.end && comparePoints(plannedSlot.end, timing.closes);
    if (
      (before !== null && before < 0) || (after !== null && after > 0) ||
      (timing.cutoffRule !== "start_by" && endAfter !== null && endAfter > 0)
    )
      throw new TaskError("VALIDATION", "自己的计划时间超出招聘方窗口。");
    const start = pointInstant(plannedSlot.start);
    if (timing.cutoffRule === "finish_by" && timing.durationMinutes && start) {
      const finish = new Date(Date.parse(start) + timing.durationMinutes * 60000).toISOString();
      const latest = comparePoints({precision:"minute",date:finish.slice(0,10),time:finish.slice(11,16),zone:"UTC"}, timing.closes);
      if (latest !== null && latest > 0)
        throw new TaskError("VALIDATION", "按考试时长计算，自己的计划无法在窗口截止前完成。");
    }
  }
  if (plannedSlot && timing.mode === "deadline") {
    const order = comparePoints(plannedSlot.end ?? plannedSlot.start, timing.due);
    if (order !== null && (order > 0 || (order === 0 && timing.boundary === "exclusive")))
      throw new TaskError("VALIDATION", "自己的计划时间超出截止边界。");
  }
  return {
    title: text(v.title, 200, true),
    company: text(v.company, 120),
    role: text(v.role, 160),
    kind,
    action,
    round: text(v.round, 80),
    timing,
    plannedSlot,
    location: text(v.location, 300),
    url,
    notes: text(v.notes, 10000),
    checklist,
    uncertainties: [...new Set(uncertainties)],
  };
}
export function taskMarkers(draft: TaskDraft, zone: Zone): TaskMarker[] {
  const result: TaskMarker[] = [];
  const add = (p: TimePoint, key: string, label: string) => {
    if (p.precision === "minute" && !p.zone) return;
    const instant = pointInstant(p);
    result.push({
      key,
      label,
      date: instant ? dateKey(instant, zone) : p.date,
      time: instant ? clockTime(instant, zone) : "",
      instant,
    });
  };
  const t = draft.timing;
  if (t.mode === "fixed") add(t.start, "start", TASK_KINDS[draft.kind]);
  if (t.mode === "deadline") add(t.due, "due", "截止");
  if (t.mode === "window") {
    if (t.opens) add(t.opens, "opens", "窗口开放");
    add(t.closes, "closes", "窗口截止");
  }
  if (draft.plannedSlot) add(draft.plannedSlot.start, "plan", "自己的计划");
  return result;
}
export function timingLabel(t: TaskTiming): string {
  const p = (v: TimePoint) =>
    `${v.date}${v.precision === "minute" ? " " + v.time : "（仅日期）"} · ${v.zone === "Asia/Shanghai" ? "北京" : v.zone === "Australia/Sydney" ? "悉尼" : (v.zone ?? "时区待核实")}`;
  if (t.mode === "unknown") return t.originalText || "时间待定";
  if (t.mode === "fixed") return p(t.start) + (t.end ? " → " + p(t.end) : "");
  if (t.mode === "deadline") return "截止 " + p(t.due);
  return (
    (t.opens ? p(t.opens) : "开放时间未说明") +
    " → " +
    p(t.closes) +
    (t.durationMinutes ? ` · 限时 ${t.durationMinutes} 分钟` : "")
  );
}
export function emptyTaskDraft(): TaskDraft {
  return {
    title: "",
    company: "",
    role: "",
    kind: "interview",
    action: "attend",
    round: "",
    timing: { mode: "unknown", originalText: "" },
    plannedSlot: null,
    location: "",
    url: "",
    notes: "",
    checklist: [],
    uncertainties: [],
  };
}
