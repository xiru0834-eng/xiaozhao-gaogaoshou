import { test } from "node:test";
import assert from "node:assert/strict";
import { createSession } from "../src/client/session.ts";
test("collection requests authenticate reads, isolate profiles and never automatically repeat billable work", async () => {
  let requests = 0;
  const session = createSession("synthetic-profile", "synthetic-token", async (_url, options) => {
    requests++;
    assert.equal(new Headers(options?.headers).get("X-App-Token"), "synthetic-token");
    return new Response("{}", { status: 403 });
  }, async () => { throw Error("unexpected reconnect"); });
  await assert.rejects(session.collectionRequest("/api/collection-runs", {}), /会话已过期.*不会自动重发/);
  assert.equal(requests, 1);
  const wrong = createSession("a", "t", async () => Response.json({ profileId: "b", runs: [] }), async () => { throw Error(); });
  await assert.rejects(wrong.collectionRequest("/api/collection-runs"), /资料/);
});
