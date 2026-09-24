/** Porcelain surfaces and shared interaction states for the interview workspace. */
import { DEFAULT_COACH_TOKENS } from './product-appearance.js'

export const COACH_STYLES = `
:root {
  ${DEFAULT_COACH_TOKENS}
  --sz-sans:"PingFang SC","Microsoft YaHei UI","Microsoft YaHei","Segoe UI",sans-serif;
  --sz-serif:var(--sz-sans);
}
.sz-product,.sz-home {
  color:var(--sz-ink); color-scheme:var(--sz-mode); font:15px/1.75 var(--sz-sans);
  -webkit-font-smoothing:antialiased;
}
.sz-product *,.sz-home * { box-sizing:border-box; }
.sz-product ::selection,.sz-home ::selection { background:var(--sz-selected); color:var(--sz-ink); }
.sz-product { display:flex; flex-direction:column; height:100%; min-height:0; background:var(--sz-page); container:sz-product / inline-size; }
.sz-product [hidden],.sz-home [hidden] { display:none!important; }
.sz-product button,.sz-home button { font:inherit; touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.sz-product :is(button,a,summary,input,textarea,select):focus-visible,.sz-home :is(button,a,summary,input,textarea,select):focus-visible {
  outline:2px solid var(--sz-accent); outline-offset:3px; scroll-margin:20px;
}
.sz-product button:not(:disabled),.sz-home button:not(:disabled),.sz-home summary { cursor:pointer; }
.sz-product button:disabled,.sz-home button:disabled { opacity:.48; cursor:not-allowed; }
.sz-product-nav {
  display:flex; align-items:center; gap:4px; padding:14px 32px;
  border-bottom:1px solid var(--sz-line); background:var(--sz-paper); flex-shrink:0;
}
.sz-wordmark { display:flex; align-items:center; gap:10px; margin-right:auto; font-weight:600; white-space:nowrap; font-size:14px; letter-spacing:.015em; }
.sz-wordmark .di-icon { color:var(--sz-accent); width:28px; height:28px; padding:4px; background:var(--sz-selected); border-radius:7px; }
.sz-product-nav button {
  position:relative; min-height:44px; border:0; padding:9px 14px; border-radius:6px;
  background:transparent; color:var(--sz-muted); font-size:13px;
  transition:background-color 140ms ease,color 140ms ease,transform 140ms ease;
}
.sz-product-nav button[aria-pressed=false]:hover:not(:disabled) { background:var(--sz-wash); color:var(--sz-ink); }
.sz-product-nav button[aria-pressed=true] { color:var(--sz-on-accent); background:var(--sz-green); font-weight:600; }
.sz-product-nav button[aria-pressed=true]:hover:not(:disabled) { background:var(--sz-hover); }
.sz-product-nav button:active { transform:translateY(1px); }
.sz-career-frame { width:100%; border:0; flex:1; min-height:0; background:var(--sz-page); }
.sz-landing {
  height:100%; overflow:auto; padding:30px clamp(20px,4vw,64px) 48px; background:var(--sz-page);
  scrollbar-color:var(--sz-border) var(--sz-page); scrollbar-width:thin;
}
.sz-product>.sz-landing { flex:1; min-height:0; height:auto; }
.sz-home { max-width:1160px; margin:auto; padding:0 0 24px; container:sz-coach / inline-size; }
.sz-home :is(h1,h2,h3,h4) { color:var(--sz-ink); text-wrap:balance; }
.sz-hub-heading { display:flex; align-items:center; justify-content:space-between; gap:24px; margin:0 0 20px; }
.sz-hub-heading h1 { font:500 20px/1.4 var(--sz-sans); margin:0; }
.sz-hub-heading p { display:none; }
.sz-bank-stats { display:flex; gap:18px; flex-shrink:0; }
.sz-bank-stats>span { display:flex; align-items:baseline; gap:7px; color:var(--sz-muted); font-size:12px; white-space:nowrap; }
.sz-bank-stats strong { color:var(--sz-accent); font-size:19px; line-height:1.4; font-weight:500; font-variant-numeric:tabular-nums; }
.sz-coach-nav { display:flex; gap:4px; padding:5px; margin:0 0 28px; border:1px solid var(--sz-line); border-radius:12px; background:var(--sz-wash); overflow-x:auto; scrollbar-width:thin; scrollbar-color:var(--sz-border) transparent; }
.sz-coach-nav button {
  display:flex; flex:1 0 auto; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:10px 14px;
  border:1px solid transparent; border-radius:8px; background:transparent; color:var(--sz-muted); font-size:13px; white-space:nowrap;
  transition:background-color 140ms ease,color 140ms ease,transform 140ms ease;
}
.sz-coach-nav button[aria-pressed=false]:hover:not(:disabled) { background:var(--sz-wash); color:var(--sz-ink); }
.sz-coach-nav button[aria-pressed=true] { color:var(--sz-on-accent); background:var(--sz-green); border-color:var(--sz-green); font-weight:600; }
.sz-coach-nav button[aria-pressed=true]:hover:not(:disabled) { background:var(--sz-hover); }
.sz-coach-nav button:active:not(:disabled) { transform:translateY(1px); }
.sz-bank-page,.sz-records,.sz-preparation-page,.sz-revision,.sz-session {
  margin:0; padding:32px; background:var(--sz-paper); border:1px solid var(--sz-line); border-radius:16px; color:var(--sz-ink);
}
.sz-bank-page,.sz-records,.sz-revision { padding:32px; }
.sz-page-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; margin-bottom:28px; }
.sz-page-heading h2,.sz-preparation-header h2,.sz-revision>h2 { margin:0 0 10px; font:600 28px/1.45 var(--sz-sans); letter-spacing:-.025em; }
.sz-page-heading p,.sz-preparation-header p { color:var(--sz-muted); margin:0; font-size:14px; max-width:42em; }
.sz-count-pill { flex-shrink:0; padding:4px 11px; border:1px solid var(--sz-line); border-radius:6px; color:var(--sz-muted); font-size:12px; font-variant-numeric:tabular-nums; }
.sz-bank-search { display:flex; align-items:center; gap:18px; margin:0 0 30px; font-size:14px; }
.sz-search-control { display:flex; align-items:center; gap:10px; flex:1; min-width:0; max-width:620px; padding:0 14px; background:var(--sz-paper); border:1px solid var(--sz-border); border-radius:7px; }
.sz-search-control>.di-icon { flex-shrink:0; color:var(--sz-muted); }
.sz-search-control:focus-within { border-color:var(--sz-accent); outline:2px solid var(--sz-accent); outline-offset:3px; }
.sz-search-control input { width:100%; min-width:0; height:46px; padding:0; border:0; border-radius:0; outline:none!important; background:transparent; color:var(--sz-ink); font:inherit; }
.sz-search-control input::placeholder { color:var(--sz-muted); }
.sz-bank-layout { display:grid; grid-template-columns:168px minmax(0,1fr); gap:32px; }
.sz-bank-layout>div { min-width:0; }
.sz-topic-nav { display:flex; flex-direction:column; gap:5px; padding-right:18px; border-right:1px solid var(--sz-line); align-self:start; }
.sz-topic-nav button { display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:44px; padding:10px 11px; text-align:left; color:var(--sz-muted); background:transparent; border:1px solid transparent; border-radius:6px; font-size:13px; }
.sz-topic-nav button>span:last-child { font-size:12px; font-variant-numeric:tabular-nums; }
.sz-topic-nav button[aria-pressed=false]:hover:not(:disabled) { background:var(--sz-wash); color:var(--sz-ink); }
.sz-topic-nav button[aria-pressed=true] { background:var(--sz-green); color:var(--sz-on-accent); border-color:var(--sz-green); font-weight:600; }
.sz-topic-nav button[aria-pressed=true]:hover:not(:disabled) { background:var(--sz-hover); }
.sz-question-list { list-style:none; padding:0; margin:0; }
.sz-question-list>li { display:flex; align-items:center; gap:18px; padding:22px 2px; border-bottom:1px solid var(--sz-line); }
.sz-question-list>li:first-child { padding-top:4px; }
.sz-question-list>li:hover .sz-question-list-copy h3 { color:var(--sz-accent); }
.sz-question-list-copy { flex:1; min-width:0; }
.sz-question-list h3 { font-size:16px; font-weight:500; line-height:1.75; margin:4px 0 0; overflow-wrap:anywhere; }
.sz-question-meta { color:var(--sz-muted); font-size:12px; margin:0; }
.sz-bank-number { color:var(--sz-muted); font-size:12px; font-variant-numeric:tabular-nums; flex:0 0 22px; }
.sz-home .di-button,.sz-product .di-button {
  display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; height:auto; padding:10px 16px;
  font:500 14px/1.5 var(--sz-sans); border:1px solid var(--sz-border); border-radius:9px; background:var(--sz-paper); color:var(--sz-ink);
  box-shadow:none; text-decoration:none; white-space:normal;
  transition:background-color 140ms ease,border-color 140ms ease,transform 140ms ease,box-shadow 140ms ease;
}
.sz-home .di-button:hover:not(:disabled),.sz-product .di-button:hover:not(:disabled) { transform:none; border-color:var(--sz-accent); background:var(--sz-wash); color:var(--sz-accent); box-shadow:0 2px 4px #243c3210; }
.sz-home .di-button:active:not(:disabled),.sz-product .di-button:active:not(:disabled) { transform:translateY(1px); box-shadow:none; }
.sz-home .di-button.is-primary,.sz-product .di-button.is-primary { color:var(--sz-on-accent); background:var(--sz-green); border-color:var(--sz-green); box-shadow:inset 0 1px 0 #ffffff26,0 3px 6px #1b2d3c12; }
.sz-home .di-button.is-primary:hover:not(:disabled),.sz-product .di-button.is-primary:hover:not(:disabled) { color:var(--sz-on-accent); background:var(--sz-hover); border-color:var(--sz-hover); }
.sz-question-list .di-button { flex-shrink:0; white-space:nowrap; padding:10px 12px; font-size:13px; }
.sz-empty { margin:0; padding:64px 24px; border-block:1px solid var(--sz-line); color:var(--sz-muted); font-size:14px; text-align:center; line-height:2; }
.sz-pagination { display:flex; justify-content:flex-end; align-items:center; flex-wrap:wrap; gap:16px; margin-top:24px; color:var(--sz-muted); font-size:13px; font-variant-numeric:tabular-nums; }
.sz-resume-bar { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 18px; margin:0 0 22px; background:var(--sz-selected); border-radius:10px; color:var(--sz-accent); font-size:14px; }
.sz-resume-bar>span { min-width:0; overflow-wrap:anywhere; }
.sz-resume-bar>.di-button { flex-shrink:0; }
.sz-preparation-page { padding:0; overflow:hidden; }
.sz-preparation-page form { padding:32px; }
.sz-preparation-header { display:grid; grid-template-columns:48px minmax(0,1fr); gap:4px 18px; align-items:center; padding:30px 32px; border-bottom:1px solid var(--sz-line); background:var(--sz-input); }
.sz-preparation-icon { grid-row:1/3; display:grid; place-items:center; width:48px; height:56px; color:var(--sz-accent); }
.sz-preparation-header h2 { grid-column:2; margin:0; }
.sz-preparation-header p { grid-column:2; max-width:48em; font-size:14px; }
.sz-preparation-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px; margin:0 0 28px; }
.sz-field-prepRole { grid-column:1/-1; max-width:100%; }
.sz-field { min-width:0; }
.sz-field>label { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; font-size:14px; color:var(--sz-ink); font-weight:500; }
.sz-required { color:var(--sz-muted); font-size:12px; font-weight:400; }
.sz-product :is(input,textarea,select),.sz-home :is(input,textarea,select) { caret-color:var(--sz-accent); accent-color:var(--sz-accent); }
.sz-home :is(.di-input,.sz-textarea,select),.sz-product .sz-textarea,.sz-product .sz-career-target input {
  display:block; box-sizing:border-box; width:100%; max-width:100%; min-width:0; min-height:46px; height:auto; margin:0;
  padding:12px 14px; border:1px solid var(--sz-border); border-radius:9px; color:var(--sz-ink); background:var(--sz-input); font:16px/1.7 var(--sz-sans);
  transition:border-color 140ms ease,background-color 140ms ease; box-shadow:inset 0 1px 2px #243c3207;
}
.sz-home select { cursor:pointer; padding:12px 32px 12px 12px; font-size:14px; }
.sz-home :is(.di-input,.sz-textarea,select):hover:not(:disabled),.sz-product .sz-textarea:hover { border-color:var(--sz-accent); }
.sz-home :is(.di-input,.sz-textarea,select):focus,.sz-product .sz-textarea:focus { border-color:var(--sz-accent); background:var(--sz-paper); outline:2px solid var(--sz-accent); outline-offset:3px; box-shadow:none; }
.sz-home :is(.di-input,.sz-textarea)::placeholder,.sz-product .sz-textarea::placeholder { color:var(--sz-muted); opacity:1; }
.sz-home :is(input,textarea,select):disabled { background:var(--sz-wash); cursor:not-allowed; opacity:.65; }
.sz-home .sz-textarea,.sz-product .sz-textarea { min-height:200px; resize:vertical; line-height:1.9; }
.sz-home [aria-invalid=true] { border-color:var(--sz-error); }
.sz-field-error { color:var(--sz-error); font-size:13px; margin:8px 0 0; }
.sz-settings-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px; margin:0 0 24px; padding-top:24px; border-top:1px solid var(--sz-line); }
.sz-segment-field { min-width:0; margin:0; padding:0; border:0; }
.sz-segment-field legend { font-size:14px; font-weight:500; margin:0 0 10px; padding:0; }
.sz-segment-options { display:flex; gap:4px; padding:4px; background:var(--sz-wash); border-radius:10px; }
.sz-segment-options label { position:relative; flex:1; min-width:0; cursor:pointer; }
.sz-segment-options input { position:absolute; width:1px; height:1px; opacity:0; margin:0; }
.sz-segment-options span { display:flex; align-items:center; justify-content:center; min-height:44px; padding:8px 4px; border:1px solid transparent; border-radius:7px; font-size:14px; color:var(--sz-muted); transition:background-color 140ms ease,color 140ms ease; }
.sz-segment-options label:hover input:not(:checked):not(:disabled)+span { color:var(--sz-accent); background:var(--sz-selected); }
.sz-segment-options input:checked+span { color:var(--sz-on-accent); background:var(--sz-green); border-color:var(--sz-green); font-weight:600; }
.sz-segment-options label:hover input:checked:not(:disabled)+span { background:var(--sz-hover); border-color:var(--sz-hover); }
.sz-segment-options input:focus-visible+span { outline:2px solid var(--sz-accent); outline-offset:2px; }
.sz-segment-field:disabled { opacity:.5; }
.sz-segment-field:disabled label { cursor:not-allowed; }
.sz-setup-details { font-size:13px; color:var(--sz-muted); margin:4px 0 24px; }
.sz-setup-details summary { min-height:44px; padding:10px 0; }
.sz-setup-details p { margin:8px 0; max-width:52em; }
.sz-preparation-footer { display:flex; flex-direction:column; align-items:flex-start; gap:18px; padding-top:22px; border-top:1px solid var(--sz-line); }
.sz-preparation-footer .sz-hint { max-width:52em; margin:0; }
.sz-preparation-footer .is-primary { min-width:190px; }
.sz-home .sz-hint,.sz-product .sz-hint { font-size:13px!important; line-height:1.8; color:var(--sz-muted)!important; margin:10px 0; }
.sz-local { text-align:center; font-size:12px; color:var(--sz-muted); margin:28px 0 0; }
.sz-record-list { display:grid; }
.sz-record-list article { display:flex; align-items:center; justify-content:space-between; gap:24px; padding:22px 0; border-bottom:1px solid var(--sz-line); }
.sz-record-list h3 { font-size:17px; margin:8px 0 5px; font-weight:500; }
.sz-record-list p { color:var(--sz-muted); font-size:13px; margin:0; }
.sz-record-list .di-button { flex-shrink:0; }
.sz-status,.sz-mastered-badge { display:inline-block; padding:3px 9px; border-radius:4px; background:var(--sz-wash); color:var(--sz-muted); font-size:12px; }
.sz-status.active,.sz-mastered-badge { color:var(--sz-accent); background:var(--sz-selected); }
.sz-mastered-badge { margin-top:12px; }
.sz-review-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr)); gap:0 32px; }
.sz-review-grid article { display:flex; flex-direction:column; align-items:flex-start; min-width:0; padding:24px 0; border-bottom:1px solid var(--sz-line); }
.sz-review-grid h3 { font-size:17px; line-height:1.75; margin:8px 0 12px; }
.sz-review-grid p,.sz-review-grid li { font-size:14px; }
.sz-review-grid article>.di-button { margin-top:12px; }
.sz-review-grid ul { padding-left:20px; }
.sz-home.is-answering .sz-hub-heading { margin-bottom:18px; }
.sz-home.is-answering .sz-hub-heading h1 { font-size:20px; }
.sz-home.is-answering .sz-hub-heading p,.sz-home.is-answering .sz-bank-stats { display:none; }
.sz-session { padding:0; overflow:hidden; }
.sz-session-header { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:24px 32px; border-bottom:1px solid var(--sz-line); }
.sz-session-header h2 { margin:4px 0 0; font-size:17px; font-weight:500; }
.sz-session-header p { margin:4px 0 0; color:var(--sz-muted); font-size:13px; }
.sz-eyebrow { color:var(--sz-muted); font-size:12px; }
.sz-progress { color:var(--sz-muted); font-variant-numeric:tabular-nums; font-size:17px; flex-shrink:0; }
.sz-question { padding:30px 32px 18px; }
.sz-question h3 { font:600 26px/1.7 var(--sz-sans); margin:0 0 24px; overflow-wrap:anywhere; max-width:36em; }
.sz-question-tools { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.sz-mastery-button { margin-left:auto; }
.sz-home .sz-mastery-button { color:var(--sz-accent); border-color:var(--sz-line); background:var(--sz-selected); }
.sz-answer { padding:8px 32px 28px; }
.sz-answer-heading { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin:8px 0 12px; font-size:14px; }
.sz-answer-heading>span { color:var(--sz-muted); font-size:12px; font-variant-numeric:tabular-nums; }
.sz-answer .sz-textarea { min-height:250px; padding:20px; }
.sz-answer-actions { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin:20px 0 12px; }
.sz-answer-actions>.is-primary { margin-left:auto; }
.sz-home .sz-recording { color:var(--sz-error); border-color:var(--sz-error); background:var(--sz-error-bg); }
.sz-notice,.sz-recovery { padding:16px 20px; margin:20px 0; border:1px solid color-mix(in srgb,var(--sz-amber) 30%,var(--sz-line)); border-radius:9px; color:var(--sz-amber); background:var(--sz-amber-bg); font-size:14px; }
.sz-home .di-notice.is-error,.sz-product>.di-notice.is-error { color:var(--sz-error); background:var(--sz-error-bg); border:1px solid color-mix(in srgb,var(--sz-error) 30%,var(--sz-line)); }
.sz-session>.sz-notice,.sz-session>.sz-recovery { margin:16px 32px; }
.sz-recovery .di-button { margin:6px 10px 0 0; }
.sz-timer { margin:0; padding:12px 32px; background:var(--sz-selected); color:var(--sz-accent); font-size:13px; font-variant-numeric:tabular-nums; }
.sz-feedback { margin:16px 32px 28px; padding:24px 0 0; border-top:1px solid var(--sz-line); }
.sz-feedback-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.sz-feedback-heading h3 { margin:0; font:600 24px/1.5 var(--sz-serif); }
.sz-score { font-size:32px; font-weight:500; color:var(--sz-accent); font-variant-numeric:tabular-nums; }
.sz-score small { font-size:13px; font-weight:400; color:var(--sz-muted); }
.sz-evidence { display:grid; gap:24px; color:var(--sz-ink); }
.sz-evidence h4,.sz-comparison h4 { margin:0 0 12px; font-size:15px; font-weight:600; }
.sz-next-step { padding:20px 22px; border-radius:7px; background:var(--sz-selected); }
.sz-next-step p { margin:0; font-size:16px; line-height:1.9; }
.sz-evidence-group { display:grid; grid-template-columns:120px minmax(0,1fr); gap:0 24px; padding:4px 0 22px; border-bottom:1px solid var(--sz-line); }
.sz-evidence-group>h4 { color:var(--sz-accent); grid-column:1; grid-row:1; }
.sz-evidence-group.is-partial>h4,.sz-evidence-group.is-missing>h4 { color:var(--sz-amber); }
.sz-evidence-group.is-incorrect>h4 { color:var(--sz-error); }
.sz-evidence-group.is-uncertain>h4 { color:var(--sz-info); }
.sz-evidence article { min-width:0; grid-column:2; overflow-wrap:anywhere; }
.sz-evidence article+article { margin-top:16px; padding-top:16px; border-top:1px dashed var(--sz-line); }
.sz-evidence strong { font-size:15px; font-weight:600; }
.sz-evidence p { margin:8px 0 0; line-height:1.9; }
.sz-evidence article,.sz-next-step p,.sz-report .di-markdown,.sz-history .di-markdown { max-width:70ch; }
.sz-evidence blockquote { margin:12px 0; padding:2px 0 2px 14px; border-left:1px solid var(--sz-border); color:var(--sz-muted); white-space:pre-wrap; font-size:14px; }
.sz-home .di-markdown,.sz-home .di-markdown :is(p,li,blockquote,code,strong) { color:var(--sz-ink)!important; font-size:15px; line-height:1.9; }
.sz-home .di-markdown { font-weight:400; }
.sz-home .di-markdown pre { overflow:auto; max-width:100%; }
.sz-home .di-markdown :is(pre,code) { background:var(--sz-input); border-color:var(--sz-line); }
.sz-home .di-markdown a,.sz-home a { color:var(--sz-accent); text-decoration:underline; text-underline-offset:3px; }
.sz-home details>summary { padding:10px 0; min-height:44px; cursor:pointer; color:var(--sz-accent); }
.sz-home details>summary:hover { color:var(--sz-hover); text-decoration:underline; text-underline-offset:4px; }
.sz-history,.sz-comparison { border-top:1px solid var(--sz-line); margin-top:18px; padding-top:8px; font-size:14px; }
.sz-session>.sz-history { margin:16px 32px 24px; }
.sz-history article { padding:16px 0; border-bottom:1px solid var(--sz-line); }
.sz-history article>span { color:var(--sz-muted); font-size:12px; }
.sz-comparison-columns { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:20px; }
.sz-comparison-columns article { min-width:0; overflow-wrap:anywhere; padding:0 0 12px; }
.sz-comparison-columns article+article { padding-left:24px; border-left:1px solid var(--sz-line); }
.sz-report { padding:28px 32px; border-bottom:1px solid var(--sz-line); }
.sz-report h3 { font:600 24px/1.5 var(--sz-serif); margin:0 0 20px; }
.sz-report li { margin:8px 0; }
.sz-session-footer { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:24px 32px; border-top:1px solid var(--sz-line); background:var(--sz-input); }
.sz-session-footer>.sz-hint { flex-basis:100%; margin:0; }
.sz-session-picker { margin-top:22px; padding-top:16px; border-top:1px solid var(--sz-line); }
.sz-session-picker>p { color:var(--sz-muted); font-size:13px; }
.sz-session-picker ol { list-style:none; margin:0; padding:3px; max-height:340px; overflow:auto; overscroll-behavior:contain; }
.sz-session-picker li+li { margin-top:6px; }
.sz-session-picker button { display:flex; justify-content:space-between; align-items:center; gap:12px; width:100%; text-align:left; min-height:44px; padding:12px 14px; border:1px solid var(--sz-line); border-radius:6px; color:var(--sz-ink); background:var(--sz-paper); font-size:14px; }
.sz-session-picker button:hover:not(:disabled) { color:var(--sz-accent); background:var(--sz-selected); }
.sz-session-picker button[aria-current=true] { color:var(--sz-on-accent); background:var(--sz-green); border-color:var(--sz-green); opacity:1; }
.sz-session-picker small { white-space:nowrap; }
.sz-chat-start,.sz-career-target { max-width:1120px; margin:0 auto 28px; padding:32px; border:1px solid var(--sz-line); border-radius:12px; background:var(--sz-paper); color:var(--sz-ink); }
.sz-chat-start>label,.sz-career-target h2 { font:600 28px/1.5 var(--sz-serif); }
.sz-chat-start>p,.sz-career-target>p { color:var(--sz-muted); }
.sz-chat-start .sz-textarea { margin:24px 0; }
.sz-career-target>label { display:block; margin:16px 0 8px; }
.sz-career-history { display:flex; flex-wrap:wrap; gap:10px; }
.sz-career-history button { padding:10px 14px; min-height:44px; border:1px solid var(--sz-border); border-radius:7px; background:var(--sz-paper); color:var(--sz-accent); }
.di-workspace-content.is-coach { padding:24px!important; background:var(--sz-page); container:sz-product / inline-size; }
.sz-overview-top { display:grid; grid-template-columns:1.15fr 1fr; gap:48px; align-items:center; padding:12px 0 38px; }
.sz-overview-intro { padding:8px 0; }
.sz-overview-intro h1 { margin:0 0 22px; font:600 clamp(34px,4.4cqi,50px)/1.35 var(--sz-sans); letter-spacing:-.03em; }
.sz-overview-intro h1 span { display:block; }
.sz-overview-intro h1 span+span { color:var(--sz-accent); }
.sz-overview-intro>p { max-width:27em; margin:0 0 26px; color:var(--sz-muted); font-size:15px; line-height:1.95; text-wrap:pretty; }
.sz-overview-intro>.di-button { gap:30px; min-height:48px; padding:12px 20px; }
.sz-overview-intro>.sz-overview-note { display:flex; align-items:center; gap:8px; margin:18px 0 0; font-size:12px; }
.sz-library { min-width:0; padding:22px 24px 12px; background:var(--sz-paper); border-radius:16px; box-shadow:0 4px 8px #223a4804,0 14px 40px -12px #223a481b; }
.sz-library header { display:flex; align-items:baseline; justify-content:space-between; gap:16px; padding-bottom:14px; }
.sz-library h2 { margin:0; font-size:17px; font-weight:600; }
.sz-library header>span { color:var(--sz-muted); font-size:12px; font-variant-numeric:tabular-nums; white-space:nowrap; }
.sz-library button { color:var(--sz-ink); background:transparent; border:0; min-height:44px; }
.sz-library nav button { display:flex; align-items:center; justify-content:space-between; gap:18px; width:100%; padding:13px 0; border-top:1px solid var(--sz-line); text-align:left; font-size:14px; }
.sz-library-count { display:flex; align-items:center; gap:16px; color:var(--sz-muted); font-size:12px; font-variant-numeric:tabular-nums; }
.sz-library nav button:hover:not(:disabled) { color:var(--sz-accent); }
.sz-library nav button:hover:not(:disabled) .di-icon { transform:translateX(3px); color:var(--sz-accent); }
.sz-library .di-icon { transition:transform 160ms ease; flex-shrink:0; }
.sz-library footer { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:8px; border-top:1px solid var(--sz-line); }
.sz-library footer button { display:flex; align-items:center; gap:7px; padding:8px 0; color:var(--sz-accent); font-size:12px; }
.sz-library footer button:hover:not(:disabled) { text-decoration:underline; text-underline-offset:4px; }
.sz-library footer button span { color:var(--sz-muted); font-variant-numeric:tabular-nums; }
.sz-overview-section-heading { display:flex; align-items:baseline; justify-content:space-between; gap:16px; padding:20px 0 22px; border-top:1px solid var(--sz-line); }
.sz-overview-section-heading h2 { margin:0; font-size:22px; font-weight:600; letter-spacing:-.02em; }
.sz-overview-section-heading p { margin:0; font-size:12px; color:var(--sz-muted); }
.sz-overview-tools { display:grid; grid-template-columns:1.15fr 1fr; gap:28px; align-items:stretch; }
.sz-mock-entry { padding:26px 28px; background:var(--sz-selected); border-radius:16px; }
.sz-mock-title { display:flex; align-items:center; gap:12px; color:var(--sz-accent); }
.sz-mock-title h3 { font-size:21px; font-weight:600; margin:0; }
.sz-mock-entry>p { font-size:14px; color:var(--sz-muted); max-width:34em; margin:12px 0 20px; }
.sz-interview-steps { display:flex; gap:14px; list-style:none; padding:0; margin:0 0 24px; counter-reset:interview-step; }
.sz-interview-steps li { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--sz-accent); white-space:nowrap; }
.sz-interview-steps li::before { counter-increment:interview-step; content:counter(interview-step); display:grid; place-items:center; width:20px; height:20px; border:1px solid var(--sz-border); border-radius:50%; font-size:11px; }
.sz-mock-entry-footer { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.sz-mock-entry-footer>span { display:flex; align-items:center; gap:6px; color:var(--sz-muted); font-size:11px; }
.sz-mock-entry-footer .di-button { padding-inline:14px; font-size:13px; border-color:var(--sz-border); color:var(--sz-accent); }
.sz-overview-secondary { display:flex; flex-direction:column; padding:2px 0; }
.sz-overview-secondary button { display:flex; flex:1; align-items:center; gap:18px; width:100%; padding:22px 8px; border:0; background:transparent; color:var(--sz-accent); text-align:left; }
.sz-overview-secondary button+button { border-top:1px solid var(--sz-line); }
.sz-overview-secondary button>span { display:grid; gap:7px; flex:1; min-width:0; }
.sz-overview-secondary strong { color:var(--sz-ink); font-size:18px; font-weight:500; }
.sz-overview-secondary button>span>span { color:var(--sz-muted); font-size:13px; }
.sz-overview-secondary .di-icon { flex-shrink:0; transition:transform 160ms ease; }
.sz-overview-secondary button:hover:not(:disabled) strong { color:var(--sz-accent); }
.sz-overview-secondary button:hover:not(:disabled)>.di-icon:last-child { transform:translateX(4px); }
@container sz-product (max-width:1100px) {
  .sz-landing { padding:28px 24px; }
}
@container sz-coach (max-width:960px) {
  .sz-coach-nav button { gap:5px; padding-inline:10px; font-size:12px; }
  .sz-coach-nav .di-icon { width:16px; height:16px; }
  .sz-bank-layout { grid-template-columns:150px minmax(0,1fr); gap:22px; }
}
@container sz-product (max-width:800px) {
  .sz-product-nav { padding:10px 18px; }
  .sz-wordmark { font-size:12px; gap:7px; }
  .sz-product-nav button { padding:9px 10px; font-size:12px; }
}
@container sz-coach (max-width:720px) {
  .sz-coach-nav { gap:5px; }
  .sz-coach-nav button { flex:0 0 auto; }
  .sz-bank-stats { flex-direction:column; gap:4px; }
  .sz-bank-page,.sz-records,.sz-revision { padding:24px; }
  .sz-overview-top { grid-template-columns:1fr; gap:28px; padding-top:0; }
  .sz-overview-intro h1 { font-size:40px; }
  .sz-overview-intro>p { max-width:34em; }
  .sz-overview-tools { grid-template-columns:1fr; gap:10px; }
  .sz-overview-section-heading { display:block; }
  .sz-overview-section-heading p { margin-top:8px; }
  .sz-overview-secondary button { padding:22px 8px; }
  .sz-preparation-page form { padding:24px; }
  .sz-bank-layout { display:block; }
  .sz-topic-nav { flex-direction:row; flex-wrap:wrap; border:0; padding:0 0 18px; gap:5px; }
  .sz-topic-nav button { border-color:var(--sz-line); gap:12px; }
  .sz-preparation-fields { grid-template-columns:1fr; }
  .sz-home .sz-preparation-page .sz-textarea { min-height:156px; }
  .sz-question-list>li { gap:12px; }
  .sz-comparison-columns { grid-template-columns:1fr; }
  .sz-comparison-columns article+article { padding:16px 0 0; border-left:0; border-top:1px solid var(--sz-line); }
  .sz-evidence-group { display:block; }
  .sz-evidence-group>h4 { margin-bottom:14px; }
  .sz-preparation-header { padding:24px; }
  .sz-preparation-header h2 { font-size:28px; }
}
@container sz-coach (max-width:640px) {
  .sz-settings-row { grid-template-columns:1fr; }
}
@container sz-product (max-width:480px) {
  .sz-product-nav { flex-wrap:wrap; gap:4px; padding:10px 14px 8px; }
  .sz-wordmark { width:100%; margin-bottom:3px; font-size:13px; }
  .sz-product-nav button { flex:1; font-size:12px; }
  .sz-landing { padding:22px 14px 32px; }
  .sz-chat-start,.sz-career-target { padding:20px 16px; border-radius:8px; }
}
@container sz-coach (max-width:480px) {
  .sz-hub-heading { align-items:flex-start; gap:12px; margin-bottom:22px; }
  .sz-hub-heading h1 { font-size:20px; }
  .sz-hub-heading p { max-width:17em; font-size:13px; }
  .sz-bank-stats { flex-direction:column; gap:5px; min-width:58px; }
  .sz-bank-stats>span { flex-direction:row; align-items:baseline; gap:6px; font-size:11px; white-space:nowrap; }
  .sz-bank-stats strong { font-size:17px; }
  .sz-coach-nav { gap:3px; margin-bottom:20px; }
  .sz-coach-nav button { font-size:12px; gap:5px; }
  .sz-bank-page,.sz-records,.sz-revision { padding:22px 18px; }
  .sz-overview-intro h1 { font-size:32px; }
  .sz-overview-intro>p { font-size:14px; }
  .sz-library { padding:20px 18px 10px; }
  .sz-mock-entry { padding:24px 18px; }
  .sz-interview-steps { gap:10px; flex-wrap:wrap; }
  .sz-overview-section-heading h2 { font-size:21px; }
  .sz-mock-entry-footer { align-items:flex-start; flex-direction:column; gap:16px; }
  .sz-preparation-header { padding:22px 18px; grid-template-columns:30px minmax(0,1fr); gap:8px 12px; }
  .sz-preparation-icon { width:30px; height:40px; grid-row:1; }
  .sz-preparation-header p { grid-column:1/-1; }
  .sz-preparation-page form { padding:24px 18px; }
  .sz-page-heading { gap:10px; margin-bottom:22px; }
  .sz-page-heading h2,.sz-preparation-header h2,.sz-revision>h2 { font-size:28px; }
  .sz-bank-search { display:block; }
  .sz-search-control { margin-top:8px; padding:0 10px; }
  .sz-search-control input { font-size:16px; }
  .sz-question-list>li { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; padding:18px 0; }
  .sz-question-list .sz-bank-number { display:none; }
  .sz-question-list-copy { grid-column:1/-1; }
  .sz-question-list .di-button { grid-column:2; font-size:12px; }
  .sz-question-list h3 { font-size:15px; }
  .sz-record-list article { align-items:flex-start; flex-direction:column; gap:14px; }
  .sz-resume-bar { align-items:center; font-size:13px; }
  .sz-resume-bar>.di-button { max-width:120px; padding:9px 10px; font-size:12px; }
  .sz-session-header,.sz-question,.sz-answer,.sz-session-footer,.sz-report { padding:20px 18px; }
  .sz-question h3 { font-size:22px; }
  .sz-question-tools { gap:8px; }
  .sz-question-tools .di-button { font-size:12px; padding:10px; }
  .sz-mastery-button { margin-left:0; }
  .sz-feedback { margin:12px 18px 22px; }
  .sz-next-step { padding:18px; }
  .sz-session>.sz-history,.sz-session>.sz-notice,.sz-session>.sz-recovery { margin:16px 18px; }
  .sz-timer { padding:12px 18px; }
  .sz-answer-actions>.is-primary { margin-left:0; width:100%; }
  .sz-answer .sz-textarea { padding:14px; }
  .sz-preparation-footer .is-primary { width:100%; }
}
@media(max-width:560px) {
  .di-workspace-content.is-coach { padding:14px!important; }
}
@media(prefers-reduced-motion:reduce) {
  .sz-home *,.sz-product * { transition:none!important; animation:none!important; scroll-behavior:auto!important; }
  .sz-overview button:hover:not(:disabled) .di-icon { transform:none!important; }
}
`
