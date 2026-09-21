import type { Decision } from "./collection-contract.ts";

export interface ClassifiedExample { expected: Decision; actual: Decision }
/** Unknown is a first-class decision, never a positive recommendation. */
export function classificationMetrics(rows: ClassifiedExample[]) {
  const count = (expected: Decision, actual: Decision) => rows.filter(row => row.expected === expected && row.actual === actual).length;
  const labels: Decision[] = ["eligible", "ineligible", "unknown"];
  const tp = count("eligible", "eligible");
  const fp = rows.filter(row => row.expected !== "eligible" && row.actual === "eligible").length;
  const fn = rows.filter(row => row.expected === "eligible" && row.actual !== "eligible").length;
  const precision = tp + fp ? tp / (tp + fp) : null, recall = tp + fn ? tp / (tp + fn) : null;
  return {
    total: rows.length, tp, fp, fn, precision, recall,
    f1: precision === null || recall === null ? null : precision + recall ? 2 * precision * recall / (precision + recall) : 0,
    unknownCount: rows.filter(row => row.actual === "unknown").length,
    unknownRate: rows.length ? rows.filter(row => row.actual === "unknown").length / rows.length : null,
    exact: rows.filter(row => row.expected === row.actual).length,
    confusion: Object.fromEntries(labels.map(expected => [expected, Object.fromEntries(labels.map(actual => [actual, count(expected, actual)]))])),
  };
}
