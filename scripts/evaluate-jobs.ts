import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { assessJob, validateExtraction } from "../src/server/job-rules.ts";
import { classificationMetrics } from "../src/shared/eval-metrics.ts";
import type { Decision, JobPreferences } from "../src/shared/collection-contract.ts";

// This command never accesses the network, model credentials or personal profiles.
const bytes = readFileSync(new URL("../tests/fixtures/jobs_gold.json", import.meta.url), "utf8");
const gold = JSON.parse(bytes) as { version: string; defaults: Record<string, string | null>; cases: Array<{ id: string; split: string; group: string; overrides?: Record<string, string | null>; expected?: Decision }> };
const preferences: JobPreferences = { graduationMonth: "2027-01", degree: "master", major: "软件工程", cities: [], includeInternships: false, confirmed: true };
const report = ["dev", "reserve"].map(split => {
  const cases = gold.cases.filter(c => c.split === split && c.expected);
  const rows = cases.map(c => {
    const fields = { ...gold.defaults, ...c.overrides }, text = Object.values(fields).filter(Boolean).join("\n");
    return { id: c.id, expected: c.expected!, actual: assessJob(validateExtraction({ fields }, text), preferences, true, text).eligibility };
  });
  return { split, ...classificationMetrics(rows), failures: rows.filter(row => row.expected !== row.actual) };
});
console.log(JSON.stringify({ scope: "合成规则回归，不是独立盲测或真实模型准确率；身份/安全/开放性另由 npm test 验证", version: gold.version, sha256: createHash("sha256").update(bytes).digest("hex"), corpusSize: gold.cases.length, modelCalls: 0, report }, null, 2));
if (report.some(split => split.failures.length)) process.exitCode = 1;
