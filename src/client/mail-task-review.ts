import type { MailCandidate, MailMessage } from "../shared/mail-contract.ts";
import type {
  MailTaskAnalysis,
  MailTaskAction,
} from "../shared/mail-task-contract.ts";
import {
  TASK_KINDS,
  TASK_ACTIONS,
  timingLabel,
  emptyTaskDraft,
  type TaskDraft,
  type RecruitmentTask,
} from "../shared/recruitment-task-contract.ts";
import { openTaskEditor, taskEscape as esc } from "./recruitment-task-form.ts";
import type { DataSession } from "./session.ts";
import "./recruitment-tasks.css";

export function renderMailTaskReview(
  host: HTMLElement,
  c: MailCandidate & { taskAnalysis?: MailTaskAnalysis | null },
  source: MailMessage,
  session: DataSession,
  reload: () => Promise<void>,
  calendar: () => void,
) {
  const analysis = c.taskAnalysis,
    actions = analysis?.actions ?? [];
  let busy = false;
  const stateName = {
    review: "待核对",
    confirming: "保存恢复中",
    confirmed: "已记录",
    ignored: "已忽略",
  };
  const pending = actions.filter((a) => a.state === "review");
  host.innerHTML = `<header><span class="mail-state">${analysis ? "逐项核对" : "先整理，再安排"}</span><h3>${esc(source.subject)}</h3><p>收信 ${esc(new Date(source.receivedAt).toLocaleString())} · ${esc(source.sender)}</p></header>
  <details class="mail-original"><summary>查看邮件原文 · 与下方事项对照</summary><pre>${esc(source.text)}</pre></details>
  ${c.error ? `<p class="mail-warning">${esc(c.error)}</p>` : ""}
  <section class="mt-review" aria-label="邮件任务核对"><header class="mt-heading"><div><h4>${analysis ? `${actions.length} 项待办线索` : "这封通知，需要做些什么？"}</h4><p>预约、参加、完成测评分别记录；确认前不会改变日历。</p></div>${pending.some((a) => a.mutation === "create") ? '<button class="action" data-mt="batch">确认勾选项</button>' : ""}</header>
  ${analysis && !actions.length ? '<p class="mail-warning">未识别出可记录事项。这不代表邮件无须处理，请检查原文，也可以手动整理。</p>' : ""}
  ${actions.map((a) => `<article class="mt-action" data-action-id="${a.id}"><div class="mt-action-head">${a.state === "review" && a.mutation === "create" ? `<label class="mt-check"><input type="checkbox" data-select="${a.id}" aria-label="勾选 ${esc(a.draft.title)}">批量确认</label>` : ""}<span class="rt-kind">${TASK_KINDS[a.draft.kind]} · ${TASK_ACTIONS[a.draft.action]}</span><span class="rt-state">${stateName[a.state]}</span></div><h4>${esc(a.draft.title)}</h4><p>${esc([a.draft.company || "公司待核实", a.draft.role, a.draft.round].filter(Boolean).join(" · "))}</p><p class="mt-time">${esc(timingLabel(a.draft.timing))}</p>${a.draft.uncertainties.length ? `<div class="mail-warning"><strong>请核对</strong><ul>${a.draft.uncertainties.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>` : ""}<details><summary>原文依据 ${a.evidence.length} 项</summary>${a.evidence.map((e) => `<blockquote>${esc(e.quote)}</blockquote>`).join("") || "<p>手动整理，由你核对原文。</p>"}</details><div class="mt-actions">${a.state === "review" ? `<button class="action primary" data-review="${a.id}">${a.mutation === "create" ? "核对并记录" : a.mutation === "update" ? "选择原任务，核对改期" : "选择原任务，确认取消"}</button>${a.mutation === "create" ? `<button class="schedule-link" data-link="${a.id}">关联已有任务</button>` : ""}<button class="schedule-link" data-ignore="${a.id}">忽略此项</button>` : a.taskId ? "<span>已保存在「求职任务」，不会因清理邮件而删除。</span>" : ""}</div></article>`).join("")}
  <p role="alert" class="rt-error" data-mt="error"></p></section>
  <div class="mail-detail-actions">${!actions.some((a) => ["confirmed", "confirming"].includes(a.state)) ? `<button class="action" data-mt="analyze">${analysis ? "重新提取事项" : "使用模型分析"}</button>` : ""}${!actions.length ? '<button class="action" data-mt="manual">手动整理成任务</button>' : ""}${actions.some((a) => a.state === "confirming") ? '<button class="action" data-mt="recover">核对保存结果</button>' : ""}<button class="action" data-mt="calendar">查看任务与日历</button>${!actions.length ? '<button class="schedule-link" data-mt="ignore-mail">忽略这封邮件</button>' : ""}</div>`;
  const error = (e: unknown) => {
    host.querySelector("[data-mt=error]")!.textContent =
      e instanceof Error ? e.message : "操作未完成，请保留内容重试。";
  };
  const request = (v: unknown) => session.mailRequest(v);
  const done = async () => {
    await reload();
    window.dispatchEvent(new Event("schedules:changed"));
  };
  async function run(work: () => Promise<unknown>) {
    if (busy) return;
    busy = true;
    host
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((b) => (b.disabled = true));
    try {
      await work();
      await done();
    } catch (e) {
      error(e);
    } finally {
      busy = false;
      host
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((b) => (b.disabled = false));
    }
  }
  function sender() {
    let signature = "",
      id = "";
    return async (decisions: unknown[]) => {
      const json = JSON.stringify(decisions);
      if (signature !== json) {
        signature = json;
        id = crypto.randomUUID();
      }
      return request({
        action: "confirmTasks",
        batch: {
          requestId: id,
          mailId: c.id,
          analysisRevision: analysis!.revision,
          sourceVersion: analysis!.sourceVersion,
          decisions,
        },
      });
    };
  }
  async function chooseTarget(
    a: MailTaskAction,
    mode: "edit" | "cancel" | "link",
  ) {
    const targets: RecruitmentTask[] = [];
    let cursor: number | null = 0;
    do {
      const data = (
        await session.collectionRequest(
          "/api/recruitment-tasks?limit=100&cursor=" + cursor,
        )
      ).data as { items: RecruitmentTask[]; nextCursor: number | null };
      targets.push(...data.items);
      cursor = data.nextCursor;
    } while (cursor !== null);
    const dialog = document.createElement("dialog");
    dialog.className = "rt-dialog";
    dialog.setAttribute("aria-label", "选择原任务");
    dialog.innerHTML = `<form><h2>选择要${mode === "link" ? "关联" : mode === "cancel" ? "取消" : "修改"}的原任务</h2><p class="rt-help">不会凭公司名称自动匹配。旧版日程请到日历中手动修改。</p><label>原任务<select required name="target"><option value="">请选择</option>${targets.map((t) => `<option value="${t.id}">${esc(t.company + " · " + t.title + " · " + timingLabel(t.timing))}</option>`).join("")}</select></label><p data-target-summary class="rt-help"></p><footer><button type="button" class="action" data-close>取消</button><button type="submit" class="action primary">继续核对</button></footer></form>`;
    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelector("[data-close]")!.addEventListener("click", () => {
      dialog.close();
      dialog.remove();
    });
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    dialog.querySelector("select")!.onchange = () => {
      const t = targets.find(
        (t) => t.id === dialog.querySelector("select")!.value,
      );
      dialog.querySelector("[data-target-summary]")!.textContent = t
        ? `当前版本 ${t.revision} · ${timingLabel(t.timing)} · ${t.state}`
        : "";
    };
    dialog.querySelector("form")!.onsubmit = (e) => {
      e.preventDefault();
      const t = targets.find(
        (t) => t.id === dialog.querySelector("select")!.value,
      );
      if (!t) return;
      dialog.close();
      review(a, mode, t);
    };
  }
  function review(
    a: MailTaskAction,
    mode: "create" | "edit" | "cancel" | "link" = "create",
    target?: RecruitmentTask,
  ) {
    const send = sender();
    let draft = a.draft;
    if (target) {
      const {
        id,
        revision,
        state,
        createdAt,
        updatedAt,
        deletedAt,
        ...previous
      } = target;
      draft =
        mode === "edit"
          ? {
              ...previous,
              ...Object.fromEntries(
                Object.entries(a.draft).filter(
                  ([key, value]) => typeof value === "string" && value !== "",
                ),
              ),
              timing:
                a.draft.timing.mode === "unknown"
                  ? previous.timing
                  : a.draft.timing,
              uncertainties: a.draft.uncertainties,
            }
          : previous;
    }
    const editor = openTaskEditor(
      draft,
      mode === "edit"
        ? "核对改期后的完整任务"
        : mode === "cancel"
          ? "核对要取消的任务"
          : mode === "link"
            ? "核对关联的任务"
            : "核对邮件任务",
      mode === "cancel"
        ? "确认取消任务"
        : mode === "link"
          ? "仅关联来源"
          : "确认记录任务",
      async (value) => {
        await send([
          {
            actionId: a.id,
            mode,
            ...(target
              ? { targetId: target.id, expectedRevision: target.revision }
              : {}),
            ...(["create", "edit"].includes(mode) ? { draft: value } : {}),
          },
        ]);
        await done();
      },
      `<div class="mail-warning">${target ? `原任务：${esc(target.title)} · ${esc(timingLabel(target.timing))}<br>` : ""}${mode === "link" ? "只关联邮件来源，不改原任务内容。" : mode === "cancel" ? "取消后保留记录，不删除任务。" : "请核对公司、日期、时区；有疑点可以先保留为时间待定。"}</div><label class="mt-verified"><input type="checkbox" required>我已核对原文及本次操作</label>`,
    );
    if (mode === "cancel" || mode === "link")
      (editor.querySelector("[data-fields]") as HTMLFieldSetElement).disabled =
        true;
  }
  const sendBatch = sender();
  host.addEventListener(
    "click",
    (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>("button");
      if (!b || busy) return;
      const a = actions.find(
        (a) =>
          a.id === (b.dataset.review ?? b.dataset.link ?? b.dataset.ignore),
      );
      if (a && b.dataset.review) {
        if (a.mutation === "create") review(a);
        else
          void chooseTarget(
            a,
            a.mutation === "update" ? "edit" : "cancel",
          ).catch(error);
      }
      if (a && b.dataset.link) void chooseTarget(a, "link").catch(error);
      if (
        a &&
        b.dataset.ignore &&
        confirm("忽略这一项？不会删除已记录的其他任务。")
      )
        void run(() =>
          request({
            action: "ignoreTask",
            id: c.id,
            actionId: a.id,
            revision: analysis!.revision,
          }),
        );
      switch (b.dataset.mt) {
        case "analyze":
          void run(() => request({ action: "analyzeTasks", id: c.id }));
          break;
        case "recover":
          void run(() => request({ action: "recoverTasks" }));
          break;
        case "ignore-mail":
          void run(() => request({ action: "ignore", id: c.id }));
          break;
        case "calendar":
          calendar();
          break;
        case "manual":
          openTaskEditor(
            { ...emptyTaskDraft(), title: source.subject.slice(0, 200) },
            "手动整理邮件任务",
            "保存为待核对事项",
            async (draft) => {
              await request({ action: "manualTask", id: c.id, draft });
              await done();
            },
          );
          break;
        case "batch": {
          const selected = [
            ...host.querySelectorAll<HTMLInputElement>("[data-select]:checked"),
          ]
            .map((b) => actions.find((a) => a.id === b.dataset.select)!)
            .filter(Boolean);
          if (!selected.length) {
            error(Error("请先勾选要确认的事项。"));
            break;
          }
          if (
            confirm(
              `确认已核对以下 ${selected.length} 项的原文和时间？\n${selected.map((a) => a.draft.title + "：" + timingLabel(a.draft.timing)).join("\n")}\n\n不确定的事项请取消，逐项编辑后再确认。`,
            )
          )
            void run(() =>
              sendBatch(
                selected.map((a) => ({
                  actionId: a.id,
                  mode: "create",
                  draft: a.draft,
                })),
              ),
            );
          break;
        }
      }
    },
    {
      signal: (() => {
        const controller = new AbortController();
        const observer = new MutationObserver(() => {
          if (!host.isConnected) {
            controller.abort();
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return controller.signal;
      })(),
    },
  );
}
