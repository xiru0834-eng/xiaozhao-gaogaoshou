import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  DATA,
  APPEND_DATES,
  ownershipOf,
  hasCode,
} from "../src/shared/catalog.ts";

test("published catalog includes all 518 companies while preserving the original 335", () => {
  assert.equal(DATA.length, 518);
  assert.equal(new Set(DATA.map((r) => r[0])).size, DATA.length);
  assert.deepEqual(
    Object.fromEntries(
      ["ai", "b2b", "car", "fin", "frn", "game", "hw", "net", "soe"].map((category) => [
        category,
        DATA.filter((row) => row[1] === category).length,
      ]),
    ),
    { ai: 56, b2b: 89, car: 31, fin: 64, frn: 21, game: 27, hw: 136, net: 49, soe: 45 },
  );
  const hash = createHash("sha256")
    .update(JSON.stringify(DATA.slice(0, 315).map((r) => r[0])))
    .digest("hex");
  assert.equal(
    hash,
    "5dbde7cd97572cc75b882a0251233b25e39b65ac932092b37d35bf14a366ea6e",
  );
  assert.equal(APPEND_DATES.size, 210);
  // Frozen from the legacy HTML snapshot before migration: every field, not only names.
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify({ data: DATA.slice(0, 315), dates: [...APPEND_DATES].slice(0, 7) }))
      .digest("hex"),
    "52d7eb09bf490cdc3fac749871996273f8e4f0302466d77120d912ceacc49072",
  );
  assert.deepEqual(DATA.slice(315, 321).map((r) => r[0]), [
    "小天才", "新石器无人车 Neolix", "中海达", "挚文集团（陌陌 / 探探）", "启云方", "柠檬微趣",
  ]);
  assert.ok(DATA.slice(321, 335).every((row) => APPEND_DATES.get(row[0]) === "2026-09-24"));
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify({ data: DATA.slice(0, 335), dates: [...APPEND_DATES].slice(0, 27) }))
      .digest("hex"),
    "4de9cafa07ca5422e24b3b21e8ff47cb8d72e7a06b793720831855436f384e5c",
  );
  assert.deepEqual(DATA.slice(335).map((row) => row[0]).slice(-5), [
    "费曼智核", "启望精密", "北太振寰", "巨鲨医疗", "艾飞智控",
  ]);
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
