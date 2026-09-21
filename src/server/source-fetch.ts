import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import robotsParserModule from "robots-parser";
import { CollectionError, type SourceDefinition, type SourceDocument, type SourceState } from "../shared/collection-contract.ts";
import { ModelError } from "../shared/model-contract.ts";
import { parseSourceHtml } from "./source-document.ts";
import { secureSourceTransport, secureSourceUrl, sourceAbort, type SourceTransport, type WirePage } from "./source-wire.ts";

export interface RequestBudget { requests: number; beforeRequest?: () => void }
// The package is CommonJS; its default-export declaration differs under NodeNext/Bundler.
interface RobotsPolicy { isAllowed(url: string, agent: string): boolean | undefined; getCrawlDelay(agent: string): number | undefined }
const robotsParser = robotsParserModule as unknown as (url: string, text: string) => RobotsPolicy;
export class SourceReader {
  private readonly transport: SourceTransport;
  private readonly intervalMs: number;
  private lastRequest = new Map<string, number>();
  constructor(options: { transport?: SourceTransport; intervalMs?: number } = {}) {
    this.transport = options.transport ?? secureSourceTransport;
    this.intervalMs = options.intervalMs ?? 1000;
  }
  async read(source: SourceDefinition, parent: AbortSignal, budget: RequestBudget = { requests: 0 }): Promise<SourceDocument> {
    const initialCount = budget.requests;
    const signal = AbortSignal.any([parent, AbortSignal.timeout(60000)]);
    const doc: SourceDocument = { sourceId: source.id, url: source.entryUrl, checkedAt: new Date().toISOString(), state: "network_error", httpStatus: null, message: "", text: "", hash: "", title: null, links: [], requests: 0 };
    const get = async (url: URL, interval = this.intervalMs): Promise<WirePage> => {
      if (signal.aborted) throw sourceAbort(signal);
      if (budget.requests >= 20) throw new CollectionError("unsupported", "本次 HTTP 请求已达到 20 次上限。");
      const wait = Math.max(0, (this.lastRequest.get(url.hostname) ?? 0) + interval - Date.now());
      if (wait) await delay(wait, undefined, { signal });
      if (signal.aborted) throw sourceAbort(signal);
      budget.beforeRequest?.();
      budget.requests++; this.lastRequest.set(url.hostname, Date.now());
      return this.transport(url, AbortSignal.any([signal, AbortSignal.timeout(15000)]));
    };
    try {
      let url = secureSourceUrl(source, source.entryUrl);
      const policies = new Map<string, ReturnType<typeof robotsParser>>();
      let page: WirePage | undefined;
      for (let redirects = 0; redirects <= 3; redirects++) {
        let robots = policies.get(url.origin);
        if (!robots) {
          const robotsUrl = secureSourceUrl(source, url.origin + "/robots.txt", true);
          const response = await get(robotsUrl);
          // A definite 404/410 means no robots resource (RFC 9309). Auth/5xx/HTML is not permission.
          if (![200, 404, 410].includes(response.status) || (response.status === 200 && (response.body.length > 512000 || /<html|<!doctype/i.test(response.body) || (response.body.trim() && !/^\s*(?:user-agent|sitemap|#)/im.test(response.body))))) throw new CollectionError("robots_unknown", "无法确认 robots 规则，已暂停该来源。");
          robots = robotsParser(robotsUrl.href, response.status === 200 ? response.body : "");
          policies.set(url.origin, robots);
        }
        if (robots.isAllowed(url.href, "XiaozhaoGaogaoshou") !== true) throw new CollectionError("robots_denied", "该来源的 robots 规则不允许读取此页。");
        const crawlDelay = robots.getCrawlDelay("XiaozhaoGaogaoshou") ?? 0;
        if (!Number.isFinite(crawlDelay) || crawlDelay > 30) throw new CollectionError("robots_unknown", "来源要求较长访问间隔，当前短检查已暂停。");
        page = await get(url, Math.max(this.intervalMs, crawlDelay * 1000));
        doc.httpStatus = page.status;
        if (page.status >= 300 && page.status < 400) {
          if (!page.location || redirects === 3) throw new CollectionError("unsupported", "来源重定向超过限制。");
          url = secureSourceUrl(source, new URL(page.location, url).href); continue;
        }
        break;
      }
      if (!page) throw new CollectionError("network_error", "未收到来源响应。");
      doc.url = url.href;
      if (page.status === 401 || page.status === 403) throw new CollectionError("login_required", "来源要求登录或拒绝访问；未绕过限制。");
      if (page.status !== 200) throw new CollectionError("http_error", `来源返回 HTTP ${page.status}，不能据此判定岗位关闭。`);
      if (!/^text\/html(?:;|$)/i.test(page.contentType)) throw new CollectionError("unsupported", "此来源暂不支持的内容类型。");
      const content = parseSourceHtml(page.body, url.href);
      if (content.text.length > 16000) throw new CollectionError("too_large", "正文超过 16,000 字符，本次不截断岗位硬条件。");
      if (/^(?:请先登录|登录后查看|访问验证|验证码|sign in to continue)/i.test(content.text.trim()) || /captcha|验证码/.test(content.title ?? "")) throw new CollectionError("login_required", "页面要求登录或验证，未继续读取。");
      if (content.text.length < 30 || !content.title) throw new CollectionError("dynamic", "静态页面未提供足够正文，可能需要动态加载；未判定无岗位。");
      Object.assign(doc, content, { state: "readable", message: source.kind === "listing" ? "已读取招聘入口；此页不是单个岗位，不直接生成推荐。" : "已读取公开正文；岗位匹配仍需核验。", hash: createHash("sha256").update(content.text).digest("hex") });
    } catch (error) {
      const failure = signal.aborted ? sourceAbort(signal) : error instanceof CollectionError ? error : error instanceof ModelError && error.code === "UNSAFE_ENDPOINT" ? new CollectionError("unsafe_url", "来源 DNS 指向非公网地址，已拒绝访问。") : new CollectionError("network_error", "读取失败，请检查网络或来源可用性。");
      doc.state = failure.code as SourceState; doc.message = failure.message;
    }
    doc.requests = budget.requests - initialCount;
    return doc;
  }
}
