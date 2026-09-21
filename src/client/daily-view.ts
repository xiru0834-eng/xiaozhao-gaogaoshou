import { required } from './dom.ts';
import './daily.css';

/** Static layout only; every remote title, error and URL is rendered through DOM properties. */
export function dailyView() {
  const page=document.createElement('section');page.className='content daily-page';page.hidden=true;
  page.setAttribute('aria-labelledby','daily-heading');
  page.innerHTML=`
    <button class="text-button module-back" data-daily="back" type="button">← 返回投递工作台</button>
    <header class="daily-heading"><div><p class="daily-eyebrow">DAILY LETTER · 每一步，都有回音</p><h1 id="daily-heading" tabindex="-1">每日更新<span>机会来信</span></h1><p>公开来源认真找，新机会慢慢选。投递记录始终由你掌握。</p></div><span class="daily-character" aria-hidden="true"></span></header>
    <p data-daily="feedback" class="daily-feedback" role="status" aria-live="polite">正在读取本机状态…</p>
    <div class="daily-layout">
      <section class="daily-panel daily-controls" aria-labelledby="daily-plan-title">
        <div class="daily-section-heading"><span class="daily-number">01</span><h2 id="daily-plan-title">更新计划</h2><span data-daily="enabled" class="daily-pill">未启用</span></div>
        <div class="daily-next"><span>下一次检查</span><strong data-daily="next">尚未安排</strong><small data-daily="zone-note"></small></div>
        <form data-daily="form"><fieldset data-daily="fields">
          <div class="daily-form-grid"><label>每天开始时间<input data-daily="time" type="time" required value="07:00"></label><label>时区<select data-daily="zone"><option value="Australia/Sydney">悉尼 · 自动夏令时</option><option value="Asia/Shanghai">中国 · UTC+8</option><option value="UTC">UTC</option></select></label></div>
          <label class="daily-checkbox"><input data-daily="notify" type="checkbox" checked>完成后，角色轻轻提醒我一次</label>
          <label>提醒时间（留空即完成后）<input data-daily="notify-time" type="time"><small>不会在更新尚未完成时弹出成功通知。</small></label>
          <details class="daily-budget"><summary>每日额度与安全边界</summary><div class="daily-form-grid"><label>搜索请求<input data-daily="search-limit" type="number" min="1" max="6" required></label><label>网页请求<input data-daily="page-limit" type="number" min="1" max="20" required></label><label>模型提取<input data-daily="extract-limit" type="number" min="1" max="6" required></label></div><p>按 UTC 日累计，和手动来源检查共享；失败与未知费用也计入。不是金额上限，具体费用以服务商为准。</p><p>只发公开招聘查询与正文，不发简历、邮箱或个人投递记录。新线索先核验，不自动投递。</p></details>
          <button class="action" data-daily="save" type="submit">保存设置</button><small data-daily="dirty">保存不会触发联网或自动启用。</small>
        </fieldset></form>
        <div class="daily-readiness" data-daily="readiness"></div>
        <p class="daily-runtime" data-daily="runtime"></p>
        <label class="daily-checkbox"><input data-daily="consent" type="checkbox">我同意按以上额度调用当前模型及联网搜索，可能产生 API 费用。</label>
        <div class="daily-actions"><button class="action primary" data-daily="start" type="button" disabled>现在检查一次</button><button class="action" data-daily="enable" type="button" disabled>启用每日更新</button><button class="action" data-daily="disable" type="button" hidden>暂停自动更新</button></div>
        <p data-daily="usage" class="daily-footnote"></p>
      </section>
      <section class="daily-panel daily-history" aria-labelledby="daily-history-title">
        <div class="daily-section-heading"><span class="daily-number">02</span><h2 id="daily-history-title">更新来信</h2><button class="text-button" data-daily="refresh" type="button">刷新</button></div>
        <section class="daily-running" data-daily="running" hidden><div><strong data-daily="phase"></strong><p>可以返回工作台；请保持本机服务运行。</p></div><button class="action" data-daily="cancel" type="button">停止本次</button></section>
        <div data-daily="reports"></div><button class="action" data-daily="more" type="button" hidden>更早的来信</button>
        <section class="daily-report" data-daily="report" hidden aria-label="日报详情"></section>
      </section>
    </div>`;
  return {page,node:<T extends HTMLElement>(name:string)=>required<T>(`[data-daily="${name}"]`,page)};
}
