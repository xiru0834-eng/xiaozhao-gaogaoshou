/** Settings, next actions and an uncluttered answer workspace share product color tokens. */
export const WORKSPACE_STYLES = `
.sz-today { flex:none; padding:18px 30px 20px; color:var(--sz-ink); background:var(--sz-page); font:13px/1.5 var(--sz-sans); }
.sz-today-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.sz-today-heading h2 { margin:0; font-size:15px; font-weight:600; }
.sz-today-heading .sz-button { min-height:28px; padding:3px 10px; }
.sz-today-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
.sz-today-grid>button { display:flex; align-items:center; text-align:left; gap:14px; padding:17px 20px; border:1px solid var(--sz-line); border-radius:12px; background:var(--sz-paper); color:var(--sz-ink); font:inherit; cursor:pointer; transition:border-color .15s,background .15s; }
.sz-today-grid>button:hover { border-color:var(--sz-accent); background:var(--sz-wash); }
.sz-today-grid>button:focus-visible { outline:2px solid var(--sz-accent); outline-offset:3px; }
.sz-today-grid>button>span { min-width:0; flex:1; }
.sz-today-grid strong,.sz-today-grid small { display:block; }
.sz-today-grid small { margin-top:4px; font-size:12px; color:var(--sz-muted); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.sz-focus-bar { display:flex; gap:16px; align-items:center; margin:0 auto 24px; max-width:900px; }
.sz-focus-bar>span { flex:1; color:var(--sz-muted); font-size:12px; text-align:center; }
.sz-home.is-focused>.sz-coach-nav,.sz-home.is-focused>.sz-hub-heading,.sz-home.is-focused>.sz-local { display:none; }
.sz-product:has(.sz-landing:not([hidden]) .sz-home.is-focused)>.sz-product-nav { display:none; }
.sz-landing:has(.sz-home.is-focused)>.sz-career-target { display:none; }
.sz-home.is-focused { max-width:960px; margin:0 auto; padding-top:24px; }
.sz-home.is-focused .sz-session { margin:0 auto; width:100%; }
.sz-home.is-focused .sz-question h3 { font-size:clamp(20px,2vw,28px); line-height:1.6; }
.sz-home.is-focused .sz-textarea { min-height:220px; font-size:16px; line-height:1.9; }
.sz-draft-status { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0 0 20px; color:var(--sz-muted); font-size:12px; }
.sz-draft-status .sz-button { padding:5px 10px; min-height:30px; }
.sz-advanced-trigger { display:none; }
.sz-open-settings { display:grid; place-items:center; width:36px; height:36px; border:0; border-radius:9px; background:transparent; color:var(--sz-ink); cursor:pointer; }
.sz-open-settings:hover { background:var(--sz-selected); }
.sz-settings-dialog { box-sizing:border-box; width:min(720px,calc(100vw - 40px)); max-height:calc(100dvh - 48px); padding:0; border:1px solid var(--sz-line); border-radius:20px; color:var(--sz-ink); background:var(--sz-paper); box-shadow:0 28px 100px #122b4040; font:14px/1.65 var(--sz-sans); }
.sz-settings-dialog::backdrop { background:#14233860; backdrop-filter:blur(4px); }
.sz-settings-dialog>header { display:flex; justify-content:space-between; align-items:flex-start; padding:28px 32px 18px; }
.sz-settings-dialog h2 { margin:0; font-size:24px; font-weight:600; }
.sz-settings-dialog header p { margin:5px 0 0; color:var(--sz-muted); }
.sz-settings-dialog nav { display:flex; padding:0 24px 12px; gap:6px; border-bottom:1px solid var(--sz-line); }
.sz-settings-dialog nav button { flex:1; border:0; border-radius:8px; background:transparent; color:var(--sz-muted); padding:10px 4px; font:inherit; cursor:pointer; }
.sz-settings-dialog nav button[aria-pressed=true],.sz-theme-options button[aria-pressed=true] { background:var(--sz-green); color:var(--sz-on-accent); }
.sz-settings-dialog button:focus-visible,.sz-settings-dialog input:focus-visible { outline:2px solid var(--sz-accent); outline-offset:3px; }
.sz-settings-content { padding:24px 32px 30px; min-height:300px; }
.sz-settings-content h3 { margin:0 0 10px; font-size:18px; }
.sz-settings-content p { color:var(--sz-muted); }
.sz-settings-field { display:grid; gap:7px; margin:0 0 12px; }
.sz-settings-field input { box-sizing:border-box; width:100%; min-height:44px; border:1px solid var(--sz-border); border-radius:8px; background:var(--sz-input); padding:10px 12px; color:var(--sz-ink); font:inherit; }
.sz-settings-field small { color:var(--sz-muted); font-size:12px; }
.sz-settings-check { display:flex; gap:8px; align-items:center; margin:0 0 22px; color:var(--sz-muted); font-size:12px; }
.sz-settings-check input { accent-color:var(--sz-green); }
.sz-settings-actions,.sz-theme-options { display:flex; flex-wrap:wrap; gap:10px; margin-top:22px; }
.sz-theme-options button { flex:1; padding:24px 12px; }
@media(max-width:900px) { .sz-today { padding:12px 18px; } .sz-today-grid { gap:8px; } .sz-today-grid>button { padding:12px; gap:8px; } .sz-today-grid>button>.di-icon:last-child { display:none; } }
@media(max-width:600px) { .sz-today-grid { grid-template-columns:1fr; } .sz-today-grid>button { padding:10px 14px; } .sz-settings-dialog>header,.sz-settings-content { padding:20px; } .sz-settings-dialog nav { padding:0 12px 12px; } .sz-focus-bar>span { display:none; } .sz-focus-bar { justify-content:space-between; } }
`
