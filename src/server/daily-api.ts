import { DailyError, dailyObject, dailyKeys, dailyId, dailyInteger } from '../shared/daily-contract.ts';
import type { DailyService } from './daily-service.ts';
export const isDailyPath=(path:string)=>/^\/api\/(daily-settings|daily-activations|daily-reports|daily-notifications|discovery-runs|notification-deliveries)(\/|$)/.test(path);
export async function dailyRequest(service:DailyService,path:string,method:string,body:()=>Promise<unknown>,params:URLSearchParams) {
  const now=()=>new Date().toISOString();
  if(method==='GET') {
    if(path==='/api/daily-settings')return service.view();
    if(path==='/api/daily-reports')return {reports:service.store.reports(dailyInteger(Number(params.get('offset')??0),1000),dailyInteger(Number(params.get('limit')??50),100,1)),total:service.store.reportCount()};
    if(path==='/api/daily-notifications')return {notification:service.store.notification(now()),unread:service.store.unread()};
    const run=path.match(/^\/api\/discovery-runs\/([a-zA-Z0-9-]+)$/);if(run)return {run:service.store.run(dailyId(run[1]))};
    const report=path.match(/^\/api\/daily-reports\/([a-zA-Z0-9-]+)$/);if(report)return {report:service.store.report(dailyId(report[1]))};
  } else if(method==='DELETE' && path==='/api/daily-activations/current')return {settings:service.disable()};
  else if(method==='POST'||method==='PUT') {
    let v:Record<string,unknown>;try {v=dailyObject(await body());}catch {throw new DailyError('VALIDATION','请求格式无效或内容过长。');}
    if(method==='PUT' && path==='/api/daily-settings') {dailyKeys(v,['expectedRevision','settings']);return {settings:service.store.configure(v.settings,dailyInteger(v.expectedRevision,Number.MAX_SAFE_INTEGER),now())};}
    if(method==='POST' && path==='/api/daily-activations') {dailyKeys(v,['requestId','settingsRevision']);return {settings:await service.activate(dailyInteger(v.settingsRevision,Number.MAX_SAFE_INTEGER),dailyId(v.requestId))};}
    if(method==='POST' && path==='/api/discovery-runs') {dailyKeys(v,['requestId','expectedSettingsRevision']);return {run:await service.start(dailyId(v.requestId),dailyInteger(v.expectedSettingsRevision,Number.MAX_SAFE_INTEGER))};}
    if(method==='POST' && path==='/api/notification-deliveries') {dailyKeys(v,['reportId','requestId']);return {claim:service.store.claimNotification(dailyId(v.reportId),dailyId(v.requestId),now())};}
    const cancel=path.match(/^\/api\/discovery-runs\/([a-zA-Z0-9-]+)\/cancel$/);if(method==='POST'&&cancel){dailyKeys(v,[]);return {run:service.cancel(dailyId(cancel[1]))};}
    const read=path.match(/^\/api\/daily-reports\/([a-zA-Z0-9-]+)\/read-receipts$/);if(method==='POST'&&read){dailyKeys(v,['requestId']);dailyId(v.requestId);service.store.readReport(dailyId(read[1]),now());return {ok:true};}
    const action=path.match(/^\/api\/notification-deliveries\/([a-zA-Z0-9-]+)\/action$/);if(method==='PUT'&&action){dailyKeys(v,['action']);if(v.action!=='opened'&&v.action!=='dismissed')throw new DailyError('VALIDATION','提醒操作无效。');service.store.notificationAction(dailyId(action[1]),v.action,now());return {ok:true};}
  } else throw new DailyError('METHOD','不支持此操作。',405);
  throw new DailyError('NOT_FOUND','接口不存在。',404);
}
