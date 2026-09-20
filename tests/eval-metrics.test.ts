import { test } from "node:test";
import assert from "node:assert/strict";
import { classificationMetrics } from "../src/shared/eval-metrics.ts";
test("quality metrics preserve denominators, unknowns and false-positive counts", () => {
  const result = classificationMetrics([{ expected: "eligible", actual: "eligible" }, { expected: "eligible", actual: "unknown" }, { expected: "ineligible", actual: "eligible" }, { expected: "unknown", actual: "unknown" }]);
  assert.equal(result.total, 4); assert.equal(result.precision, .5); assert.equal(result.recall, .5); assert.equal(result.f1, .5); assert.equal(result.unknownRate, .5); assert.equal(result.fp, 1);
  assert.equal(classificationMetrics([]).precision, null);
  assert.equal(classificationMetrics([{ expected: "eligible", actual: "ineligible" }]).recall, 0);
});
