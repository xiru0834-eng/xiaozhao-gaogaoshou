import { test } from "node:test";
import assert from "node:assert/strict";
import { createSession } from "../src/client/session.ts";
import { ModelError } from "../src/shared/model-contract.ts";

test("model requests send token on reads, preserve profile, expose only known errors, never retry inference", async () => {
  let calls = 0;
  const session = createSession("profile-a", "token", async (_url, options) => {
    calls++;
    assert.equal(new Headers(options?.headers).get("X-App-Token"), "token");
    return Response.json({ profileId: "profile-a", error: { code: "AUTH", message: "untrusted secret" } }, { status: 502 });
  }, async () => { throw Error("must not reconnect model request automatically"); });
  await assert.rejects(session.modelRequest("/api/model-tests", {}), error => error instanceof ModelError && error.code === "AUTH" && !error.message.includes("untrusted"));
  assert.equal(calls, 1);
  await assert.rejects(session.modelRequest("/api/model-settings"), ModelError);
  const wrong = createSession("profile-a", "token", async () => Response.json({ profileId: "profile-b", result: {} }), async () => { throw Error(); });
  await assert.rejects(wrong.modelRequest("/api/model-tests", {}), /资料/);
});

test("model request reports expired session rather than secretly re-sending a chargeable call", async () => {
  const session = createSession("a", "t", async () => new Response("{}", { status: 403 }), async () => { throw Error("unexpected"); });
  await assert.rejects(session.modelRequest("/api/model-tests", {}), /重新打开/);
});
