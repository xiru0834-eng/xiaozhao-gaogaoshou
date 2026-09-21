import {
  TASK_KINDS,
  TASK_ACTIONS,
  validateTaskDraft,
  type TaskDraft,
  type TimePoint,
  type TaskTiming,
} from "../shared/recruitment-task-contract.ts";
export const taskEscape = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const options = (values: Record<string, string>, selected: string) =>
  Object.entries(values)
    .map(
      ([k, v]) =>
        `<option value="${k}" ${selected === k ? "selected" : ""}>${v}</option>`,
    )
    .join("");
export function taskFormFields(d: TaskDraft) {
  const input = (label: string, key: string, value: string, max = 200) =>
    `<label>${label}<input name="${key}" maxlength="${max}" value="${taskEscape(value)}" ${key === "title" ? "required" : ""}></label>`;
  const point = (key: string, label: string, p: TimePoint | null) =>
    `<fieldset class="rt-point"><legend data-point-label="${key}">${label}</legend><label>日期<input type="date" name="${key}Date" value="${p?.date ?? ""}" min="2000-01-01" max="2099-12-31"></label><label>时刻（可空）<input type="time" name="${key}Time" value="${p?.precision === "minute" ? p.time : ""}"></label><label>时区<select name="${key}Zone">${options({ "": "未说明／待核实", "Asia/Shanghai": "北京时间", "Australia/Sydney": "悉尼时间", UTC: "UTC" }, p?.zone ?? "")}</select></label></fieldset>`;
  const t = d.timing,
    a =
      t.mode === "fixed"
        ? t.start
        : t.mode === "deadline"
          ? t.due
          : t.mode === "window"
            ? t.opens
            : null,
    b = t.mode === "fixed" ? t.end : t.mode === "window" ? t.closes : null;
  return `<div class="rt-form-grid">${input("事项名称 *", "title", d.title)}${input("公司（未知可留空）", "company", d.company, 120)}${input("岗位", "role", d.role, 160)}${input("轮次", "round", d.round, 80)}<label>事项类型<select name="kind">${options(TASK_KINDS, d.kind)}</select></label><label>需要做什么<select name="action">${options(TASK_ACTIONS, d.action)}</select></label></div>
  <div class="rt-time-heading"><h3>时间安排</h3><label>时间类型<select name="timingMode">${options({ unknown: "时间待定", fixed: "固定安排", deadline: "截止前完成", window: "有效时间窗口" }, t.mode)}</select></label></div>
  <p class="rt-help">未写时刻就留空；未写时区先核对。预约截止不是面试开始。</p>
  <div data-timing-unknown>${input("原始时间说明", "originalText", t.mode === "unknown" ? t.originalText : "", 1000)}</div>
  <div data-timing-points>${point("a", "开始", a)}<div data-point-end>${point("b", "结束（可空）", b)}</div></div>
  <label data-boundary>截止边界<select name="boundary">${options({ unspecified: "原文未明确", inclusive: "含该时刻", exclusive: "不含该时刻" }, t.mode === "deadline" ? t.boundary : "unspecified")}</select></label>
  <div class="rt-form-grid" data-window><label>考试时长（分钟，可空）<input name="durationMinutes" type="number" min="1" max="1440" value="${t.mode === "window" ? (t.durationMinutes ?? "") : ""}"></label><label>关闭规则<select name="cutoffRule">${options({ unknown: "原文未说明", finish_by: "必须在关闭前完成", start_by: "允许在关闭前开始" }, t.mode === "window" ? t.cutoffRule : "unknown")}</select></label></div>
  <details class="rt-more"><summary>地点、入口与准备清单</summary><div class="rt-form-grid">${input("地点／会议方式", "location", d.location, 300)}${input("入口链接", "url", d.url, 2000)}</div><a class="schedule-link" data-task-url target="_blank" rel="noopener noreferrer" hidden>打开通知入口 ↗（请先核对网址）</a><label>准备清单（每行一项）<textarea name="checklist" rows="3">${taskEscape(d.checklist.map((x) => x.text).join("\n"))}</textarea></label>${d.checklist.map((item,i)=>`<label class="mt-verified"><input type="checkbox" data-checklist="${i}" ${item.done?'checked':''}>${taskEscape(item.text)}</label>`).join('')}<label>备注<textarea name="notes" maxlength="10000" rows="3">${taskEscape(d.notes)}</textarea></label></details>
  <details class="rt-more"><summary>我的计划时间（不改招聘方安排）</summary>${point("plan", "计划开始", d.plannedSlot?.start ?? null)}${point("planEnd", "计划结束（可空）", d.plannedSlot?.end ?? null)}</details>`;
}
export function bindTaskForm(form: HTMLFormElement) {
  const update = () => {
    const mode = (form.elements.namedItem("timingMode") as HTMLSelectElement)
      .value;
    for (const [selector, visible] of [
      ["[data-timing-unknown]", mode === "unknown"],
      ["[data-timing-points]", mode !== "unknown"],
      ["[data-point-end]", mode === "fixed" || mode === "window"],
      ["[data-boundary]", mode === "deadline"],
      ["[data-window]", mode === "window"],
    ] as const)
      form.querySelector<HTMLElement>(selector)!.hidden = !visible;
    form.querySelector('[data-point-label="a"]')!.textContent =
      mode === "deadline"
        ? "截止"
        : mode === "window"
          ? "窗口开放（可空）"
          : "开始";
    form.querySelector('[data-point-label="b"]')!.textContent =
      mode === "window" ? "窗口截止" : "结束（可空）";
  };
  (form.elements.namedItem("timingMode") as HTMLSelectElement).addEventListener(
    "change",
    update,
  );
  update();
  const link=form.querySelector<HTMLAnchorElement>('[data-task-url]')!,url=form.elements.namedItem('url') as HTMLInputElement;
  const updateLink=()=>{link.hidden=true;link.removeAttribute('href');try{const u=new URL(url.value);if(['https:','http:'].includes(u.protocol)&&!u.username&&!u.password){link.href=u.href;link.hidden=false;}}catch{/* Invalid drafts remain editable but are never clickable. */}};
  url.addEventListener('input',updateLink);updateLink();
}
export function readTaskForm(
  form: HTMLFormElement,
  original: TaskDraft,
): TaskDraft {
  const v = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement).value;
  const point = (key: string, optional = false): TimePoint | null => {
    const date = v(key + "Date"),
      time = v(key + "Time"),
      zone = v(key + "Zone") || null;
    if (!date && !time && optional) return null;
    return (
      time
        ? { precision: "minute", date, time, zone }
        : { precision: "date", date, zone }
    ) as TimePoint;
  };
  const mode = v("timingMode");
  let timing: TaskTiming;
  if (mode === "unknown") timing = { mode, originalText: v("originalText") };
  else if (mode === "fixed")
    timing = { mode, start: point("a")!, end: point("b", true) };
  else if (mode === "deadline")
    timing = {
      mode,
      due: point("a")!,
      boundary: v("boundary") as "unspecified",
    };
  else
    timing = {
      mode: "window",
      opens: point("a", true),
      closes: point("b")!,
      durationMinutes: v("durationMinutes")
        ? Number(v("durationMinutes"))
        : null,
      cutoffRule: v("cutoffRule") as "unknown",
    };
  const plan = point("plan", true),
    planEnd = point("planEnd", true);
  if (!plan && planEnd) throw Error("请先填写自己的计划开始时间。");
  return validateTaskDraft({
    title: v("title"),
    company: v("company"),
    role: v("role"),
    kind: v("kind"),
    action: v("action"),
    round: v("round"),
    timing,
    plannedSlot: plan ? { start: plan, end: planEnd } : null,
    location: v("location"),
    url: v("url"),
    notes: v("notes"),
    checklist: v("checklist")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({
        text,
        done: form.querySelector<HTMLInputElement>(`[data-checklist="${original.checklist.findIndex(t=>t.text===text)}"]`)?.checked ?? false,
      })),
    uncertainties: original.uncertainties,
  });
}
export function openTaskEditor(
  draft: TaskDraft,
  title: string,
  saveLabel: string,
  onSave: (draft: TaskDraft) => Promise<void>,
  footer = "",
) {
  const previous = document.activeElement as HTMLElement | null,
    dialog = document.createElement("dialog");
  dialog.className = "rt-dialog";
  dialog.setAttribute("aria-label", title);
  dialog.innerHTML = `<form><header class="rt-editor-heading"><div><h2>${taskEscape(title)}</h2><p>把下一步，清清楚楚记下来。</p></div><button type="button" data-close class="action" aria-label="关闭任务编辑">×</button></header><fieldset data-fields>${taskFormFields(draft)}</fieldset><p class="rt-error" role="alert"></p>${footer}<footer><span>仅保存在本机 · 不修改投递状态</span><button type="submit" class="action primary">${taskEscape(saveLabel)}</button></footer></form>`;
  document.body.append(dialog);
  const form = dialog.querySelector("form")!;
  bindTaskForm(form);
  let dirty = false,
    busy = false;
  const close = () => {
    if (
      busy ||
      dialog.dataset.busy === "true" ||
      (dirty && !confirm("有未保存的修改，确定关闭？"))
    )
      return false;
    dialog.close();
    dialog.remove();
    return true;
  };
  dialog.querySelector("[data-close]")!.addEventListener("click", close);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  form.addEventListener("input", () => {
    dirty = true;
  });
  const unload = (e: BeforeUnloadEvent) => {
    if (dirty || busy || dialog.dataset.busy === "true") {
      e.preventDefault();
      e.returnValue = "";
    }
  };
  window.addEventListener("beforeunload", unload);
  dialog.addEventListener(
    "close",
    () => {
      window.removeEventListener("beforeunload", unload);
      (previous?.isConnected
        ? previous
        : (document.querySelector<HTMLElement>("[data-rt=new]") ??
          document.getElementById("open-schedules"))
      )?.focus();
    },
    { once: true },
  );
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy || dialog.dataset.busy === "true") return;
    const error = dialog.querySelector(".rt-error")!;
    error.textContent = "";
    const fields = form.querySelector("[data-fields]") as HTMLFieldSetElement,
      readOnly = fields.disabled;
    try {
      const value = readTaskForm(form, draft);
      busy = true;
      dialog.dataset.busy = "true";
      dialog
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((b) => (b.disabled = true));
      fields.disabled = true;
      await onSave(value);
      dirty = false;
      busy = false;
      dialog.dataset.busy = "false";
      close();
    } catch (e) {
      error.textContent =
        e instanceof Error ? e.message : "保存未完成，请重试。";
    } finally {
      busy = false;
      dialog.dataset.busy = "false";
      dialog
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((b) => (b.disabled = false));
      fields.disabled = readOnly;
    }
  });
  dialog.showModal();
  return dialog;
}
