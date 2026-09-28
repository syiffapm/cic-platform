// Extracts user-visible English strings from src/ for the Myanmar dictionary.
// Output: scripts/strings.json { exact: [...], templates: [...] }  (templates use {x} for ${...}).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src';
const exact = new Set();
const templates = new Set();
const SKIP_FILES = /(\.test\.|i18n\/(en|mm)\.js$)/;

const looksLikeClasses = (s) => s.split(/\s+/).every((t) => /^[!a-z0-9:[\]/_.%#()'&>,=-]+$/.test(t)) && /[-:]/.test(s);
const hasWords = (s) => /[A-Za-z]{2,}/.test(s);
function keep(raw) {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s || s.length < 2 || s.length > 400) return null;
  if (!hasWords(s)) return null;
  if (/[က-႟]/.test(s)) return null; // already Myanmar
  if (/^(@\/|\.{1,2}\/|\/|https?:|mailto:|tel:|#[0-9a-f]{3,8}$)/i.test(s)) return null;
  if (looksLikeClasses(s)) return null;
  if (/^[A-Z0-9_]+(-[A-Z0-9_.]+)*$/.test(s)) return null; // IDs / codes / CONSTANTS
  if (/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)*$/.test(s)) return null; // keys: camelCase, dotted
  if (/^[a-z_]+$/.test(s)) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  if (/[{}]|=>|\bconst\b|\breturn\b|;\s*$|\(\)/.test(s)) return null;
  if (/^(text|bg|border|ring|shadow|flex|grid|rounded|px|py|p|m|h|w)-/.test(s)) return null;
  return s;
}

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|mjs)$/.test(f) && !SKIP_FILES.test(p)) scan(fs.readFileSync(p, 'utf8'));
  }
}

function scan(src) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  // JSX text nodes
  for (const m of code.matchAll(/>([^<>{}`]+)</g)) { const k = keep(m[1]); if (k) exact.add(k); }
  // JSX text that mixes {expr}: turn into templates, e.g. >Welcome, {user.name}<
  for (const m of code.matchAll(/>([^<>`]{1,300})</g)) {
    if (!m[1].includes('{')) continue;
    const t = m[1].replace(/\{[^{}]*\}/g, '{x}').replace(/\s+/g, ' ').trim();
    if (/[{}]/.test(t.replace(/\{x\}/g, ''))) continue;
    if (/[A-Za-z]{2,}/.test(t.replace(/\{x\}/g, '')) && t !== '{x}' && !/[;=]|=>/.test(t)) templates.add(t);
  }
  // String literals
  for (const m of code.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)) {
    const raw = (m[1] ?? m[2] ?? '').replace(/\\'/g, "'").replace(/\\"/g, '"');
    const k = keep(raw); if (k) exact.add(k);
  }
  // Template literals
  for (const m of code.matchAll(/`([^`]{0,600})`/g)) {
    const body = m[1];
    if (!body.includes('${')) { const k = keep(body); if (k) exact.add(k); continue; }
    if (body.length > 400) continue;
    const t = body.replace(/\$\{(?:[^{}]|\{[^{}]*\})*\}/g, '{x}').replace(/\s+/g, ' ').trim();
    const statics = t.replace(/\{x\}/g, ' ');
    if (!/[A-Za-z]{3,}/.test(statics) || looksLikeClasses(statics.trim()) || /^[/#@]/.test(t) || /^(https?|\/)/.test(t)) continue;
    if (/^[\w./-]*\{x\}[\w./-]*$/.test(t)) continue; // paths / ids like /gov/mfi/{x}
    if (/(^|\s)(text|bg|border|ring|flex|grid|rounded|px|py|w|h)-/.test(statics)) continue;
    templates.add(t);
  }
}

walk(ROOT);
const out = { exact: [...exact].sort(), templates: [...templates].sort() };
fs.writeFileSync('scripts/strings.json', JSON.stringify(out, null, 1));
console.log('exact', out.exact.length, 'templates', out.templates.length, 'chars', out.exact.join('').length + out.templates.join('').length);
