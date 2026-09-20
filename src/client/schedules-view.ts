import "./schedules.css";
export function schedulesView() {
  const page = document.createElement("section");
  page.className = "schedule-page";
  page.hidden = true;
  page.setAttribute("aria-label", "面试日程");
  page.innerHTML = `<div class="schedule-heading"><div><p class="schedule-kicker">把准备留给自己，把安排交给日历。</p><h1 id="schedule-heading" tabindex="-1">面试日程<span>CALENDAR</span></h1><p class="schedule-subtitle">笔试、面试和每一步准备，都在这里。</p></div><div class="schedule-actions"><button class="action" data-s="back">返回台账</button><button class="action primary" data-s="new">＋ 新建日程</button></div></div>
 <div class="schedule-toolbar"><div class="schedule-segment" aria-label="日程视图"><button data-view="calendar" aria-pressed="true">月历</button><button data-view="list" aria-pressed="false">全部列表</button></div><label class="schedule-search"><span aria-hidden="true">⌕</span><input data-s="search" aria-label="搜索日程" placeholder="搜索公司、岗位或备注"></label><label class="sr-only" for="schedule-kind">日程类型</label><select id="schedule-kind" data-s="kind"><option value="all">全部类型</option><option value="written">笔试</option><option value="interview">面试</option></select><label class="sr-only" for="schedule-state">日程状态</label><select id="schedule-state" data-s="state"><option value="all">全部状态</option><option value="planned">待参加</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select></div>
 <div class="schedule-meta"><label>查看时区 <select data-s="zone" aria-label="查看时区"><option value="Asia/Shanghai">北京时间</option><option value="Australia/Sydney">悉尼时间</option><option value="UTC">UTC</option></select></label><span data-s="count"></span><button class="schedule-link" data-s="refresh">刷新</button><button class="schedule-link" data-s="export">导出日程</button></div>
 <p data-s="feedback" class="schedule-feedback" role="status" aria-live="polite">正在读取本机日程…</p>
 <div data-s="calendar" class="schedule-columns"><section class="schedule-month" aria-label="月历"><div class="schedule-month-head"><h2 data-s="month-title"></h2><div><button data-s="prev" aria-label="上个月">‹</button><button data-s="today">今天</button><button data-s="next" aria-label="下个月">›</button></div></div><div class="schedule-week" aria-hidden="true"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div data-s="grid" class="schedule-grid"></div><div class="schedule-legend"><span class="interview">● 面试</span><span class="written">● 笔试</span><span>点击日期，查看或添加安排</span></div></section><aside class="schedule-day" aria-label="当天安排"><div class="schedule-day-title"><span data-s="day-label"></span><strong data-s="day-number"></strong><span data-s="day-week"></span></div><div class="schedule-day-heading"><h2>当天安排</h2><button data-s="add-day" class="schedule-link">＋ 添加</button></div><div data-s="day-events"></div><button class="schedule-link" data-s="undated"></button></aside></div>
 <section data-s="list" class="schedule-list" aria-label="全部日程" hidden></section>`;
  const dialog = document.createElement("dialog");
  dialog.className = "schedule-dialog";
  dialog.setAttribute("aria-labelledby", "schedule-editor-title");
  dialog.innerHTML = `<form data-s="form"><div class="schedule-editor-head"><div><small>每一场机会，都认真准备。</small><h2 id="schedule-editor-title">新建日程</h2></div><button type="button" data-s="close-editor" class="action" aria-label="关闭日程编辑">×</button></div><fieldset data-s="fields"><div class="schedule-form-grid">
 <label>公司 *<input name="company" required maxlength="120" placeholder="填写公司名称"></label><label>岗位<input name="role" maxlength="160" placeholder="例如：Agent 研发工程师"></label>
 <label>类型<select name="kind"><option value="interview">面试</option><option value="written">笔试</option></select></label><label>轮次<input name="round" maxlength="80" placeholder="例如：技术一面"></label>
 <label>日期<input type="date" name="date" min="2000-01-01" max="2099-12-31"></label><label>录入时区<select name="zone"><option value="Asia/Shanghai">北京时间</option><option value="Australia/Sydney">悉尼时间</option><option value="UTC">UTC</option></select></label>
 <label>开始时间<input type="time" name="time"></label><label>结束时间（可选，同日）<input type="time" name="endTime"></label></div>
 <p class="schedule-time-help" data-s="time-preview">日期或时间未定可以留空。</p><a data-s="meeting" class="schedule-link" target="_blank" rel="noopener noreferrer" hidden>打开会议／笔试链接 ↗</a>
 <div class="schedule-form-grid"><label>地点／会议方式<input name="location" maxlength="300" placeholder="线上 · 腾讯会议"></label><label>会议／笔试链接<input name="url" type="url" maxlength="2000" placeholder="https://…"></label></div>
 <label>安排备注<textarea name="notes" rows="2" maxlength="10000" placeholder="面试要求、联系人称呼、需要携带的材料…"></textarea></label>
 <div class="schedule-check-heading"><label>准备清单</label><button type="button" data-s="add-task" class="schedule-link">＋ 添加一项</button></div><div data-s="tasks"></div>
 <div class="schedule-form-grid"><label>日程状态<select name="status"><option value="planned">待参加</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select></label><div class="schedule-status-help">完成或取消日程，不会改变公司的投递状态。</div></div>
 <label>面后复盘<textarea name="review" rows="3" maxlength="10000" placeholder="问到了什么？哪些地方值得再准备？"></textarea></label></fieldset>
 <p data-s="edit-error" class="schedule-edit-error" role="alert"></p><div class="schedule-editor-foot"><button type="button" data-s="delete" class="action schedule-danger" hidden>删除日程</button><span>仅保存在本机</span><button type="button" data-s="cancel" class="action">取消</button><button type="submit" data-s="save" class="action primary">保存日程</button></div></form>`;
  document.body.append(dialog);
  return {
    page,
    dialog,
    node: <T extends HTMLElement>(name: string) => {
      const el =
        page.querySelector(`[data-s="${name}"]`) ??
        dialog.querySelector(`[data-s="${name}"]`);
      if (!el) throw Error(name);
      return el as T;
    },
  };
}
