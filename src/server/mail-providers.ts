import {
  PublicClientApplication,
  type DeviceCodeRequest,
} from "@azure/msal-node";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createHash } from "node:crypto";
import { MailStore } from "./mail-store.ts";
import { MailError, type MailMessage } from "../shared/mail-contract.ts";
import { plainMail } from "./mail-analysis.ts";

export const recruitmentMail = (subject: string) =>
  /面试|笔试|测评|预约|招聘|interview|assessment|invitation|recruit|reschedul|cancell/i.test(
    subject,
  );
const scopes = ["https://graph.microsoft.com/Mail.Read"];
const since = () => new Date(Date.now() - 30 * 86400000);
async function boundedText(res: Response, limit: number) {
  const reader = res.body?.getReader();
  if (!reader) throw new MailError("邮件服务返回空响应。");
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      total += r.value.length;
      if (total > limit) throw new MailError("邮件服务响应超过大小限制。");
      parts.push(r.value);
    }
    return Buffer.concat(parts).toString("utf8");
  } finally {
    await reader.cancel().catch(() => {});
  }
}
export class MailProviders {
  private store: MailStore;
  private request: DeviceCodeRequest | null = null;
  private closed = false;
  private abort = new AbortController();
  private authRun: Promise<void> | null = null;
  private connecting = new Set<Promise<void>>();
  private clients = new Set<ImapFlow>();
  private auth = { state: "idle", code: "", url: "", error: "" };
  constructor(store: MailStore) {
    this.store = store;
  }
  authStatus() {
    return { ...this.auth };
  }
  private msal(clientId: string, tenant: string) {
    return new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenant}`,
      },
      system: {
        loggerOptions: { loggerCallback: () => {}, piiLoggingEnabled: false },
        networkClient: {
          sendGetRequestAsync: async (url, options) =>
            this.msRequest(url, { headers: options?.headers }),
          sendPostRequestAsync: async (url, options) =>
            this.msRequest(url, {
              method: "POST",
              headers: options?.headers,
              body: options?.body,
            }),
        },
      },
    });
  }
  private async msRequest<T>(
    url: string,
    init: RequestInit,
  ): Promise<{ headers: Record<string, string>; body: T; status: number }> {
    const u = new URL(url);
    if (
      u.protocol !== "https:" ||
      !["login.microsoftonline.com", "login.live.com"].includes(u.hostname)
    )
      throw new MailError("微软授权地址不受支持。");
    const res = await fetch(url, {
      ...init,
      redirect: "error",
      signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(20000)]),
    });
    const text = await boundedText(res, 2000000);
    return {
      headers: Object.fromEntries(res.headers),
      body: JSON.parse(text),
      status: res.status,
    };
  }
  async connectQQ(email: string, password: string) {
    if (this.closed) throw new MailError("邮箱服务已停止。", 409);
    const promise = this.connectQQAccount(email, password);
    this.connecting.add(promise);
    try {
      await promise;
    } finally {
      this.connecting.delete(promise);
    }
  }
  private async connectQQAccount(email: string, password: string) {
    if (
      !/^[A-Za-z0-9._+-]+@(qq|foxmail)\.com$/i.test(email) ||
      !/^[A-Za-z]{16}$/.test(password)
    )
      throw new MailError(
        "请填写 QQ/foxmail 邮箱和 16 位 IMAP 授权码（不是登录密码）。",
      );
    const client = this.qq(email, password);
    try {
      await client.connect();
      await client.mailboxOpen("INBOX", { readOnly: true });
    } catch {
      throw new MailError(
        "QQ 连接失败：请确认已开启 IMAP、授权码正确及网络可用。",
        502,
      );
    } finally {
      client.close();
      this.clients.delete(client);
    }
    if (this.closed) return;
    await this.store.saveAccount(
      "qq-" +
        createHash("sha256")
          .update(email.toLowerCase())
          .digest("hex")
          .slice(0, 16),
      "qq",
      email,
      { email, password },
      () => !this.closed,
    );
  }
  private qq(email: string, password: string) {
    const client = new ImapFlow({
      host: "imap.qq.com",
      port: 993,
      secure: true,
      auth: { user: email, pass: password },
      logger: false,
      disableAutoIdle: true,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
    client.on("error", () => {});
    this.clients.add(client);
    return client;
  }
  startOutlook(clientId: string, kind: string) {
    if (this.closed) throw new MailError("邮箱服务已停止。", 409);
    if (
      !/^[a-f0-9-]{36}$/i.test(clientId) ||
      !["personal", "school"].includes(kind)
    )
      throw new MailError(
        "请填写自己的 Microsoft 应用 Client ID 并选择账号类型。",
      );
    if (this.request)
      throw new MailError("已有授权正在进行，请完成或取消后再试。", 409);
    const tenant = kind === "personal" ? "consumers" : "organizations",
      pca = this.msal(clientId, tenant);
    this.auth = { state: "starting", code: "", url: "", error: "" };
    const request: DeviceCodeRequest = {
      scopes,
      timeout: 300,
      deviceCodeCallback: (r) => {
        if (!this.closed && !request.cancel)
          this.auth = {
            state: "waiting",
            code: r.userCode,
            url: "https://microsoft.com/devicelogin",
            error: "",
          };
      },
    };
    this.request = request;
    this.authRun = pca
      .acquireTokenByDeviceCode(request)
      .then(async (result) => {
        if (this.closed || request.cancel) return;
        if (!result?.account) throw new Error("account");
        const id =
          "ms-" +
          createHash("sha256")
            .update(result.account.homeAccountId)
            .digest("hex")
            .slice(0, 24);
        const saved = await this.store.saveAccount(id, "outlook", result.account.username, {
          clientId,
          tenant,
          homeAccountId: result.account.homeAccountId,
          cache: pca.getTokenCache().serialize(),
        }, () => !this.closed && !request.cancel);
        if (!saved || this.closed || request.cancel) return;
        this.auth = { state: "connected", code: "", url: "", error: "" };
      })
      .catch(() => {
        if (!this.closed && !request.cancel)
          this.auth = {
            state: "failed",
            code: "",
            url: "",
            error:
              "微软授权未完成。请检查 Client ID、公共客户端配置及租户权限；学校可能需要管理员批准。",
          };
      })
      .finally(() => {
        if (this.request === request) this.request = null;
      });
    return this.authStatus();
  }
  cancelAuth() {
    if (this.request) this.request.cancel = true;
    this.auth = { state: "cancelled", code: "", url: "", error: "" };
  }
  async fetch(
    id: string,
  ): Promise<{ messages: MailMessage[]; scanned: number; capped: boolean }> {
    if (this.closed) throw new MailError("邮箱服务已停止。", 409);
    const account = await this.store.account(id);
    if (this.closed) throw new MailError("邮箱服务已停止。", 409);
    if (account.kind === "qq")
      return this.fetchQQ(account.secret.email, account.secret.password);
    const { clientId, tenant, homeAccountId, cache } = account.secret,
      pca = this.msal(clientId, tenant);
    try {
      pca.getTokenCache().deserialize(cache);
      const a = (await pca.getTokenCache().getAllAccounts()).find(
        (a) => a.homeAccountId === homeAccountId,
      );
      if (!a) throw new Error("account");
      const result = await pca.acquireTokenSilent({ scopes, account: a });
      const saved = await this.store.saveAccount(account.id, account.kind, account.label, {
        ...account.secret,
        cache: pca.getTokenCache().serialize(),
      }, () => !this.closed);
      if (!saved || this.closed) throw new MailError("邮箱服务已停止。", 409);
      const query = new URLSearchParams({
        $filter: `receivedDateTime ge ${since().toISOString()}`,
        $orderby: "receivedDateTime desc",
        $top: "25",
        $select:
          "id,internetMessageId,subject,from,receivedDateTime,body,hasAttachments",
      });
      let next =
        "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?" +
        query;
      const messages: MailMessage[] = [];
      let scanned = 0;
      for (let page = 0; next && page < 4; page++) {
        const u = new URL(next);
        if (
          u.origin !== "https://graph.microsoft.com" ||
          !u.pathname.startsWith("/v1.0/me/")
        )
          throw new Error("link");
        const res = await fetch(next, {
          headers: {
            Authorization: `Bearer ${result.accessToken}`,
            Prefer: 'outlook.body-content-type="text", IdType="ImmutableId"',
          },
          redirect: "error",
          signal: AbortSignal.any([
            this.abort.signal,
            AbortSignal.timeout(20000),
          ]),
        });
        if (!res.ok) throw new Error("graph");
        const text = await boundedText(res, 4000000);
        const data = JSON.parse(text);
        if (!Array.isArray(data.value)) throw new Error("format");
        for (const m of data.value) {
          scanned++;
          if (!recruitmentMail(String(m.subject))) continue;
          messages.push({
            key: String(m.internetMessageId || m.id),
            subject: String(m.subject).slice(0, 500),
            sender: String(m.from?.emailAddress?.address ?? "").slice(0, 500),
            receivedAt: m.receivedDateTime,
            text:
              m.body?.contentType?.toLowerCase() === "html"
                ? plainMail(String(m.body.content))
                : String(m.body?.content ?? "").slice(0, 12000) ||
                  "正文为空，请查看原邮箱。",
            attachment: !!m.hasAttachments,
            truncated: String(m.body?.content ?? "").length > 12000,
          });
        }
        next =
          typeof data["@odata.nextLink"] === "string"
            ? data["@odata.nextLink"]
            : "";
      }
      return { messages, scanned, capped: !!next };
    } catch {
      throw new MailError(
        "Outlook 读取失败：可能需要重新授权、管理员批准、限流或网络恢复；未改动邮箱与日历。",
        502,
      );
    }
  }
  private async fetchQQ(email: string, password: string) {
    const client = this.qq(email, password);
    const messages: MailMessage[] = [];
    let scanned = 0,
      capped = false;
    try {
      await client.connect();
      await client.mailboxOpen("INBOX", { readOnly: true });
      const found = await client.search({ since: since() }, { uid: true });
      const all = Array.isArray(found) ? found : [];
      capped = all.length > 100;
      for (const uid of all.slice(-100).reverse()) {
        const meta = await client.fetchOne(
          uid,
          { envelope: true, size: true, internalDate: true },
          { uid: true },
        );
        if (!meta) continue;
        scanned++;
        if (!recruitmentMail(meta.envelope?.subject ?? "")) continue;
        const key =
          meta.envelope?.messageId ||
          `${client.mailbox && client.mailbox.uidValidity}:${uid}`;
        if ((meta.size ?? 0) > 256000) {
          messages.push({
            key,
            subject: (meta.envelope?.subject ?? "").slice(0, 500),
            sender: "",
            receivedAt: new Date(
              meta.internalDate || meta.envelope?.date || Date.now(),
            ).toISOString(),
            text: "邮件超过 256KB，请在原邮箱查看正文及附件后手动录入。",
            attachment: true,
          });
          continue;
        }
        const raw = await client.fetchOne(
          uid,
          { source: { start: 0, maxLength: 256000 } },
          { uid: true },
        );
        if (!raw || !raw.source) continue;
        const parsed = await simpleParser(raw.source, {
          skipHtmlToText: true,
          skipTextToHtml: true,
          skipImageLinks: true,
        });
        messages.push({
          key,
          subject: (parsed.subject ?? "").slice(0, 500),
          sender: (parsed.from?.text ?? "").slice(0, 500),
          receivedAt: new Date(
            meta.internalDate || parsed.date || Date.now(),
          ).toISOString(),
          text: (
            parsed.text ||
            plainMail(parsed.html || "") ||
            "正文为空，请查看原邮箱。"
          ).slice(0, 12000),
          attachment: parsed.attachments.length > 0,
          truncated: (parsed.text || parsed.html || "").length > 12000,
        });
      }
      return { messages, scanned, capped };
    } catch {
      throw new MailError(
        "QQ 读取失败：请检查授权码、IMAP 开关或网络。未改动邮箱和日历。",
        502,
      );
    } finally {
      client.close();
      this.clients.delete(client);
    }
  }
  async close() {
    this.closed = true;
    this.cancelAuth();
    this.abort.abort();
    for (const client of this.clients) client.close();
    this.clients.clear();
    await Promise.allSettled([
      ...this.connecting,
      ...(this.authRun ? [this.authRun] : []),
    ]);
  }
}
