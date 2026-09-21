/** Presentation only: never infer qualifications or mutate the company catalog. */
export function roleKeywords(roles: string): string[] {
  const matches = roles.match(/大模型|人工智能|智能体|多模态|机器学习|深度学习|全栈|量化|\b(?:AIGC|RAG|Agent|AI|Python|Java|LLM|MCP)\b|C\+\+/gi) ?? [];
  const canonical: Record<string, string> = { agent: 'Agent', python: 'Python', java: 'Java' };
  return [...new Set(matches.map(word => canonical[word.toLowerCase()] ?? (/^[a-z]+$/i.test(word) ? word.toUpperCase() : word)))].slice(0, 3);
}

export function deadlineNotice(count: number, active: boolean) {
  return {
    title: count > 0 ? '别错过，这一批机会' : '按自己的节奏，继续下一站',
    detail: count > 0
      ? `当前筛选中有 ${count} 家公司在 7 天内截止。日期来自目录，投前请核对官网。`
      : '当前筛选没有 7 天内截止的公司。也可以看看其他机会。',
    action: active ? '取消截止筛选' : '查看近期截止',
    pressed: active,
  };
}

/** Session-only presentation preference. No catalog, filter or progress writes. */
export function mountWorkbenchOverview(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>('#overview-toggle');
  if (!button) return;
  let expanded = true;
  const update = () => {
    root.dataset.focus = String(!expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? '收起概览 ↑' : '展开概览 ↓';
  };
  button.addEventListener('click', () => { expanded = !expanded; update(); });
  update();
}

export function placeMenu(
  anchor: { left: number; right: number; top: number; bottom: number },
  panel: { width: number; height: number },
  viewport: { width: number; height: number; top: number },
) {
  const edge = 12, gap = 8;
  const below = Math.max(0, viewport.height - anchor.bottom - gap - edge);
  const above = Math.max(0, anchor.top - viewport.top - gap - edge);
  const upwards = below < Math.min(panel.height, 240) && above > below;
  const maxHeight = Math.min(panel.height, upwards ? above : below);
  return {
    left: Math.max(edge, Math.min(anchor.right - panel.width, viewport.width - panel.width - edge)),
    top: upwards ? anchor.top - gap - maxHeight : anchor.bottom + gap,
    maxHeight,
  };
}

/** Position workbench and export menus within the viewport; no application state changes. */
export function mountWorkbenchMenus() {
  const menus = [...document.querySelectorAll<HTMLDetailsElement>('#advanced-filters, #view-options, #export-menu')];
  const fit = () => {
    for (const menu of menus) {
      const panel = menu.querySelector<HTMLElement>('.filter-panel, .menu-panel');
      const summary = menu.querySelector('summary');
      if (!menu.open || !panel || !summary) continue;
      const parent = menu.getBoundingClientRect();
      const position = placeMenu(summary.getBoundingClientRect(),
        {width: panel.getBoundingClientRect().width, height: Math.min(panel.scrollHeight + 2, 480)},
        {width: document.documentElement.clientWidth, height: window.innerHeight,
          top: document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 0});
      panel.style.left = `${position.left - parent.left}px`;
      panel.style.right = 'auto';
      panel.style.top = `${position.top - parent.top}px`;
      panel.style.maxHeight = `${position.maxHeight}px`;
      panel.style.overflowY = 'auto';
    }
  };
  let scheduled = false;
  const scheduleFit = () => {
    if (scheduled || !menus.some(menu => menu.open)) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; fit(); });
  };
  menus.forEach(menu => menu.addEventListener('toggle', scheduleFit));
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('scroll', scheduleFit, {passive: true});
}
