import { CollectionError, JOB_FIELDS, record, exactKeys, evidenceQuote, type JobFields, type JobPreferences, type JobAssessment, type Decision } from "../shared/collection-contract.ts";

export function validateExtraction(input: unknown, text: string): JobFields {
  const value = record(input); exactKeys(value, ["fields"]);
  const fields = record(value.fields); exactKeys(fields, JOB_FIELDS);
  if (JOB_FIELDS.some(key => !(key in fields))) throw new CollectionError("EVIDENCE", "模型未返回完整字段结构。");
  return Object.fromEntries(JOB_FIELDS.map(key => [key, fields[key] === null ? null : evidenceQuote(text, fields[key])])) as JobFields;
}
function graduationRule(text: string, month: string): Decision {
  if (!text) return "unknown";
  if (/毕业时间不限|不限毕业年份/.test(text)) return "eligible";
  const ranges = [...text.matchAll(/(20\d{2})[年./-](\d{1,2})月?\s*(?:至|到|~|～|—|–|-)\s*(20\d{2})[年./-](\d{1,2})月?/g)];
  if (ranges.length === 1 && /毕业/.test(text)) {
    const [, a, b, c, d] = ranges[0];
    if ([b, d].some(m => Number(m) < 1 || Number(m) > 12)) return "unknown";
    const start = `${a}-${b.padStart(2, "0")}`, end = `${c}-${d.padStart(2, "0")}`;
    return start > end ? "unknown" : month >= start && month <= end ? "eligible" : "ineligible";
  }
  const cohorts = [...text.matchAll(/(20\d{2})\s*届/g)];
  if (cohorts.length !== 1 || /另行|部分|不含|除外|仅限.*(?:海外|国内)/.test(text)) return "unknown";
  return cohorts[0][1] === month.slice(0, 4) ? "eligible" : "ineligible";
}
function degreeRule(text: string, degree: JobPreferences["degree"]): Decision {
  if (/学历不限/.test(text)) return "eligible";
  const ranks = { bachelor: 1, master: 2, doctor: 3 };
  const labels = [...text.matchAll(/本科|硕士|博士/g)].map(m => ({ 本科: 1, 硕士: 2, 博士: 3 })[m[0] as "本科"]);
  if (!labels.length) return "unknown";
  // A preference (博士优先) is not a hard minimum. Complex alternatives stay reviewable.
  if (/优先|或|仅限|另行/.test(text) || new Set(labels).size !== 1) return "unknown";
  const required = labels[0];
  if (ranks[degree] < required) return "ineligible";
  return /及以上|以上|学历|学位|毕业/.test(text) || /^(本科|硕士|博士)$/.test(text.trim()) ? "eligible" : "unknown";
}
export function assessJob(fields: JobFields, preferences: JobPreferences, applicationPresent: boolean, documentText = ""): JobAssessment {
  const q = (key: keyof JobFields) => fields[key]?.quote ?? "";
  const reasons: string[] = [], checks: Decision[] = [];
  const check = (result: Decision, reason: string) => { checks.push(result); if (result !== "eligible") reasons.push(reason); };
  const title = q("title");
  const relevant = /AI|AIGC|Agent|RAG|LLM|大模型|智能体|人工智能|机器学习/i.test(title);
  const adjacent = /测试|测开|运维|SRE|产品经理|数据分析|产品运营|游戏策划/i.test(title);
  check(!title ? "unknown" : relevant && !adjacent ? "eligible" : "ineligible", "岗位名称未明确匹配 AI / Agent / RAG 研发方向。");
  check(graduationRule(q("graduation"), preferences.graduationMonth), "毕业届别/窗口不符或证据不足，需核对。");
  check(degreeRule(q("degree"), preferences.degree), "学历要求不符或无法明确解析。");
  const experience = q("experience");
  const hardExperience = (value: string) => value.split(/[\n。；;]+/).some(line => /(?:[1-9]\d*|一|二|三|四|五|六|七|八|九|十)\s*年.{0,20}(?:经验|开发|工作)/.test(line) && !/优先|加分|非必须|不要求/.test(line));
  if (hardExperience(experience) || hardExperience(documentText)) check("ineligible", "原文要求既有多年经验，不能假定应届经历满足。");
  else check(/经验不限|无经验要求|无需.*经验|应届|校招|接受.*毕业生/.test(experience + q("employment")) ? "eligible" : "unknown", "工作经验门槛未明确。");
  if (/实习|intern/i.test(q("employment") + title)) check(preferences.includeInternships ? "unknown" : "ineligible", preferences.includeInternships ? "实习到岗日期和时长需要本人确认。" : "未开启实习岗位。");
  else check(/全职|正式|校招|校园招聘|应届|full.?time/i.test(q("employment")) ? "eligible" : "unknown", "用工类型尚未明确。");
  if (preferences.cities.length) check(preferences.cities.some(city => q("locations").includes(city)) ? "eligible" : "unknown", "城市偏好未核实匹配。");
  // Scan the complete evidence too: a model cannot omit an inconvenient hard requirement.
  if (/博士(?:研究生)?(?:学历|学位|及以上)/.test(documentText) && preferences.degree !== "doctor" && !/博士.{0,8}优先/.test(documentText)) check("ineligible", "完整原文包含博士硬要求。");
  const status = q("status");
  const closed = /招聘已结束|已停止招聘|岗位已关闭|职位已下架|停止接受申请/.test(status) || /招聘已结束|岗位已关闭|职位已下架/.test(documentText);
  const available = /立即申请|申请岗位|投递简历|立即投递|简历请发送|apply now/i.test(status);
  const availability = closed ? "closed" : available && applicationPresent ? "open" : "unknown";
  if (availability !== "open") reasons.push(availability === "closed" ? "原文明确招聘已结束。" : "尚无明确开放及申请入口证据。");
  const eligibility = checks.includes("ineligible") ? "ineligible" : checks.includes("unknown") ? "unknown" : "eligible";
  return { eligibility, availability, reasons, recommended: eligibility === "eligible" && availability === "open" };
}
