// Renders docs/frontend/CIC-Frontend-Pages.pdf from pages.mjs using headless Chromium (Playwright).
// Usage: node docs/frontend/build-pdf.mjs [path-to-playwright]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PORTALS, SHARED, STACK } from './pages.mjs';
import { ENGINES } from '../backend/engines.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] ?? `${process.env.HOME}/.linkit360-mcp/node_modules/playwright`);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const css = fs.readFileSync(path.join(here, 'style.css'), 'utf8');
const engineName = Object.fromEntries(ENGINES.map((e) => [e.id, e.name]));
const total = PORTALS.reduce((n, p) => n + p.pages.length, 0);
const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
const engineChips = (list) => list.split(/,\s*/).map((id) => `<span class="chip int" title="${esc(engineName[id] ?? '')}">${esc(id)}</span>`).join(' ');

const summaryRows = PORTALS.map((p) => `<tr><td class="b">${esc(p.name)}</td><td class="mono">${esc(p.base)}</td><td>${esc(p.audience)}</td><td class="c b">${p.pages.length}</td></tr>`).join('');

const portalSection = (p, i) => `
<div class="section">
  <h2>${i + 4}. ${esc(p.name)}</h2>
  <p class="lead"><b>Base route:</b> <span class="mono">${esc(p.base)}</span> · <b>Users:</b> ${esc(p.audience)} · <b>${p.pages.length} pages</b></p>
  <table class="grid pages">
    <thead><tr><th style="width:21%">Route</th><th style="width:15%">Page</th><th>Purpose &amp; key UI</th><th style="width:15%">Access</th><th style="width:12%">Engines</th></tr></thead>
    <tbody>${p.pages.map(([route, name, purpose, ui, access, engines]) => `
      <tr><td class="mono">${esc(route)}</td><td class="b">${esc(name)}</td>
      <td><div>${esc(purpose)}</div><div class="small muted2">${esc(ui)}</div></td>
      <td class="small">${esc(access)}</td><td>${engineChips(engines)}</td></tr>`).join('')}</tbody>
  </table>
</div>`;

const engineLegend = `<table class="grid"><thead><tr><th>ID</th><th>Backend engine</th><th>ID</th><th>Backend engine</th></tr></thead><tbody>${
  Array.from({ length: Math.ceil(ENGINES.length / 2) }, (_, r) => {
    const a = ENGINES[r]; const b = ENGINES[r + Math.ceil(ENGINES.length / 2)];
    return `<tr><td class="mono b">${a.id}</td><td>${esc(a.name)}</td><td class="mono b">${b ? b.id : ''}</td><td>${b ? esc(b.name) : ''}</td></tr>`;
  }).join('')}</tbody></table>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>CIC Myanmar — Frontend Pages</title>
<style>${css}
  .pages td { font-size: 8.3pt; } .muted2 { color: #475569; margin-top: 2px; } .c { text-align: center; }
  .kv td:first-child { width: 28%; font-weight: 700; color: #1f3551; }
</style></head><body>
<div class="cover">
  <div class="band">
    <div class="kicker">Credit Information Center · Central Bank of Myanmar</div>
    <h1>Frontend Page Specification</h1>
    <p class="sub">Every screen of the Public website, Borrower self-service, MFI Member Portal and Government Portal — route, purpose, key UI, who can open it, and which backend engines it calls.</p>
    <div class="facts">
      <div class="fact"><b>${total}</b><span>pages / screens</span></div>
      <div class="fact"><b>${PORTALS.length}</b><span>portals / portal areas</span></div>
      <div class="fact"><b>2</b><span>languages (EN / MM)</span></div>
      <div class="fact"><b>0</b><span>serious WCAG issues (axe)</span></div>
    </div>
  </div>
  <table class="meta-table">
    <tr><td>Document</td><td>CIC Myanmar Platform — Frontend pages, access &amp; backend dependencies</td></tr>
    <tr><td>Version</td><td>1.0 draft for internal review</td></tr>
    <tr><td>Date</td><td>${today}</td></tr>
    <tr><td>Prepared by</td><td>PT. LinkIT 360 — Presales</td></tr>
    <tr><td>Reference build</td><td>cic-platform.vercel.app · github.com/syiffapm/cic-platform</td></tr>
    <tr><td>Companion</td><td>CIC Myanmar Platform — Backend Engine Specification (engine IDs E01–E${String(ENGINES.length).padStart(2, '0')})</td></tr>
  </table>
</div>

<div>
  <h2>1. Summary</h2>
  <p class="lead">The frontend is one codebase with five portal areas, each loaded as its own bundle. Menus, routes and buttons follow the role-based permission matrix; every screen is available in English and Myanmar. The reference build keeps data in the browser — in production each page calls the backend engines listed next to it.</p>
  <table class="grid"><thead><tr><th>Portal</th><th>Base route</th><th>Users</th><th class="c">Pages</th></tr></thead><tbody>${summaryRows}
    <tr><td class="b">Total</td><td></td><td></td><td class="c b">${total}</td></tr></tbody></table>
  <h2 style="margin-top:14px">2. Technology &amp; standards</h2>
  <table class="grid kv"><tbody>${STACK.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
</div>

<div class="section">
  <h2>3. Shared frontend foundation</h2>
  <table class="grid kv"><tbody>${SHARED.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
  <h4>Backend engine reference (IDs used in the page tables)</h4>
  ${engineLegend}
</div>
${PORTALS.map(portalSection).join('')}
</body></html>`;

const htmlPath = path.join(here, 'CIC-Frontend-Pages.html');
fs.writeFileSync(htmlPath, html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
const out = path.join(here, 'CIC-Frontend-Pages.pdf');
await page.pdf({
  path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="font-family:Helvetica,Arial;font-size:7.5pt;color:#94a3b8;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>CIC Myanmar Platform — Frontend Page Specification v1.0</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
});
await browser.close();
console.log('written', out);
