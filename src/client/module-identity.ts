/** Static presentation only; no account, model or application state. */
export type ModuleIdentity = 'models' | 'schedules' | 'updates';
const paths: Record<ModuleIdentity, string> = {
  models: '<rect x="5" y="6" width="14" height="12" rx="3"/><path d="M12 3v3M9 11h.01M15 11h.01M9 15h6M2 10v4M22 10v4"/>',
  schedules: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 17h2"/>',
  updates: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7 10h6M10 7v6"/>',
};
export function moduleIdentity(kind: ModuleIdentity) {
  return `<span class="module-emblem" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[kind]}</svg></span>`;
}
export const moduleCompanion = '<span class="module-companion" aria-hidden="true"></span>';
