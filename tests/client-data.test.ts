import { test } from "node:test";
import assert from "node:assert/strict";
import {
  installCatalog,
  DATA,
  ownershipOf,
  APPEND_DATES,
} from "../src/client/catalog.ts";
import { matches, sortedRows, type Filters } from "../src/client/selectors.ts";
import { csvText, csvCell } from "../src/client/exports.ts";
import { createSession } from "../src/client/session.ts";

const snapshot = {
  schemaVersion: 1,
  revision: 1,
  companies: [
    [
      "动态外企",
      "ai",
      "Agent",
      "上海",
      "",
      "",
      "https://example.org/jobs",
      "",
      "",
      "",
    ],
  ],
  appendDates: [["动态外企", "2026-09-20"]],
  metadata: [
    {
      id: "co_" + "1".repeat(32),
      name: "动态外企",
      sequence: 1,
      ownership: "foreign",
      aliases: ["Dynamic Alias"],
      channel: "none",
      channelEvidence: "",
    },
  ],
};
test("CSV treats formula prefixes as text and quotes carriage returns", () => {
  assert.equal(csvCell("=1+1"), "'=1+1");
  assert.equal(csvCell("  @SUM(1)"), "'  @SUM(1)");
  assert.equal(csvCell("line\rbreak"), '"line\rbreak"');
});
test("dynamic catalog drives classification, alias search, dates, order and CSV; malformed refresh cannot erase it", () => {
  installCatalog(snapshot);
  assert.equal(ownershipOf(DATA[0]), "foreign");
  assert.equal(APPEND_DATES.size, 1);
  const filters: Filters = {
    state: {},
    filterStatus: "all",
    onlySoon: false,
    onlyCode: false,
    onlyRecent: true,
    filterCat: "all",
    filterOwnership: "foreign",
    filterChannel: "all",
    filterInterviewMode: "all",
    query: "dynamic alias",
  };
  assert.equal(matches(DATA[0], filters), true);
  assert.deepEqual(sortedRows([...DATA], "original"), DATA);
  assert.match(csvText({ 动态外企: "面试" }), /动态外企,面试,外企/);
  assert.throws(() =>
    installCatalog({ ...snapshot, revision: 2, companies: [["broken"]] }),
  );
  assert.throws(() => installCatalog({ ...snapshot, revision: 0 }));
  assert.equal(DATA[0][0], "动态外企");
});

test("session refuses another profile and does not retry a rotated token against it", async () => {
  let calls = 0;
  const transport: typeof fetch = async (_input, init) => {
    calls++;
    assert.equal(new Headers(init?.headers).get("X-Profile-Id"), "profile-a");
    return new Response("{}", { status: 403 });
  };
  const session = createSession(
    "profile-a",
    "old-token",
    transport,
    async () => ({ profileId: "profile-b", token: "new-token" }),
  );
  await assert.rejects(
    session.write("/api/status", { updates: { A: "已投" } }),
    /profile/i,
  );
  assert.equal(calls, 1);
  const wrong = createSession(
    "profile-a",
    "token",
    async () => Response.json({ profileId: "profile-b", statuses: {} }),
    async () => {
      throw Error("unexpected");
    },
  );
  await assert.rejects(wrong.read("/api/status"), /profile/i);
});

test("same-profile service restart refreshes token once and confirms writes", async () => {
  let calls = 0;
  const transport: typeof fetch = async (_input, init) => {
    calls++;
    return calls === 1
      ? new Response("{}", { status: 403 })
      : Response.json({
          profileId: "profile-a",
          ok: new Headers(init?.headers).get("X-App-Token") === "new-token",
        });
  };
  const session = createSession(
    "profile-a",
    "old-token",
    transport,
    async () => ({ profileId: "profile-a", token: "new-token" }),
  );
  const ack = await session.write("/api/status", {});
  assert.equal(ack.ok, true);
  assert.equal(calls, 2);
});
