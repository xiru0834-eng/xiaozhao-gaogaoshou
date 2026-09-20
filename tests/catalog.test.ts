import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  DATA,
  APPEND_DATES,
  ownershipOf,
  hasCode,
} from "../src/shared/catalog.ts";

test("migration preserves all 315 companies and their order", () => {
  assert.equal(DATA.length, 315);
  assert.equal(new Set(DATA.map((r) => r[0])).size, 315);
  const hash = createHash("sha256")
    .update(JSON.stringify(DATA.map((r) => r[0])))
    .digest("hex");
  assert.equal(
    hash,
    "5dbde7cd97572cc75b882a0251233b25e39b65ac932092b37d35bf14a366ea6e",
  );
  assert.equal(APPEND_DATES.size, 7);
  // Frozen from the legacy HTML snapshot before migration: every field, not only names.
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify({ data: DATA, dates: [...APPEND_DATES] }))
      .digest("hex"),
    "52d7eb09bf490cdc3fac749871996273f8e4f0302466d77120d912ceacc49072",
  );
});
test("ownership and referral rules remain compatible", () => {
  const tencent = DATA.find((r) => r[0] === "腾讯")!;
  assert.equal(ownershipOf(tencent), "private");
  assert.equal(hasCode(tencent), true);
  assert.equal(
    ownershipOf(DATA.find((r) => r[0] === "微软亚太研发集团")!),
    "foreign",
  );
});
