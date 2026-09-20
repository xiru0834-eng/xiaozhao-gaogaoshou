import { BlockList, isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import type { ClientRequest, IncomingMessage } from "node:http";
import { ModelError, type ModelConfig, type ModelResult } from "../shared/model-contract.ts";

const excluded = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16], ["192.0.0.0", 24],
  ["192.0.2.0", 24], ["192.88.99.0", 24], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) excluded.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]] as const) excluded.addSubnet(network, prefix, "ipv6");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
export function publicAddress(address: string): boolean {
  const family = isIP(address);
  return family === 4 ? !excluded.check(address, "ipv4") : family === 6 && globalV6.check(address, "ipv6") && !excluded.check(address, "ipv6");
}
type Lookup = (hostname: string) => Promise<{ address: string; family: number }[]>;
export async function resolvePublic(hostname: string, resolve: Lookup = host => lookup(host, { all: true })) {
  const host = hostname.replace(/^\[|\]$/g, "");
  const records = isIP(host) ? [{ address: host, family: isIP(host) }] : await resolve(host);
  if (!records.length) throw new ModelError("NETWORK");
  if (records.some(r => !publicAddress(r.address))) throw new ModelError("UNSAFE_ENDPOINT");
  return records;
}
function abortError(signal: AbortSignal): ModelError {
  return new ModelError(signal.reason instanceof Error && signal.reason.name === "TimeoutError" ? "TIMEOUT" : "CANCELLED");
}
function statusError(status: number): ModelError | null {
  if (status >= 200 && status < 300) return null;
  if (status >= 300 && status < 400) return new ModelError("REDIRECT");
  if (status === 401 || status === 403) return new ModelError("AUTH");
  if (status === 402) return new ModelError("QUOTA");
  if (status === 404) return new ModelError("NOT_FOUND");
  if (status === 429) return new ModelError("RATE_LIMIT");
  return new ModelError(status >= 500 ? "UPSTREAM" : "PARAMETERS");
}

/** Shared wire reader; tests inject only the socket factory, not the parser. */
export function postCompletion(makeRequest: (handler: (res: IncomingMessage) => void) => ClientRequest, payload: string, signal: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: ModelError, result?: unknown) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      if (error) reject(error); else resolve(result);
    };
    const req = makeRequest(res => {
      const error = statusError(res.statusCode ?? 0);
      if (error) { finish(error); res.destroy(); return; }
      let size = 0;
      const chunks: Buffer[] = [];
      res.on("data", (part: Buffer) => {
        size += part.length;
        if (size > 1024 * 1024) { finish(new ModelError("RESPONSE_LIMIT")); res.destroy(); req.destroy(); }
        else chunks.push(part);
      });
      res.on("error", () => finish(signal.aborted ? abortError(signal) : new ModelError("NETWORK")));
      res.on("end", () => {
        try { finish(undefined, JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
        catch { finish(new ModelError("PROTOCOL")); }
      });
    });
    const abort = () => { finish(abortError(signal)); req.destroy(); };
    req.on("error", () => finish(signal.aborted ? abortError(signal) : new ModelError("NETWORK")));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { abort(); return; }
    req.end(payload);
  });
}
export type ModelTransport = (url: URL, apiKey: string, payload: string, signal: AbortSignal) => Promise<unknown>;

export const secureTransport: ModelTransport = async (url, apiKey, payload, signal) => {
  if (url.protocol !== "https:") throw new ModelError("UNSAFE_ENDPOINT");
  // DNS may outlive the OS resolver; abort this wait too, before sending credentials.
  const records = await new Promise<Awaited<ReturnType<typeof resolvePublic>>>((resolve, reject) => {
    const abort = () => reject(abortError(signal));
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    resolvePublic(url.hostname).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
  if (signal.aborted) throw abortError(signal);
  const target = records[0];
  return postCompletion(handler => request(url, {
    method: "POST", signal, family: target.family,
    // Pin the checked IP while retaining the URL hostname for TLS verification.
    lookup: (_hostname, _options, callback) => callback(null, target.address, target.family),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json", "Content-Length": Buffer.byteLength(payload) },
  }, handler), payload, signal);
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
export async function generateText(config: ModelConfig, apiKey: string, prompt: string, signal: AbortSignal, transport: ModelTransport = secureTransport): Promise<ModelResult> {
  const started = performance.now();
  const combined = AbortSignal.any([signal, AbortSignal.timeout(config.timeoutSeconds * 1000)]);
  try {
    const raw = record(await transport(new URL(config.baseUrl + "/chat/completions"), apiKey, JSON.stringify({
      model: config.model, messages: [{ role: "user", content: prompt }], stream: false, [config.tokenField]: config.maxTokens,
    }), combined));
    if (combined.aborted) throw abortError(combined);
    if (!raw || !Array.isArray(raw.choices) || !raw.choices.length) throw new ModelError("PROTOCOL");
    const choice = record(raw.choices[0]);
    const message = record(choice?.message);
    if (!message || (message.role !== undefined && message.role !== "assistant") || (message.content !== null && typeof message.content !== "string")) throw new ModelError("PROTOCOL");
    if (!message.content || !(message.content as string).trim()) throw new ModelError("EMPTY_RESPONSE");
    const usage = record(raw.usage);
    const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null;
    return {
      text: (message.content as string).split(apiKey).join("[密钥已隐藏]"),
      model: typeof raw.model === "string" && raw.model.length <= 160 && !raw.model.includes(apiKey) ? raw.model : config.model,
      durationMs: Math.round(performance.now() - started), truncated: choice?.finish_reason === "length",
      usage: { input: count(usage?.prompt_tokens), output: count(usage?.completion_tokens) },
    };
  } catch (error) {
    if (combined.aborted) throw abortError(combined);
    if (error instanceof ModelError) throw error;
    throw new ModelError("NETWORK");
  }
}
