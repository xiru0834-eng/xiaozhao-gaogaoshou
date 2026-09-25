import { test } from "node:test";
import assert from "node:assert/strict";
import { interviewEvidence, matchesInterviewMode } from "../src/client/interview-mode.ts";

test("unknown companies are online candidates but never confirmed online", () => {
  assert.equal(interviewEvidence("未收录的测试公司").mode, "unknown");
  assert.equal(matchesInterviewMode("未收录的测试公司", "online-candidate"), true);
  assert.equal(matchesInterviewMode("未收录的测试公司", "online"), false);
});

test("AI first round does not establish a complete remote interview", () => {
  const item = interviewEvidence("中移九天（中国移动数智事业部）");
  assert.equal(item.mode, "mixed");
  assert.match(item.note, /后两轮形式未公布/);
  assert.equal(matchesInterviewMode("中移九天（中国移动数智事业部）", "online-candidate"), true);
  assert.equal(matchesInterviewMode("中移九天（中国移动数智事业部）", "online"), false);
});

test("online written test is not labeled online interview", () => {
  assert.equal(interviewEvidence("中国移动（集团统一）").mode, "unknown");
});
