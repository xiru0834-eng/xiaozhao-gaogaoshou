export interface ModelConfig {
  baseUrl: string;
  model: string;
  timeoutSeconds: number;
  maxTokens: number;
  tokenField: "max_tokens" | "max_completion_tokens";
}
export interface ModelSettingsView {
  revision: number;
  config: ModelConfig | null;
  hasKey: boolean;
  updatedAt: string | null;
}
export interface ModelResult {
  text: string;
  model: string;
  durationMs: number;
  truncated: boolean;
  usage: { input: number | null; output: number | null };
}
export const MODEL_ERRORS = {
  VALIDATION: "请检查地址、模型 ID、密钥及数值范围。地址只支持 HTTPS，不能携带查询参数或账号密码。",
  NOT_CONFIGURED: "请先保存模型地址、模型 ID 和 API Key。",
  CONFLICT: "配置已在另一处更新，请重新打开设置后再操作。",
  KEY_REENTRY: "服务地址已改变，请重新输入新服务的 API Key，或清除原密钥。",
  SECRET_STORAGE: "无法使用 Windows 用户密钥保护。请在当前 Windows 账户重试；不会改用明文保存。",
  SETTINGS_CORRUPT: "模型配置文件无法读取。台账不受影响；请检查资料目录，不要删除投递数据库。",
  SAVE_FAILED: "保存失败，原配置保留。请检查资料目录权限和磁盘空间。",
  AUTH: "服务拒绝了 API Key。请核对密钥、服务地址和模型使用权限。",
  NOT_FOUND: "接口或模型不存在，请核对完整请求地址和服务商提供的模型 ID。",
  RATE_LIMIT: "服务限流或额度不足。请检查服务商控制台后再试，系统不会自动重试。",
  QUOTA: "服务余额或配额不足，请到服务商控制台检查。",
  TIMEOUT: "请求超时。可检查网络或调高超时；本次可能已计费，不会自动重发。",
  CANCELLED: "已停止等待并取消上游连接；服务商可能已经产生费用。",
  NETWORK: "连接失败，请检查网络、HTTPS 证书和域名。当前不支持系统代理或自签名证书。",
  UNSAFE_ENDPOINT: "地址解析到了本机、内网或保留网段。此版本只支持公网 HTTPS 模型服务。",
  REDIRECT: "服务返回重定向。为避免泄露密钥已停止，请填写最终的 HTTPS API 地址。",
  PROTOCOL: "返回内容不是兼容的 Chat Completions 文本响应，请核对服务协议。",
  EMPTY_RESPONSE: "服务没有返回可显示的文本。可能是模型拒答、推理耗尽预算或协议不兼容；请检查模型与输出上限。",
  RESPONSE_LIMIT: "服务响应超过安全大小限制，已停止接收。",
  UPSTREAM: "模型服务暂时失败，请稍后手动重试。",
  PARAMETERS: "服务不接受当前请求参数。请核对模型 ID 和 Token 参数类型，或查看服务商兼容说明。",
  BUSY: "当前已有模型请求，请等待完成或先停止。",
  LOCAL_LIMIT: "已达到每分钟 6 次的本机调用上限，请稍后再试。",
} as const;
export type ModelErrorCode = keyof typeof MODEL_ERRORS;
export class ModelError extends Error {
  readonly code: ModelErrorCode;
  constructor(code: ModelErrorCode) { super(MODEL_ERRORS[code]); this.code = code; }
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ModelError("VALIDATION");
  return value as Record<string, unknown>;
}
export function revision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new ModelError("VALIDATION");
  return value as number;
}
export function parseModelConfig(input: unknown): ModelConfig {
  const value = object(input);
  if (Object.keys(value).some(k => !["baseUrl", "model", "timeoutSeconds", "maxTokens", "tokenField"].includes(k))) throw new ModelError("VALIDATION");
  if (typeof value.baseUrl !== "string" || value.baseUrl.length > 500 || /[%\\\s]/.test(value.baseUrl)) throw new ModelError("VALIDATION");
  let url: URL;
  try { url = new URL(value.baseUrl); } catch { throw new ModelError("VALIDATION"); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || !url.hostname || !/^\/[a-zA-Z0-9/_.-]*$/.test(url.pathname)) throw new ModelError("VALIDATION");
  url.pathname = url.pathname.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
  if (typeof value.model !== "string" || !value.model.trim() || value.model.length > 160 || /[\x00-\x1f\x7f]/.test(value.model)) throw new ModelError("VALIDATION");
  if (!Number.isInteger(value.timeoutSeconds) || (value.timeoutSeconds as number) < 10 || (value.timeoutSeconds as number) > 120 || !Number.isInteger(value.maxTokens) || (value.maxTokens as number) < 32 || (value.maxTokens as number) > 4096 || !["max_tokens", "max_completion_tokens"].includes(value.tokenField as string)) throw new ModelError("VALIDATION");
  return { baseUrl: url.href.replace(/\/+$/, ""), model: value.model.trim(), timeoutSeconds: value.timeoutSeconds as number, maxTokens: value.maxTokens as number, tokenField: value.tokenField as ModelConfig["tokenField"] };
}
