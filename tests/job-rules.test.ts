import { test } from "node:test";
import assert from "node:assert/strict";
import { JOB_FIELDS, evidenceQuote, type JobFields, type JobPreferences } from "../src/shared/collection-contract.ts";
import { assessJob, validateExtraction } from "../src/server/job-rules.ts";
const preferences: JobPreferences = { graduationMonth: "2027-01", degree: "master", major: "软件工程", cities: [], includeInternships: false, confirmed: true };
const quotes = { title: "Agent 开发工程师", graduation: "2027届毕业生", degree: "本科及以上", experience: "经验不限", employment: "全职", locations: "北京", skills: "RAG", salary: null, published: null, deadline: null, status: "立即申请" };
const body = Object.values(quotes).filter(Boolean).join("\n");
function fields(overrides: Partial<typeof quotes> = {}): JobFields {
  return Object.fromEntries(JOB_FIELDS.map(key => { const q = { ...quotes, ...overrides }[key]; return [key, q === null ? null : evidenceQuote(q, q)]; })) as JobFields;
}
test("job rules require all hard conditions and do not let topic keywords override role/experience", () => {
  assert.equal(assessJob(fields(), preferences, true).recommended, true);
  for (const patch of [{ title: "大模型测试开发工程师" }, { title: "普通后端开发工程师" }, { experience: "3年及以上开发经验" }, { degree: "博士学历" }, { graduation: "2026届应届毕业生" }]) assert.equal(assessJob(fields(patch), preferences, true).eligibility, "ineligible");
  assert.equal(assessJob({ ...fields(), graduation: null }, preferences, true).eligibility, "unknown");
  assert.equal(assessJob(fields({ employment: "实习" }), { ...preferences, includeInternships: true }, true).eligibility, "unknown");
});
test("ambiguous windows, missing degree and unsupported field semantics never become eligible", () => {
  assert.equal(assessJob(fields({ graduation: "2026年9月至2027年8月毕业", degree: "硕士及以上" }), preferences, true).eligibility, "eligible");
  assert.equal(assessJob(fields({ graduation: "2027届或2026届，具体另行通知" }), preferences, true).eligibility, "unknown");
  assert.equal(assessJob(fields({ graduation: "岗位编号2027" }), preferences, true).eligibility, "unknown");
  assert.equal(assessJob({ ...fields(), degree: null }, preferences, true).eligibility, "unknown");
});
test("closure needs explicit evidence, and link existence alone is not job availability", () => {
  assert.equal(assessJob(fields({ status: "招聘已结束" }), preferences, true).availability, "closed");
  assert.equal(assessJob(fields({ status: "HTTP 404" }), preferences, false).availability, "unknown");
  assert.equal(assessJob({ ...fields(), status: null }, preferences, true).availability, "unknown");
});
test("extraction accepts exact quotes only, rejects additions/hallucination and fixes identity outside model", () => {
  const good = validateExtraction({ fields: quotes }, body);
  assert.equal(good.graduation?.quote, "2027届毕业生");
  assert.throws(() => validateExtraction({ fields: { ...quotes, graduation: "2028届毕业生" } }, body));
  assert.throws(() => validateExtraction({ fields: quotes, company: "fake" }, body));
  assert.throws(() => validateExtraction({ fields: { ...quotes, command: "erase" } }, body));
  assert.throws(() => validateExtraction({ fields: { ...quotes, degree: { quote: "本科及以上" } } }, body));
});
test("omitted conflicting cohorts, restrictive majors and expired dates cannot receive a recommendation", () => {
  assert.equal(assessJob(fields(), preferences, true, body + "\n仅限2026届毕业生").recommended, false);
  assert.equal(assessJob(fields(), preferences, true, body + "\n必须为临床医学相关专业").recommended, false);
  assert.equal(assessJob(fields(), preferences, true, body + "\n博士学历为硬性要求\n博士经验优先").recommended, false);
  assert.equal(assessJob(fields(), preferences, true, body + "\n截止时间2020年1月1日").availability, "closed");
});
