import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateTaskDraft,
  pointInstant,
  taskMarkers,
} from "../src/shared/recruitment-task-contract.ts";

export const taskDraft = (
  timing: unknown = { mode: "unknown", originalText: "时间另行通知" },
) => ({
  title: "完成入职前测评",
  company: "测试公司",
  role: "Agent 开发",
  kind: "assessment",
  action: "complete",
  timing,
  plannedSlot: null,
  round: "",
  location: "线上",
  url: "",
  notes: "",
  checklist: [],
  uncertainties: [],
});
const minute = (
  date = "2026-10-05",
  time = "14:00",
  zone: string | null = "Asia/Shanghai",
) => ({ precision: "minute", date, time, zone });

test("date-only deadline stays date-only and never becomes a start instant", () => {
  const draft = validateTaskDraft(
    taskDraft({
      mode: "deadline",
      due: { precision: "date", date: "2026-10-05", zone: "Asia/Shanghai" },
      boundary: "unspecified",
    }),
  );
  assert.equal(draft.timing.mode, "deadline");
  const markers = taskMarkers(draft, "Australia/Sydney");
  assert.equal(markers.length, 1);
  assert.equal(markers[0].date, "2026-10-05");
  assert.equal(markers[0].instant, null);
  assert.match(markers[0].label, /截止/);
});
test("missing timezone remains unresolved, fixed time cannot silently use display timezone", () => {
  const draft = validateTaskDraft(
    taskDraft({
      mode: "fixed",
      start: minute("2026-10-05", "14:00", null),
      end: null,
    }),
  );
  assert.equal(taskMarkers(draft, "Asia/Shanghai").length, 0);
  assert.ok(draft.uncertainties.some((s) => s.includes("时区")));
});
test("window is not one long exam; cross-day bounds and user plan are separately validated", () => {
  const timing = {
    mode: "window",
    opens: minute("2026-10-04", "09:00"),
    closes: minute("2026-10-06", "18:00"),
    durationMinutes: 90,
    cutoffRule: "unknown",
  };
  const draft = validateTaskDraft(taskDraft(timing));
  assert.deepEqual(
    taskMarkers(draft, "Asia/Shanghai").map((m) => m.date),
    ["2026-10-04", "2026-10-06"],
  );
  assert.throws(
    () =>
      validateTaskDraft({
        ...taskDraft(timing),
        plannedSlot: { start: minute("2026-10-07"), end: null },
      }),
    /窗口/,
  );
  assert.throws(
    () =>
      validateTaskDraft(taskDraft({ ...timing, closes: minute("2026-10-03") })),
    /晚于/,
  );
});
test("invalid date, DST gap and fold, unsafe URL, forged fields are rejected", () => {
  for (const p of [
    minute("2026-02-29"),
    minute("2026-10-04", "02:30", "Australia/Sydney"),
    minute("2026-04-05", "02:30", "Australia/Sydney"),
  ])
    assert.throws(() =>
      validateTaskDraft(taskDraft({ mode: "fixed", start: p, end: null })),
    );
  assert.throws(() =>
    validateTaskDraft({ ...taskDraft(), url: "javascript:alert(1)" }),
  );
  assert.throws(() =>
    validateTaskDraft({ ...taskDraft(), state: "completed" }),
  );
  assert.throws(() =>
    validateTaskDraft({
      ...taskDraft(),
      checklist: [{ text: "abc", done: "yes" }],
    }),
  );
});
test("cross-zone instant conversion and minute precision do not lose the source meaning", () => {
  assert.equal(pointInstant(minute() as never), "2026-10-05T06:00:00.000Z");
  const draft = validateTaskDraft({
    ...taskDraft({
      mode: "fixed",
      start: minute(),
      end: minute("2026-10-06", "00:30"),
    }),
    kind: "interview",
    action: "attend",
  });
  const markers = taskMarkers(draft, "Australia/Sydney");
  assert.equal(markers[0].time, "17:00");
  assert.equal(markers[0].date, "2026-10-05");
});

test("same-day reversed unknown-zone times and deadline violations are rejected; corrected warnings clear", () => {
  assert.throws(() =>
    validateTaskDraft(
      taskDraft({
        mode: "fixed",
        start: minute("2026-10-05", "14:00", null),
        end: minute("2026-10-05", "13:00", null),
      }),
    ),
  );
  const draft = validateTaskDraft(taskDraft());
  const corrected = validateTaskDraft({
    ...draft,
    timing: { mode: "fixed", start: minute(), end: null },
  });
  assert.ok(!corrected.uncertainties.some((s) => s.includes("时间待定")));
  assert.throws(() =>
    validateTaskDraft({
      ...taskDraft({ mode: "deadline", due: minute(), boundary: "exclusive" }),
      plannedSlot: { start: minute(), end: null },
    }),
  );
  const window = {
    mode: "window",
    opens: minute("2026-10-05", "10:00"),
    closes: minute("2026-10-05", "18:00"),
    durationMinutes: 90,
    cutoffRule: "start_by",
  };
  assert.doesNotThrow(() =>
    validateTaskDraft({
      ...taskDraft(window),
      plannedSlot: {
        start: minute("2026-10-05", "17:30"),
        end: minute("2026-10-05", "19:00"),
      },
    }),
  );
});
