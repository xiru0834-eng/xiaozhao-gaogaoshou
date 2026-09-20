import { test } from "node:test";
import assert from "node:assert/strict";
import { DATA } from "../src/shared/catalog.ts";
import { matches, sortedRows, type Filters } from "../src/client/selectors.ts";
const base: Filters = {
  state: {},
  filterStatus: "all",
  onlySoon: false,
  onlyCode: false,
  onlyRecent: false,
  filterCat: "all",
  filterOwnership: "all",
  filterChannel: "all",
  query: "",
};

test("private + unapplied + referral + search compose without mutating catalog", () => {
  const filters: Filters = {
    ...base,
    query: "腾讯",
    filterOwnership: "private",
    filterStatus: "todo",
    onlyCode: true,
    state: { 腾讯: "面试" },
  };
  assert.deepEqual(
    DATA.filter((r) => matches(r, filters)).map((r) => r[0]),
    ["腾讯音乐 TME"],
  );
  assert.equal(DATA[0][0], "腾讯");
});
test("unsuitable is not counted as applied; sorting can restore original order", () => {
  const row = DATA[0];
  assert.equal(
    matches(row, {
      ...base,
      filterStatus: "applied",
      state: { 腾讯: "无合适岗位" },
    }),
    false,
  );
  assert.equal(
    matches(row, {
      ...base,
      filterStatus: "unsuitable",
      state: { 腾讯: "无合适岗位" },
    }),
    true,
  );
  assert.deepEqual(sortedRows([...DATA].reverse(), "original"), DATA);
});
test("recent filter uses original append dates only", () => {
  assert.equal(
    DATA.filter((r) => matches(r, { ...base, onlyRecent: true })).length,
    7,
  );
});
