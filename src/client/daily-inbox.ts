import type { DataSession } from './session.ts';
import type { DailyReport, NotificationClaim } from '../shared/daily-contract.ts';
import { canOfferNotice, dailyWhen, noticeCopy } from './daily-presentation.ts';
import { el, action } from './updates-render.ts';

/** The database arbitrates offers across windows. An uncertain claim is never replayed. */
export function mountDailyInbox(session:DataSession,open:(id:string)=>Promise<boolean>,badge:(n:number)=>void) {
  let offering=false,notice:HTMLElement|null=null,lastConsidered='';
  function safeMoment() {
    const focused=document.activeElement;
    const editing=!!focused?.matches('input,textarea,select,[contenteditable="true"]');
    const modal=!!document.fullscreenElement || [...document.querySelectorAll<HTMLElement>('dialog[open],[role="dialog"]:not([hidden]),[aria-modal="true"]:not([hidden])')]
      .some(n=>n.getClientRects().length>0&&getComputedStyle(n).visibility!=='hidden');
    return canOfferNotice(document.visibilityState==='visible',editing,modal,!!notice);
  }
  async function poll() {
    if(offering || document.visibilityState!=='visible')return;
    offering=true;
    try {
      const data=await session.dailyRequest('/api/daily-notifications');badge(Number(data.unread)||0);
      const report=data.notification as DailyReport|null;
      if(!report || report.id===lastConsidered || !safeMoment())return;
      lastConsidered=report.id;
      const {claim}=await session.dailyRequest('/api/notification-deliveries','POST',{reportId:report.id,requestId:crypto.randomUUID()}) as {claim:NotificationClaim};
      // A tab hidden while the claim was in flight must not steal attention. The unread report remains.
      if(claim.claimed && safeMoment())show(report,claim.deliveryId);
    } catch { /* Offline/stale session: no repeated write, unread badge catches up after a safe GET. */ }
    finally {offering=false;}
  }
  function show(report:DailyReport,deliveryId:string) {
    const card=el('aside','','daily-notice');card.setAttribute('aria-label','每日更新来信');
    const top=el('div','','daily-notice-top'),avatar=el('span','','daily-character');avatar.setAttribute('aria-hidden','true');
    const copy=el('div');copy.append(el('h2','你的更新来信到了'),el('small',dailyWhen(report.run.finishedAt,report.run.settings.options.timeZone)));top.append(avatar,copy);
    const close=action('×',()=>void dismiss());close.className='daily-notice-close';close.setAttribute('aria-label','关闭本次来信');
    const actions=el('div','','daily-actions');
    const inspect=action('看看这次更新',()=>{void (async()=>{
      inspect.disabled=true;
      try {if(await open(report.id)){await session.dailyRequest(`/api/notification-deliveries/${deliveryId}/action`,'PUT',{action:'opened'});remove();}}
      catch {foot.textContent='读取或回执保存失败，来信仍可从每日更新中查看。';}
      finally {inspect.disabled=false;}
    })();},true);
    const later=action('稍后看',()=>void dismiss());actions.append(inspect,later);
    const foot=el('p','今天只轻轻提醒这一次。历史来信会一直留在每日更新。','daily-notice-foot');
    card.append(top,close,el('p',noticeCopy(report.run.state,report.run.counts.discovered,report.run.counts.verifiedJobs)),actions,foot);
    notice=card;
    if(matchMedia('(max-width:600px)').matches)document.querySelector('.main-shell')?.prepend(card);else document.body.append(card);
    // No focus change, audio, timeout dismissal, or live-region announcement while typing.
    function remove(){card.remove();notice=null;}
    async function dismiss(){remove();try{await session.dailyRequest(`/api/notification-deliveries/${deliveryId}/action`,'PUT',{action:'dismissed'});}catch{/* Claim already persists. */}}
  }
  const timer=setInterval(()=>void poll(),30000);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  document.addEventListener('visibilitychange',()=>void poll());
  document.addEventListener('focusout',()=>{setTimeout(()=>void poll(),100);});
  void poll();
  return {poll};
}
