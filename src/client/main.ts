import { exportCsv, exportSql } from "./exports.ts";
import {
  daysLeft,
  groupOf as selectGroup,
  groupList as selectGroups,
  sortedRows as sortRows,
  matches as matchesRow,
} from "./selectors.ts";
import { element, required } from "./dom.ts";
import "./styles.css";
import "./workbench.css";
import {
  DATA,
  CATS,
  CATNAME,
  OWNERSHIPS,
  OWNERSHIPNAME,
  RECRUIT_CHANNELS,
  RECRUIT_CHANNEL_NAME,
  APPEND_DATES,
  ownershipOf,
  classificationLabel,
  recruitChannelOf,
  recruitChannelEvidence,
  F,
  hasCode,
  installCatalog,
} from "./catalog.ts";
import { STATUSES, APPLIED_STATUSES, isStatus } from "../shared/types.ts";
import type { CompanyRow, Status, StatusMap } from "../shared/types.ts";
import { Progress } from "./progress.ts";
import { statusApi } from "./api.ts";
import { sessionFromPage } from "./session.ts";
import { mountModelSettings } from "./model-settings.ts";
import { mountUpdates } from "./updates.ts";
const session = sessionFromPage();
mountModelSettings(session);
mountUpdates(session, () => { void initBackend(); });
// Download links cannot send custom headers, so bind them through a non-secret profile ID.
document
  .querySelectorAll<HTMLAnchorElement>('a[href^="/api/backup"]')
  .forEach((link) => {
    const url = new URL(link.href);
    url.searchParams.set("profileId", session.profileId);
    link.href = url.href;
  });
let catalogReady = false;
let connecting = false;
let state: StatusMap = {};
let filterCat = "all",
  filterOwnership = "all",
  filterChannel = "all",
  filterStatus = "all",
  onlyCode = false,
  onlyRecent = false,
  groupBy = "dl",
  query = "",
  sortOrder = "deadline",
  onlySoon = false;
let backend = "local";
const foldedGroups = new Set(["dl:past"]);
let detailName = "",
  detailOpener: HTMLElement | null = null;
const STATUS_VIEWS = [
  ["all", "全部公司", "▦"],
  ["todo", "待投递", "○"],
  ["applied", "已投递", "✓"],
  ["interview", "面试中", "◷"],
  ["unsuitable", "无合适岗位", "−"],
];
const progress = new Progress(statusApi(session), (message) => {
  const nextBackend = progress.ready && catalogReady ? "sqlite" : "local";
  const changed = state !== progress.state || backend !== nextBackend;
  state = progress.state;
  backend = nextBackend;
  // A save acknowledgement must not replace the select currently used by the user.
  if (changed) render();
  note(message);
});
window.addEventListener("beforeunload", (e) => {
  if (progress.dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
function note(t: string) {
  const el = element("savenote");
  el.textContent = t;
  el.dataset.kind! = /失败|未连接/.test(t)
    ? "error"
    : /正在|连接中/.test(t)
      ? "saving"
      : "ready";
  const detailNote = element("detail-save-note");
  if (detailNote) {
    detailNote.textContent = t;
    detailNote.style.color =
      el.dataset.kind! === "error" ? "var(--alarm)" : "var(--muted)";
  }
  element("retry-connection").hidden = !/未连接/.test(t);
}
function save(name: string) {
  progress.set(name, state[name]);
}
async function initBackend() {
  if (connecting || progress.dirty) return;
  connecting = true;
  try {
    note("正在连接公司目录…");
    const changed = installCatalog(await session.read("/api/catalog"));
    catalogReady = true;
    if (changed) {
      buildFilters();
      render();
    }
    await progress.connect();
  } catch {
    catalogReady = false;
    backend = "local";
    render();
    note("公司目录未连接，请重试；若切换了资料，请重新打开窗口");
  } finally {
    connecting = false;
  }
}
window.addEventListener("focus", () => {
  if (document.activeElement?.tagName !== "SELECT") void initBackend();
});

function groupOf(row: CompanyRow) {
  return selectGroup(row, groupBy);
}
function groupList() {
  return selectGroups(groupBy);
}
function sortedRows(rows: CompanyRow[]) {
  return sortRows(rows, sortOrder);
}
function matches(row: CompanyRow) {
  return matchesRow(row, {
    state,
    filterStatus,
    onlySoon,
    onlyCode,
    onlyRecent,
    filterCat,
    filterOwnership,
    filterChannel,
    query,
  });
}
function esc(s: unknown) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function entryLink(r: CompanyRow, className = "") {
  const u = r[F.url] || "";
  if (!/^https?:\/\//.test(u) && !/^mailto:/.test(u))
    return '<span class="sub">见详情</span>';
  const mail = /^mailto:/.test(u),
    label = /bing\.com\/search/.test(u)
      ? "查入口 ↗"
      : mail
        ? "邮件投递 ↗"
        : "去官网 ↗";
  return (
    '<a class="' +
    esc(className) +
    '" href="' +
    esc(u) +
    '"' +
    (mail ? "" : ' target="_blank" rel="noopener noreferrer"') +
    ">" +
    label +
    "</a>"
  );
}
function statusSelect(name: string, s: Status) {
  return (
    '<select class="st"' +
    (backend !== "sqlite" ? " disabled" : "") +
    ' data-name="' +
    esc(name) +
    '" data-v="' +
    esc(s) +
    '" aria-label="' +
    esc(name) +
    ' 投递状态">' +
    STATUSES.map(
      (o) => "<option" + (o === s ? " selected" : "") + ">" + o + "</option>",
    ).join("") +
    "</select>"
  );
}
function codeButton(r: CompanyRow) {
  return hasCode(r)
    ? '<button class="code" type="button" data-code="' +
        esc(r[F.code]) +
        '" aria-label="复制推荐码 ' +
        esc(r[F.code]) +
        '">' +
        esc(r[F.code]) +
        "</button>"
    : '<span class="code nocode">' + esc(r[F.code] || "暂无公开码") + "</span>";
}
function deadlineLabel(r: CompanyRow) {
  const d = daysLeft(r[F.dl]);
  if (d === null) return r[F.dlTxt] || "未标截止";
  if (d < 0) return r[F.dl].slice(5) + " 已过期";
  if (d === 0) return "今天截止";
  return r[F.dl].slice(5) + (d <= 14 ? " · 剩 " + d + " 天" : " 截止");
}
function rowHtml(r: CompanyRow) {
  const name = r[F.n],
    s = state[name] || "未投",
    d = daysLeft(r[F.dl]),
    added = APPEND_DATES.get(name);
  const done = ["Offer", "结束", "无合适岗位"].includes(s) ? " done" : "",
    badge = added
      ? '<span class="added-badge">' + esc(added.slice(5)) + " 新增</span>"
      : "";
  return (
    '<article class="row' +
    done +
    '" data-id="' +
    esc(name) +
    '" data-category="' +
    esc(r[F.cat]) +
    '" aria-label="' +
    esc(name) +
    '">' +
    '<div class="co"><div class="company-title"><span class="company-initial" aria-hidden="true">' +
    esc(Array.from(name)[0]) +
    '</span><div class="name-block">' +
    '<button class="company-name" type="button" data-detail="' +
    esc(name) +
    '" aria-label="查看 ' +
    esc(name) +
    ' 详情" title="' +
    esc(name) +
    '">' +
    esc(name) +
    "</button>" +
    badge +
    '<div class="company-meta">' +
    esc(classificationLabel(r)) +
    '</div></div></div><div class="rl" title="' +
    esc(r[F.roles]) +
    '">' +
    esc(r[F.roles]) +
    "</div></div>" +
    '<div class="codewrap">' +
    codeButton(r) +
    '</div>' +
    '<div class="cell-when' +
    (d !== null && d >= 0 && d <= 7 ? " soon" : "") +
    '"><span class="cityline" title="' +
    esc(r[F.city]) +
    '">' +
    esc(r[F.city] || "城市未注明") +
    '</span><span class="deadline">' +
    esc(deadlineLabel(r)) +
    "</span></div>" +
    '<div class="cell-st">' +
    statusSelect(name, s) +
    '<div class="links">' +
    entryLink(r) +
    "</div></div></article>"
  );
}
function visibleRows() {
  const rows = DATA.filter(matches);
  return groupList().flatMap(([g]) =>
    sortedRows(rows.filter((r) => groupOf(r) === g)),
  );
}
function detailHtml(r: CompanyRow) {
  const name = r[F.n],
    s = state[name] || "未投",
    search =
      "https://www.bing.com/search?q=" +
      encodeURIComponent(name + " 2027届校园招聘 内推");
  const rows = visibleRows(),
    idx = rows.findIndex((x) => x[F.n] === name),
    added = APPEND_DATES.get(name);
  return (
    '<h2 id="detail-title">' +
    esc(name) +
    '</h2><p class="intro">' +
    esc(r[F.roles]) +
    "</p>" +
    '<dl class="detail-properties"><dt>公司性质</dt><dd>' +
    esc(OWNERSHIPNAME[ownershipOf(r)]) +
    "</dd><dt>行业方向</dt><dd>" +
    esc(CATNAME[r[F.cat]]) +
    "</dd><dt>工作城市</dt><dd>" +
    esc(r[F.city] || "未注明") +
    "</dd><dt>截止信息</dt><dd>" +
    esc(r[F.dlTxt] || r[F.dl] || "未标截止日期") +
    "</dd>" +
    (added ? "<dt>收录日期</dt><dd>" + esc(added) + "</dd>" : "") +
    "</dl>" +
    '<div class="detail-actions"><label>投递状态 ' +
    statusSelect(name, s) +
    "</label>" +
    entryLink(r, "action primary") +
    "</div>" +
    '<h3>推荐码与核验说明</h3><div class="detail-code">' +
    codeButton(r) +
    "<small>公开线索，投递前核对适用批次</small></div>" +
    "<p>" +
    esc(r[F.alt] || "未记录进一步的推荐码说明，请以官方申请表识别结果为准。") +
    '</p><a class="action" href="' +
    esc(search) +
    '" target="_blank" rel="noopener noreferrer">查找内推来源 ↗</a>' +
    '<section class="detail-note"><h3>投递提示 · 完整备注</h3><p>' +
    esc(r[F.note] || "暂无补充备注。请核实岗位要求、届别和毕业时间窗口。") +
    "</p></section>" +
    (recruitChannelOf(r) !== "none"
      ? '<section class="detail-note"><h3>国有体系招聘渠道</h3><p>' +
        esc(RECRUIT_CHANNEL_NAME[recruitChannelOf(r)]) +
        "\n" +
        esc(recruitChannelEvidence(r)) +
        "</p></section>"
      : "") +
    '<div class="detail-navigation"><span>' +
    (idx < 0
      ? "此公司已不在当前筛选中"
      : "当前筛选中的 " + (idx + 1) + " / " + rows.length + " 家") +
    '</span><div><button class="action" type="button" data-detail-step="-1"' +
    (idx <= 0 ? " disabled" : "") +
    ' aria-label="上一家公司">←</button> <button class="action" type="button" data-detail-step="1"' +
    (idx < 0 || idx >= rows.length - 1 ? " disabled" : "") +
    ">下一家 →</button></div></div>"
  );
}
function openDetail(name: string, opener: HTMLElement | null, direction = 1) {
  const row = DATA.find((r) => r[F.n] === name);
  if (!row) return;
  detailName = name;
  if (opener) detailOpener = opener;
  element("detail-content").innerHTML = detailHtml(row);
  const dialog = element<HTMLDialogElement>("company-detail");
  if (!dialog.open) {
    dialog.showModal();
    element("close-detail").focus();
  } else {
    const next = dialog.querySelector<HTMLElement>(
      '[data-detail-step="' + direction + '"]:not(:disabled)',
    );
    (next || element("close-detail")).focus();
  }
  dialog.scrollTop = 0;
}
function syncFilters() {
  const selected: string[] = [],
    add = (key: string, title: string) =>
      selected.push(
        '<button class="filter-token" type="button" data-remove-filter="' +
          key +
          '" aria-label="移除' +
          esc(title) +
          '筛选">' +
          esc(title) +
          '<span aria-hidden="true">×</span></button>',
      );
  if (filterStatus !== "all")
    add(
      "status",
      STATUS_VIEWS.find((x) => x[0] === filterStatus)?.[1] ?? filterStatus,
    );
  if (filterOwnership !== "all") add("owner", OWNERSHIPNAME[filterOwnership]);
  if (filterCat !== "all") add("cat", CATNAME[filterCat]);
  if (filterChannel !== "all")
    add("channel", RECRUIT_CHANNEL_NAME[filterChannel]);
  if (onlyCode) add("code", "有推荐码");
  if (onlyRecent) add("recent", "最近新增");
  if (onlySoon) add("soon", "7 天内截止");
  if (query)
    add("query", "搜索：" + element<HTMLInputElement>("q").value.trim());
  element("active-filters").innerHTML = selected.length
    ? selected.join("") +
      '<button class="text-button" id="reset-filters" type="button">清空筛选</button>'
    : '';
  element("active-filters").hidden = selected.length === 0;
  const advancedCount = [filterOwnership, filterCat, filterChannel].filter(value => value !== "all").length;
  element("filter-count").textContent = String(advancedCount);
  element("filter-count").hidden = advancedCount === 0;
  element("clear-search").hidden = !element<HTMLInputElement>("q").value;
  element<HTMLSelectElement>("group-select").value = groupBy;
  element<HTMLSelectElement>("sort-order").value = sortOrder;
  element("owner-label").textContent =
    filterOwnership === "all" ? "公司性质" : OWNERSHIPNAME[filterOwnership];
  element("industry-label").textContent =
    filterCat === "all" ? "行业方向" : CATNAME[filterCat].split(" · ")[0];
  element("channel-label").textContent =
    filterChannel === "all" ? "国企渠道" : RECRUIT_CHANNEL_NAME[filterChannel];
  for (const [attr, value] of [
    ["status", filterStatus],
    ["owner", filterOwnership],
    ["cat", filterCat],
    ["channel", filterChannel],
  ])
    document
      .querySelectorAll<HTMLElement>("[data-" + attr + "]")
      .forEach((el) =>
        el.setAttribute("aria-pressed", String(el.dataset[attr] === value)),
      );
  for (const [id, on] of [
    ["code-chip", onlyCode],
    ["recent-chip", onlyRecent],
    ["soon-chip", onlySoon],
  ] as const)
    element(id).setAttribute("aria-pressed", String(on));
  element("summary-soon").setAttribute("aria-pressed", String(onlySoon));
  element("summary-code").setAttribute("aria-pressed", String(onlyCode));
}

function summarizeRows(rows: CompanyRow[]) {
  const result = { total: rows.length, soon: 0, codes: 0, offers: 0 };
  for (const r of rows) {
    const d = daysLeft(r[F.dl]);
    if (d !== null && d >= 0 && d <= 7) result.soon++;
    if (hasCode(r)) result.codes++;
    if (state[r[F.n]] === "Offer") result.offers++;
  }
  return result;
}
function stats() {
  const sent = DATA.filter((r) => APPLIED_STATUSES.has(state[r[F.n]])).length;
  const { soon, codes, offers } = summarizeRows(DATA.filter(matches));
  element("s-all").textContent = String(DATA.length);
  element("h-count").textContent = String(DATA.length);
  element("s-code").textContent = String(codes);
  element("s-soon").textContent = String(soon);
  element("s-sent").textContent = String(sent);
  element("s-offer").textContent = String(offers);
  element("s-bar").style.width =
    (DATA.length ? (sent / DATA.length) * 100 : 0) + "%";
}

function render() {
  const board = element("board"),
    buckets = new Map();
  let html = "",
    shown = 0;
  for (const r of DATA) {
    if (!matches(r)) continue;
    const g = groupOf(r);
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g).push(r);
  }
  for (const [key, title, hint] of groupList()) {
    const unsorted = buckets.get(key);
    if (!unsorted?.length) continue;
    const rows = sortedRows(unsorted);
    shown += rows.length;
    const foldKey = groupBy + ":" + key,
      folded = foldedGroups.has(foldKey) && !query;
    html +=
      '<section class="sec' +
      (folded ? " is-folded" : "") +
      '"><div class="sec-head' +
      (key === "w1" ? " hot" : "") +
      '"><button class="fold-group" type="button" data-fold="' +
      esc(foldKey) +
      '" aria-expanded="' +
      !folded +
      '" aria-label="' +
      (folded ? "展开" : "收起") +
      esc(title) +
      '"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><h2>' +
      esc(title) +
      '</h2><span class="cnt">' +
      rows.length +
      "</span>" +
      (hint ? '<span class="hint">' + esc(hint) + "</span>" : "") +
      "</div>" +
      '<div class="column-head" aria-hidden="true"><span>公司与岗位</span><span title="公开来源，使用前请核实适用批次">公开推荐码</span><span class="deadline-label">城市 / 截止</span><span>投递进度</span></div>' +
      rows.map(rowHtml).join("") +
      "</section>";
  }
  board.innerHTML = shown
    ? html
    : !catalogReady
      ? '<div class="empty" role="status"><h2>公司目录尚未连接</h2><p>连接完成后会显示清单。连接失败时请使用上方「重连」，不会用旧清单替代。</p></div>'
      : '<div class="empty"><div class="empty-symbol" aria-hidden="true">⌕</div><h2>这一组，还没有匹配的公司</h2><p>试试移除一个筛选条件，或换个公司名。你的投递记录都还在。</p><button class="action primary" type="button" data-reset-filters>清空全部筛选</button></div>';
  element("result-count").textContent =
    "显示 " + shown + " / " + DATA.length + " 家公司";
  stats();
  syncFilters();
  const detailStatus = document.querySelector<HTMLSelectElement>(
    "#company-detail[open] select.st",
  );
  if (detailStatus) {
    detailStatus.value = state[detailStatus.dataset.name!] || "未投";
    detailStatus.dataset.v! = detailStatus.value;
    const visible = visibleRows(),
      idx = visible.findIndex((r) => r[F.n] === detailName),
      nav = document.querySelector<HTMLElement>(
        "#company-detail .detail-navigation",
      );
    if (nav) {
      required<HTMLButtonElement>("span", nav).textContent =
        idx < 0
          ? "此公司已不在当前筛选中"
          : "当前筛选中的 " + (idx + 1) + " / " + visible.length + " 家";
      required<HTMLButtonElement>('[data-detail-step="-1"]', nav).disabled =
        idx <= 0;
      required<HTMLButtonElement>('[data-detail-step="1"]', nav).disabled =
        idx < 0 || idx >= visible.length - 1;
    }
  }
  document
    .querySelectorAll<HTMLElement>("[data-count-status]")
    .forEach((el) => {
      const k = el.dataset.countStatus!;
      el.textContent = String(
        DATA.filter((r) => {
          const s = state[r[F.n]] || "未投";
          return (
            k === "all" ||
            (k === "todo" && s === "未投") ||
            (k === "applied" && APPLIED_STATUSES.has(s)) ||
            (k === "interview" && s === "面试") ||
            (k === "unsuitable" && s === "无合适岗位")
          );
        }).length,
      );
    });
}
function buildFilters() {
  element("filters").innerHTML = [["all", "全部行业"], ...CATS]
    .map(
      ([k, t]) =>
        '<button class="chip" type="button" data-cat="' +
        k +
        '" aria-pressed="' +
        (k === filterCat) +
        '">' +
        t.split(" · ")[0] +
        '<span class="n">' +
        DATA.filter((r) => k === "all" || r[F.cat] === k).length +
        "</span></button>",
    )
    .join("");
  element("ownership-filters").innerHTML = [["all", "全部性质"], ...OWNERSHIPS]
    .map(
      ([k, t]) =>
        '<button class="chip" type="button" data-owner="' +
        k +
        '" aria-pressed="' +
        (k === filterOwnership) +
        '">' +
        t +
        '<span class="n">' +
        DATA.filter((r) => k === "all" || ownershipOf(r) === k).length +
        "</span></button>",
    )
    .join("");
  element("channel-filters").innerHTML = [
    ["all", "全部渠道"],
    ...RECRUIT_CHANNELS,
  ]
    .map(
      ([k, t]) =>
        '<button class="chip" type="button" data-channel="' +
        k +
        '" aria-pressed="' +
        (k === filterChannel) +
        '">' +
        t +
        '<span class="n">' +
        DATA.filter((r) =>
          k === "all" ? ownershipOf(r) === "state" : recruitChannelOf(r) === k,
        ).length +
        "</span></button>",
    )
    .join("");
  element("status-filters").innerHTML = STATUS_VIEWS.map(
    ([k, t, icon]) =>
      '<button class="chip" type="button" data-status="' +
      k +
      '" aria-pressed="' +
      (k === filterStatus) +
      '"><span class="nav-icon" aria-hidden="true">' +
      icon +
      "</span>" +
      t +
      '<span class="n" data-count-status="' +
      k +
      '"></span></button>',
  ).join("");
  element("quick-filters").innerHTML =
    '<button class="chip" id="soon-chip" type="button" aria-pressed="false"><span class="nav-icon" aria-hidden="true">◴</span>7 天内截止</button><button class="chip" id="recent-chip" type="button" aria-pressed="false"><span class="nav-icon" aria-hidden="true">✧</span>最近新增<span class="n">' +
    APPEND_DATES.size +
    '</span></button><button class="chip" id="code-chip" type="button" aria-pressed="false"><span class="nav-icon" aria-hidden="true">⌘</span>有推荐码</button>';
}

document.addEventListener("change", (e) => {
  if (!(e.target instanceof HTMLSelectElement)) return;
  if (e.target.id === "group-select") {
    groupBy = e.target.value;
    render();
    return;
  }
  if (e.target.id === "sort-order") {
    sortOrder = e.target.value;
    render();
    return;
  }
  const sel = e.target.closest<HTMLSelectElement>("select.st");
  if (!sel) return;
  const name = sel.dataset.name;
  if (!name || !isStatus(sel.value)) return;
  if (backend !== "sqlite") {
    sel.value = state[name] || "未投";
    return;
  }
  const inDetail = !!sel.closest<HTMLElement>("#company-detail");
  state[name] = sel.value;
  save(name);
  render();
  if (inDetail) {
    sel.value = state[name];
    sel.dataset.v! = sel.value;
    sel.focus();
  } else {
    const next =
      Array.from(
        document.querySelectorAll<HTMLSelectElement>("#board select.st"),
      ).find((s) => s.dataset.name! === name) ||
      document.querySelector<HTMLElement>("#board button.company-name") ||
      element<HTMLInputElement>("q");
    next.focus();
  }
});
document.addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  const summary = e.target.closest<HTMLElement>("[data-summary-filter]");
  if (summary) {
    if (summary.dataset.summaryFilter! === "soon") onlySoon = !onlySoon;
    else if (summary.dataset.summaryFilter! === "code") onlyCode = !onlyCode;
    render();
    return;
  }
  const detail = e.target.closest<HTMLElement>("[data-detail]");
  if (detail) {
    openDetail(detail.dataset.detail!, detail);
    return;
  }
  const step = e.target.closest<HTMLElement>("[data-detail-step]");
  if (step) {
    const direction = Number(step.dataset.detailStep!),
      rows = visibleRows(),
      idx = rows.findIndex((r) => r[F.n] === detailName) + direction;
    if (rows[idx]) openDetail(rows[idx][F.n], null, direction);
    return;
  }
  const fold = e.target.closest<HTMLElement>("[data-fold]");
  if (fold) {
    const closed = fold.getAttribute("aria-expanded") === "true";
    closed
      ? foldedGroups.add(fold.dataset.fold!)
      : foldedGroups.delete(fold.dataset.fold!);
    fold.closest<HTMLElement>(".sec")!.classList.toggle("is-folded", closed);
    fold.setAttribute("aria-expanded", String(!closed));
    fold.setAttribute(
      "aria-label",
      (closed ? "展开" : "收起") +
        fold
          .closest<HTMLElement>(".sec-head")!
          .querySelector<HTMLElement>("h2")!.textContent,
    );
    return;
  }
  if (
    e.target.closest<HTMLElement>("[data-reset-filters],#reset-filters,.brand")
  ) {
    e.preventDefault();
    resetFilters();
    return;
  }
  const remove = e.target.closest<HTMLElement>("[data-remove-filter]");
  if (remove) {
    const k = remove.dataset.removeFilter!;
    if (k === "status") filterStatus = "all";
    if (k === "owner") {
      filterOwnership = "all";
      filterChannel = "all";
    }
    if (k === "cat") filterCat = "all";
    if (k === "channel") filterChannel = "all";
    if (k === "code") onlyCode = false;
    if (k === "recent") onlyRecent = false;
    if (k === "soon") onlySoon = false;
    if (k === "query") {
      query = "";
      element<HTMLInputElement>("q").value = "";
    }
    render();
    return;
  }
  const cb = e.target.closest<HTMLElement>("button.code");
  if (cb) {
    const txt = cb.dataset.code!,
      done = () => {
        cb.classList.add("copied");
        toast("已复制 " + txt);
        setTimeout(() => cb.classList.remove("copied"), 1300);
      },
      failed = () => toast("复制失败，请选中推荐码后按 Ctrl+C 复制");
    if (navigator.clipboard?.writeText)
      navigator.clipboard.writeText(txt).then(done).catch(failed);
    else {
      try {
        const ta = document.createElement("textarea");
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        const copied = document.execCommand("copy");
        ta.remove();
        copied ? done() : failed();
      } catch (err) {
        failed();
      }
    }
    return;
  }
  const chip = e.target.closest<HTMLElement>(".chip");
  if (chip) {
    if (chip.id === "code-chip") onlyCode = !onlyCode;
    else if (chip.id === "recent-chip") onlyRecent = !onlyRecent;
    else if (chip.id === "soon-chip") onlySoon = !onlySoon;
    else if (chip.dataset.owner!) {
      filterOwnership = chip.dataset.owner!;
      if (filterOwnership !== "state") filterChannel = "all";
    } else if (chip.dataset.channel!) {
      filterChannel = chip.dataset.channel!;
      if (filterChannel !== "all") filterOwnership = "state";
    } else if (chip.dataset.status!) filterStatus = chip.dataset.status!;
    else if (chip.dataset.cat!) filterCat = chip.dataset.cat!;
    else return;
    const menu = chip.closest<HTMLDetailsElement>("details.filter-menu");
    if (menu) {
      menu.open = false;
      menu.querySelector<HTMLElement>("summary")!.focus();
    }
    render();
    return;
  }
  document
    .querySelectorAll<HTMLDetailsElement>(
      "details.filter-menu[open],details.menu[open]",
    )
    .forEach((menu) => {
      if (!menu.contains(e.target as Node)) menu.open = false;
    });
});
document
  .querySelectorAll<HTMLDetailsElement>("details.filter-menu,details.menu")
  .forEach((menu) =>
    menu.addEventListener("toggle", () => {
      if (menu.open)
        document
          .querySelectorAll<HTMLDetailsElement>(
            "details.filter-menu[open],details.menu[open]",
          )
          .forEach((other) => {
            if (other !== menu) other.open = false;
          });
    }),
  );
element<HTMLInputElement>("q").addEventListener("input", (e) => {
  query = element<HTMLInputElement>("q").value.trim().toLowerCase();
  render();
});
element("clear-search").addEventListener("click", () => {
  query = "";
  element<HTMLInputElement>("q").value = "";
  render();
  element<HTMLInputElement>("q").focus();
});
element("btn-csv").addEventListener("click", () => exportCsv(state));
element("btn-sql").addEventListener("click", () => exportSql(state));
function resetFilters() {
  filterCat = filterOwnership = filterChannel = filterStatus = "all";
  query = "";
  onlyCode = onlyRecent = onlySoon = false;
  element<HTMLInputElement>("q").value = "";
  render();
}
let toastTimer: ReturnType<typeof setTimeout>;
function toast(message: string) {
  element("toast").hidden = true;
  element("detail-toast").hidden = true;
  const el = element(
    element<HTMLDialogElement>("company-detail").open
      ? "detail-toast"
      : "toast",
  );
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3500);
}
element("toggle-filters").addEventListener("click", (e) => {
  const panel = required(".controls"),
    expanded = panel.dataset.collapsed! === "true";
  panel.dataset.collapsed! = String(!expanded);
  (e.currentTarget as HTMLElement).setAttribute(
    "aria-expanded",
    String(expanded),
  );
  (e.currentTarget as HTMLElement).textContent = expanded
    ? "收起视图"
    : "展开视图";
});
element("retry-connection").addEventListener("click", initBackend);
element("close-detail").addEventListener("click", () =>
  element<HTMLDialogElement>("company-detail").close(),
);
element<HTMLDialogElement>("company-detail").addEventListener("click", (e) => {
  if (
    e.target === (e.currentTarget as HTMLElement) &&
    e.clientX < (e.currentTarget as HTMLElement).getBoundingClientRect().left
  )
    element<HTMLDialogElement>("company-detail").close();
});
element<HTMLDialogElement>("company-detail").addEventListener("close", () => {
  if (detailOpener?.isConnected) detailOpener.focus();
  else {
    const b = Array.from(
      document.querySelectorAll<HTMLElement>("button.company-name"),
    ).find((b) => b.dataset.detail! === detailName);
    (b || element<HTMLInputElement>("q")).focus();
  }
  detailName = "";
});
element("open-help").addEventListener("click", () => {
  const help = required<HTMLDetailsElement>("footer details");
  help.open = true;
  help.scrollIntoView({ block: "start" });
  help.querySelector<HTMLElement>("summary")!.focus();
});
document.addEventListener("keydown", (e) => {
  if (!(e.target instanceof HTMLElement)) return;
  if (e.key === "Escape" && !element<HTMLDialogElement>("company-detail").open)
    document
      .querySelectorAll<HTMLDetailsElement>(
        "details.filter-menu[open],details.menu[open]",
      )
      .forEach((menu) => {
        menu.open = false;
        menu.querySelector<HTMLElement>("summary")!.focus();
      });
  if (
    e.key === "/" &&
    !required<HTMLElement>(".main-shell > .content").hidden &&
    !element<HTMLDialogElement>("company-detail").open &&
    !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) &&
    !e.target.isContentEditable
  ) {
    e.preventDefault();
    element<HTMLInputElement>("q").focus();
  }
});
function setDensity(compact: boolean) {
  document.body.dataset.density! = compact ? "compact" : "comfortable";
  const b = element("density-toggle");
  b.setAttribute("aria-pressed", String(compact));
  b.textContent = compact ? "切换机会卡片" : "切换紧凑清单";
  try {
    localStorage.setItem(
      "qiuzhao-density",
      compact ? "compact" : "comfortable",
    );
  } catch (e) {}
}
try {
  const t = localStorage.getItem("qiuzhao-theme");
  document.documentElement.dataset.theme! = t === "dark" ? "dark" : "light";
  if (localStorage.getItem("qiuzhao-density") === "compact") setDensity(true);
} catch (e) {
  document.documentElement.dataset.theme! = "light";
}
element("density-toggle").addEventListener("click", () =>
  setDensity(document.body.dataset.density !== "compact"),
);
element("theme-toggle").addEventListener("click", () => {
  const root = document.documentElement,
    dark = root.dataset.theme! === "dark";
  root.dataset.theme! = dark ? "light" : "dark";
  try {
    localStorage.setItem("qiuzhao-theme", root.dataset.theme!);
  } catch (e) {}
  toast(dark ? "已切换浅色主题" : "已切换深色主题");
});
buildFilters();
render();
initBackend();
