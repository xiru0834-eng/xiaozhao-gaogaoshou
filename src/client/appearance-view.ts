import { SKINS } from './appearance-model.ts';

export function appearanceView() {
  const dialog = document.createElement('dialog');
  dialog.id = 'appearance-dialog';
  dialog.className = 'appearance-dialog';
  dialog.setAttribute('aria-labelledby', 'appearance-title');
  dialog.innerHTML = `
    <header class="appearance-heading">
      <div><p class="appearance-kicker">给日常一点喜欢</p><h2 id="appearance-title">主题衣橱<span> / 05</span></h2></div>
      <button class="action icon-button" data-a="close" type="button" aria-label="关闭主题衣橱">×</button>
    </header>
    <div class="appearance-body">
      <section class="skin-preview" data-a="preview" aria-label="主题预览">
        <div class="skin-art"><div class="character-sprite" data-a="portrait" role="img"></div><span class="skin-monogram" data-a="monogram" aria-hidden="true"></span></div>
        <div class="skin-caption"><p data-a="mood"></p><h3 data-a="name"></h3><p data-a="subtitle"></p><blockquote data-a="quote"></blockquote><div class="skin-swatches" data-a="swatches" aria-hidden="true"></div></div>
      </section>
      <div class="appearance-options">
        <fieldset class="skin-choices"><legend>挑一个今天的心情</legend>
        ${SKINS.map((skin, i) => `<label class="skin-choice${skin.id === 'mint' ? ' is-original' : ''}">
          <input type="radio" name="skin-choice" value="${skin.id}">
          <span class="skin-thumb" style="--thumb:${skin.swatch}"><span class="character-sprite" data-image="${skin.id}" aria-hidden="true"></span></span>
          <span class="skin-choice-label"><strong>${skin.name}</strong><small>${skin.mood}</small></span>
          <span class="skin-index" aria-hidden="true">0${i + 1}</span><span class="skin-check" aria-hidden="true">✓</span>
        </label>`).join('')}
        </fieldset>
        <fieldset class="skin-mode"><legend>明暗模式</legend>
          <label><input type="radio" name="skin-mode" value="light"><span>☼ 浅色</span></label>
          <label><input type="radio" name="skin-mode" value="dark"><span>☾ 深色</span></label>
        </fieldset>
        <label class="skin-character-option"><span><strong>角色陪伴</strong><small>点缀概览与模块，不遮挡表单和公司清单</small></span><input data-a="characters" type="checkbox" role="switch" aria-label="角色陪伴"></label>
        <p class="appearance-note">五位搭档，各有自己的性格。原创角色由 AI 辅助绘制；外观只存当前浏览器，不修改投递数据。</p>
      </div>
    </div>
    <footer class="appearance-footer"><button class="text-button" data-a="reset" type="button">恢复薄荷石墨</button><span data-a="preview-note" role="status">仅预览，应用后生效</span><button class="action primary" data-a="apply" type="button">使用这套皮肤</button></footer>`;
  return { dialog, node: <T extends HTMLElement = HTMLElement>(key: string) => dialog.querySelector<T>(`[data-a="${key}"]`)! };
}
