/**
 * Myanmar NRC parser (LOC-03, BOR-01).
 * Format: {state 1-14}/{township code}({citizenship type}){6 digits}
 * e.g. 12/ABC(N)123456  or 12/OuKaMa(N)123456. Myanmar digits are normalised to Latin.
 */
const MM_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
const CITIZENSHIP = { N: 'Citizen (Naing)', E: 'Associate (E)', P: 'Naturalised (Pyu)', T: 'Temporary (Thi)', Y: 'Religious (Yahan)', S: 'Monk (Sa)' };
const MM_CITIZENSHIP = { 'နိုင်': 'N', 'ဧည့်': 'E', 'ပြု': 'P' };

export function normaliseDigits(value) {
  return String(value ?? '').replace(/[၀-၉]/g, (d) => String(MM_DIGITS.indexOf(d)));
}

export function parseNrc(raw) {
  let value = normaliseDigits(raw).trim().replace(/\s+/g, '');
  Object.entries(MM_CITIZENSHIP).forEach(([mm, en]) => { value = value.replace(`(${mm})`, `(${en})`); });
  const m = value.match(/^(1[0-4]|[1-9])\/([A-Za-zက-႟]{3,9})\(([NEPTYS])\)(\d{6})$/i);
  if (!m) return { valid: false, error: 'Use the format 12/ABC(N)123456 (state/township(type)number).' };
  const [, state, township, type, number] = m;
  return {
    valid: true,
    state: Number(state),
    township: township.toUpperCase(),
    type: type.toUpperCase(),
    typeLabel: CITIZENSHIP[type.toUpperCase()],
    number,
    normalised: `${state}/${township.toUpperCase()}(${type.toUpperCase()})${number}`,
  };
}

/** Strips Myanmar honorifics for matching (LOC-02). */
export function normaliseName(name) {
  return String(name ?? '')
    .replace(/^(U|Daw|Ko|Ma|Maung|Mg|ဦး|ဒေါ်|ကို|မ)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Very rough Zawgyi detection heuristic for paste handling (CMS-02, LOC-01). */
export function looksLikeZawgyi(text) {
  return /[ၚၠ-႗]|ေျ|ဳ|ဴ/.test(text ?? '');
}
