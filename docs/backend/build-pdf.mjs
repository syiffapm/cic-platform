// Renders docs/backend/CIC-Backend-Engines.pdf from engines.mjs using headless Chromium (Playwright).
// Usage: node docs/backend/build-pdf.mjs [path-to-playwright]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { ENGINES, EXTERNAL, GROUPS, PORTALS } from './engines.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pwPath = process.argv[2] ?? `${process.env.HOME}/.linkit360-mcp/node_modules/playwright`;
const { chromium } = require(pwPath);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const byId = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
const PHASE_CLASS = { Pilot: 'p0', Production: 'p1', Option: 'p2' };
const phaseBadge = (p) => `<span class="badge ${PHASE_CLASS[p]}">${p}</span>`;
const portalOrder = Object.keys(PORTALS);
const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

/* ---------------------------------------------------------------- architecture diagram (SVG) */
function diagram() {
  const W = 760; let y = 10; const parts = [];
  const box = (x, yy, w, h, fill, stroke, text, sub, tcol = '#0f172a') => parts.push(
    `<rect x="${x}" y="${yy}" width="${w}" height="${h}" rx="7" fill="${fill}" stroke="${stroke}"/>`
    + `<text x="${x + w / 2}" y="${yy + (sub ? h / 2 - 3 : h / 2 + 4)}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${tcol}">${esc(text)}</text>`
    + (sub ? `<text x="${x + w / 2}" y="${yy + h / 2 + 10}" text-anchor="middle" font-size="8.5" fill="${tcol}" opacity="0.8">${esc(sub)}</text>` : ''));
  const label = (t, yy) => parts.push(`<text x="0" y="${yy}" font-size="8.5" font-weight="700" fill="#64748b" letter-spacing="0.6">${t}</text>`);
  // portals
  label('PORTALS', y + 8); y += 14;
  const pw = (W - 4 * 8) / 5;
  const SHORT = { PUB: 'Public website', BOR: 'Borrower portal', MFI: 'MFI Member Portal', GOV: 'Gov — Supervision', ADM: 'Gov — CMS & Admin' };
  portalOrder.forEach((p, i) => box(i * (pw + 8), y, pw, 34, '#1f3551', '#1f3551', SHORT[p], ['Public zone (DMZ)', 'Citizens', 'Licensed MFIs', 'Central Bank / FRD', 'CIC operations'][i], '#ffffff'));
  y += 34;
  parts.push(`<line x1="${W / 2}" y1="${y}" x2="${W / 2}" y2="${y + 12}" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#a)"/>`); y += 14;
  box(0, y, W, 28, '#fef3c7', '#f59e0b', 'E01 API Gateway & Edge  ·  E02 Identity & Access (citizen + workforce realms, permission decision point)', null);
  y += 28;
  parts.push(`<line x1="${W / 2}" y1="${y}" x2="${W / 2}" y2="${y + 12}" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#a)"/>`); y += 14;
  label('ENGINES', y + 8); y += 14;
  const groups = GROUPS.filter((g) => g.id !== 'edge');
  const gw = (W - 3 * 8) / 4;
  const colTop = y; let maxH = 0;
  groups.forEach((g, i) => {
    const list = ENGINES.filter((e) => e.group === g.id);
    const h = 22 + list.length * 15 + 6; maxH = Math.max(maxH, h);
    const x = i * (gw + 8);
    parts.push(`<rect x="${x}" y="${colTop}" width="${gw}" height="__H__" rx="7" fill="#f1f5f9" stroke="#cbd5e1"/>`);
    parts.push(`<text x="${x + 8}" y="${colTop + 14}" font-size="9.5" font-weight="700" fill="#1f3551">${esc(g.name)}</text>`);
    list.forEach((e, k) => parts.push(`<text x="${x + 8}" y="${colTop + 30 + k * 15}" font-size="8.8" fill="#0f172a"><tspan font-weight="700" fill="#0f766e">${e.id}</tspan> ${esc(e.name.length > 34 ? `${e.name.slice(0, 33)}…` : e.name)}</text>`));
  });
  for (let i = 0; i < parts.length; i++) parts[i] = parts[i].replace('__H__', String(maxH));
  y = colTop + maxH;
  parts.push(`<line x1="${W / 2}" y1="${y}" x2="${W / 2}" y2="${y + 12}" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#a)"/>`); y += 14;
  label('DATA', y + 8); y += 14;
  const dw = (W - 4 * 8) / 5;
  [['Registry DB', 'encrypted PII, versioned'], ['Operational DBs', 'per engine'], ['Analytics DWH', 'pseudonymised'], ['Audit store', 'hash chain, WORM'], ['Object storage', 'files, PDFs, media']]
    .forEach(([t, s], i) => box(i * (dw + 8), y, dw, 32, '#ecfdf5', '#10b981', t, s));
  y += 32; y += 10;
  label('EXTERNAL', y + 8); y += 14;
  const ext = ['MFI core banking', 'Gov / MFI SSO', 'SMS & email', 'eKYC', 'Payment gateways', 'SIEM / SOC', 'NRC · MCIX · MMCB'];
  const ew = (W - (ext.length - 1) * 6) / ext.length;
  ext.forEach((t, i) => box(i * (ew + 6), y, ew, 28, '#ffffff', '#94a3b8', t, null));
  y += 28;
  return `<svg viewBox="0 -2 ${W} ${y + 6}" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="Helvetica, Arial, sans-serif">
    <defs><marker id="a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#94a3b8"/></marker></defs>${parts.join('')}</svg>`;
}

/* ---------------------------------------------------------------- sections */
const counts = { Pilot: 0, Production: 0, Option: 0 };
ENGINES.forEach((e) => { counts[e.phase] += 1; });

const catalogue = `
<table class="grid">
  <thead><tr><th>ID</th><th>Engine</th><th>Group</th><th>Phase</th><th>Purpose</th></tr></thead>
  <tbody>${ENGINES.map((e) => `<tr><td class="mono b">${e.id}</td><td class="b">${esc(e.name)}</td><td>${esc(GROUPS.find((g) => g.id === e.group).name)}</td><td>${phaseBadge(e.phase)}</td><td>${esc(e.purpose)}</td></tr>`).join('')}</tbody>
</table>`;

const matrix = `
<table class="grid matrix">
  <thead><tr><th>Engine</th>${portalOrder.map((p) => `<th class="c">${esc(PORTALS[p])}</th>`).join('')}</tr></thead>
  <tbody>${ENGINES.map((e) => `<tr><td><span class="mono b">${e.id}</span> ${esc(e.name)}</td>${portalOrder.map((p) => `<td class="c">${e.portals.includes(p) ? '<span class="dot"></span>' : ''}</td>`).join('')}</tr>`).join('')}</tbody>
</table>`;

const card = (e) => `
<section class="card">
  <div class="card-h">
    <div><span class="id">${e.id}</span><h3>${esc(e.name)}</h3></div>
    <div class="meta">${phaseBadge(e.phase)}<span class="spec">${esc(e.spec)}</span></div>
  </div>
  <p class="purpose">${esc(e.purpose)}</p>
  <div class="cols">
    <div>
      <h4>Scope</h4>
      <ul>${e.scope.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    </div>
    <div class="side">
      <h4>Used by portals</h4>
      <p>${e.portals.map((p) => `<span class="chip">${esc(PORTALS[p])}</span>`).join(' ')}</p>
      <h4>Integrates with — internal</h4>
      <p>${e.internal.filter((x) => byId[x]).map((x) => `<span class="chip int">${x} ${esc(byId[x].name)}</span>`).join(' ') || '<span class="muted">None (append-only sink)</span>'}</p>
      <h4>Integrates with — external</h4>
      <p>${e.external.filter((x) => x !== '—').map((x) => `<span class="chip ext">${esc(x)}</span>`).join(' ') || '<span class="muted">None</span>'}</p>
      <h4>Key APIs</h4>
      <p class="mono small">${e.apis.map(esc).join('<br/>')}</p>
      <h4>Data owned</h4>
      <p class="small">${e.data.map(esc).join('; ')}</p>
    </div>
  </div>
</section>`;

const FLOWS = [
  ['Citizen gets a credit report', ['PUB/BOR → E02 register, verify identity (eKYC or SMS), confirmation by E16', 'BOR → E11 request report → E04 + E06 automated validation', 'ADM officer → E11 approve (E17 rules) → E07 issue snapshot → E21 PDF + QR', 'E16 SMS/email "report ready" → BOR views report; E19 logs every step', 'Anyone → PUB → E07 verify report ID + code']],
  ['Citizen applies for a loan', ['BOR → E10 application + E09 digital consent', 'MFI → E10 inbox → E07 inquiry (E15 charges Basic/Full or subscription; E08 grade)', 'MFI → E10 decision (second approval via E17 above threshold) → disburse', 'E10 → E04 posts the loan; E16 notifies the citizen; E20 updates lending statistics']],
  ['Monthly data submission', ['MFI system → E01 → E05 batch (idempotent) → validation report', 'MFI checker → E17 sign-off with attestation', 'E05 → E06 identity resolution → E04 load + reconciliation', 'E08 EWS evaluation → E13 alerts; E20 KPIs; E19 audit']],
  ['Dispute and correction', ['BOR (or E14 helpdesk) → E12 dispute + evidence (E21 virus scan)', 'MFI → E12 response / correction within SLA', 'ADM steward → E12 approve (E17) → E04 new record version', 'E16 notifies the citizen; SLA breach → E13 consumer-protection escalation']],
  ['Publishing a public notice', ['ADM editor → E18 draft (EN/MM) → E17 review by publisher', 'E18 publish (classification enforced) → CDN / E22 search index', 'Regulator notices: GOV → E18 → publication approval → PUB']],
];

const flows = FLOWS.map(([t, steps]) => `<div class="flow"><h4>${esc(t)}</h4><ol>${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>`).join('');

const external = `
<table class="grid">
  <thead><tr><th>External system</th><th>Used for</th><th>Engines</th><th>Phase</th></tr></thead>
  <tbody>${EXTERNAL.map(([n, u, e, p]) => `<tr><td class="b">${esc(n)}</td><td>${esc(u)}</td><td class="mono">${esc(e)}</td><td>${phaseBadge(p)}</td></tr>`).join('')}</tbody>
</table>`;

const phases = ['Pilot', 'Production', 'Option'].map((p) => `
  <div class="phase"><div>${phaseBadge(p)} <b>${counts[p]} engines</b></div>
  <p>${ENGINES.filter((e) => e.phase === p).map((e) => `${e.id} ${esc(e.name)}`).join(' · ')}</p></div>`).join('');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>CIC Myanmar — Backend Engines</title>
<style>
  @page { size: A4; margin: 16mm 14mm 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #0f172a; font-size: 9.6pt; line-height: 1.42; margin: 0; }
  h1 { font-size: 26pt; margin: 0 0 6px; color: #1f3551; letter-spacing: -0.3px; }
  h2 { font-size: 15pt; color: #1f3551; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 2px solid #f59e0b; }
  h3 { font-size: 12pt; margin: 0; display: inline; }
  h4 { font-size: 8pt; text-transform: uppercase; letter-spacing: .5px; color: #64748b; margin: 8px 0 3px; }
  p { margin: 0 0 6px; }
  .cover { height: 245mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
  .cover .band { background: #1f3551; color: #fff; border-radius: 10px; padding: 26px 26px 22px; }
  .cover .band h1 { color: #fff; }
  .cover .kicker { color: #f59e0b; font-weight: 700; letter-spacing: 1.5px; font-size: 9pt; text-transform: uppercase; }
  .cover .sub { font-size: 12pt; color: #dde6f1; max-width: 150mm; }
  .facts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
  .fact { background: rgba(255,255,255,.08); border-radius: 8px; padding: 10px; }
  .fact b { display: block; font-size: 18pt; color: #fff; }
  .fact span { font-size: 8.5pt; color: #bccde3; }
  .meta-table td { padding: 3px 10px 3px 0; font-size: 9pt; } .meta-table td:first-child { color: #64748b; }
  .section { page-break-before: always; }
  .lead { font-size: 10.5pt; color: #334155; }
  table.grid { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 8.6pt; }
  table.grid th { background: #1f3551; color: #fff; text-align: left; padding: 5px 6px; font-weight: 600; }
  table.grid td { border-bottom: 1px solid #e2e8f0; padding: 5px 6px; vertical-align: top; }
  table.grid tr:nth-child(even) td { background: #f8fafc; }
  table.grid tr { page-break-inside: avoid; }
  .matrix th.c { text-align: center; font-size: 7.6pt; } .matrix td.c { text-align: center; }
  .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #0f766e; }
  .mono { font-family: Menlo, Consolas, monospace; font-size: 8pt; } .b { font-weight: 700; } .small { font-size: 8.2pt; } .muted { color: #94a3b8; }
  .badge { display: inline-block; border-radius: 999px; padding: 1px 8px; font-size: 7.6pt; font-weight: 700; }
  .p0 { background: #fee2e2; color: #991b1b; } .p1 { background: #fef3c7; color: #92400e; } .p2 { background: #e2e8f0; color: #334155; }
  .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px; margin: 0 0 10px; page-break-inside: avoid; }
  .card-h { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
  .card .id { font-family: Menlo, monospace; font-weight: 700; color: #0f766e; margin-right: 6px; }
  .card .meta { display: flex; gap: 8px; align-items: center; } .card .spec { font-size: 7.8pt; color: #64748b; }
  .purpose { margin-top: 6px; color: #334155; font-style: italic; }
  .cols { display: grid; grid-template-columns: 1.15fr 1fr; gap: 14px; }
  .cols ul { margin: 0; padding-left: 14px; } .cols li { margin-bottom: 3px; }
  .side { border-left: 3px solid #f1f5f9; padding-left: 10px; }
  .chip { display: inline-block; border-radius: 5px; padding: 1px 6px; margin: 0 2px 3px 0; font-size: 7.8pt; background: #dde6f1; color: #1f3551; }
  .chip.int { background: #ccfbf1; color: #115e59; } .chip.ext { background: #fef3c7; color: #92400e; }
  .principles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 8px 0 12px; }
  .principles div { border-left: 3px solid #f59e0b; padding: 2px 0 2px 8px; }
  .flow { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px 4px; margin-bottom: 8px; page-break-inside: avoid; }
  .flow h4 { color: #1f3551; font-size: 9pt; text-transform: none; letter-spacing: 0; margin: 2px 0 4px; }
  .flow ol { margin: 0 0 4px; padding-left: 16px; } .flow li { margin-bottom: 2px; }
  .phase { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px; margin-bottom: 8px; }
  .phase p { margin: 4px 0 0; font-size: 8.6pt; color: #334155; }
  .legend { font-size: 8.4pt; color: #475569; }
</style></head><body>

<div class="cover">
  <div class="band">
    <div class="kicker">Credit Information Center · Central Bank of Myanmar</div>
    <h1>Backend Engine Specification</h1>
    <p class="sub">The services that must be built behind the Public website, Borrower self-service, MFI Member Portal and Government Portal — their scope, which portals use them, and what they integrate with.</p>
    <div class="facts">
      <div class="fact"><b>${ENGINES.length}</b><span>backend engines</span></div>
      <div class="fact"><b>5</b><span>portals / portal areas</span></div>
      <div class="fact"><b>${EXTERNAL.length}</b><span>external integrations</span></div>
      <div class="fact"><b>${counts.Pilot} / ${counts.Production} / ${counts.Option}</b><span>Pilot / Production / Option</span></div>
    </div>
  </div>
  <table class="meta-table">
    <tr><td>Document</td><td>CIC Myanmar Platform — Backend Engines, scope &amp; integrations</td></tr>
    <tr><td>Version</td><td>1.0 draft for internal review</td></tr>
    <tr><td>Date</td><td>${today}</td></tr>
    <tr><td>Prepared by</td><td>PT. LinkIT 360 — Presales</td></tr>
    <tr><td>Based on</td><td>CIC Myanmar Platform — E2E Requirements Specification v1.0; working prototype (cic-platform.vercel.app)</td></tr>
  </table>
</div>

<div>
  <h2>1. Summary</h2>
  <p class="lead">The front-end prototype runs every portal on data kept in the browser. For production, that logic moves into ${ENGINES.length} backend engines behind one API gateway. Each engine owns its data, exposes versioned APIs, and writes every sensitive action to the audit store. Portals never talk to a database directly.</p>
  <div class="principles">
    <div><b>One core, many portals.</b> Registry, inquiry, disputes and billing are built once and reused by every portal.</div>
    <div><b>Security enforced on the server.</b> Tenant, role, CRUD permission and data scope are checked by the permission decision point on every call.</div>
    <div><b>Maker-checker everywhere.</b> Licence changes, corrections, rule activation, publishing, role changes and large loans go through one approval engine.</div>
    <div><b>Evidence by design.</b> Hash-chained audit, consent references, rule versions and data dates travel with every report.</div>
    <div><b>Bilingual.</b> Content and UI strings are served in English and Myanmar (Unicode) from the CMS.</div>
    <div><b>Integrations as options.</b> NRC, MCIX, MMCB and alternative data sit behind an integration hub with their own agreements.</div>
  </div>
  <h4>Phase legend</h4>
  <p class="legend">${phaseBadge('Pilot')} needed before the 5-MFI pilot · ${phaseBadge('Production')} needed before scaling to 30 MFIs · ${phaseBadge('Option')} after the foundation is stable, subject to agreements.</p>
  <h2 style="margin-top:14px">2. Architecture overview</h2>
  ${diagram()}
</div>

<div class="section">
  <h2>3. Engine catalogue</h2>
  ${catalogue}
</div>

<div class="section">
  <h2>4. Which portals use which engine</h2>
  ${matrix}
  <p class="legend">Public website and CMS-published content are served from the public zone and never hold personal data; all other portals sit behind the gateway in the private zone.</p>
</div>

<div class="section">
  <h2>5. Engine details — scope and integrations</h2>
  ${ENGINES.map(card).join('')}
</div>

<div class="section">
  <h2>6. External integrations</h2>
  ${external}
  <h2 style="margin-top:16px">7. How the engines work together</h2>
  ${flows}
</div>

<div class="section">
  <h2>8. Build phasing</h2>
  ${phases}
  <h4>Open decisions that affect the backend</h4>
  <ul>
    <li>Hosting location and data residency (in-country or CBM-approved cloud) — affects E21, E20, E25.</li>
    <li>Identity verification route for citizens (NRC registry API, MFI phone OTP, branch activation) — affects E02, E24.</li>
    <li>Payment providers and settlement accounts — affects E15.</li>
    <li>CIC's role versus MCIX and MMCB, and whether data exchange is in scope — affects E24.</li>
    <li>Exact CBM regulation clauses for retention, dispute SLA and consent — affects E04, E09, E12, E14, E19.</li>
  </ul>
</div>
</body></html>`;

const htmlPath = path.join(here, 'CIC-Backend-Engines.html');
fs.writeFileSync(htmlPath, html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
const out = path.join(here, 'CIC-Backend-Engines.pdf');
await page.pdf({
  path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="font-family:Helvetica,Arial;font-size:7.5pt;color:#94a3b8;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>CIC Myanmar Platform — Backend Engine Specification v1.0</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
});
await browser.close();
console.log('written', out);
