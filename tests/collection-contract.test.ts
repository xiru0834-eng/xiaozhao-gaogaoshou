import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePreferences, parseRunInput, evidenceQuote, jobIdentity } from "../src/shared/collection-contract.ts";

test("collection preferences validate month, degree, consent and reject personal fields", () => {
  const input = { graduationMonth: "2027-01", degree: "master", major: "软件工程", cities: [], includeInternships: false, confirmed: true };
  assert.deepEqual(parsePreferences(input), input);
  for (const bad of [{ ...input, graduationMonth: "2027-13" }, { ...input, email: "private@example.com" }, { ...input, confirmed: false }, { ...input, cities: [1] }]) assert.throws(() => parsePreferences(bad));
});
test("run creation has explicit mode, bounded registered source IDs and stable retry ID", () => {
  const input = { mode: "source_only", sourceIds: ["speediance-llm"], requestId: "request-12345678", maxModelCalls: 0 };
  assert.deepEqual(parseRunInput(input), input);
  assert.throws(() => parseRunInput({ ...input, sourceIds: ["https://localhost"] }));
  assert.throws(() => parseRunInput({ ...input, mode: "extract", maxModelCalls: 4 }));
  assert.throws(() => parseRunInput({ ...input, mode: "extract", maxModelCalls: 1 }));
  assert.throws(() => parseRunInput({ ...input, apiKey: "never accepted" }));
});
test("evidence is an exact nonempty substring and job identity preserves official URL parameters", () => {
  const text = "岗位要求：2027届毕业生；硕士及以上。";
  assert.deepEqual(evidenceQuote(text, "2027届毕业生"), { quote: "2027届毕业生", start: 5, end: 13 });
  assert.throws(() => evidenceQuote(text, "2026届"));
  assert.throws(() => evidenceQuote(text, ""));
  assert.notEqual(jobIdentity("tenant-a", "https://jobs.example.com/#/job/1"), jobIdentity("tenant-a", "https://jobs.example.com/#/job/2"));
  assert.notEqual(jobIdentity("tenant-a", "https://jobs.example.com/job?id=1"), jobIdentity("tenant-b", "https://jobs.example.com/job?id=1"));
});
