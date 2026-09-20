import type { DataSession } from "./session.ts";
import { schedulesView } from "./schedules-view.ts";
import {
  validateSchedule,
  dateKey,
  clockTime,
  scheduleDay,
  type Schedule,
  type ScheduleSnapshot,
  type Zone,
} from "../shared/schedule-contract.ts";

const escape = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const statusName = {
  planned: "待参加",
  completed: "已完成",
  cancelled: "已取消",
};
const typeName = { interview: "面试", written: "笔试" };
export function mountSchedules(session: DataSession) {
  const { page, dialog, node } = schedulesView();
  const workbench = document.querySelector<HTMLElement>(
      ".main-shell > .content",
    )!,
    breadcrumb = document.querySelector<HTMLElement>(
      ".breadcrumb span:last-child",
    )!;
  workbench.after(page);
  const launch = document.createElement("button");
  launch.className = "action";
  launch.id = "open-schedules";
  launch.textContent = "面试日程";
  launch.setAttribute("aria-pressed", "false");
  document.querySelector(".header-tools")!.prepend(launch);
  let snapshot: ScheduleSnapshot = { revision: 0, items: [] },
    loaded = false,
    view = "calendar",
    zone: Zone = "Asia/Shanghai",
    selectedDay = today(),
    month = selectedDay.slice(0, 7),
    busy = false,
    dirty = false,
    editing: Schedule | null = null,
    editRevision = 0,
    epoch = 0,
    retryRequest: { signature: string; id: string } | null = null;
  const form = node<HTMLFormElement>("form");
  const field = (name: string) =>
    form.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
  function today() {
    return dateKey(new Date().toISOString(), zone);
  }
  function feedback(text: string, error = false) {
    node("feedback").textContent = text;
    node("feedback").dataset.error = String(error);
  }
  function controls() {
    node<HTMLButtonElement>("new").disabled = !loaded || busy;
    node<HTMLButtonElement>("add-day").disabled = !loaded || busy;
    node<HTMLButtonElement>("refresh").disabled = busy;
    node<HTMLButtonElement>("export").disabled = !loaded || busy;
    node<HTMLFieldSetElement>("fields").disabled = busy;
    for (const key of ["save", "delete", "cancel", "close-editor"])
      node<HTMLButtonElement>(key).disabled = busy;
  }
  async function load() {
    const current = ++epoch;
    busy = true;
    controls();
    feedback("正在读取本机日程…");
    try {
      const data = await session.collectionRequest("/api/schedules");
      if (current !== epoch) return;
      snapshot = readSnapshot(data);
      loaded = true;
      render();
      feedback("仅保存在本机 · 日程状态与投递进度独立");
    } catch (e) {
      if (current === epoch)
        feedback(e instanceof Error ? e.message : "读取失败，请重试。", true);
    } finally {
      if (current === epoch) {
        busy = false;
        controls();
      }
    }
  }
  function readSnapshot(data: Record<string, unknown>): ScheduleSnapshot {
    if (!Number.isSafeInteger(data.revision) || !Array.isArray(data.items))
      throw Error("日程响应无效，未替换当前记录。");
    return {
      revision: Number(data.revision),
      items: data.items.map(validateSchedule),
    };
  }
  function open() {
    if (!page.hidden) return;
    if (
      !window.dispatchEvent(
        new CustomEvent("workspace:navigate", {
          cancelable: true,
          detail: "schedules",
        }),
      )
    )
      return;
    page.hidden = false;
    workbench.hidden = true;
    document.querySelector<HTMLElement>(".workspace")!.dataset.page =
      "schedules";
    breadcrumb.textContent = "面试日程";
    launch.setAttribute("aria-pressed", "true");
    document.getElementById("schedule-heading")!.focus();
    window.scrollTo({ top: 0 });
    void load();
  }
  function close() {
    if (!closeEditor()) return false;
    epoch++;
    page.hidden = true;
    workbench.hidden = false;
    delete document.querySelector<HTMLElement>(".workspace")!.dataset.page;
    breadcrumb.textContent = "公司与投递";
    launch.setAttribute("aria-pressed", "false");
    if (location.hash === "#schedules")
      history.replaceState(null, "", location.pathname + location.search);
    launch.focus();
    return true;
  }
  launch.onclick = () => (page.hidden ? open() : close());
  node("back").onclick = close;
  window.addEventListener("workspace:navigate", (event) => {
    if (
      (event as CustomEvent).detail !== "schedules" &&
      !page.hidden &&
      !close()
    )
      event.preventDefault();
  });
  for (const selector of [".brand", "#open-help", "#status-filters"])
    document.querySelector(selector)?.addEventListener(
      "click",
      (event) => {
        if (!page.hidden && !close()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
  window.addEventListener("beforeunload", (event) => {
    if (dirty || (busy && dialog.open)) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  function filtered() {
    const query = node<HTMLInputElement>("search")
        .value.toLocaleLowerCase()
        .trim(),
      kind = node<HTMLSelectElement>("kind").value,
      state = node<HTMLSelectElement>("state").value;
    return snapshot.items
      .filter(
        (i) =>
          (kind === "all" || i.kind === kind) &&
          (state === "all" || i.status === state) &&
          (!query ||
            [i.company, i.role, i.round, i.notes, i.review]
              .join(" ")
              .toLocaleLowerCase()
              .includes(query)),
      )
      .sort(
        (a, b) =>
          (scheduleDay(a, zone) || "9999").localeCompare(
            scheduleDay(b, zone) || "9999",
          ) ||
          (a.start || "z").localeCompare(b.start || "z") ||
          a.company.localeCompare(b.company, "zh"),
      );
  }
  function timeLabel(i: Schedule) {
    return i.start
      ? clockTime(i.start, zone) + (i.end ? "–" + clockTime(i.end, zone) : "")
      : "时间待定";
  }
  function secondaryTime(i: Schedule) {
    if (!i.start) return i.date ? i.date + " · 时间待定" : "日期待定";
    const other: Zone =
      zone === "Australia/Sydney" ? "Asia/Shanghai" : "Australia/Sydney";
    return `${scheduleDay(i, zone)} · ${other === "Asia/Shanghai" ? "北京" : "悉尼"} ${dateKey(i.start, other).slice(5)} ${clockTime(i.start, other)}`;
  }
  function eventHtml(i: Schedule) {
    return `<button class="schedule-event" data-event="${escape(i.id)}" aria-label="编辑日程：${escape(i.company)} ${escape(i.round)}"><span class="schedule-event-meta"><span class="${i.kind}">${typeName[i.kind]} · ${escape(timeLabel(i))}</span><span class="schedule-tag">${statusName[i.status]}</span></span><span><strong>${escape(i.company)}</strong><small>${escape([i.role, i.round].filter(Boolean).join(" · "))}</small></span><small>${escape(secondaryTime(i))}<br>${escape(i.location || "地点待补充")}${i.tasks.length ? ` · 准备 ${i.tasks.filter((t) => t.done).length}/${i.tasks.length}` : ""}</small></button>`;
  }
  function empty(title: string, description: string) {
    return `<div class="schedule-empty"><strong>${title}</strong>${description}</div>`;
  }
  function render() {
    const items = filtered(),
      now = today();
    node("count").textContent =
      `${items.length} 场安排 · ${items.filter((i) => i.status === "planned" && (!scheduleDay(i, zone) || scheduleDay(i, zone) >= now)).length} 场待参加`;
    node("calendar").hidden = view !== "calendar";
    node("list").hidden = view !== "list";
    page
      .querySelectorAll<HTMLElement>("[data-view]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.view === view)),
      );
    const [year, m] = month.split("-").map(Number);
    node("month-title").textContent = `${year} 年 ${m} 月`;
    const first = new Date(Date.UTC(year, m - 1, 1)),
      offset = (first.getUTCDay() + 6) % 7,
      days = new Date(Date.UTC(year, m, 0)).getUTCDate(),
      cells = Math.ceil((offset + days) / 7) * 7;
    let html = "";
    for (let n = 0; n < cells; n++) {
      const key = new Date(Date.UTC(year, m - 1, 1 - offset + n))
          .toISOString()
          .slice(0, 10),
        events = items.filter((i) => scheduleDay(i, zone) === key);
      html += `<button class="schedule-date ${key.slice(0, 7) !== month ? "is-other" : ""} ${key === now ? "is-today" : ""}" data-date="${key}" aria-pressed="${key === selectedDay}" ${key === now ? 'aria-current="date"' : ""} aria-label="${key}，${events.length} 场安排"><span>${Number(key.slice(-2))}</span>${events
        .slice(0, 2)
        .map(
          (i) =>
            `<span class="schedule-pill ${i.kind} ${i.status !== "planned" ? "is-done" : ""}">${typeName[i.kind]} ${escape(i.company)}</span>`,
        )
        .join(
          "",
        )}${events.length > 2 ? `<span class="schedule-more">另 ${events.length - 2} 场</span>` : ""}</button>`;
    }
    node("grid").innerHTML = html;
    node("day-number").textContent = String(Number(selectedDay.slice(-2)));
    node("day-label").textContent =
      `${selectedDay.slice(0, 4)} 年 ${Number(selectedDay.slice(5, 7))} 月`;
    node("day-week").textContent = new Intl.DateTimeFormat("zh-CN", {
      weekday: "long",
      timeZone: "UTC",
    }).format(new Date(selectedDay + "T12:00:00Z"));
    const dayItems = items.filter((i) => scheduleDay(i, zone) === selectedDay);
    node("day-events").innerHTML = dayItems.length
      ? dayItems.map(eventHtml).join("")
      : empty(
          "这一天，还没有安排",
          "给准备留一点从容。<br>点击「＋ 添加」记下下一场机会。",
        );
    const undated = items.filter((i) => !i.date).length;
    node("undated").hidden = !undated;
    node("undated").textContent = `另有 ${undated} 场日期待定 →`;
    const groups = new Map<string, Schedule[]>();
    for (const i of items) {
      const day = scheduleDay(i, zone),
        key =
          i.status === "cancelled"
            ? "已取消"
            : i.status === "completed"
              ? "已完成"
              : !day
                ? "日期待定"
                : day < now
                  ? "日期已过 · 待确认"
                  : day === now
                    ? "今天"
                    : day;
      groups.set(key, [...(groups.get(key) || []), i]);
    }
    const priority = (k: string) =>
      k === "今天"
        ? "0"
        : /^20\d\d/.test(k)
          ? "1" + k
          : k === "日期待定"
            ? "2"
            : k.startsWith("日期已过")
              ? "3"
              : k === "已完成"
                ? "4"
                : "5";
    node("list").innerHTML = groups.size
      ? [...groups]
          .sort(([a], [b]) => priority(a).localeCompare(priority(b)))
          .map(
            ([k, rows]) =>
              `<section><h2>${escape(k)} <span>· ${rows.length} 场</span></h2>${rows.map(eventHtml).join("")}</section>`,
          )
          .join("")
      : empty("还没有匹配的日程", "新建一场安排，或调整上方筛选。");
  }
  page.addEventListener("click", (event) => {
    const target = event.target as Element;
    const date = target.closest<HTMLElement>("[data-date]");
    if (date) {
      selectedDay = date.dataset.date!;
      render();
      page
        .querySelector<HTMLButtonElement>(`[data-date="${selectedDay}"]`)
        ?.focus({ preventScroll: true });
    }
    const item = target.closest<HTMLElement>("[data-event]");
    if (item) edit(snapshot.items.find((i) => i.id === item.dataset.event)!);
  });
  for (const el of page.querySelectorAll<HTMLElement>("[data-view]"))
    el.onclick = () => {
      view = el.dataset.view!;
      render();
    };
  node("search").oninput = render;
  node("kind").onchange = render;
  node("state").onchange = render;
  node("zone").onchange = () => {
    zone = node<HTMLSelectElement>("zone").value as Zone;
    render();
  };
  function move(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1 + delta, 1));
    if (next.getUTCFullYear() < 2000 || next.getUTCFullYear() > 2099) return;
    month = next.toISOString().slice(0, 7);
    selectedDay = month + "-01";
    render();
  }
  node("prev").onclick = () => move(-1);
  node("next").onclick = () => move(1);
  node("today").onclick = () => {
    selectedDay = today();
    month = selectedDay.slice(0, 7);
    render();
  };
  node("undated").onclick = () => {
    view = "list";
    render();
  };
  node("refresh").onclick = () => void load();
  node("export").onclick = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { version: 1, exportedAt: new Date().toISOString(), ...snapshot },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `面试日程-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback("已生成本地 JSON 导出；含私人备注，请妥善保管。");
  };
  function task(text = "", done = false) {
    const row = document.createElement("div");
    row.className = "schedule-task";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = done;
    box.setAttribute("aria-label", "准备项已完成");
    const input = document.createElement("input");
    input.type = "text";
    input.value = text;
    input.maxLength = 200;
    input.placeholder = "例如：复习项目架构";
    input.setAttribute("aria-label", "准备事项");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "删除准备项");
    remove.onclick = () => {
      row.remove();
      dirty = true;
    };
    row.append(box, input, remove);
    node("tasks").append(row);
    return input;
  }
  function draft(): Schedule {
    const object: Record<string, unknown> = {
      id: editing?.id || form.dataset.id,
    };
    for (const name of [
      "company",
      "role",
      "kind",
      "round",
      "date",
      "time",
      "endTime",
      "zone",
      "status",
      "location",
      "url",
      "notes",
      "review",
    ])
      object[name] = field(name).value;
    object.tasks = [...node("tasks").querySelectorAll(".schedule-task")]
      .map((row) => ({
        text: row.querySelector<HTMLInputElement>("input[type=text]")!.value,
        done: row.querySelector<HTMLInputElement>("input[type=checkbox]")!
          .checked,
      }))
      .filter((t) => t.text.trim());
    return validateSchedule(object);
  }
  function previewTime() {
    const link = node<HTMLAnchorElement>("meeting");
    link.hidden = true;
    link.removeAttribute("href");
    try {
      const value = draft();
      node("time-preview").textContent = value.start
        ? `北京 ${dateKey(value.start, "Asia/Shanghai")} ${clockTime(value.start, "Asia/Shanghai")}\n悉尼 ${dateKey(value.start, "Australia/Sydney")} ${clockTime(value.start, "Australia/Sydney")}`
        : "日期或时间未定可以留空，将单独标注。";
      if (value.url) {
        link.href = value.url;
        link.hidden = false;
      }
    } catch {
      node("time-preview").textContent =
        "日期时间按所选时区录入；保存前会校验夏令时和起止时间。";
    }
  }
  function edit(item: Schedule | null, date = selectedDay) {
    if (!loaded || busy) return;
    editing = item;
    editRevision = snapshot.revision;
    retryRequest = null;
    form.reset();
    form.dataset.id = item?.id || crypto.randomUUID();
    for (const name of [
      "company",
      "role",
      "kind",
      "round",
      "date",
      "time",
      "endTime",
      "zone",
      "status",
      "location",
      "url",
      "notes",
      "review",
    ]) {
      const defaults: Record<string, string> = {
        kind: "interview",
        status: "planned",
        zone: "Asia/Shanghai",
        date,
      };
      field(name).value = item
        ? String(item[name as keyof Schedule] ?? "")
        : defaults[name] || "";
    }
    node("tasks").replaceChildren();
    item?.tasks.forEach((t) => task(t.text, t.done));
    node("edit-error").textContent = "";
    document.getElementById("schedule-editor-title")!.textContent = item
      ? "编辑日程"
      : "新建日程";
    node("delete").hidden = !item;
    dirty = false;
    controls();
    previewTime();
    dialog.showModal();
    field("company").focus();
  }
  function closeEditor() {
    if (!dialog.open) return true;
    if (busy) return false;
    if (dirty && !confirm("还有未保存的日程内容，确定放弃吗？")) return false;
    dialog.close();
    dirty = false;
    return true;
  }
  node("new").onclick = () => edit(null, today());
  node("add-day").onclick = () => edit(null);
  node("cancel").onclick = closeEditor;
  node("close-editor").onclick = closeEditor;
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeEditor();
  });
  form.addEventListener("input", () => {
    dirty = true;
    previewTime();
  });
  form.addEventListener("change", () => {
    dirty = true;
    previewTime();
  });
  node("add-task").onclick = () => {
    if (node("tasks").children.length >= 30) return;
    task().focus();
    dirty = true;
  };
  async function mutate(action: "save" | "delete") {
    if (busy) return;
    let request: Record<string, unknown>;
    try {
      request = {
        action,
        expectedRevision: editRevision,
        ...(action === "save" ? { item: draft() } : { id: editing!.id }),
      };
    } catch (e) {
      node("edit-error").textContent = (e as Error).message;
      return;
    }
    const signature = JSON.stringify(request);
    if (retryRequest?.signature !== signature)
      retryRequest = { signature, id: crypto.randomUUID() };
    request.requestId = retryRequest.id;
    busy = true;
    controls();
    node("edit-error").textContent = "正在保存…";
    try {
      snapshot = readSnapshot(
        await session.collectionRequest("/api/schedules", request),
      );
      dirty = false;
      dialog.close();
      render();
      feedback(action === "delete" ? "日程已删除。" : "日程已保存在本机。");
      launch.dispatchEvent(new Event("schedule:saved"));
    } catch (e) {
      node("edit-error").textContent =
        e instanceof Error ? e.message : "保存失败，输入已保留。";
    } finally {
      busy = false;
      controls();
    }
  }
  form.onsubmit = (event) => {
    event.preventDefault();
    void mutate("save");
  };
  node("delete").onclick = () => {
    if (confirm("删除这条日程及准备清单、复盘备注？此操作不可撤销。"))
      void mutate("delete");
  };
  window.addEventListener("hashchange", () => {
    if (location.hash === "#schedules") open();
  });
  if (location.hash === "#schedules") open();
  controls();
}
