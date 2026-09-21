import { required } from "./dom.ts";
import { moduleIdentity, moduleCompanion } from "./module-identity.ts";
import "./updates.css";
export function updatesView() {
  const page = document.createElement("section"); page.className = "content updates-page"; page.hidden = true;
  page.setAttribute("aria-labelledby", "updates-heading");
  page.innerHTML = `
    <button class="text-button module-back" data-updates="back" type="button">← 返回投递工作台</button>
    <div class="updates-heading module-heading">${moduleIdentity('updates')}<div class="module-heading-copy"><h1 id="updates-heading" tabindex="-1">岗位更新<span>手动采集</span></h1><p>发现新机会，也认真核对每一条来源。</p></div>${moduleCompanion}<button class="action" data-updates="refresh" type="button">刷新记录</button></div>
    <nav class="updates-tabs" aria-label="岗位更新视图"><button type="button" data-view="start" aria-pressed="true">开始检查</button><button type="button" data-view="runs" aria-pressed="false">运行记录</button><button type="button" data-view="jobs" aria-pressed="false">已收录岗位</button></nav>
    <p class="updates-feedback" data-updates="feedback" role="status" aria-live="polite">正在读取本机状态…</p>
    <div data-pane="start" class="updates-setup">
      <section class="updates-sources"><div class="module-section-title"><span aria-hidden="true">01</span><h2>这次检查哪些来源？</h2></div><p class="updates-muted">最多选 3 个。只访问已登记的公开页面，不登录、不绕过验证。</p><div data-updates="sources"></div>
        <div class="updates-controls"><label for="updates-budget">最多模型调用</label><select id="updates-budget" data-updates="budget"><option value="1">1 次</option><option value="2">2 次</option><option value="3">3 次</option></select></div>
        <p class="updates-muted" data-updates="model-note"></p>
        <label class="updates-check"><input type="checkbox" data-updates="consent">我确认发送所选公开岗位正文给当前模型，可能产生费用。不发送简历或个人投递记录。</label>
        <div class="updates-actions"><button class="action primary" data-updates="extract" type="button" disabled>检查并提取</button><button class="action" data-updates="source-only" type="button">只检查来源 · 不调用模型</button></div>
        <p class="updates-muted">每次最多 5 分钟、20 次 HTTP 请求；失败不重试。检查完成不会自动入库，也不会替你投递。</p>
      </section>
      <section class="updates-preferences"><div class="module-section-title"><span aria-hidden="true">02</span><h2>你的匹配条件</h2></div><p class="updates-muted">条件只保存在本机，用规则判断，不交给模型猜。</p>
        <form data-updates="preferences"><fieldset data-updates="preference-fields"><label for="updates-month">预计毕业月份</label><input id="updates-month" data-updates="month" type="month" required min="2000-01" max="2099-12">
          <label for="updates-degree">最高学历</label><select id="updates-degree" data-updates="degree"><option value="master">硕士</option><option value="bachelor">本科</option><option value="doctor">博士</option></select>
          <label for="updates-major">专业</label><input id="updates-major" data-updates="major" required maxlength="80" placeholder="例如：软件工程">
          <label for="updates-cities">意向城市</label><input id="updates-cities" data-updates="cities" maxlength="400" placeholder="留空不限；多个城市用逗号隔开">
          <label class="updates-check"><input type="checkbox" data-updates="internships">同时查看实习（到岗时间仍需核实）</label>
          <label class="updates-check"><input type="checkbox" data-updates="confirmed" required>以上是我的真实求职条件</label>
          <button class="action" type="submit" data-updates="save-prefs">保存匹配条件</button>
        </fieldset></form>
      </section>
    </div>
    <section data-pane="runs" hidden><h2>检查记录与待确认变化</h2><p class="updates-muted">运行中的任务可取消；关闭此视图不会自动取消。中断的任务不会自动补跑。</p><div data-updates="runs"></div><div data-updates="preview"></div></section>
    <section data-pane="jobs" hidden><div class="updates-heading"><h2>已收录岗位</h2><label>查看 <select data-updates="job-filter"><option value="all">全部记录</option><option value="recommended">条件初筛通过</option><option value="unknown">待核验</option><option value="ineligible">不匹配</option></select></label></div><p class="updates-muted">这里是核验过来源的岗位记录，不是投递成功记录。申请是否成功仍以招聘官网为准。</p><div data-updates="jobs"></div></section>`;
  const node = <T extends HTMLElement>(name: string) => required<T>(`[data-updates="${name}"]`, page);
  return { page, node };
}
