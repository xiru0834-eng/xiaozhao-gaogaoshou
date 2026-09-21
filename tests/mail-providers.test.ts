import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MailStore } from "../src/server/mail-store.ts";
import { MailProviders } from "../src/server/mail-providers.ts";
const secrets = {
  protect: async (s: string) => Buffer.from(s).toString("base64"),
  unprotect: async (s: string) => Buffer.from(s, "base64").toString(),
};
async function fixture(protector = secrets) {
  const dir = await mkdtemp(join(tmpdir(), "mail-provider-"));
  const store = new MailStore(join(dir, "mail.db"), protector),
    provider = new MailProviders(store);
  return {
    store,
    provider,
    close: async () => {
      await provider.close();
      store.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}
test("QQ adapter opens read-only, fetches source without Seen mutation, deduplicates stable message identity", async () => {
  const f = await fixture();
  const calls: any[] = [];
  const fake = {
    connect: async () => {},
    mailboxOpen: async (...a: any[]) => calls.push(a),
    search: async () => [1],
    mailbox: { uidValidity: 123 },
    fetchOne: async (_id: number, q: any) =>
      q.envelope
        ? {
            envelope: { subject: "面试邀请", messageId: "same-message" },
            size: 200,
            internalDate: new Date("2026-09-20T00:00:00Z"),
          }
        : {
            source: Buffer.from(
              "Subject: interview\r\nFrom: test@example.test\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n面试时间 2026-10-05 14:00 北京时间",
            ),
          },
    close: () => {},
  };
  (f.provider as any).qq = () => fake;
  try {
    await f.provider.connectQQ("synthetic@qq.com", "abcdefghijklmnop");
    const a = f.store.accounts()[0];
    const batch = await f.provider.fetch(a.id);
    assert.equal(batch.messages.length, 1);
    assert.equal(batch.messages[0].key, "same-message");
    assert.equal(batch.messages[0].receivedAt, "2026-09-20T00:00:00.000Z");
    assert.ok(calls.every((a) => a[0] === "INBOX" && a[1].readOnly === true));
    assert.equal(
      JSON.stringify(f.store.accounts()).includes("abcdefghijklmnop"),
      false,
    );
  } finally {
    await f.close();
  }
});
for (const kind of ["personal", "school"])
  test(`Outlook ${kind} account routes correct authority and saves token cache separately`, async () => {
    const f = await fixture();
    let selected = "";
    let requested: any;
    (f.provider as any).msal = (_id: string, tenant: string) => {
      selected = tenant;
      return {
        acquireTokenByDeviceCode: async (req: any) => {
          requested = req;
          req.deviceCodeCallback({ userCode: "FAKECODE" });
          return {
            account: { homeAccountId: kind, username: kind + "@example.test" },
          };
        },
        getTokenCache: () => ({ serialize: () => '{"synthetic":"token"}' }),
      };
    };
    try {
      f.provider.startOutlook("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", kind);
      for (
        let i = 0;
        i < 20 && f.provider.authStatus().state !== "connected";
        i++
      )
        await new Promise((r) => setTimeout(r, 5));
      assert.equal(
        selected,
        kind === "personal" ? "consumers" : "organizations",
      );
      assert.deepEqual(requested.scopes, [
        "https://graph.microsoft.com/Mail.Read",
      ]);
      assert.equal(f.provider.authStatus().state, "connected");
      assert.equal(f.store.accounts().length, 1);
      assert.ok(!JSON.stringify(f.store.accounts()).includes("token"));
    } finally {
      await f.close();
    }
  });
test("invalid credentials are rejected before any network connection", async () => {
  const f = await fixture();
  try {
    await assert.rejects(() =>
      f.provider.connectQQ("user@other.test", "password"),
    );
    assert.throws(() => f.provider.startOutlook("invalid", "school"));
    assert.equal(f.store.accounts().length, 0);
  } finally {
    await f.close();
  }
});

test("Outlook cancellation ignores a late device-code callback", async () => {
  const f = await fixture();
  let request: any, finish!: (value: unknown) => void;
  (f.provider as any).msal = () => ({acquireTokenByDeviceCode: (r: any) => {
    request = r;
    return new Promise(resolve => { finish = resolve; });
  }});
  try {
    f.provider.startOutlook("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "personal");
    f.provider.cancelAuth();
    request.deviceCodeCallback({userCode: "LATE-CODE"});
    assert.equal(f.provider.authStatus().state, "cancelled");
    assert.equal(f.provider.authStatus().code, "");
    assert.equal(f.store.accounts().length, 0);
  } finally { finish(null); await f.close(); }
});

test("Outlook cancellation during encryption cannot persist an account or claim connected", async () => {
  let release!: () => void, entered!: () => void;
  const gate = new Promise<void>(r => {release = r;});
  const started = new Promise<void>(r => {entered = r;});
  const f = await fixture({...secrets, protect: async (s: string) => {entered(); await gate; return secrets.protect(s);}});
  (f.provider as any).msal = () => ({
    acquireTokenByDeviceCode: async () => ({account:{homeAccountId:"cancelled-fixture",username:"synthetic@example.test"}}),
    getTokenCache: () => ({serialize: () => "synthetic-only"}),
  });
  try {
    f.provider.startOutlook("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "school");
    await started;
    f.provider.cancelAuth();
    release();
    await (f.provider as any).authRun;
    assert.equal(f.store.accounts().length, 0);
    assert.equal(f.provider.authStatus().state, "cancelled");
  } finally { release(); await f.close(); }
});

test("closed mail provider rejects new QQ/Outlook and read requests before side effects", async () => {
  const f = await fixture();
  let clients=0,credentials=0;
  (f.provider as any).qq=()=>{clients++;throw new Error('unexpected client');};
  (f.provider as any).msal=()=>{clients++;throw new Error('unexpected client');};
  f.store.account=async()=>{credentials++;throw new Error('unexpected credentials');};
  try {
    await f.provider.close();
    await assert.rejects(f.provider.connectQQ('synthetic@qq.com','abcdefghijklmnop'),/停止/);
    assert.throws(()=>f.provider.startOutlook('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','personal'),/停止/);
    await assert.rejects(f.provider.fetch('missing'),/停止/);
    assert.equal(clients,0);assert.equal(credentials,0);
  } finally { await f.close(); }
});
