/** Product header replacing the framework sidebar, with retained settings and session browsing. */
import React from 'react'
import { h, Icon } from '../shared/ui.js'
import { t } from '../shared/coach-locale.js'

/** Renders the shell's navigation seats in a header and an on-demand history dialog.
 * @param {object} props Slot renderer, session selector and new-session action.
 * @returns {object} Product header and history dialog.
 */
export function ProductShell({ renderSlot, useSessions, createSession, openPlugins }) {
  const header = React.useRef(null)
  const dialog = React.useRef(null)
  const historyButton = React.useRef(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const selected = useSessions((state) => Object.values(state.byId)
    .find((item) => (item.retainedBy.mainView ?? 0) > 0)?.id)
  React.useEffect(() => { dialog.current?.close() }, [selected])
  React.useLayoutEffect(() => {
    // The pinned Harness frame exposes column order but no zero-sidebar setting.
    // These owned markers move its sidebar seat into a header without replacing layout services.
    const column = header.current.closest('[data-slot="sidebar"]').parentElement
    const frame = column.parentElement
    const main = column.nextElementSibling
    column.classList.add('sz-shell-column')
    frame.classList.add('sz-shell-frame')
    main.classList.add('sz-shell-main-column')
    return () => {
      column.classList.remove('sz-shell-column')
      frame.classList.remove('sz-shell-frame')
      main.classList.remove('sz-shell-main-column')
    }
  }, [])
  async function start() {
    if (busy) return
    setBusy(true); setError('')
    try { await createSession() } catch (failure) { setError(failure.message || t('error')) }
    finally { setBusy(false) }
  }
  return h('header', { className: 'sz-shell-header', ref: header },
    h('div', { className: 'sz-shell-brand' }, h(Icon, { name: 'book', size: 22 }),
      h('strong', null, t('careerBrand')), h('span', null, t('shellTagline'))),
    h('div', { className: 'sz-shell-actions' },
      h('button', { type: 'button', className: 'sz-shell-home', onClick: start, disabled: busy },
        h(Icon, { name: 'grid', size: 16 }), t('shellHome')),
      h('button', { type: 'button', ref: historyButton, 'aria-haspopup': 'dialog', onClick: () => dialog.current.showModal() },
        h(Icon, { name: 'clock', size: 16 }), t('shellHistory')),
      h('div', { className: 'sz-shell-settings' }, renderSlot('sidebar.settings', { wide: false }))),
    error ? h('div', { className: 'sz-shell-error', role: 'alert' }, error) : null,
    h('dialog', { ref: dialog, className: 'sz-shell-history', 'aria-labelledby': 'sz-history-title',
      onClose: () => historyButton.current?.focus(),
      onClick: (event) => { if (event.target === event.currentTarget) dialog.current.close() } },
      h('div', { className: 'sz-shell-history-inner' },
        h('div', { className: 'sz-shell-history-heading' }, h('div', null,
          h('h2', { id: 'sz-history-title' }, t('shellHistory')), h('p', null, t('shellHistoryHint'))),
        h('button', { type: 'button', 'aria-label': t('shellClose'), onClick: () => dialog.current.close() }, h(Icon, { name: 'close' }))),
        h('div', { className: 'sz-shell-history-list' }, renderSlot('sidebar.workspaces', { wide: true, expandSidebar: () => {} })),
        h('div', { className: 'sz-shell-history-footer' }, h('button', { type: 'button', onClick: () => { dialog.current.close(); openPlugins() } }, t('shellPlugins'))))))
}

/** Header geometry for the pinned Harness frame; no upstream CSS module names are used. */
export const SHELL_STYLES = `
.sz-shell-frame { grid-template-rows:58px minmax(0,1fr)!important; }
.sz-shell-column { grid-column:1/-1; grid-row:1; overflow:visible!important; border:0!important; z-index:12; }
.sz-shell-main-column { grid-column:1/3; grid-row:2; }
.sz-shell-frame>[data-rightbar-col] { grid-column:3; grid-row:2; }
.sz-shell-frame>[data-side="sidebar"] { display:none; }
.sz-shell-frame>[data-side="rightbar"] { top:58px; }
.sz-shell-header { box-sizing:border-box; color-scheme:var(--sz-mode); }
.sz-shell-header { height:58px; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:0 30px; background:var(--sz-paper); color:var(--sz-ink); border-bottom:1px solid var(--sz-line); font:13px/1.5 var(--sz-sans); }
.sz-shell-brand,.sz-shell-actions,.sz-shell-actions>button { display:flex; align-items:center; gap:8px; }
.sz-shell-brand>.di-icon { padding:5px; box-sizing:content-box; border-radius:9px; background:var(--sz-green); color:var(--sz-on-accent); }
.sz-shell-brand strong { font-size:14px; font-weight:600; letter-spacing:.02em; white-space:nowrap; }
.sz-shell-brand>span { margin-left:10px; padding-left:18px; border-left:1px solid var(--sz-line); color:var(--sz-muted); font-size:12px; }
.sz-shell-actions>button,.sz-shell-history-heading button { border:1px solid transparent; border-radius:8px; padding:8px 11px; color:var(--sz-muted); background:transparent; font:inherit; cursor:pointer; }
.sz-shell-actions>button:hover,.sz-shell-history-heading button:hover { color:var(--sz-ink); background:var(--sz-selected); }
.sz-shell-header button:focus-visible { outline:2px solid var(--sz-accent); outline-offset:2px; }
.sz-shell-settings { width:36px; flex:none; }
.sz-shell-settings>div { width:100%; }
.sz-shell-settings [data-slot="sidebar.settings"]>div>button[aria-haspopup="dialog"] { color:var(--sz-ink); background:transparent; }
.sz-shell-frame:has(.sz-product) .sz-shell-home { display:none; }
.sz-shell-frame .sz-product-nav { justify-content:flex-start; padding:10px 30px; }
.sz-shell-frame .sz-product-nav>.sz-wordmark { display:none; }
.sz-shell-error { position:absolute; top:58px; right:20px; padding:12px; color:var(--di-red); background:var(--sz-paper); border:1px solid var(--sz-line); border-radius:8px; }
.sz-shell-history { padding:0; width:min(580px,calc(100vw - 32px)); height:min(680px,calc(100dvh - 64px)); max-height:calc(100dvh - 32px); border:1px solid var(--sz-line); border-radius:18px; background:var(--sz-paper); color:var(--sz-ink); box-shadow:0 24px 90px #142c4230; }
.sz-shell-history::backdrop { background:#14233855; backdrop-filter:blur(3px); }
.sz-shell-history-inner { display:flex; flex-direction:column; height:100%; }
.sz-shell-history-heading { display:flex; align-items:center; justify-content:space-between; padding:22px 24px 16px; border-bottom:1px solid var(--sz-line); }
.sz-shell-history-heading h2 { margin:0; font-size:18px; font-weight:600; }
.sz-shell-history-heading p { margin:5px 0 0; color:var(--sz-muted); font-size:12px; }
.sz-shell-history-list { flex:1; min-height:0; display:flex; flex-direction:column; padding:12px; }
.sz-shell-history-footer { padding:12px 24px; border-top:1px solid var(--sz-line); }
.sz-shell-history-footer button { border:0; background:transparent; color:var(--sz-muted); font:inherit; cursor:pointer; padding:6px 0; }
@media(max-width:720px) { .sz-shell-header { padding:0 14px; gap:8px; } .sz-shell-brand>span { display:none; } .sz-shell-brand strong { font-size:12px; } .sz-shell-actions { gap:2px; } .sz-shell-actions>button { padding:8px 6px; } .sz-shell-frame .sz-product-nav { padding:10px 14px; } }
`
