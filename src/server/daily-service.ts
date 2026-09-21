import { randomUUID } from 'node:crypto';
import { DailyError, type DailyRun } from '../shared/daily-contract.ts';
import { CollectionError } from '../shared/collection-contract.ts';
import { ModelError } from '../shared/model-contract.ts';
import { DailyStore } from './daily-store.ts';
import type { ModelService } from './model-service.ts';
import type { CollectionService } from './collection-service.ts';
import type { CatalogStore } from './catalog-store.ts';

export class DailyService {
  readonly store: DailyStore;
  private readonly model: ModelService;
  private readonly collection: CollectionService;
  private readonly companies: () => string[];
  private readonly now: () => string;
  private active: {controller:AbortController;promise:Promise<void>;id:string;child?:string} | null = null;
  private starting = false;
  private preparing: Promise<void> | null = null;
  private stopped = false;
  private storageFailure: string | null = null;
  private readonly timer: ReturnType<typeof setInterval>;
  constructor(store: DailyStore, model: ModelService, collection: CollectionService, catalog: CatalogStore, now=()=>new Date().toISOString()) {
    this.store=store;this.model=model;this.collection=collection;this.now=now;this.companies=()=>catalog.snapshot().companies.map(c=>c[0]);
    store.recover(now());
    // Legacy manual checks share the same durable quota. Sent requests are conservatively held until recovery.
    collection.beforeCall=(runId,kind)=>{
      try {const id=randomUUID();store.reserve(id,runId,kind,this.now());store.attemptState(id,'sent');}
      catch(error){if(error instanceof DailyError)throw new CollectionError('unsupported',error.message,error.status);throw error;}
    };
    this.timer=setInterval(()=>{void this.tick().catch(()=>{this.storageFailure='自动检查未能保存或读取状态，已停止自动调用。请检查磁盘后重启。';});},60000);this.timer.unref();
  }
  async readiness() {
    const model=await this.model.settings.read(),prefs=await this.collection.preferences.read();
    const reasons:string[]=[];
    if(!model.hasKey || !model.config) reasons.push('请先在模型设置保存官方接口和密钥。');
    if(model.config && !['https://api.deepseek.com','https://api.deepseek.com/v1'].includes(model.config.baseUrl.replace(/\/$/,''))) reasons.push('当前搜索仅支持 DeepSeek 官方接口，不会转发其他接口密钥。');
    if(!prefs.preferences) reasons.push('请先在机会清单确认毕业月份等求职偏好。');
    return {ready:reasons.length===0,reasons,modelRevision:model.revision,preferenceRevision:prefs.revision,preferences:prefs.preferences};
  }
  async view() {
    return {settings:this.store.settings(),readiness:await this.readiness(),active:this.store.active(),usage:this.store.usage(this.now()),unread:this.store.unread(),failure:this.storageFailure,
      engineMode:'service_running',systemWakeInstalled:false,limitation:'当前版本关闭网页仍可运行；退出后端或关机后不会自行执行。搜索新来源先待核验，未自动登记。'};
  }
  async activate(expected:number,requestId?:string) {
    const r=await this.readiness();if(!r.ready)throw new DailyError('NOT_CONFIGURED',r.reasons.join(' '),422);
    if(this.storageFailure)throw new DailyError('STORAGE',this.storageFailure,503);
    return this.store.activate(expected,r.modelRevision,r.preferenceRevision,this.now(),requestId);
  }
  async start(requestId:string,expected:number) {
    const existing=this.store.findRequest(requestId);
    if(existing) {
      if(existing.settings.revision!==expected || existing.trigger!=='manual')throw new DailyError('CONFLICT','重复请求内容不一致。',409);
      return existing;
    }
    if(this.starting || this.active || this.collection.isBusy())throw new DailyError('BUSY','已有采集正在运行，请等待完成。',409);
    if(this.stopped || this.storageFailure)throw new DailyError('STORAGE',this.storageFailure??'后台已停止。',503);
    this.starting=true;
    let prepared!:()=>void;this.preparing=new Promise<void>(resolve=>{prepared=resolve;});
    try {
      const r=await this.readiness();if(!r.ready)throw new DailyError('NOT_CONFIGURED',r.reasons.join(' '),422);
      if(this.stopped)throw new DailyError('STORAGE','后台已停止，未启动新的请求。',503);
      const run=this.store.startManual(requestId,expected,this.now(),r.modelRevision,r.preferenceRevision);this.launch(run);return run;
    } finally {this.starting=false;prepared();this.preparing=null;}
  }
  async tick() {
    if(this.stopped || this.storageFailure || this.starting || this.active || this.collection.isBusy() || !this.store.settings().enabled)return;
    this.starting=true;
    let prepared!:()=>void;this.preparing=new Promise<void>(resolve=>{prepared=resolve;});
    try {
      const s=this.store.settings(),r=await this.readiness();
      if(this.stopped)return;
      if(!r.ready || s.modelRevision!==r.modelRevision || s.preferenceRevision!==r.preferenceRevision) {this.store.disable('模型或求职偏好变化，请核对后重新启用。');return;}
      const run=this.store.claimDue(this.now());if(run)this.launch(run);
    } finally {this.starting=false;prepared();this.preparing=null;}
  }
  private launch(run:DailyRun) {
    const controller=new AbortController(),state={controller,id:run.id,promise:Promise.resolve(),child:undefined as string|undefined};
    this.active=state;
    state.promise=this.execute(run,AbortSignal.any([controller.signal,AbortSignal.timeout(600000)]),id=>{state.child=id;})
      .catch(()=>{this.storageFailure='运行结果未能写入本机，已停止后续请求；请检查磁盘后重启，未自动重试。';})
      .finally(()=>{if(this.active===state)this.active=null;});
  }
  private async execute(run:DailyRun,signal:AbortSignal,setChild:(id:string)=>void) {
    let searchSucceeded=false;
    try {
      const r=await this.readiness();
      if(!r.ready || r.modelRevision!==run.settings.modelRevision || r.preferenceRevision!==run.settings.preferenceRevision)throw new DailyError('CONFIG_CHANGED','配置已变化，未开始外部调用。',409);
      const names=this.companies().filter(n=>n.length<=100 && !/@|\d{11}|https?:|sk-/.test(n));
      const offset=Math.floor(Date.parse(run.startedAt)/86400000)*3;
      run.companies=names.length ? Array.from({length:Math.min(3,names.length)},(_,i)=>names[(offset+i)%names.length]) : [];
      const year=r.preferences!.graduationMonth.slice(0,4);
      const scope=run.companies.join('、');
      for(const days of [1,7,30].slice(0,run.settings.options.searchLimit)) {
        signal.throwIfAborted();
        if(days>1 && run.counts.discovered>=5)break;
        const attempt=randomUUID();this.store.reserve(attempt,run.id,'search',this.now());
        run.phase=`搜索近${days}天公开线索`;run.usage.searchRequests++;this.store.saveRun(run);
        this.store.attemptState(attempt,'sent');
        try {
          const result=await this.model.searchPublic(`当前日期${this.now().slice(0,10)}，近${days}天：${year}届 校园招聘 AI应用 Agent 大模型 RAG 开发 招聘官网 公开免费内推码。重点公司：${scope}。找原始职位/内推帖，不猜发布时间。`,run.settings.modelRevision!,signal);
          this.store.attemptState(attempt,'settled');searchSucceeded=true;
          for(const key of ['serverSearches','input','output'] as const)run.usage[key]=run.usage[key]===null||result.usage[key]===null?null:run.usage[key]!+result.usage[key]!;
          for(const lead of result.leads) {
            if(run.leads.some(l=>l.url===lead.url)){run.counts.duplicates++;continue;}
            run.leads.push(lead);
            if(this.store.observeLead(lead,this.now()))run.counts.discovered++;else run.counts.duplicates++;
            run.counts.needsReview++;
            if(/内推|推荐码/.test(lead.title))run.counts.referralLeads++;
          }
        } catch(error) {
          // A successfully settled response followed by a storage failure must not be reclassified.
          try {this.store.attemptState(attempt,'unknown');}catch{/* Original error takes precedence. */}
          throw error;
        }
        this.store.saveRun(run);
      }
      signal.throwIfAborted();
      // Only exact, human-reviewed registry URLs are automatically fetched. Search cannot grant network scope.
      const sources=this.collection.sources.slice(0,3);
      if(sources.length) {
        run.phase='复核已登记来源';this.store.saveRun(run);
        const child=await this.collection.start({mode:'extract',sourceIds:sources.map(s=>s.id),requestId:`daily-${run.id}`,maxModelCalls:Math.min(3,run.settings.options.extractLimit),expectedModelRevision:run.settings.modelRevision,expectedPreferenceRevision:run.settings.preferenceRevision});
        setChild(child.id);run.collectionRunIds.push(child.id);this.store.saveRun(run);
        const abort=()=>this.collection.cancel(child.id);signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
        let result;try {result=await this.collection.wait(child.id);}finally{signal.removeEventListener('abort',abort);}
        run.errors.push(...result.errors);run.counts.failedSources=result.documents.filter(d=>d.state!=='readable').length;
        const candidates=this.collection.store.candidates(child.id);
        run.counts.verifiedJobs=candidates.filter(c=>c.job.assessment.recommended).length;
        run.counts.needsReview+=candidates.filter(c=>c.kind!=='duplicate').length;
        run.counts.duplicates+=candidates.filter(c=>c.kind==='duplicate').length;
      }
      if(run.leads.some(l=>!this.collection.sources.some(s=>s.entryUrl===l.url)))run.errors.push('部分新来源尚未登记核验，保留为线索；不代表可投岗位或有效内推码。');
      if(!sources.length)run.errors.push('未登记可自动核验的来源，本次仅发现公开线索。');
      run.state=signal.aborted?'cancelled':run.errors.length?'partial':'completed';
    } catch(error) {
      run.state=signal.aborted?'cancelled':searchSucceeded?'partial':'failed';
      run.errors.push(error instanceof DailyError||error instanceof ModelError||error instanceof CollectionError?error.message:signal.aborted?'本次检查已停止。':'更新执行失败，未自动重试。');
    }
    run.phase='已结束';run.finishedAt=this.now();this.store.finish(run,this.now());
  }
  cancel(id:string) {const run=this.store.run(id);if(this.active?.id===id){this.active.controller.abort();if(this.active.child)this.collection.cancel(this.active.child);}return run;}
  disable() {const settings=this.store.disable();if(this.active)this.cancel(this.active.id);return settings;}
  async close() {this.stopped=true;clearInterval(this.timer);if(this.active)this.cancel(this.active.id);await this.preparing;await this.active?.promise;}
}
