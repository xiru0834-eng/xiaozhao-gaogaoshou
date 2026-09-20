import { MODEL_ERRORS, ModelError, type ModelErrorCode } from "../shared/model-contract.ts";

interface Credentials {
  profileId: string;
  token: string;
}

/** The page's profile is immutable, even when a restarted service rotates its token. */
export function createSession(
  profileId: string,
  initialToken: string,
  transport: typeof fetch,
  reconnect: () => Promise<Credentials>,
) {
  let token = initialToken;
  const headers = () => ({ "X-Profile-Id": profileId });
  async function response(res: Response): Promise<Record<string, unknown>> {
    if (res.status === 409)
      throw new Error("Profile mismatch; reopen the workbench");
    if (!res.ok) throw new Error("Data service request failed");
    const data: unknown = await res.json();
    if (
      !data ||
      typeof data !== "object" ||
      !("profileId" in data) ||
      data.profileId !== profileId
    )
      throw new Error("Invalid profile response");
    return data as Record<string, unknown>;
  }
  return {
    profileId,
    /** No automatic retry for a potentially billable request. */
    async modelRequest(path: string, body?: unknown, signal?: AbortSignal): Promise<Record<string, unknown>> {
      const res = await transport(path, {
        method: body === undefined ? "GET" : "POST", cache: "no-store",
        headers: { ...headers(), "X-App-Token": token, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.any([AbortSignal.timeout(135000), ...(signal ? [signal] : [])]),
      });
      if (res.status === 403) throw new Error("本机会话已过期，请刷新工作台并重新打开模型设置；未自动重试。");
      const data: unknown = await res.json();
      if (!data || typeof data !== "object" || !("profileId" in data) || data.profileId !== profileId) throw new Error("资料身份不一致，请重新打开工作台。");
      if (!res.ok) {
        const error = "error" in data ? data.error : null;
        if (error && typeof error === "object" && "code" in error && typeof error.code === "string" && Object.hasOwn(MODEL_ERRORS, error.code)) throw new ModelError(error.code as ModelErrorCode);
        throw new Error("本机模型服务请求失败，未自动重试。");
      }
      return data as Record<string, unknown>;
    },
    async read(path: string) {
      return response(
        await transport(path, {
          cache: "no-store",
          headers: headers(),
          signal: AbortSignal.timeout(10000),
        }),
      );
    },
    async write(path: string, body: unknown) {
      const post = () =>
        transport(path, {
          method: "POST",
          headers: {
            ...headers(),
            "Content-Type": "application/json",
            "X-App-Token": token,
          },
          body: JSON.stringify(body),
          keepalive: true,
          signal: AbortSignal.timeout(10000),
        });
      let res = await post();
      if (res.status === 403) {
        const next = await reconnect();
        if (next.profileId !== profileId)
          throw new Error("Profile changed; reopen the workbench");
        token = next.token;
        res = await post();
      }
      return response(res);
    },
  };
}
export type DataSession = ReturnType<typeof createSession>;
export function sessionFromPage(): DataSession {
  const credentials = (doc: Document): Credentials => {
    const profileId =
      doc.querySelector<HTMLMetaElement>('meta[name="profile-id"]')?.content ??
      "";
    const token =
      doc.querySelector<HTMLMetaElement>('meta[name="app-token"]')?.content ??
      "";
    if (!/^[a-f0-9-]{36}$/.test(profileId) || !/^[a-f0-9]{64}$/.test(token))
      throw new Error("Invalid service identity");
    return { profileId, token };
  };
  const current = credentials(document);
  return createSession(current.profileId, current.token, fetch, async () => {
    const page = await fetch("/", {
      cache: "no-store",
      headers: { "X-Profile-Id": current.profileId },
      signal: AbortSignal.timeout(10000),
    });
    if (!page.ok) throw new Error("Profile reconnect failed");
    return credentials(
      new DOMParser().parseFromString(await page.text(), "text/html"),
    );
  });
}
