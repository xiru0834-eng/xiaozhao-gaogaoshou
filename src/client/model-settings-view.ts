import { required } from "./dom.ts";
import { moduleIdentity, moduleCompanion } from "./module-identity.ts";
import "./model-settings.css";

export function modelSettingsView() {
  const page = document.createElement("section");
  page.className = "content model-page";
  page.hidden = true;
  page.setAttribute("aria-labelledby", "model-heading");
  // Static markup only. All provider/user content is rendered with textContent/value.
  page.innerHTML = `
    <button type="button" class="text-button module-back" data-model="back">← 返回投递工作台</button>
    <div class="model-page-heading module-heading">
      ${moduleIdentity('models')}<div class="module-heading-copy"><h1 id="model-heading" tabindex="-1">连接你的模型</h1><p>先接通，再试一句。把 AI 变成得心应手的小助手。</p></div>${moduleCompanion}
      <span class="model-badge" data-model="badge">尚未配置</span>
    </div>
    <p class="model-notice">本轮支持 OpenAI 兼容的 Chat Completions 文本接口；不自动搜岗，不发送你的简历或投递记录。</p>
    <div class="model-layout">
      <form class="model-form" data-model="form">
        <div class="module-section-title"><span aria-hidden="true">01</span><h2>连接配置</h2><small>仅本机保存</small></div><p class="model-subtitle">填入服务商提供的信息。保存不会调用模型。</p>
        <fieldset data-model="fields" disabled>
          <label for="model-url">API 地址 <span>Base URL</span></label>
          <input id="model-url" data-model="url" type="url" required maxlength="500" placeholder="https://api.example.com/v1" autocomplete="off" spellcheck="false" aria-describedby="model-endpoint-help">
          <p id="model-endpoint-help" class="model-help">使用 HTTPS 公网地址。可粘贴以 /chat/completions 结尾的完整地址。</p>
          <label for="model-id">模型 ID</label>
          <input id="model-id" data-model="model" required maxlength="160" placeholder="填写服务商控制台中的模型 ID" autocomplete="off" spellcheck="false">
          <label for="model-key">API Key <span data-model="key-note">尚未保存</span></label>
          <div class="model-key-row"><input id="model-key" data-model="key" type="password" maxlength="4096" placeholder="输入密钥，仅本机加密保存" autocomplete="off" spellcheck="false"><button class="action" type="button" data-model="clear-key" hidden>清除已存密钥</button></div>
          <p class="model-help">Windows 当前账户加密保护；已存密钥不回显。更换地址时须重新输入密钥。</p>
          <details class="model-advanced"><summary>请求限制与兼容选项</summary>
            <div class="model-options"><div><label for="model-timeout">超时（秒）</label><input id="model-timeout" data-model="timeout" type="number" min="10" max="120" step="1" value="30" required></div><div><label for="model-tokens">输出上限（tokens）</label><input id="model-tokens" data-model="tokens" type="number" min="32" max="4096" step="1" value="512" required></div></div>
            <label for="model-token-field">Token 参数</label><select id="model-token-field" data-model="token-field"><option value="max_tokens">max_tokens（常见兼容服务）</option><option value="max_completion_tokens">max_completion_tokens</option></select>
            <p class="model-help">不支持的参数不会偷偷替换重发。推理模型可能在预算内只思考、不返回文本；请按服务商说明选择。</p>
          </details>
          <div class="model-endpoint"><span>实际请求地址</span><code data-model="endpoint">填入地址后显示</code></div>
          <div class="model-buttons"><button class="action primary" type="submit" data-model="save">保存配置</button><button class="action" type="button" data-model="test" disabled>测试连接</button></div>
        </fieldset>
        <p class="model-help">测试会发送一条固定短消息，最多 64 个输出 tokens，可能产生费用。不会自动重试。</p>
      </form>
      <section class="model-lab" aria-labelledby="model-lab-title">
        <div class="module-section-title"><span aria-hidden="true">02</span><h2 id="model-lab-title">试着聊一句</h2><small>独立试用区</small></div><p class="model-subtitle">直接验证能否生成回答，只发送你在这里输入的内容。</p>
        <label for="model-prompt">测试内容</label><textarea id="model-prompt" data-model="prompt" rows="4" maxlength="2000" placeholder="例如：用一句话解释 RAG。" disabled></textarea>
        <div class="model-buttons"><button class="action primary" data-model="generate" type="button" disabled>发送并生成</button><button class="action" data-model="cancel" type="button" hidden>停止请求</button></div>
        <p class="model-help">最多 2,000 字符；单次独立对话，不存历史。关闭页面会取消等待，但不保证免计费。</p>
        <div class="model-feedback" data-model="feedback" role="status" aria-live="polite">打开设置后读取当前配置。</div>
        <button class="text-button" data-model="reload" type="button" hidden>重新读取配置</button>
        <div class="model-answer" data-model="answer-wrap" hidden><h3 data-model="answer-title">模型回复</h3><p data-model="answer-meta"></p><pre data-model="answer"></pre></div>
        <p class="model-privacy">密钥只发往你指定的服务地址，请仅使用可信服务。未配置模型时，公司的查看、筛选和进度记录均不受影响。</p>
      </section>
    </div>`;
  const node = <T extends HTMLElement>(name: string) => required<T>(`[data-model="${name}"]`, page);
  return { page, node };
}
