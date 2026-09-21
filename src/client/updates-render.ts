import { JOB_FIELDS, type Candidate, type JobDraft, type RunView, type SourceDefinition } from "../shared/collection-contract.ts";
export const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = "", className = ""): HTMLElementTagNameMap[K] => { const node = document.createElement(tag); node.textContent = text; node.className = className; return node; };
export function action(text: string, run: () => void, primary = false) { const b = el("button", text, "action" + (primary ? " primary" : "")); b.type = "button"; b.addEventListener("click", run); return b; }
export function publicLink(text: string, url: string) {
  const link = el("a", text);
  try { const u = new URL(url); if (!["https:", "mailto:"].includes(u.protocol) || u.username || u.password) throw new Error(); link.href = u.href; link.target = "_blank"; link.rel = "noopener noreferrer"; }
  catch { link.removeAttribute("href"); }
  return link;
}
const label: Record<string, string> = { title: "岗位", locations: "城市", graduation: "毕业窗口", degree: "学历 / 专业", experience: "经验", employment: "类型", skills: "技能", salary: "薪资", published: "发布时间", deadline: "截止时间", status: "网页状态" };
export const runLabels: Record<RunView["state"], string> = { queued: "排队中", running: "检查中", completed: "检查完成", partial: "部分完成", failed: "失败", cancelled: "已取消", interrupted: "上次中断" };
export const when = (date: string) => new Date(date).toLocaleString("zh-CN", { hour12: false });
export function sourcesView(host: HTMLElement, sources: SourceDefinition[], changed: () => void) {
  host.replaceChildren();
  for (const source of sources) {
    const row = el("div", "", "updates-source"), choice = el("label", "", "updates-check");
    const box = el("input"); box.type = "checkbox"; box.value = source.id; box.checked = true; box.addEventListener("change", changed);
    choice.append(box, el("strong", source.name));
    row.append(choice, el("span", source.kind === "detail" ? "岗位详情" : "招聘入口 · 暂不提取", "updates-pill"), el("p", source.note, "updates-muted"), publicLink("查看官方来源 ↗", source.entryUrl)); host.append(row);
  }
}
export function jobView(job: JobDraft, previous: JobDraft | null, evidence: () => void) {
  const block = el("div", "", "updates-job");
  const title = el("h3", job.fields.title?.quote ?? "标题待核验");
  const status = job.assessment.recommended ? "条件初筛通过" : job.assessment.eligibility === "ineligible" ? "不匹配" : "待核验";
  block.append(title, el("p", `${job.company} · ${job.fields.locations?.quote ?? "城市未披露"} · ${status}`, "updates-job-meta"));
  block.append(el("p", job.assessment.availability === "open" ? "上次核验时公开页面显示可申请，不代表申请一定成功。" : job.assessment.availability === "closed" ? "原文显示已关闭或明确截止日期已过。" : "开放状态尚未确认。", "updates-muted"));
  if (job.assessment.reasons.length) block.append(el("p", job.assessment.reasons.join(" "), "updates-reasons"));
  const more = el("details"), summary = el("summary", previous ? "展开字段变化与原文" : "展开字段证据"); more.append(summary);
  const table = el("dl", "", "updates-evidence-fields");
  for (const key of JOB_FIELDS) {
    const before = previous?.fields[key]?.quote, current = job.fields[key]?.quote;
    const value = el("dd", current ?? "未披露 / 无法确认");
    if (previous && before !== current) value.prepend(el("small", `之前：${before ?? "未知"} → `, "updates-muted"));
    table.append(el("dt", label[key]), value);
  }
  more.append(table, action("查看完整原文快照", evidence));
  const links = el("div", "", "updates-actions"); links.append(publicLink("官方岗位 ↗", job.url));
  if (job.applicationUrl) links.append(publicLink("页面申请入口 ↗", job.applicationUrl));
  block.append(more, links, el("p", `首次发现 ${when(job.firstSeenAt)} · 最后核验 ${when(job.lastVerifiedAt)}`, "updates-muted"));
  return block;
}
export function candidateView(candidate: Candidate, evidence: () => void, changed: () => void) {
  const row = el("article", "", "updates-candidate"), choice = el("label", "", "updates-check");
  const box = el("input"); box.type = "checkbox"; box.value = candidate.id; box.disabled = !candidate.canAccept || candidate.accepted;
  const stale = Date.now() - Date.parse(candidate.job.lastVerifiedAt) > 86400000;
  if (stale) box.disabled = true;
  box.addEventListener("change", changed);
  choice.append(box, el("strong", candidate.accepted ? "已入库" : ({ new: "新增岗位", changed: "岗位有变化", duplicate: "与已收录内容一致", review: "公司信息需人工核实，暂不可入库" })[candidate.kind]));
  if (stale && !candidate.accepted) choice.append(el("span", "原文超过 24 小时，请重新检查", "updates-reasons"));
  row.append(choice, jobView(candidate.job, candidate.previous, evidence)); return row;
}
