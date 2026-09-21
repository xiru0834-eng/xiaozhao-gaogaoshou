import { ScheduleStore } from "./schedule-store.ts";
import {
  TaskError,
  choice,
  taskMarkers,
  TASK_KINDS,
  TASK_STATES,
} from "../shared/recruitment-task-contract.ts";
import { ZONES, wallTime, scheduleDay } from "../shared/schedule-contract.ts";

export function taskRequest(
  store: ScheduleStore,
  url: URL,
  method: string,
  body?: unknown,
): unknown {
  const path = url.pathname,
    q = url.searchParams;
  if (path === "/api/recruitment-task-commands" && method === "POST")
    return store.recruitment.commit(body);
  if (method !== "GET")
    throw new TaskError("METHOD", "不支持的请求方法。", 405);
  if (path === "/api/recruitment-tasks") {
    const state = q.get("state") || undefined,
      kind = q.get("kind") || undefined;
    if (state) choice(state, Object.keys(TASK_STATES));
    if (kind) choice(kind, Object.keys(TASK_KINDS));
    const query = q.get("q") ?? "";
    if (query.length > 200) throw new TaskError("VALIDATION", "搜索内容过长。");
    return store.recruitment.list({
      state,
      kind,
      q: query,
      cursor: Number(q.get("cursor") ?? 0),
      limit: Number(q.get("limit") ?? 50),
      deleted: q.get("deleted") === "true",
    });
  }
  if (path === "/api/recruitment-timeline") {
    const from = q.get("from") ?? "",
      to = q.get("to") ?? "",
      zone = choice(q.get("zone") ?? "Asia/Shanghai", ZONES);
    let a: number, b: number;
    try {
      a = Date.parse(wallTime(from, "12:00", "UTC"));
      b = Date.parse(wallTime(to, "12:00", "UTC"));
    } catch {
      throw new TaskError("VALIDATION", "请提供有效的起止日期。");
    }
    if (b < a || b - a > 92 * 86400000)
      throw new TaskError("VALIDATION", "日历查询范围最多 93 天。");
    const all = store.recruitment.all(),
      markers = all
        .flatMap((t) =>
          taskMarkers(t, zone).map((m) => ({ ...m, taskId: t.id })),
        )
        .filter((m) => m.date >= from && m.date <= to);
    const undated = all.filter((t) => !taskMarkers(t, zone).length),
      ids = new Set(markers.map((m) => m.taskId));
    return {
      tasks: all.filter((t) => ids.has(t.id)),
      markers,
      undated,
      events: store.snapshot().items.filter((e) => {
        const day = scheduleDay(e, zone);
        return !day || (day >= from && day <= to);
      }),
    };
  }
  const match = /^\/api\/recruitment-tasks\/([a-f0-9-]{36})$/.exec(path);
  if (match)
    return {
      task: store.recruitment.get(match[1]),
      history: store.recruitment.history(match[1]),
      sources: store.recruitment.sources(match[1]),
    };
  throw new TaskError("NOT_FOUND", "任务接口不存在。", 404);
}
