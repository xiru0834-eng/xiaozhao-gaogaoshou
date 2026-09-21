import type { DailyRunState } from '../shared/daily-contract.ts';

const labels: Record<DailyRunState,string> = {
  running:'检查中',completed:'检查完成',partial:'部分完成',failed:'检查失败',cancelled:'已取消',interrupted:'上次中断',blocked:'等待处理',
};
export const dailyStateLabel=(state:DailyRunState)=>labels[state];
export function noticeCopy(state:DailyRunState,leads:number,verified:number) {
  if(['failed','interrupted','cancelled','blocked'].includes(state)) return '这次更新未完成，原因已记在日报里。';
  if(leads>0) return `发现 ${leads} 条新线索，${verified} 个岗位通过条件初筛；一起核对来源吧。`;
  if(verified>0) return `已复核来源，${verified} 个岗位通过条件初筛。`;
  return state==='partial' ? '暂没有可靠新增，部分来源还需要你核对。' : '这次检查没有可靠新增，复核记录已保存。';
}
export const canOfferNotice=(visible:boolean,editing:boolean,modal:boolean,shown:boolean)=>visible&&!editing&&!modal&&!shown;
export function dailyWhen(value:string|null,zone?:string) {
  if(!value)return '尚未安排';
  return new Intl.DateTimeFormat('zh-CN',{timeZone:zone,dateStyle:'medium',timeStyle:'short',hour12:false}).format(new Date(value));
}
