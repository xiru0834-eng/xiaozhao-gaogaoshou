import type { DailyReport, DailyRun, DailySettings } from '../shared/daily-contract.ts';
import type { DataSession } from './session.ts';
import { required } from './dom.ts';
import { dailyView } from './daily-view.ts';
import { dailyWhen, dailyStateLabel, noticeCopy } from './daily-presentation.ts';
import { mountDailyInbox } from './daily-inbox.ts';
import { action, el } from './updates-render.ts';

interface DailyView {
  settings:DailySettings; readiness:{ready:boolean;reasons:string[]}; active:DailyRun|null;
  usage:{search:number;page:number;extract:number}; failure:string|null;limitation:string;
}
export function mountDaily(session:DataSession) {
  const {page,node}=dailyView(),workbench=required<HTMLElement>('.main-shell > .content'),workspace=required<HTMLElement>('.workspace');
  const breadcrumb=required<HTMLElement>('.breadcrumb span:last-child');workbench.after(page);
  const launch=action('每日更新',()=>{void open();});launch.id='open-daily';launch.setAttribute('aria-pressed','false');required('.header-tools').prepend(launch);
  let view:DailyView|null=null,dirty=false,busy=false,loading=false,selected='',reports:DailyReport[]=[],more=false,editingRevision=0,reportSignature='';
  let refreshTimer:ReturnType<typeof setTimeout>|undefined;
  const input=(name:string)=>node<HTMLInputElement>(name),button=(name:string)=>node<HTMLButtonElement>(name);
  function say(text:string,error=false){node('feedback').textContent=text;node('feedback').dataset.error=String(error);}
  function fail(error:unknown){say(error instanceof Error?error.message:'读取失败，未自动重试。',true);}
  function controls() {
    const active=!!view?.active,locked=busy||!view;
    node<HTMLFieldSetElement>('fields').disabled=locked||active;
    button('start').disabled=locked||loading||active||dirty||!view?.readiness.ready||!input('consent').checked;
    button('enable').disabled=locked||loading||active||dirty||!view?.readiness.ready||!input('consent').checked;
    button('enable').hidden=!!view?.settings.enabled;button('disable').hidden=!view?.settings.enabled;button('disable').disabled=busy||loading;
    button('save').disabled=locked||loading||active;
    button('cancel').disabled=busy||loading;button('refresh').disabled=busy||loading;button('more').disabled=busy||loading;
    node('dirty').textContent=dirty?'有未保存的修改；保存后才会生效。':'保存不会触发联网或自动启用。';
  }
  function fillSettings() {
    if(!view)return;const options=view.settings.options;editingRevision=view.settings.revision;
    input('time').value=options.localTime;input('notify').checked=options.notifyEnabled;input('notify-time').value=options.notifyTime??'';
    const zone=node<HTMLSelectElement>('zone');
    if(![...zone.options].some(o=>o.value===options.timeZone)){const opt=document.createElement('option');opt.value=options.timeZone;opt.textContent=options.timeZone;zone.append(opt);}
    zone.value=options.timeZone;
    input('search-limit').value=String(options.searchLimit);input('page-limit').value=String(options.pageLimit);input('extract-limit').value=String(options.extractLimit);
  }
  function renderState() {
    if(!view)return;const {settings:s,active,usage,readiness}=view;
    node('enabled').textContent=s.enabled?'已启用':'已暂停';node('enabled').dataset.enabled=String(s.enabled);
    node('next').textContent=dailyWhen(s.nextDueAt,s.options.timeZone);node('zone-note').textContent=`${s.options.timeZone} · 开始时间，不是结果到达时间`;
    node('runtime').textContent=view.limitation;
    node('usage').textContent=`今日 UTC 用量：搜索 ${usage.search}/${s.options.searchLimit} · 网页 ${usage.page}/${s.options.pageLimit} · 提取 ${usage.extract}/${s.options.extractLimit}`;
    const ready=node('readiness');ready.replaceChildren(el('p',readiness.ready?'官方搜索接口与匹配条件已就绪。':readiness.reasons.join(' ')));
    ready.append(action('模型设置',()=>document.querySelector<HTMLButtonElement>('#open-model')?.click()),action('匹配条件 / 核验候选',()=>document.querySelector<HTMLButtonElement>('#open-updates')?.click()));
    node('running').hidden=!active;node('phase').textContent=active?.phase??'';
    if(view.failure)say(view.failure,true);else if(s.pauseReason)say(s.pauseReason,true);
    controls();
  }
  function renderReports() {
    const signature=JSON.stringify([selected,reports.map(r=>[r.id,r.readAt]),more]);
    if(signature===reportSignature)return;reportSignature=signature;
    const host=node('reports');host.replaceChildren();
    if(!reports.length){const empty=el('div','','daily-empty');empty.append(el('strong','下一封来信，从一次检查开始'),el('span','设置好接口与匹配条件，再手动检查一次。没有可靠新增，也会留下诚实的复核记录。'));host.append(empty);}
    for(const report of reports){
      const row=action('',()=>{void showReport(report.id).catch(fail);});row.className='daily-letter';row.setAttribute('aria-pressed',String(selected===report.id));
      const title=el('div','','daily-letter-heading');title.append(el('strong',`${dailyWhen(report.run.finishedAt,report.run.settings.options.timeZone)} · ${dailyStateLabel(report.run.state)}`));
      if(!report.readAt)title.append(el('span','未读','daily-unread'));
      row.append(title,el('p',noticeCopy(report.run.state,report.run.counts.discovered,report.run.counts.verifiedJobs)),el('small',`${report.run.trigger==='manual'?'手动检查':'定时检查'} · ${report.run.usage.searchRequests} 次搜索尝试 · ${report.run.counts.duplicates} 条重复`));host.append(row);
    }
    button('more').hidden=!more;
  }
  async function load(reset=false) {
    if(loading)return;loading=true;controls();
    try {
      // Read reports AFTER state. Parallel reads could see no report and an already-finished run,
      // incorrectly switching a fast run to the idle 30-second poll interval.
      const state=await session.dailyRequest('/api/daily-settings');
      const list=await session.dailyRequest('/api/daily-reports?limit=20');
      const first=!view;view=state as unknown as DailyView;
      const latest=list.reports as DailyReport[],ids=new Set(latest.map(r=>r.id));
      reports=[...latest,...reports.filter(r=>!ids.has(r.id))];more=reports.length<Number(list.total);
      if(first||reset){dirty=false;fillSettings();}
      renderState();renderReports();
      if(!view.failure&&!view.settings.pauseReason)say(view.active?'正在检查，结果保存后会生成来信。':'设置与记录已同步到本机。');
    }catch(error){fail(error);}finally{loading=false;controls();schedule();}
  }
  function schedule(){if(refreshTimer)clearTimeout(refreshTimer);if(!page.hidden)refreshTimer=setTimeout(()=>void load(),view?.active?1800:30000);}
  async function showReport(id:string) {
    const {report}=await session.dailyRequest(`/api/daily-reports/${id}`) as {report:DailyReport};selected=id;
    const run=report.run,host=node('report');host.hidden=false;host.replaceChildren(el('h3',`${dailyStateLabel(run.state)} · ${run.trigger==='manual'?'手动检查':'定时检查'}`));
    host.append(el('p',`完成于 ${dailyWhen(run.finishedAt,run.settings.options.timeZone)}。发布时间未确认的来源不标成今日新开。`));
    const metrics=el('div','','daily-metrics');
    for(const [value,label] of [[run.counts.discovered,'新线索'],[run.counts.verifiedJobs,'初筛通过'],[run.counts.needsReview,'待核对'],[run.counts.referralLeads,'内推线索']] as const){const item=el('span');item.append(el('b',String(value)),document.createTextNode(label));metrics.append(item);}host.append(metrics);
    host.append(el('p',`本次公司范围：${run.companies.join('、')||'未记录'}。不是全网穷尽。自动入库 ${run.counts.acceptedJobs} 条；个人投递状态未改变。`));
    if(run.errors.length){host.append(el('h4','未完成与待核对'));const errors=el('ul');for(const message of run.errors)errors.append(el('li',message));host.append(errors);}
    host.append(el('h4','公开搜索线索 · 尚未证明岗位开放或内推有效'));
    const leads=el('ul');
    for(const lead of run.leads){const row=el('li');const link=el('a',lead.title||lead.url) as HTMLAnchorElement;try {const url=new URL(lead.url);if(url.protocol==='https:'){link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';}}catch{/* Stored invalid URL stays non-clickable. */}row.append(link,el('small',' · 发布时间无法确认'));leads.append(row);}
    host.append(run.leads.length?leads:el('p','本次没有可展示的搜索结果块；不能据此判断没有招聘。'));
    if(run.collectionRunIds.length)host.append(action('去岗位更新核验候选',()=>document.querySelector<HTMLButtonElement>('#open-updates')?.click()));
    host.append(el('p',`搜索 HTTP ${run.usage.searchRequests} 次；原生搜索 ${run.usage.serverSearches??'服务商未报告'} 次；输入 ${run.usage.input??'未报告'} / 输出 ${run.usage.output??'未报告'} tokens。提取费用另见岗位更新记录。`));
    await session.dailyRequest(`/api/daily-reports/${id}/read-receipts`,'POST',{requestId:crypto.randomUUID()});
    report.readAt=new Date().toISOString();reports=reports.map(r=>r.id===id?report:r);renderReports();host.scrollIntoView({block:'nearest'});void inbox.poll();
  }
  async function open(id?:string):Promise<boolean> {
    if(page.hidden){
      if(!window.dispatchEvent(new CustomEvent('workspace:navigate',{cancelable:true,detail:'daily'})))return false;
      page.hidden=false;workbench.hidden=true;workspace.dataset.page='daily';breadcrumb.textContent='每日更新';launch.setAttribute('aria-pressed','true');
      history.replaceState(null,'','#daily');required<HTMLElement>('#daily-heading',page).focus();window.scrollTo({top:0});await load();
    }
    if(id)await showReport(id);return true;
  }
  function close() {
    if(busy){say('正在保存，请稍等。');return false;}
    if(dirty&&!window.confirm('更新设置尚未保存，离开将放弃修改。继续吗？'))return false;
    page.hidden=true;workbench.hidden=false;delete workspace.dataset.page;breadcrumb.textContent='公司与投递';launch.setAttribute('aria-pressed','false');
    dirty=false;view=null;if(refreshTimer)clearTimeout(refreshTimer);if(location.hash==='#daily')history.replaceState(null,'',location.pathname+location.search);return true;
  }
  async function mutate(work:()=>Promise<unknown>,message:string) {
    if(busy)return;if(loading){say('状态同步中，请稍后再试。');return;}busy=true;controls();
    try {await work();dirty=false;input('consent').checked=false;await load(true);say(message);}
    catch(error){fail(error);}finally{busy=false;controls();}
  }
  node<HTMLFormElement>('form').addEventListener('input',()=>{dirty=true;controls();});
  node<HTMLFormElement>('form').addEventListener('submit',event=>{
    event.preventDefault();if(!view)return;
    const options={...view.settings.options,localTime:input('time').value,timeZone:node<HTMLSelectElement>('zone').value,notifyEnabled:input('notify').checked,notifyTime:input('notify-time').value||null,searchLimit:Number(input('search-limit').value),pageLimit:Number(input('page-limit').value),extractLimit:Number(input('extract-limit').value)};
    void mutate(()=>session.dailyRequest('/api/daily-settings','PUT',{expectedRevision:editingRevision,settings:options}),'设置已保存；保存本身没有调用模型。');
  });
  input('consent').addEventListener('change',controls);
  button('start').addEventListener('click',()=>{if(view)void mutate(()=>session.dailyRequest('/api/discovery-runs','POST',{requestId:crypto.randomUUID(),expectedSettingsRevision:view!.settings.revision}),'检查已开始，结果保存后再提醒。');});
  button('enable').addEventListener('click',()=>{if(view)void mutate(()=>session.dailyRequest('/api/daily-activations','POST',{requestId:crypto.randomUUID(),settingsRevision:view!.settings.revision}),'每日更新已启用；从下一个计划时间开始，不补刷历史请求。');});
  button('disable').addEventListener('click',()=>void mutate(()=>session.dailyRequest('/api/daily-activations/current','DELETE'),'已暂停定时并停止当前每日更新。'));
  button('cancel').addEventListener('click',()=>{if(view?.active)void mutate(()=>session.dailyRequest(`/api/discovery-runs/${view!.active!.id}/cancel`,'POST',{}),'已请求停止；已发送的调用可能仍计费。');});
  button('refresh').addEventListener('click',()=>{if(!dirty||window.confirm('刷新将放弃未保存的设置。继续吗？'))void load(true);});
  button('more').addEventListener('click',()=>{void (async()=>{if(loading)return;loading=true;controls();try{const data=await session.dailyRequest(`/api/daily-reports?offset=${reports.length}&limit=20`);const next=data.reports as DailyReport[];const ids=new Set(reports.map(r=>r.id));reports.push(...next.filter(r=>!ids.has(r.id)));more=reports.length<Number(data.total);renderReports();}catch(error){fail(error);}finally{loading=false;controls();}})();});
  button('back').addEventListener('click',()=>{if(close())launch.focus();});
  window.addEventListener('workspace:navigate',event=>{if((event as CustomEvent).detail!=='daily'&&!page.hidden&&!close())event.preventDefault();});
  for(const selector of ['.brand','#open-help','#status-filters'])document.querySelector(selector)?.addEventListener('click',event=>{if(!page.hidden&&!close()){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
  const inbox=mountDailyInbox(session,open,n=>{(launch.querySelector('[data-nav-label]')??launch).textContent=n?`每日更新 · ${n>99?'99+':n}`:'每日更新';});
  window.addEventListener('hashchange',()=>{if(location.hash==='#daily')void open();});
  if(location.hash==='#daily')void open();
}
