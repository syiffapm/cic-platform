// Imports reviewer corrections from docs/translations/cic-translations-en-mm.json (or a path given as argument)
// into public/i18n/mm.json and src/i18n/mm.js keys. Only entries with review_status "changed" and a
// corrected_myanmar value are applied; placeholders ({x}) must be preserved.
import fs from 'node:fs';

const file = process.argv[2] ?? 'docs/translations/cic-translations-en-mm.json';
const review = JSON.parse(fs.readFileSync(file, 'utf8'));
const dict = JSON.parse(fs.readFileSync('public/i18n/mm.json', 'utf8'));
let applied = 0; const skipped = []; const keyChanges = [];
for (const e of review.entries) {
  if (e.review_status !== 'changed' || !e.corrected_myanmar?.trim()) continue;
  const v = e.corrected_myanmar.trim();
  if ((e.english.match(/\{x\}/g) ?? []).length !== (v.match(/\{x\}/g) ?? []).length) { skipped.push(`${e.id}: placeholder count differs`); continue; }
  if (e.type === 'template') dict.templates[e.english] = v;
  else if (e.type === 'phrase') dict.exact[e.english] = v;
  else if (e.type === 'key') keyChanges.push({ key: e.key, value: v });
  applied += 1;
}
fs.writeFileSync('public/i18n/mm.json', JSON.stringify(dict));
console.log(`applied ${applied} corrections`);
if (keyChanges.length) console.log('Update these keys in src/i18n/mm.js:', keyChanges);
if (skipped.length) console.log('skipped:', skipped);
