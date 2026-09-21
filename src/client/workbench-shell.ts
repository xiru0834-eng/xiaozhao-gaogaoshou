/** Presentation-only navigation: reuse the original buttons and their guarded handlers. */
export const WORKBENCH_MODULES = [
  {id: 'open-workbench', page: 'workbench', label: '机会清单', path: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'},
  {id: 'open-schedules', page: 'schedules', label: '面试日程', path: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-14 5h3m4 0h3"/>'},
  {id: 'open-daily', page: 'daily', label: '每日更新', path: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="m3 7 9 7 9-7M9 3h6"/>'},
  {id: 'open-updates', page: 'updates', label: '岗位更新', path: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>'},
  {id: 'open-model', page: 'models', label: '模型设置', path: '<rect x="4" y="6" width="16" height="14" rx="4"/><path d="M12 3v3m-4 5h.01M16 11h.01M9 16h6M1 11v4m22-4v4"/>'},
] as const;

export function activeModule(page?: string): string {
  return WORKBENCH_MODULES.find(item => item.page === page)?.id ?? 'open-workbench';
}

export function requestWorkbenchNavigation(events: EventTarget, onAccepted: () => void): boolean {
  if (!events.dispatchEvent(new CustomEvent('workspace:navigate', {cancelable: true, detail: 'workbench'}))) return false;
  onAccepted();
  return true;
}

export function mountWorkbenchShell() {
  const workspace = document.querySelector<HTMLElement>('.workspace');
  const sidebar = document.querySelector<HTMLElement>('.sidebar');
  const workbench = document.querySelector<HTMLElement>('.workbench');
  if (!workspace || !sidebar || !workbench || document.getElementById('workspace-navigation')) return;
  const nav = document.createElement('nav');
  nav.id = 'workspace-navigation';
  nav.className = 'workspace-navigation';
  nav.setAttribute('aria-label', '工作台模块');
  const home = document.createElement('button');
  home.id = 'open-workbench';
  home.type = 'button';
  home.addEventListener('click', () => {
    requestWorkbenchNavigation(window, () => {
      workbench.hidden = false;
      delete workspace.dataset.page;
      const breadcrumb = document.querySelector('.breadcrumb span:last-child');
      if (breadcrumb) breadcrumb.textContent = '公司与投递';
      const heading = workbench.querySelector('h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({preventScroll: true});
      window.scrollTo({top: 0});
    });
  });
  for (const item of WORKBENCH_MODULES) {
    const button = item.id === home.id ? home : document.getElementById(item.id);
    if (!(button instanceof HTMLButtonElement)) continue;
    button.classList.add('workspace-nav-item');
    button.setAttribute('title', item.label);
    // Static icon paths only. Moving, not cloning, retains event listeners and dirty-state guards.
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${item.path}</svg><span data-nav-label>${item.label}</span><span class="nav-current-dot" aria-hidden="true"></span>`;
    nav.append(button);
  }
  sidebar.querySelector('.brand')?.after(nav);
  const sync = () => {
    const selected = activeModule(workspace.dataset.page);
    nav.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.id === selected));
      if (button.id === selected) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  };
  new MutationObserver(sync).observe(workspace, {attributes: true, attributeFilter: ['data-page']});
  sync();
}
