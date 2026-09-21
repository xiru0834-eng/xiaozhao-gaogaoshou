/** Test-only browser harness. No database, native window calls or external navigation. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { DATA, ownershipOf, CATNAME, F, APPEND_DATES, OWNERSHIPNAME } from '../src/shared/catalog.ts';

const port = 18768;
const companies = DATA.map(row => ({
  name: row[F.n], roles: row[F.roles], city: row[F.city], code: row[F.code],
  owner: OWNERSHIPNAME[ownershipOf(row)], industry: CATNAME[row[F.cat]],
  url: row[F.url], note: row[F.note], source: row[F.alt],
  deadline: row[F.dl], deadlineText: row[F.dlTxt],
  added: APPEND_DATES.get(row[F.n]) ?? '',
}));
const original = await readFile(new URL('../companion.html', import.meta.url), 'utf8');
const mascot = (await readFile(new URL('../assets/mascot-48.png', import.meta.url))).toString('base64');
const cast = (await readFile(new URL('../assets/companion-cast.png', import.meta.url))).toString('base64');
const bridge = `<script>
(() => {
 const companies = ${JSON.stringify(companies).replaceAll('<', '\\u003c')};
 const statuses = {}, today = new Set();
 let failOnce = new URL(location.href).searchParams.has('fail-save');
 const shell = {pinned:false,collapsed:false};
 const navigation = JSON.parse(localStorage.getItem('preview-navigation')||'{"bookmark":null,"browse":null}');
 const snapshot = () => ({companies,statuses:{...statuses},today:[...today],date:'2026-09-20',shell,navigation});
 window.previewBridge = {
  snapshot: async () => snapshot(),
  save_navigation: async (kind,point) => {navigation[kind]=point;localStorage.setItem('preview-navigation',JSON.stringify(navigation));return true;},
  save_status: async (name,status) => { if(failOnce){ failOnce=false; throw Error('synthetic failure'); } statuses[name]=status; if(status==='已投')today.add(name); if(status==='未投')today.delete(name); return snapshot(); },
  copy_code: async name => companies.find(c=>c.name===name).code,
  open_role: async () => {},
  interaction: async () => {},
  window_action: async action => { if(action==='pin')shell.pinned=!shell.pinned; if(action==='collapse')shell.collapsed=true; if(action==='expand')shell.collapsed=false; return shell; }
 };
})();</script>`;
const server = createServer(async (req, res) => {
  if (req.method !== 'GET' || req.headers.host !== `127.0.0.1:${port}`) {res.writeHead(403).end(); return;}
  if (!['/', '/before'].includes(new URL(req.url ?? '/', `http://127.0.0.1:${port}`).pathname)) {res.writeHead(404).end(); return;}
  try {
    const html = req.url?.startsWith('/before') ? original : await readFile(new URL('../companion.html', import.meta.url), 'utf8');
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
    res.end(html.replaceAll('__MASCOT__', `data:image/png;base64,${mascot}`).replaceAll('__CAST__', `data:image/png;base64,${cast}`).replace('<script>', bridge+'<script>'));
  } catch {res.writeHead(500).end('Preview unavailable');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Synthetic companion preview http://127.0.0.1:${port}`));
const timer = setTimeout(()=>server.close(), 3600000);
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{clearTimeout(timer);server.close();});
