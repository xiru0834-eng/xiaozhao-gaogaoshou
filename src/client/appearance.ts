import { paletteFor, readAppearance, saveAppearance, skinOf, type Appearance, type AppearanceStorage } from './appearance-model.ts';
import { appearanceView } from './appearance-view.ts';
import { required } from './dom.ts';
import './appearance.css';

export function mountAppearance(notify: (message: string) => void) {
  let storage: AppearanceStorage | undefined;
  try { storage = window.localStorage; } catch { /* Private/blocked storage: keep appearance in memory. */ }
  let current = readAppearance(storage), draft = { ...current };
  const root = document.documentElement;
  const toggle = required<HTMLButtonElement>('#theme-toggle');
  const brand = required<HTMLImageElement>('.brand img');
  const originalImage = brand.src;
  const brandCharacter = document.createElement('span');
  brandCharacter.className = 'skin-brand character-sprite'; brandCharacter.setAttribute('aria-hidden', 'true');
  brand.after(brandCharacter);
  const launch = document.createElement('button');
  launch.type = 'button'; launch.className = 'action appearance-launch'; launch.id = 'appearance-open';
  launch.setAttribute('aria-haspopup', 'dialog'); launch.setAttribute('aria-controls', 'appearance-dialog');
  launch.innerHTML = '<span class="appearance-dot" aria-hidden="true"></span>换肤';
  toggle.before(launch);
  const companion = document.createElement('button');
  companion.type = 'button'; companion.className = 'skin-companion'; companion.hidden = true;
  companion.innerHTML = '<span class="character-sprite" aria-hidden="true"></span><span class="companion-caption"><strong></strong><small></small></span>';
  required('.side-progress').before(companion);
  const { dialog, node } = appearanceView();
  document.body.append(dialog);
  let opener: HTMLElement = launch;

  function character(target: HTMLElement, id: Appearance['skin']) {
    const skin = skinOf(id);
    target.style.backgroundImage = `url("${skin.image || originalImage}")`;
    target.style.backgroundPosition = skin.position;
    // The blue cell needs a small inner crop so the neighboring ponytail cannot bleed in.
    target.style.backgroundSize = skin.id === 'blue' ? '210% 210%' : skin.image ? '200% 200%' : 'contain';
  }

  function color(target: HTMLElement, value: Appearance) {
    target.dataset.skin = value.skin; target.dataset.theme = value.mode;
    target.style.colorScheme = value.mode;
    for (const [key, val] of Object.entries(paletteFor(value.skin, value.mode))) target.style.setProperty(`--${key}`, val);
  }
  function apply() {
    const skin = skinOf(current.skin);
    color(root, current);
    root.dataset.characters = String(current.characters);
    brand.hidden = !current.characters || !!skin.image;
    brandCharacter.hidden = !current.characters || !skin.image;
    if (skin.image && current.characters) character(brandCharacter, skin.id);
    companion.hidden = !current.characters || !skin.image;
    if (skin.image && current.characters) character(companion.querySelector<HTMLElement>('.character-sprite')!, skin.id);
    companion.querySelector('strong')!.textContent = skin.name;
    companion.querySelector('small')!.textContent = skin.caption;
    companion.setAttribute('aria-label', `${skin.name}，更换主题`);
    launch.title = `当前：${skin.name} · ${current.mode === 'dark' ? '深色' : '浅色'}`;
    toggle.textContent = current.mode === 'dark' ? '☾' : '☼';
    toggle.setAttribute('aria-label', current.mode === 'dark' ? '切换到浅色主题' : '切换到深色主题');
    toggle.title = current.mode === 'dark' ? '切换到浅色主题' : '切换到深色主题';
  }
  function preview() {
    const skin = skinOf(draft.skin), palette = paletteFor(draft.skin, draft.mode);
    color(dialog, draft);
    dialog.dataset.characters = String(draft.characters);
    node('name').textContent = skin.name;
    node('mood').textContent = skin.mood;
    node('subtitle').textContent = skin.subtitle;
    node('quote').textContent = `「${skin.caption}」`;
    const portrait = node('portrait');
    portrait.hidden = !draft.characters;
    character(portrait, skin.id);
    portrait.setAttribute('aria-label', `${skin.name}：${skin.detail}`);
    node('monogram').hidden = draft.characters;
    node('monogram').textContent = skin.name;
    node('swatches').replaceChildren(...['accent', 'sidebar', 'accent-soft', 'bg'].map(key => {
      const dot = document.createElement('i'); dot.style.background = palette[key]; return dot;
    }));
    dialog.querySelectorAll<HTMLInputElement>('[name="skin-choice"]').forEach(input => { input.checked = input.value === draft.skin; });
    dialog.querySelectorAll<HTMLInputElement>('[name="skin-mode"]').forEach(input => { input.checked = input.value === draft.mode; });
    node<HTMLInputElement>('characters').checked = draft.characters;
  }
  function open(source: HTMLElement) {
    opener = source; draft = { ...current }; preview();
    // Loading the workbench alone does not download unused character packs.
    dialog.querySelectorAll<HTMLElement>('[data-image]').forEach(el => character(el, skinOf(el.dataset.image).id));
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>('[name="skin-choice"]:checked')!.focus();
  }
  launch.addEventListener('click', () => open(launch));
  companion.addEventListener('click', () => open(companion));
  dialog.addEventListener('close', () => { (opener.hidden ? launch : opener).focus(); });
  dialog.addEventListener('change', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.name === 'skin-choice') draft.skin = skinOf(input.value).id;
    else if (input.name === 'skin-mode') draft.mode = input.value === 'dark' ? 'dark' : 'light';
    else draft.characters = input.checked;
    preview();
  });
  node('close').addEventListener('click', () => dialog.close());
  node('reset').addEventListener('click', () => { draft = { skin: 'mint', mode: draft.mode, characters: true }; preview(); });
  node('apply').addEventListener('click', () => {
    current = { ...draft }; apply();
    const saved = saveAppearance(storage, current);
    dialog.close();
    notify(saved ? `已换上「${skinOf(current.skin).name}」${current.characters ? '' : ' · 已隐藏角色'}` : '外观已用于本次会话；浏览器存储不可用，刷新后可能无法保留。');
  });
  toggle.addEventListener('click', () => {
    current = { ...current, mode: current.mode === 'dark' ? 'light' : 'dark' }; apply();
    const saved = saveAppearance(storage, current);
    notify(saved ? `已切换${current.mode === 'dark' ? '深色' : '浅色'}主题` : '明暗已切换；浏览器存储不可用，本次会话有效。');
  });
  apply();
}
