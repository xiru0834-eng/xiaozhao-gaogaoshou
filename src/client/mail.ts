import type { DataSession } from "./session.ts";
import type { MailCandidate, MailMessage } from "../shared/mail-contract.ts";
import "./mail.css";
import {renderMailTaskReview} from './mail-task-review.ts';
const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const states = {
  queued: "待分析",
  review: "待核对",
  confirmed: "已记录",
  ignored: "已忽略",
  failed: "分析失败",
  confirming: "保存恢复中",
};
export function mountMail(session: DataSession) {
  const launch = document.createElement("button");
  launch.className = "action";
  launch.id = "open-mail";
  launch.textContent = "邮件待确认";
  document.querySelector(".schedule-actions")!.prepend(launch);
  const dialog = document.createElement("dialog");
  dialog.className = "mail-dialog";
  dialog.setAttribute("aria-labelledby", "mail-title");
  dialog.innerHTML = `<header class="mail-head"><div><h2 id="mail-title">邮件任务助手</h2><p>把面试、笔试和测评通知拆成任务，核对后安排。</p></div><button class="action" data-m="close" aria-label="关闭邮件助手">关闭</button></header>
 <div class="mail-scroll"><details class="mail-settings"><summary>邮箱连接与隐私设置 <span data-m="account-count">尚未连接</span></summary>
 <p>只读收件箱近 30 天、最近 100 封的招聘相关邮件；不发送邮件、不标已读、不访问邮件链接。学校邮箱可能需要管理员授权。</p>
 <div data-m="accounts" class="mail-accounts"></div>
 <div class="mail-connect"><form data-m="qq"><h3>QQ 邮箱</h3><label>QQ／foxmail 地址<input name="email" type="email" required autocomplete="off" placeholder="你的邮箱地址"></label><label>IMAP 授权码<input name="password" type="password" required autocomplete="off" maxlength="16" placeholder="在 QQ 邮箱设置中开启 IMAP 后获取"></label><button class="action" type="submit">连接 QQ</button></form>
 <form data-m="outlook"><h3>Outlook</h3><label>账号类型<select name="kind"><option value="personal">个人 Outlook／Hotmail</option><option value="school">学校／工作 Microsoft 365</option></select></label><label>Microsoft 应用 Client ID<input name="clientId" required autocomplete="off" placeholder="你注册的公共客户端应用 ID"></label><button class="action" type="submit">开始微软授权</button><small>应用注册需开启公共客户端流；个人账号需支持个人 Microsoft 账户。无需 Client Secret。</small></form></div>
 <div data-m="auth" class="mail-auth" role="status"></div>
 <div class="mail-consent"><strong>模型分析需要单独授权</strong><p data-m="model"></p><label><input type="checkbox" data-m="consent">允许将上述邮箱中招聘相关邮件的标题、发件人、时间及正文发送给当前模型服务。附件不发送。</label><label><input type="checkbox" data-m="automatic">软件运行时，每 10 分钟同步并分析最多 3 封；每日最多 30 次。关闭软件后不运行。</label><button class="action" data-m="save-consent">保存分析授权</button></div></details>
 <div class="mail-tools"><div><button class="action primary" data-m="sync">同步并分析</button><button class="action" data-m="paste-toggle">粘贴一封邮件</button><button class="action" data-m="refresh">刷新</button></div><label>筛选 <select data-m="filter"><option value="pending">待处理</option><option value="all">全部邮件</option><option value="confirmed">已记录</option><option value="ignored">已忽略</option></select></label></div>
 <p data-m="feedback" class="mail-feedback" role="status" aria-live="polite"></p>
 <form data-m="paste" class="mail-paste" hidden><h3>粘贴招聘通知</h3><p>可先用一封邮件验证分析效果，无需连接邮箱。正文只在你点击分析后发送给已授权模型。</p><label>邮件标题<input name="subject" required maxlength="500"></label><label>收信时间（本机时区）<input type="datetime-local" name="receivedAt" required></label><label>邮件正文<textarea name="text" required maxlength="12000" rows="6"></textarea></label><button class="action" type="submit">保存到待分析</button></form>
 <div class="mail-columns"><nav data-m="list" class="mail-list" aria-label="邮件列表"></nav><section data-m="detail" class="mail-detail" aria-label="邮件核对"><div class="mail-empty"><h3>先选一封邮件</h3><p>模型帮你提取信息，最终时间由你确认。</p></div></section></div>
 <footer class="mail-foot"><span>确认前不改日历 · 本机加密保存原文与邮箱凭据</span><button class="schedule-link" data-m="purge">清理已处理邮件缓存</button></footer></div>`;
  document.body.append(dialog);
  const node = <T extends HTMLElement = HTMLElement>(key: string) =>
    dialog.querySelector<T>(`[data-m="${key}"]`)!;
  let data: any = null,
    selected = "",
    lastState = "",
    busy = false,
    timer: ReturnType<typeof setInterval> | null = null;
  let edited = false;
  const feedback = (s: string) => {
    node("feedback").textContent = s;
  };
  async function request(value: any) {
    return session.mailRequest(value);
  }
  function list() {
    const filter = node<HTMLSelectElement>("filter").value;
    const candidates = (data?.candidates ?? []) as MailCandidate[];
    const visible = candidates.filter((c) =>
      filter === "all" || filter === "pending"
        ? !["confirmed", "ignored"].includes(c.state) || filter === "all"
        : c.state === filter,
    );
    node("list").innerHTML = visible.length
      ? visible
          .map(
            (c) =>
              `<button data-id="${esc(c.id)}" aria-current="${c.id === selected ? "true" : "false"}"><span>${states[c.state]}</span><strong>${esc(c.subject || "无主题")}</strong><small>${esc(new Date(c.createdAt).toLocaleDateString())}${c.extraction?.uncertainties.length ? " · 有待核实项" : ""}</small></button>`,
          )
          .join("")
      : '<div class="mail-empty"><h3>没有待处理邮件</h3><p>连接邮箱后同步，或粘贴一封通知试试。</p></div>';
    launch.textContent = `邮件待确认${candidates.filter((c) => !["confirmed", "ignored"].includes(c.state)).length ? " · " + candidates.filter((c) => !["confirmed", "ignored"].includes(c.state)).length : ""}`;
  }
  function renderSettings() {
    node("account-count").textContent = `已连接 ${data.accounts.length} 个邮箱`;
    node("accounts").innerHTML = data.accounts
      .map(
        (a: any) =>
          `<div><span>${esc(a.label)} · ${a.kind === "qq" ? "QQ" : "Outlook"}</span><button class="schedule-link" data-disconnect="${esc(a.id)}">断开</button></div>`,
      )
      .join("");
    node("model").textContent = data.model.configured
      ? `当前模型：${data.model.name} · ${data.model.endpoint}`
      : (data.model.error || "尚未配置模型。请先在工作台的“模型设置”中保存并测试连接。");
    node<HTMLInputElement>("consent").checked =
      data.preferences.enabled &&
      data.preferences.endpoint === data.model.endpoint;
    node<HTMLInputElement>("automatic").checked = data.preferences.automatic;
  }
  let jobSignature = "",
    accountSignature = "",
    selectionEpoch = 0;
  async function load(settings = false) {
    data = await session.mailRequest();
    list();
    const nextAccounts = JSON.stringify(data.accounts);
    if (settings || nextAccounts !== accountSignature) renderSettings();
    accountSignature = nextAccounts;
    node<HTMLButtonElement>("sync").disabled =
      data.job.state === "running" || busy;
    const a = data.auth;
    node("auth").innerHTML =
      a.state === "waiting"
        ? `<strong>在微软官方页面输入代码：<code>${esc(a.code)}</code></strong><a href="https://microsoft.com/devicelogin" target="_blank" rel="noopener noreferrer">打开微软登录 ↗</a><button class="schedule-link" data-m="cancel-auth">取消授权</button>`
        : esc(
            a.error ||
              (
                {
                  starting: "正在请求微软授权…",
                  connected: "微软邮箱已连接，可点击同步。",
                  cancelled: "授权已取消。",
                } as any
              )[a.state] ||
              "",
          );
    node("auth")
      .querySelector('[data-m="cancel-auth"]')
      ?.addEventListener("click", () => void act({ action: "cancelAuth" }));
    const nextJob = JSON.stringify(data.job);
    if (nextJob !== jobSignature) {
      feedback(data.job.message);
      jobSignature = nextJob;
    }
    if(data.taskVersion!==2)feedback('当前后台仍是旧版。现有邮件功能保留；使用多事项任务请重新启动 TypeScript 预览服务后刷新。');
    const current = data.candidates.find(
      (c: MailCandidate) => c.id === selected,
    );
    if(selected&&!current&&!edited){selected='';lastState='';node('detail').innerHTML='<div class="mail-empty"><h3>记录已清理</h3><p>已确认的任务仍保存在求职任务中。</p></div>';}
    if (current && (current.state + ':' + JSON.stringify(current.taskAnalysis)) !== lastState && !edited) await show(selected);
  }
  async function act(value: any) {
    if (busy) return;
    busy = true;
    try {
      await request(value);
      await load(true);
    } catch (e) {
      feedback(e instanceof Error ? e.message : "操作失败。");
    } finally {
      busy = false;
      node<HTMLButtonElement>("sync").disabled = data?.job.state === "running";
    }
  }
  async function show(id: string) {
    if (edited && !confirm("有未确认的修改，确定切换邮件？")) return;
    const c: MailCandidate = data.candidates.find(
      (c: MailCandidate) => c.id === id,
    );
    if (!c) return;
    const currentSelection = ++selectionEpoch;
    const source = (await request({ action: "source", id }))
      .source as MailMessage;
    if (currentSelection !== selectionEpoch || !dialog.open) return;
    selected = id;
    lastState = c.state + ':' + JSON.stringify((c as any).taskAnalysis);
    edited = false;
    list();
    const e = c.extraction;
    if(data.taskVersion===2&&((c as any).taskAnalysis || !e)){
      const host=document.createElement('div');node('detail').replaceChildren(host);
      renderMailTaskReview(host,c,source,session,async()=>{await load();await show(id);},()=>{if(close()){const calendar=document.getElementById('open-schedules');if(calendar?.getAttribute('aria-pressed')!=='true')calendar?.click();pageTasks();}});
      return;
    }
    node("detail").innerHTML =
      `<header><span class="mail-state">${states[c.state]}</span><h3>${esc(c.subject)}</h3><p>${esc(source.sender)} · 收信 ${esc(new Date(source.receivedAt).toLocaleString())}</p></header>
  <details class="mail-original" open><summary>邮件原文 · 用于核对</summary><pre>${esc(source.text)}</pre></details>
  ${c.error ? `<p class="mail-warning">${esc(c.error)}</p>` : ""}
  ${e ? `<section class="mail-evidence"><h4>模型识别依据</h4>${e.evidence.map((s) => `<blockquote>${esc(s)}</blockquote>`).join("")}<p>判定：${e.relevant ? "招聘日程" : "非日程"} · ${{ event: "确定安排", deadline: "预约／完成截止", window: "可参加时间窗口" }[e.purpose]} · ${{ create: "新增", update: "改期", cancel: "取消" }[e.action]}</p></section>${e.uncertainties.length ? `<div class="mail-warning"><strong>请重点核对</strong><ul>${e.uncertainties.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}` : ""}
  ${
    c.state === "review" &&
    e?.relevant &&
    e.action === "create" &&
    e.purpose === "event"
      ? `<form class="mail-review" data-m="review"><h4>确认后的日程</h4><p>下方字段可修改。确认前请检查公司、年月日、时区及原文是否一致。</p><div class="mail-fields"><label>公司 *<input name="company" required maxlength="120" value="${esc(e.company)}"></label><label>岗位<input name="role" maxlength="160" value="${esc(e.role)}"></label><label>类型<select name="kind"><option value="interview" ${e.kind === "interview" ? "selected" : ""}>面试</option><option value="written" ${e.kind === "written" ? "selected" : ""}>笔试</option></select></label><label>轮次<input name="round" maxlength="80" value="${esc(e.round)}"></label><label>日期 *<input type="date" name="date" required value="${esc(e.date)}"></label><label>开始时间 *<input type="time" name="time" required value="${esc(e.time)}"></label><label>时区 *<select name="zone" required><option value="">请选择确认后的时区</option>${[
          ["Asia/Shanghai", "北京时间"],
          ["Australia/Sydney", "悉尼时间"],
          ["UTC", "UTC"],
        ]
          .map(
            ([v, n]) =>
              `<option value="${v}" ${v === e.zone ? "selected" : ""}>${n}</option>`,
          )
          .join(
            "",
          )}</select></label><label>地点<input name="location" maxlength="300" value="${esc(e.location)}"></label></div><label>会议／笔试链接<input name="url" type="url" maxlength="2000" value="${esc(e.url)}"></label><label><input type="checkbox" name="verified" required>我已核对邮件原文及时间，确认创建这条日程</label><button class="action primary" type="submit">确认写入日历</button></form>`
      : ""
  }
  <div class="mail-detail-actions">${["queued", "failed", "review"].includes(c.state) ? `<button class="action" data-m="analyze">${e ? "重新分析" : "使用模型分析"}</button><button class="schedule-link" data-m="ignore">忽略这封邮件</button>` : ""}<button class="action" data-m="calendar">查看日历${e && (e.action !== "create" || e.purpose !== "event") ? "，手动处理" : ""}</button></div>`;
    node("detail")
      .querySelector('[data-m="analyze"]')
      ?.addEventListener("click", () => void act({ action: "analyze", id }));
    node("detail")
      .querySelector('[data-m="ignore"]')
      ?.addEventListener("click", () => void act({ action: "ignore", id }));
    node("detail")
      .querySelector('[data-m="calendar"]')
      ?.addEventListener("click", () => {
        if (close()) {
          const calendar = document.getElementById("open-schedules");
          if (calendar?.getAttribute("aria-pressed") !== "true")
            calendar?.click();
        }
      });
    const form = node<HTMLFormElement>("review");
    form?.addEventListener("input", () => {
      edited = true;
    });
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;
      busy = true;
      const submit = form.querySelector<HTMLButtonElement>(
        "button[type=submit]",
      )!;
      submit.disabled = true;
      try {
        const values = Object.fromEntries(new FormData(form));
        delete values.verified;
        const schedules = await session.collectionRequest("/api/schedules");
        const item = {
          ...values,
          id: crypto.randomUUID(),
          endTime: "",
          status: "planned",
          notes: `邮件来源：${source.subject}\n${source.sender}\n${e?.evidence.join("\n") ?? ""}`,
          review: "",
          tasks: [],
        };
        await request({
          action: "confirm",
          id,
          item,
          expectedRevision: schedules.revision,
        });
        edited = false;
        await load();
        await show(id);
        feedback("已写入日历。本次确认不会自动修改投递状态。");
        window.dispatchEvent(new Event("schedules:changed"));
      } catch (error) {
        feedback(
          error instanceof Error ? error.message : "保存失败，请保留输入重试。",
        );
      } finally {
        busy = false;
        submit.disabled = false;
      }
    });
  }
  function close() {
    if (busy) return false;
    if (edited && !confirm("有未确认的修改，确定关闭？")) return false;
    edited = false;
    dialog.close();
    if (timer) clearInterval(timer);
    timer = null;
    return true;
  }
  function pageTasks(){document.querySelector<HTMLButtonElement>('[data-view="tasks"]')?.click();}
  launch.addEventListener("click", () => {
    dialog.showModal();
    void load(true).catch((e) => feedback(e.message));
    timer = setInterval(() => {
      if (!busy) void load().catch((e) => feedback(e.message));
    }, 4000);
  });
  node("close").addEventListener("click", close);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  node("filter").addEventListener("change", list);
  node("list").addEventListener("click", (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-id]")
      ?.dataset.id;
    if (id) void show(id).catch((e) => feedback(e.message));
  });
  node("refresh").addEventListener(
    "click",
    () => void load(true).catch((e) => feedback(e.message)),
  );
  node("sync").addEventListener("click", () => void act({ action: "sync" }));
  node("save-consent").addEventListener(
    "click",
    () =>
      void act({
        action: "consent",
        enabled: node<HTMLInputElement>("consent").checked,
        automatic: node<HTMLInputElement>("automatic").checked,
        endpoint: data?.model.endpoint,
      }),
  );
  node("accounts").addEventListener("click", (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-disconnect]",
    )?.dataset.disconnect;
    if (id && confirm("断开此邮箱并删除本机登录凭据？已识别记录保留。"))
      void act({ action: "disconnect", id });
  });
  for (const key of ["qq", "outlook"])
    node<HTMLFormElement>(key).addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const values = Object.fromEntries(new FormData(form));
      try {
        await act({ action: key, ...values });
      } finally {
        const password = form.elements.namedItem(
          "password",
        ) as HTMLInputElement | null;
        if (password) password.value = "";
      }
    });
  node("paste-toggle").addEventListener("click", () => {
    node("paste").hidden = !node("paste").hidden;
  });
  node<HTMLFormElement>("paste").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget as HTMLFormElement;
    busy = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      const r = await request({
        action: "paste",
        ...values,
        receivedAt: new Date(String(values.receivedAt)).toISOString(),
      });
      form.reset();
      form.hidden = true;
      await load();
      await show(r.id);
      feedback("已保存到待分析。核对授权后点击“使用模型分析”。");
    } catch (error) {
      feedback(error instanceof Error ? error.message : "保存失败。");
    } finally {
      busy = false;
    }
  });
  node("purge").addEventListener("click", () => {
    if (confirm("清理已记录和已忽略邮件的本机原文缓存？任务、来源摘要和日历记录保持不变。"))
      void act({ action: "purge" });
  });
}
