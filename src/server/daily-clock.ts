import { dailyTime, dailyZone, DailyError, type NotificationWindow } from '../shared/daily-contract.ts';

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(zone: string) {
  if (!formatters.has(zone)) {
    // Bound cache: settings can change, but should not accumulate indefinitely.
    if (formatters.size >= 32) formatters.clear();
    formatters.set(zone, new Intl.DateTimeFormat('en-CA', {timeZone:dailyZone(zone),year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}));
  }
  return formatters.get(zone)!;
}
function instant(value: string): number {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms) || ms < Date.UTC(2000,0,1) || ms > Date.UTC(2100,0,1)) throw new DailyError('VALIDATION','时间须在2000至2099年之间。');
  return ms;
}
function parts(ms: number, zone: string) {
  const p = Object.fromEntries(formatter(zone).formatToParts(ms).map(p => [p.type,p.value]));
  return {day:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};
}
function dayMs(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new DailyError('VALIDATION','日期无效。');
  const ms = instant(`${day}T00:00:00Z`);
  if (new Date(ms).toISOString().slice(0,10) !== day) throw new DailyError('VALIDATION','日期无效。');
  return ms;
}
function addDay(day: string) { return new Date(dayMs(day) + 86400000).toISOString().slice(0,10); }
export function localDay(now: string, zone: string) { return parts(instant(now), zone).day; }

/** Scan UTC minutes in chronological order: overlap chooses first; gap chooses next valid local minute. */
export function dailySlot(day: string, time: string, zone: string): string {
  dailyTime(time); dailyZone(zone);
  const base = dayMs(day);
  for (let ms = base - 18*3600000; ms <= base + 42*3600000; ms += 60000) {
    const p = parts(ms,zone);
    if (p.day === day && p.time >= time) return new Date(ms).toISOString();
  }
  throw new DailyError('INVALID_DAY','该时区不存在此日期。');
}
export function nextDailySlot(now: string, time: string, zone: string, excludedDay?: string) {
  const ms = instant(now); let day = localDay(now, zone);
  for (let i = 0; i < 4; i++, day = addDay(day)) {
    const at = dailySlot(day,time,zone);
    if (Date.parse(at) > ms && day !== excludedDay) return {day,at};
  }
  throw new DailyError('INVALID_DAY','无法计算下次执行时间。');
}
export function latestDailySlot(now:string,time:string,zone:string) {
  let day=localDay(now,zone),at=dailySlot(day,time,zone);
  if(Date.parse(at)>instant(now)){
    day=new Date(dayMs(day)-86400000).toISOString().slice(0,10);at=dailySlot(day,time,zone);
  }
  return {day,at};
}
export function notificationWindow(now: string, zone: string, previous?: NotificationWindow): NotificationWindow {
  const ms = instant(now);
  if (previous && ms < Date.parse(previous.end)) return previous; // Clock rollback never reissues a window.
  const day = localDay(now,zone);
  const midnight = dailySlot(day,'00:00',zone);
  const start = previous && previous.end > midnight ? previous.end : midnight;
  const end = dailySlot(addDay(day),'00:00',zone);
  return {id:start,start,end,zone};
}
