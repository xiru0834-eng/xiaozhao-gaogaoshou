import type { DataSession } from "./session.ts";
import {
  emptyTaskDraft,
  TASK_KINDS,
  TASK_STATES,
  timingLabel,
  type RecruitmentTask,
  type TaskDraft,
  type TaskState,
} from "../shared/recruitment-task-contract.ts";
import { openTaskEditor, taskEscape as esc } from "./recruitment-task-form.ts";
import "./recruitment-tasks.css";

export function mountRecruitmentTasks(
  page: HTMLElement,
  session: DataSession,
  onChanged: () => void,
) {
  const panel = document.createElement("section");
  panel.className = "rt-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "求职任务");
  panel.innerHTML = `<header class="rt-toolbar"><div><h2>把通知，变成下一步。</h2><p>面试、笔试和测评，在这里逐项处理。</p></div><button class="action primary" data-rt="new">＋ 记录任务</button></header><div class="rt-filters"><label class="rt-search">搜索任务<input data-rt="q" placeholder="公司、事项或岗位"></label><label>类型<select data-rt="kind"><option value="">全部类型</option>${Object.entries(
    TASK_KINDS,
  )
    .map(([k, n]) => `<option value="${k}">${n}</option>`)
    .join(
      "",
    )}</select></label><label>进度<select data-rt="state"><option value="">全部进度</option>${Object.entries(
    TASK_STATES,
  )
    .map(([k, n]) => `<option value="${k}">${n}</option>`)
    .join(
      "",
    )}<option value="deleted">已删除</option></select></label><button class="action" data-rt="refresh">刷新</button></div><p data-rt="feedback" role="status" aria-live="polite"></p><div data-rt="rows"></div><footer class="rt-pager"><button class="action" data-rt="prev">上一页</button><span data-rt="count"></span><button class="action" data-rt="next">下一页</button></footer>`;
  page.append(panel);
  const el = <T extends HTMLElement>(name: string) =>
    panel.querySelector<T>(`[data-rt="${name}"]`)!;
  let items: RecruitmentTask[] = [],
    cursor = 0,
    next: number | null = null,
    epoch = 0,
    busy = false;
  const call = async (path: string, body?: unknown) =>
    (await session.collectionRequest(path, body)).data as any;
  function retryable() {
    let last = "",
      requestId = "";
    return async (operations: unknown[]) => {
      const signature = JSON.stringify(operations);
      if (signature !== last) {
        last = signature;
        requestId = crypto.randomUUID();
      }
      return call("/api/recruitment-task-commands", { requestId, operations });
    };
  }
  async function load() {
    const current = ++epoch;
    el("feedback").textContent = "正在读取任务…";
    try {
      const state = el<HTMLSelectElement>("state").value,
        params = new URLSearchParams({
          limit: "50",
          cursor: String(cursor),
          q: el<HTMLInputElement>("q").value,
          kind: el<HTMLSelectElement>("kind").value,
        });
      if (state === "deleted") params.set("deleted", "true");
      else if (state) params.set("state", state);
      const data = await call("/api/recruitment-tasks?" + params);
      if (current !== epoch) return;
      items = data.items;
      next = data.nextCursor;
      el("rows").innerHTML = items.length
        ? items
            .map(
              (t) =>
                `<article class="rt-row"><button class="rt-main" data-edit="${t.id}"><span class="rt-kind">${TASK_KINDS[t.kind]} · ${{ attend: "参加", complete: "完成", book: "预约", submit_materials: "提交材料" }[t.action]}</span><strong>${esc(t.title)}</strong><span>${esc([t.company || "公司待核实", t.role, t.round].filter(Boolean).join(" · "))}</span><small>${esc(timingLabel(t.timing))}</small></button><div class="rt-row-actions"><span class="rt-state" data-state="${t.state}">${t.deletedAt ? "已删除" : TASK_STATES[t.state]}</span><button class="action" data-quick="${t.id}">${t.deletedAt ? "恢复" : t.state === "completed" ? "重新打开" : "查看任务"}</button></div></article>`,
            )
            .join("")
        : '<div class="schedule-empty"><strong>这里还没有任务</strong>记录一场面试，或在「邮件待确认」中整理通知。没有模型也可以手动记录。</div>';
      el("count").textContent = `${data.total} 项 · 当前 ${items.length} 项`;
      el<HTMLButtonElement>("prev").disabled = cursor === 0;
      el<HTMLButtonElement>("next").disabled = next === null;
      el("feedback").textContent =
        "本机保存 · 时间未核实的任务不会生成精确提醒";
    } catch (e) {
      if (current === epoch)
        el("feedback").textContent =
          e instanceof Error ? e.message : "读取失败";
    }
  }
  async function changed() {
    await load();
    onChanged();
    window.dispatchEvent(new Event("schedules:changed"));
  }
  function edit(item?: RecruitmentTask) {
    const send = retryable();
    const d = item
      ? (Object.fromEntries(
          Object.entries(item).filter(
            ([k]) =>
              ![
                "id",
                "revision",
                "state",
                "createdAt",
                "updatedAt",
                "deletedAt",
              ].includes(k),
          ),
        ) as unknown as TaskDraft)
      : emptyTaskDraft();
    const footer = item
      ? `<div class="rt-editor-actions">${item.deletedAt ? '<button type="button" class="action" data-command="restore">恢复任务</button>' : `<button type="button" class="action" data-state="${item.state === "completed" ? "pending" : "completed"}">${item.state === "completed" ? "重新打开" : "记为已完成"}</button><button type="button" class="action" data-state="in_progress">进行中</button><button type="button" class="action" data-state="${item.state === "cancelled" ? "pending" : "cancelled"}">${item.state === "cancelled" ? "恢复待处理" : "取消安排"}</button><button type="button" class="schedule-link" data-command="delete">删除任务</button>`}</div><details class="rt-more" data-history><summary>来源与修改记录</summary><p>正在读取…</p></details>`
      : "";
    const dialog = openTaskEditor(
      d,
      item ? "任务详情" : "记录求职任务",
      "保存任务",
      async (draft) => {
        await send([
          {
            action: item ? "edit" : "create",
            ...(item ? { id: item.id, expectedRevision: item.revision } : {}),
            draft,
          },
        ]);
        await changed();
      },
      footer,
    );
    if (item?.deletedAt)
      dialog.querySelector<HTMLButtonElement>("button[type=submit]")!.disabled =
        true;
    if (item)
      void call("/api/recruitment-tasks/" + item.id)
        .then((data) => {
          dialog.querySelector("[data-history] p")!.textContent =
            `${data.sources.length} 条邮件来源 · ${data.history.length} 次操作。` +
            data.sources
              .flatMap((s: any) => s.evidence.map((e: any) => e.quote))
              .join("\n");
        })
        .catch(() => {
          dialog.querySelector("[data-history] p")!.textContent =
            "来源暂未读取，请稍后重试。";
        });
    dialog.addEventListener("click", async (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>(
        "[data-command],[data-state]",
      );
      if (!b || !item || busy) return;
      if (!confirm("确认此操作？当前未保存的表单修改不会一起保存。")) return;
      if (dialog.dataset.busy === "true") return;
      busy = true;
      dialog.dataset.busy = "true";
      const buttons = [
        ...dialog.querySelectorAll<HTMLButtonElement>("button"),
      ].map((b) => ({ b, disabled: b.disabled }));
      buttons.forEach(({ b }) => (b.disabled = true));
      try {
        await send([
          {
            action: b.dataset.command ?? "state",
            id: item.id,
            expectedRevision: item.revision,
            ...(b.dataset.state ? { state: b.dataset.state as TaskState } : {}),
          },
        ]);
        dialog.close();
        dialog.remove();
        await changed();
      } catch (e) {
        dialog.querySelector(".rt-error")!.textContent =
          e instanceof Error ? e.message : "操作失败";
      } finally {
        busy = false;
        dialog.dataset.busy = "false";
        buttons.forEach(({ b, disabled }) => (b.disabled = disabled));
      }
    });
  }
  el("new").onclick = () => edit();
  el("refresh").onclick = () => void load();
  let timer: ReturnType<typeof setTimeout>;
  el("q").oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      cursor = 0;
      void load();
    }, 180);
  };
  for (const k of ["kind", "state"])
    el(k).onchange = () => {
      cursor = 0;
      void load();
    };
  el("prev").onclick = () => {
    cursor = Math.max(0, cursor - 50);
    void load();
  };
  el("next").onclick = () => {
    if (next !== null) {
      cursor = next;
      void load();
    }
  };
  panel.onclick = (e) => {
    const b = (e.target as Element).closest<HTMLElement>(
      "[data-edit],[data-quick]",
    );
    if (b)
      edit(items.find((t) => t.id === (b.dataset.edit ?? b.dataset.quick)));
  };
  window.addEventListener("schedules:changed", () => {
    if (!panel.hidden) void load();
  });
  return {
    panel,
    load,
    editId: async (id: string) => {
      try {
        edit((await call("/api/recruitment-tasks/" + id)).task);
      } catch (e) {
        el("feedback").textContent =
          e instanceof Error ? e.message : "读取失败";
      }
    },
  };
}
