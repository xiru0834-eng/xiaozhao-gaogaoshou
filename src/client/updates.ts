import type { Candidate, JobDraft, PreferencesView, RunView, SourceDefinition } from "../shared/collection-contract.ts";
import type { ModelSettingsView } from "../shared/model-contract.ts";
import { required } from "./dom.ts";
import type { DataSession } from "./session.ts";
import { updatesView } from "./updates-view.ts";
import { action, candidateView, el, jobView, runLabels, sourcesView, when } from "./updates-render.ts";

export function mountUpdates(session: DataSession, onAccepted: () => void) {
  const { page, node } = updatesView(), workbench = required<HTMLElement>(".main-shell > .content"), workspace = required<HTMLElement>(".workspace"), breadcrumb = required<HTMLElement>(".breadcrumb span:last-child");
  workbench.after(page);
  const launch = action("岗位更新", () => { if (!page.hidden) { close(); return; } if (!window.dispatchEvent(new CustomEvent("workspace:navigate", { cancelable: true, detail: "updates" }))) return; page.hidden = false; workbench.hidden = true; workspace.dataset.page = "updates"; breadcrumb.textContent = "岗位更新"; launch.setAttribute("aria-pressed", "true"); required<HTMLElement>("#updates-heading", page).focus(); window.scrollTo({ top: 0 }); void load(); });
  launch.id = "open-updates"; launch.setAttribute("aria-pressed", "false"); required(".header-tools").prepend(launch);
  const input = (name: string) => node<HTMLInputElement>(name), button = (name: string) => node<HTMLButtonElement>(name);
  let preferences: PreferencesView = { revision: 0, preferences: null }, model: ModelSettingsView | null = null;
  let runs: RunView[] = [], jobs: JobDraft[] = [], busy = false, dirty = false, loaded = false, epoch = 0, timer: ReturnType<typeof setTimeout> | undefined, selectedRun = "";
  let activeView = "start";
  let runsTotal = 0, jobsTotal = 0;
  const active = () => runs.some(r => ["queued", "running"].includes(r.state));
  function say(text: string, error = false) { node("feedback").textContent = text; node("feedback").dataset.error = String(error); }
  function fail(error: unknown) { say(error instanceof Error ? error.message : "请求失败，请刷新记录核对。未自动重试。", true); }
  function renderControls() {
    const locked = !loaded || busy || active(), selected = page.querySelectorAll('[data-updates="sources"] input:checked').length;
    button("source-only").disabled = locked || !selected; button("extract").disabled = locked || !selected || dirty || !preferences.preferences || !model?.hasKey || !input("consent").checked;
    node<HTMLFieldSetElement>("preference-fields").disabled = locked;
    button("refresh").disabled = busy;
    launch.textContent = active() ? "岗位更新 · 检查中" : "岗位更新";
    page.querySelectorAll<HTMLInputElement>('[data-updates="sources"] input').forEach(box => box.disabled = locked);
  }
  function tab(name: string) { activeView = name; page.querySelectorAll<HTMLElement>("[data-pane]").forEach(p => p.hidden = p.dataset.pane !== name); page.querySelectorAll<HTMLElement>("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === name))); }
  function close() {
    if (busy) { say("正在保存或发起请求，请稍等。"); return false; }
    if (dirty && !window.confirm("匹配条件尚未保存，离开会放弃修改。继续吗？")) return false;
    epoch++; if (timer) clearTimeout(timer); dirty = false; page.hidden = true; workbench.hidden = false; delete workspace.dataset.page; breadcrumb.textContent = "公司与投递"; launch.setAttribute("aria-pressed", "false"); launch.focus(); return true;
  }
  window.addEventListener("workspace:navigate", event => { if ((event as CustomEvent).detail !== "updates" && !page.hidden && !close()) event.preventDefault(); });
  for (const selector of [".brand", "#open-help", "#status-filters"]) document.querySelector(selector)?.addEventListener("click", event => { if (!page.hidden && !close()) { event.preventDefault(); event.stopImmediatePropagation(); } }, { capture: true });
  button("back").addEventListener("click", close);
  page.querySelectorAll<HTMLElement>("[data-view]").forEach(b => b.addEventListener("click", () => { tab(b.dataset.view!); if (activeView === "jobs") renderJobs(); }));
  input("consent").addEventListener("change", renderControls);
  node<HTMLFormElement>("preferences").addEventListener("input", () => { dirty = true; renderControls(); });
  button("refresh").addEventListener("click", () => { if (!dirty || window.confirm("刷新会放弃未保存的匹配条件。继续吗？")) void load(); });
  async function load() {
    const current = ++epoch; if (timer) clearTimeout(timer); busy = true; loaded = false; renderControls(); say("正在读取来源、匹配条件和历史记录…");
    try {
      const [a, b, c, d, e] = await Promise.all([session.collectionRequest("/api/sources"), session.collectionRequest("/api/job-preferences").catch(() => ({ preferences: { revision: 0, preferences: null }, unavailable: true })), session.modelRequest("/api/model-settings").catch(() => ({ settings: null })), session.collectionRequest("/api/collection-runs"), session.collectionRequest("/api/jobs")]);
      if (epoch !== current) return;
      preferences = b.preferences as PreferencesView; model = c.settings as ModelSettingsView; runs = d.runs as RunView[]; jobs = e.items as JobDraft[];
      runsTotal = Number(d.total); jobsTotal = Number(e.total);
      sourcesView(node("sources"), a.sources as SourceDefinition[], renderControls);
      const p = preferences.preferences; input("month").value = p?.graduationMonth ?? ""; node<HTMLSelectElement>("degree").value = p?.degree ?? "master"; input("major").value = p?.major ?? ""; input("cities").value = p?.cities.join("，") ?? ""; input("internships").checked = p?.includeInternships ?? false; input("confirmed").checked = p?.confirmed ?? false; input("consent").checked = false;
      node("model-note").textContent = model?.hasKey ? `当前模型：${model.config?.model} · ${model.config?.baseUrl}。仅详情页提取会调用模型，每次输出最多 ${model.config?.maxTokens} tokens。` : "模型未配置或暂时无法读取。仍可检查来源；需要提取时，请先在「模型设置」连接并测试接口。";
      dirty = false; loaded = true; renderRuns(); renderJobs(); say("记录已读取。选择来源后手动开始，不会自动联网采集。");
      if ("unavailable" in b) say("匹配条件读取失败，原文件未覆盖。仍可检查来源；岗位提取暂停，请先修复偏好文件。", true);
      if (selectedRun) await preview(selectedRun);
      schedule();
    } catch (error) { if (current === epoch) fail(error); }
    finally { if (current === epoch) { busy = false; renderControls(); } }
  }
  node<HTMLFormElement>("preferences").addEventListener("submit", async event => {
    event.preventDefault(); if (busy) return; busy = true; renderControls();
    try { const data = await session.collectionRequest("/api/job-preferences", { expectedRevision: preferences.revision, preferences: { graduationMonth: input("month").value, degree: node<HTMLSelectElement>("degree").value, major: input("major").value.trim(), cities: input("cities").value.split(/[,，]/).map(s => s.trim()).filter(Boolean), includeInternships: input("internships").checked, confirmed: input("confirmed").checked } }); preferences = data.preferences as PreferencesView; dirty = false; say("匹配条件已保存在本机。之前的候选需要按新条件重新采集评估。"); }
    catch (error) { fail(error); } finally { busy = false; renderControls(); }
  });
  async function start(mode: "source_only" | "extract") {
    if (busy || active()) return; busy = true; renderControls();
    const sourceIds = [...page.querySelectorAll<HTMLInputElement>('[data-updates="sources"] input:checked')].map(box => box.value);
    try { const data = await session.collectionRequest("/api/collection-runs", { mode, sourceIds, requestId: crypto.randomUUID(), maxModelCalls: mode === "source_only" ? 0 : Number(node<HTMLSelectElement>("budget").value), ...(mode === "extract" ? { expectedModelRevision: model?.revision, expectedPreferenceRevision: preferences.revision } : {}) }); const run = data.run as RunView; runs.unshift(run); selectedRun = run.id; tab("runs"); renderRuns(); await preview(run.id); say("任务已创建。可以返回台账；结果不会自动写入岗位库。"); schedule(); }
    catch (error) { fail(error); } finally { busy = false; renderControls(); }
  }
  button("source-only").addEventListener("click", () => void start("source_only")); button("extract").addEventListener("click", () => void start("extract"));
  function schedule() { if (timer) clearTimeout(timer); if (active() && !page.hidden) timer = setTimeout(() => void poll(), 1500); }
  async function poll() { const current = epoch; try { const data = await session.collectionRequest("/api/collection-runs"); if (current !== epoch) return; runs = data.runs as RunView[]; runsTotal = Number(data.total); renderRuns(); renderControls(); if (selectedRun) await preview(selectedRun); schedule(); } catch (error) { fail(error); } }
  async function more(target: "runs" | "jobs") {
    if (busy || active()) return;
    busy = true; renderControls();
    try {
      const data = await session.collectionRequest(target === "runs" ? `/api/collection-runs?offset=${runs.length}` : `/api/jobs?offset=${jobs.length}`);
      if (target === "runs") { runs.push(...data.runs as RunView[]); runsTotal = Number(data.total); renderRuns(); }
      else { jobs.push(...data.items as JobDraft[]); jobsTotal = Number(data.total); renderJobs(); }
    } catch (error) { fail(error); } finally { busy = false; renderControls(); }
  }
  function renderRuns() {
    const host = node("runs"); host.replaceChildren();
    if (!runs.length) host.append(el("p", "还没有检查记录。先用「只检查来源」确认网页可读，再选择是否调用模型。", "updates-empty"));
    for (const run of runs) { const row = el("div", "", "updates-run"), info = el("div"); info.append(el("strong", `${runLabels[run.state]} · ${run.input.mode === "source_only" ? "来源检查" : "岗位提取"}`), el("p", `${when(run.startedAt)} · ${run.documents.length}/${run.input.sourceIds.length} 个来源 · ${run.candidates} 条候选 · ${run.modelCalls} 次模型尝试`, "updates-muted")); row.append(info, action("查看结果", () => { selectedRun = run.id; void preview(run.id).catch(fail); })); if (["running", "queued"].includes(run.state)) row.append(action("取消任务", () => { void session.collectionRequest(`/api/collection-runs/${run.id}/cancel`, {}).then(() => { say("取消请求已发送，等待当前网络连接关闭。"); schedule(); }).catch(fail); })); host.append(row); }
    if (runs.length < runsTotal) { const next = action(`加载更早记录（${runs.length}/${runsTotal}）`, () => void more("runs")); next.disabled = active(); host.append(next); }
  }
  async function preview(id: string) {
    const current = epoch, data = await session.collectionRequest("/api/update-batches/" + id); if (current !== epoch || selectedRun !== id) return;
    const run = data.run as RunView, candidates = data.candidates as Candidate[], host = node("preview");
    // Keep reviewed selections and expanded evidence while background status refreshes.
    if (host.dataset.run === id && host.dataset.state === run.state && host.dataset.count === String(candidates.length) && ["running", "queued"].includes(run.state)) return;
    host.replaceChildren(); host.dataset.run = id; host.dataset.state = run.state; host.dataset.count = String(candidates.length);
    const summary = el("div", "", "updates-run-summary"); summary.append(el("h3", runLabels[run.state]), el("p", `模型尝试 ${run.modelCalls} 次 · 输入 ${run.usage.input ?? "未报告"} / 输出 ${run.usage.output ?? "未报告"} tokens · 匹配条件版本 ${run.preferenceRevision}`, "updates-muted"));
    const list = el("ul");
    for (const doc of run.documents) {
      const row = el("li", `${doc.url}：${doc.message}`);
      row.append(el("small", ` 核验于 ${when(doc.checkedAt)}`));
      if (doc.text) { const raw = el("details"); raw.append(el("summary", "查看本次读取原文"), el("pre", `SHA-256: ${doc.hash}\n\n${doc.text}`)); row.append(raw); }
      list.append(row);
    }
    for (const error of run.errors) list.append(el("li", error)); summary.append(list); host.append(summary);
    if (!candidates.length) host.append(el("p", run.input.mode === "source_only" ? "本次只核验来源可读性，不提取岗位、不调用模型。" : "本次暂未产生候选。查看上方原因；页面打不开不等于没有岗位。", "updates-empty"));
    const terminal = !["queued", "running"].includes(run.state), accept = action("确认收录所选（0）", confirmSelection); accept.disabled = true;
    let confirming = false, needsRefresh = false;
    const selected = () => [...host.querySelectorAll<HTMLInputElement>('article input[type="checkbox"]:checked')].map(box => box.value);
    const changed = () => { accept.textContent = `确认收录所选（${selected().length}）`; accept.disabled = !selected().length || !terminal || confirming || needsRefresh; };
    for (const candidate of candidates) host.append(candidateView(candidate, () => { void session.collectionRequest("/api/evidence/" + candidate.job.evidenceId).then(d => { const document = d.document as { text: string; hash: string }; const pre = el("pre", `SHA-256: ${document.hash}\n\n${document.text}`); host.append(pre); pre.scrollIntoView({ block: "nearest" }); }).catch(fail); }, changed));
    if (candidates.some(c => c.canAccept && !c.accepted)) host.append(accept, el("p", "收录仅保存岗位与证据，不表示推荐投递，也不改变已投状态。待核验、不匹配会保留标记。", "updates-muted"));
    function confirmSelection() {
      const ids = selected(); if (!ids.length || busy || !terminal) return;
      confirming = true; changed();
      const checkboxes = [...host.querySelectorAll<HTMLInputElement>('article input[type="checkbox"]:not(:disabled)')];
      checkboxes.forEach(box => box.disabled = true);
      const confirm = el("section", "", "updates-confirm"); confirm.setAttribute("aria-label", "确认收录");
      confirm.append(el("h3", `将收录 ${ids.length} 条岗位`), el("p", candidates.filter(c => ids.includes(c.id)).map(c => `${c.job.company} · ${c.job.fields.title?.quote}`).join("；")), el("p", "只保存岗位和原文证据，不修改投递状态，不发起申请。", "updates-muted"));
      const final = action("确定收录", () => void save(ids, confirm), true);
      confirm.append(action("返回核对", () => { confirm.remove(); checkboxes.forEach(box => box.disabled = false); confirming = false; changed(); accept.focus(); }), final);
      host.append(confirm); final.focus();
    }
    async function save(ids: string[], confirm: HTMLElement) {
      if (busy || needsRefresh) return;
      busy = true; accept.disabled = true; confirm.querySelectorAll("button").forEach(b => b.disabled = true); renderControls();
      const attempt = { requestId: crypto.randomUUID(), candidateIds: ids, expectedRevision: data.revision, expectedCatalogRevision: data.catalogRevision };
      try { await session.collectionRequest("/api/update-batches/accept", attempt); const data = await session.collectionRequest("/api/jobs"); jobs = data.items as JobDraft[]; jobsTotal = Number(data.total); onAccepted(); await preview(id); say("所选岗位已收录。个人投递记录保持不变。"); renderJobs(); }
      catch (error) { needsRefresh = true; confirm.append(el("p", "结果尚未确认。请点「刷新记录」核对是否已收录，再决定下一步；不会自动重发。", "updates-reasons")); fail(error); } finally { busy = false; changed(); renderControls(); }
    }
  }
  function renderJobs() {
    const filter = node<HTMLSelectElement>("job-filter").value, selected = jobs.filter(job => filter === "all" || filter === "recommended" && job.assessment.recommended || filter === "unknown" && job.assessment.eligibility === "unknown" || filter === "ineligible" && job.assessment.eligibility === "ineligible");
    const host = node("jobs"); host.replaceChildren(); if (!selected.length) host.append(el("p", "此筛选下尚无收录岗位。先在运行结果中核对候选，并手动确认收录。", "updates-empty"));
    for (const job of selected) host.append(jobView(job, null, () => { void session.collectionRequest("/api/evidence/" + job.evidenceId).then(d => { const doc = d.document as { text: string }; const pre = el("pre", doc.text); host.append(pre); pre.scrollIntoView({ block: "nearest" }); }).catch(fail); }));
    if (jobs.length < jobsTotal) { const next = action(`加载更多岗位（${jobs.length}/${jobsTotal}）`, () => void more("jobs")); next.disabled = active(); host.append(el("p", "筛选当前已加载记录；继续加载可查看更早收录的岗位。", "updates-muted"), next); }
  }
  node("job-filter").addEventListener("change", renderJobs);
  window.addEventListener("beforeunload", event => { if (dirty || busy) event.preventDefault(); });
}
