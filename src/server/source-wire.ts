import { request } from "node:https";
import type { ClientRequest, IncomingMessage } from "node:http";
import { createGunzip, createInflate, createBrotliDecompress } from "node:zlib";
import { isIP } from "node:net";
import { CollectionError, type SourceDefinition } from "../shared/collection-contract.ts";
import { publicAddress, resolvePublic } from "./model-client.ts";

export interface WirePage { status: number; contentType: string; body: string; location: string | null }
export type SourceTransport = (url: URL, signal: AbortSignal) => Promise<WirePage>;
export function sourceAbort(signal: AbortSignal) {
  return new CollectionError(signal.reason?.name === "TimeoutError" ? "timeout" : "cancelled", signal.reason?.name === "TimeoutError" ? "来源请求超时。" : "检查已取消。");
}
export function secureSourceUrl(source: SourceDefinition, raw: string, robots = false): URL {
  let url: URL;
  try { url = new URL(raw); } catch { throw new CollectionError("unsafe_url", "来源地址无效。"); }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const origins = source.allowedUrls.map(value => new URL(value).origin);
  const scoped = robots ? origins.includes(url.origin) && url.pathname === "/robots.txt" && !url.search && !url.hash : source.allowedUrls.includes(url.href);
  if (!scoped || url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || (isIP(host) && !publicAddress(host)) || /[\\\x00-\x20]/.test(raw) || /(?:token|session|password|userid|resumeid)=/i.test(url.search)) throw new CollectionError("unsafe_url", "已停止访问未登记或不安全的来源地址。");
  return url;
}
/** Tests replace only the socket factory; decoding, limits and cancellation are production code. */
export function readWire(makeRequest: (handler: (res: IncomingMessage) => void) => ClientRequest, signal: AbortSignal, maxBytes = 2 * 1024 * 1024): Promise<WirePage> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, page?: WirePage) => {
      if (settled) return; settled = true; signal.removeEventListener("abort", abort);
      if (error) reject(error); else resolve(page!);
    };
    const req = makeRequest(res => {
      const encoding = String(res.headers["content-encoding"] ?? "identity").toLowerCase();
      const decoder = encoding === "gzip" ? createGunzip() : encoding === "deflate" ? createInflate() : encoding === "br" ? createBrotliDecompress() : null;
      if (encoding !== "identity" && !decoder) { finish(new CollectionError("unsupported", "不支持该来源的压缩编码。")); res.destroy(); return; }
      const stream = decoder ? res.pipe(decoder) : res;
      let wire = 0, decoded = 0; const chunks: Buffer[] = [];
      const fail = (error: Error) => { finish(error); stream.destroy(); res.destroy(); req.destroy(); };
      res.on("data", (chunk: Buffer) => { wire += chunk.length; if (wire > maxBytes) fail(new CollectionError("too_large", "来源响应超过安全大小限制。")); });
      res.on("error", () => fail(signal.aborted ? sourceAbort(signal) : new CollectionError("network_error", "来源连接中断。")));
      stream.on("error", () => fail(new CollectionError("network_error", "来源内容读取失败。")));
      stream.on("data", (chunk: Buffer) => { decoded += chunk.length; if (decoded > maxBytes) fail(new CollectionError("too_large", "来源解压后超过安全大小限制。")); else chunks.push(chunk); });
      stream.on("end", () => {
        try {
          const contentType = String(res.headers["content-type"] ?? "");
          const charset = contentType.match(/charset\s*=\s*["']?([^;\s"']+)/i)?.[1] ?? "utf-8";
          const body = new TextDecoder(charset, { fatal: true }).decode(Buffer.concat(chunks));
          finish(undefined, { status: res.statusCode ?? 0, contentType, body, location: res.headers.location ?? null });
        } catch { finish(new CollectionError("unsupported", "来源字符编码无法可靠解析。")); }
      });
    });
    const abort = () => { finish(sourceAbort(signal)); req.destroy(); };
    req.on("error", () => finish(signal.aborted ? sourceAbort(signal) : new CollectionError("network_error", "无法连接来源，请检查网络或证书。")));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort(); else req.end();
  });
}
export const secureSourceTransport: SourceTransport = async (url, signal) => {
  const records = await new Promise<Awaited<ReturnType<typeof resolvePublic>>>((resolve, reject) => {
    const abort = () => reject(sourceAbort(signal));
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    resolvePublic(url.hostname).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
  if (signal.aborted) throw sourceAbort(signal);
  const ip = records[0];
  return readWire(handler => request(url, { signal, family: ip.family,
    lookup: (_host, _options, callback) => callback(null, ip.address, ip.family),
    headers: { "User-Agent": "XiaozhaoGaogaoshou/0.2 (+local-manual-job-check)", Accept: "text/html,text/plain", "Accept-Encoding": "identity" },
  }, handler), signal);
};
