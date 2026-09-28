// Builds docs/translations/cic-translations-en-mm.json for native-speaker review.
import fs from 'node:fs';
import path from 'node:path';
import en from '../src/i18n/en.js';
import mm from '../src/i18n/mm.js';

const dict = JSON.parse(fs.readFileSync('public/i18n/mm.json', 'utf8'));
const AREAS = [
  ['src/portals/public/', 'Public website'],
  ['src/portals/borrower/', 'Citizen portal (Borrower self-service)'],
  ['src/portals/mfi/', 'MFI Member Portal'],
  ['src/portals/regulator/', 'Government Portal — Supervision'],
  ['src/portals/admin/', 'Government Portal — Administration & CMS'],
  ['src/portals/government/', 'Government Portal — Access & navigation'],
  ['src/pages/', 'Sign-in pages'],
  ['src/', 'Shared (all portals)'],
];
const ORDER = AREAS.map(([, a]) => a);

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|mjs)$/.test(f) && !/i18n\/(en|mm)\.js$/.test(p)) files.push({ p: p.replace(/\\/g, '/'), src: fs.readFileSync(p, 'utf8').replace(/\s+/g, ' ') });
  }
})('src');
const areaOf = (p) => AREAS.find(([pre]) => p.startsWith(pre))[1];

const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function whereUsed(english, isTemplate) {
  let hits;
  if (isTemplate) {
    // Match the whole pattern: each {x} may be \${expr} in a template literal or {expr} in JSX.
    const re = new RegExp(english.split('{x}').map((part) => esc(part.trim())).join('\\s*(?:\\$?\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\})\\s*'));
    hits = files.filter((f) => re.test(f.src));
  } else {
    hits = files.filter((f) => f.src.includes(english));
  }
  const areas = [...new Set(hits.map((f) => areaOf(f.p)))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  return { areas: areas.length ? areas : ['Shared (all portals)'], files: hits.slice(0, 3).map((f) => f.p.replace('src/', '')) };
}

const entries = [];
let n = 0;
const push = (type, english, myanmar, notes = '') => {
  const w = whereUsed(english, type === 'template');
  entries.push({ id: '', type, area: w.areas[0], also_used_in: w.areas.slice(1), english, myanmar, notes, source_files: w.files, review_status: '', corrected_myanmar: '', reviewer_comment: '' });
};

// 1) Keyed UI strings (src/i18n/en.js ↔ mm.js)
(function flat(obj, mmObj, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flat(v, mmObj?.[k] ?? {}, key);
    else entries.push({ id: '', type: 'key', key, area: 'Shared (all portals)', also_used_in: [], english: v, myanmar: mmObj?.[k] ?? '', notes: 'Key-based string (navigation, headings).', source_files: ['i18n/en.js', 'i18n/mm.js'], review_status: '', corrected_myanmar: '', reviewer_comment: '' });
  }
})(en, mm);
// 2) Phrases and 3) templates from the runtime dictionary
for (const [e, m] of Object.entries(dict.exact)) push('phrase', e, m);
for (const [e, m] of Object.entries(dict.templates)) push('template', e, m, '{x} is a value filled in at runtime (number, date, name or ID). Keep every {x} in the translation, in the natural position.');

entries.sort((a, b) => ORDER.indexOf(a.area) - ORDER.indexOf(b.area) || (a.type === 'key' ? -1 : 0) - (b.type === 'key' ? -1 : 0) || a.english.localeCompare(b.english));
entries.forEach((e) => { n += 1; e.id = `CIC-T${String(n).padStart(5, '0')}`; });

const byArea = Object.fromEntries(ORDER.map((a) => [a, entries.filter((e) => e.area === a).length]).filter(([, c]) => c));
const out = {
  project: 'CIC Myanmar Platform — UI translations',
  languages: { source: 'English (en)', target: 'Myanmar / Burmese (my), Unicode only — no Zawgyi' },
  generated: new Date().toISOString().slice(0, 10),
  live_site: 'https://cic-platform.vercel.app (switch EN / မြန်မာ in the top bar)',
  instructions_for_reviewers: [
    'Review the "myanmar" field. If it is correct, set "review_status" to "approved".',
    'If it needs a change, set "review_status" to "changed" and write the corrected text in "corrected_myanmar". Add a note in "reviewer_comment" if useful.',
    'Keep every {x} placeholder exactly as {x}; it is replaced by a number, date, name or ID on screen.',
    'Keep acronyms, IDs, names of people, institutions and places in Latin script (CIC, MFI, NRC, PAR30, USD, MMK, LAP-2026-00318, U Kyaw Zin …).',
    'Use Myanmar Unicode only. Do not use Zawgyi.',
    'Please keep the same "id" values so the corrections can be imported back automatically.',
  ],
  glossary: {
    'credit report': 'ချေးငွေအစီရင်ခံစာ', 'credit score': 'ချေးငွေရမှတ်', 'borrower': 'ချေးငွေယူသူ', 'lender': 'ချေးငွေပေးသူ',
    'loan application': 'ချေးငွေလျှောက်လွှာ', 'microfinance institution (MFI)': 'အသေးစားငွေရေးအဖွဲ့အစည်း (MFI)', 'dispute': 'အငြင်းပွားမှု / ကန့်ကွက်ချက်',
    'consent': 'သဘောတူညီချက်', 'sign in': 'ဝင်ရောက်ရန်', 'register': 'မှတ်ပုံတင်ရန်', 'approve': 'အတည်ပြုရန်', 'reject': 'ငြင်းပယ်ရန်',
    'township': 'မြို့နယ်', 'Central Bank of Myanmar': 'မြန်မာနိုင်ငံတော်ဗဟိုဘဏ်', 'audit log': 'စာရင်းစစ်မှတ်တမ်း', 'role': 'အခန်းကဏ္ဍ', 'permission': 'ခွင့်ပြုချက်',
  },
  summary: { total: entries.length, keys: entries.filter((e) => e.type === 'key').length, phrases: entries.filter((e) => e.type === 'phrase').length, templates: entries.filter((e) => e.type === 'template').length, by_area: byArea },
  entries,
};
fs.writeFileSync('docs/translations/cic-translations-en-mm.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.summary, null, 1));
