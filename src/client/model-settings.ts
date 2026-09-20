import { ModelError, object, parseModelConfig, revision, type ModelResult, type ModelSettingsView } from "../shared/model-contract.ts";
import type { DataSession } from "./session.ts";
import { required } from "./dom.ts";
import { modelSettingsView } from "./model-settings-view.ts";

export function mountModelSettings(session: DataSession) {
  const { page, node } = modelSettingsView();
  const workbench = required<HTMLElement>(".main-shell > .content");
  const workspace = required<HTMLElement>(".workspace");
  const breadcrumb = required<HTMLElement>(".breadcrumb span:last-child");
  const originalBreadcrumb = breadcrumb.textContent;
  workbench.after(page);
  const launch = document.createElement("button");
  launch.type = "button"; launch.className = "action"; launch.textContent = "模型设置";
  launch.setAttribute("aria-pressed", "false");
  required(".header-tools").prepend(launch);
  const form = node<HTMLFormElement>("form");
  const fields = node<HTMLFieldSetElement>("fields");
  const input = (name: string) => node<HTMLInputElement>(name);
  const button = (name: string) => node<HTMLButtonElement>(name);
  const feedback = node("feedback");
  const promptInput = node<HTMLTextAreaElement>("prompt");
  let saved: ModelSettingsView | null = null;
  let dirty = false;
  let busy: "load" | "save" | "run" | null = null;
  let keyAction: "keep" | "clear" = "keep";
  let verified = false;
  let epoch = 0;
  let request: AbortController | null = null;
  function say(text: string, kind = "info") { feedback.textContent = text; feedback.dataset.kind = kind; }
  function renderState() {
    fields.disabled = !saved || busy !== null;
    button("save").disabled = !saved || !dirty || busy !== null;
    button("save").textContent = busy === "save" ? "正在加密保存…" : "保存配置";
    const callable = !!saved?.config && saved.hasKey && !dirty && busy === null;
    button("test").disabled = !callable;
    button("generate").disabled = !callable || !promptInput.value.trim();
    promptInput.disabled = !saved || busy !== null;
    button("reload").disabled = busy !== null;
    button("cancel").hidden = busy !== "run";
    node("badge").textContent = busy === "run" ? "正在请求" : dirty ? "有未保存修改" : verified ? "本次生成已验证" : saved?.hasKey ? "已保存 · 尚未测试" : "尚未配置密钥";
    node("badge").dataset.state = verified && !dirty && !busy ? "success" : "idle";
    node("key-note").textContent = keyAction === "clear" ? "保存后清除" : saved?.hasKey ? "已加密保存 · 留空保留" : "尚未保存";
    button("clear-key").hidden = !saved?.hasKey || keyAction === "clear";
  }
  function values() {
    return parseModelConfig({ baseUrl: input("url").value.trim(), model: input("model").value.trim(), timeoutSeconds: Number(input("timeout").value), maxTokens: Number(input("tokens").value), tokenField: node<HTMLSelectElement>("token-field").value });
  }
  function preview() {
    try { node("endpoint").textContent = values().baseUrl + "/chat/completions"; }
    catch { node("endpoint").textContent = input("url").value ? "完整、有效的配置填写后显示" : "填入地址后显示"; }
  }
  function accept(raw: unknown) {
    const data = object(raw);
    if (typeof data.hasKey !== "boolean" || !(data.updatedAt === null || typeof data.updatedAt === "string")) throw new ModelError("PROTOCOL");
    saved = { revision: revision(data.revision), config: data.config === null ? null : parseModelConfig(data.config), hasKey: data.hasKey, updatedAt: data.updatedAt as string | null };
    const config = saved.config;
    input("url").value = config?.baseUrl ?? ""; input("model").value = config?.model ?? "";
    input("timeout").value = String(config?.timeoutSeconds ?? 30); input("tokens").value = String(config?.maxTokens ?? 512);
    node<HTMLSelectElement>("token-field").value = config?.tokenField ?? "max_tokens";
    input("key").value = ""; input("key").placeholder = saved.hasKey ? "已保存，留空保留；输入新值可替换" : "输入密钥，仅本机加密保存";
    keyAction = "keep"; dirty = false; verified = false; preview();
    return saved;
  }
  function failure(error: unknown) {
    verified = false;
    say(error instanceof ModelError ? error.message : error instanceof Error && /本机|资料/.test(error.message) ? error.message : "请求未完成。请检查本机服务是否运行；未自动重试。", "error");
    if (error instanceof ModelError && error.code === "CONFLICT") button("reload").hidden = false;
  }
  async function load() {
    const current = ++epoch;
    busy = "load"; saved = null; dirty = false; verified = false; button("reload").hidden = true;
    node("answer-wrap").hidden = true; say("正在读取本机配置…"); renderState();
    try {
      const data = await session.modelRequest("/api/model-settings");
      if (current !== epoch) return;
      const loaded = accept(data.settings);
      say(loaded.hasKey ? "配置已读取。点击测试连接才会发起模型请求。" : "先填写连接信息并保存，再测试或试用。");
    } catch (error) { if (current === epoch) { failure(error); button("reload").hidden = false; } }
    finally { if (current === epoch) { busy = null; renderState(); } }
  }
  function close() {
    if (busy === "save") { say("正在保存，请等待完成后返回。"); return false; }
    if (dirty && !window.confirm("配置尚未保存，返回将放弃修改。确定返回吗？")) return false;
    epoch++; request?.abort(); request = null; busy = null;
    dirty = false; input("key").value = ""; promptInput.value = ""; node("answer").textContent = "";
    page.hidden = true; workbench.hidden = false; delete workspace.dataset.page;
    launch.setAttribute("aria-pressed", "false"); launch.focus();
    breadcrumb.textContent = originalBreadcrumb;
    return true;
  }
  launch.addEventListener("click", () => {
    if (!page.hidden) { close(); return; }
    if (!window.dispatchEvent(new CustomEvent("workspace:navigate", { cancelable: true, detail: "models" }))) return;
    page.hidden = false; workbench.hidden = true; workspace.dataset.page = "models";
    breadcrumb.textContent = "模型设置";
    launch.setAttribute("aria-pressed", "true"); required<HTMLElement>("#model-heading", page).focus();
    window.scrollTo({ top: 0 }); void load();
  });
  button("back").addEventListener("click", close);
  window.addEventListener("workspace:navigate", event => { if ((event as CustomEvent).detail !== "models" && !page.hidden && !close()) event.preventDefault(); });
  // Restore the workbench before its existing navigation handlers run.
  for (const selector of [".brand", "#open-help"]) required(selector).addEventListener("click", event => {
    if (!page.hidden && !close()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, { capture: true });
  button("reload").addEventListener("click", () => { if (!dirty || window.confirm("重新读取将放弃未保存的修改，继续吗？")) void load(); });
  form.addEventListener("input", () => { dirty = true; verified = false; node("answer-wrap").hidden = true; preview(); say("配置已修改，请先保存。旧测试结果不再代表当前配置。"); renderState(); });
  button("clear-key").addEventListener("click", () => { keyAction = "clear"; input("key").value = ""; dirty = true; verified = false; node("answer-wrap").hidden = true; say("点击保存配置后清除密钥；台账数据不会改变。"); renderState(); });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!saved || busy) return;
    let config;
    try { config = values(); } catch (error) { failure(error); return; }
    busy = "save"; const current = epoch; renderState();
    say("正在保护密钥并保存配置…");
    const apiKey = input("key").value.trim();
    try {
      const data = await session.modelRequest("/api/model-settings", { expectedRevision: saved.revision, config, keyAction: apiKey ? "replace" : keyAction, ...(apiKey ? { apiKey } : {}) });
      if (current !== epoch) return;
      const updated = accept(data.settings); node("answer-wrap").hidden = true; button("reload").hidden = true;
      say(updated.hasKey ? "已保存到本机。尚未验证连接；请点击测试连接。" : "配置已保存，目前没有密钥。填写 API Key 并保存后才能调用模型。", "success");
    } catch (error) { if (current === epoch) failure(error); }
    finally { if (current === epoch) { busy = null; renderState(); } }
  });
  async function run(test: boolean) {
    if (!saved || !saved.hasKey || dirty || busy) return;
    const prompt = promptInput.value.trim();
    if (!test && !prompt) return;
    busy = "run"; verified = false; const current = epoch;
    const controller = new AbortController(); request = controller;
    node("answer-wrap").hidden = true; renderState();
    say(test ? "正在向已保存的地址发送短消息测试，可能产生少量费用…" : "正在生成回答。你可以停止请求，但服务商可能已经计费。");
    try {
      const data = await session.modelRequest(test ? "/api/model-tests" : "/api/model-generations", { expectedRevision: saved.revision, ...(!test ? { prompt } : {}) }, controller.signal);
      if (current !== epoch || controller.signal.aborted) return;
      const result = data.result as ModelResult;
      if (!result || typeof result.text !== "string" || typeof result.model !== "string" || !Number.isFinite(result.durationMs) || !result.usage) throw new ModelError("PROTOCOL");
      verified = true;
      node("answer-title").textContent = test ? "连接测试 · 实际回复" : "模型回复";
      node("answer").textContent = result.text;
      node("answer-meta").textContent = `${result.model} · ${(result.durationMs / 1000).toFixed(2)} 秒 · 输入 ${result.usage.input ?? "未报告"} / 输出 ${result.usage.output ?? "未报告"} tokens`;
      node("answer-wrap").hidden = false;
      say(result.truncated ? "已收到文本，达到输出上限，回答可能不完整。可调整上限后再手动试用。" : "已收到真实文本响应。验证仅代表本次配置与调用；不代表已开启自动搜岗。", "success");
    } catch (error) { if (current === epoch) { if (controller.signal.aborted) say(new ModelError("CANCELLED").message); else failure(error); } }
    finally { if (current === epoch) { busy = null; request = null; renderState(); } }
  }
  button("test").addEventListener("click", () => void run(true));
  button("generate").addEventListener("click", () => void run(false));
  button("cancel").addEventListener("click", () => request?.abort());
  promptInput.addEventListener("input", renderState);
  window.addEventListener("beforeunload", event => { if (dirty || busy === "save") event.preventDefault(); });
  window.addEventListener("pagehide", () => { request?.abort(); input("key").value = ""; });
}
