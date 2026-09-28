/**
 * Detects personal identifiers typed into public-only tools (PUB-11: no PII).
 * Matches NRC in Latin or Myanmar script, e.g. 12/OUKAMA(N)245781, ၁၂/ဥကမ(နိုင်)၂၄၅၇၈၁, and long phone numbers.
 */
const NRC_PATTERN = /[0-9၀-၉]{1,2}\s*\/\s*[A-Za-zက-႟]{2,12}\s*\(\s*[A-Za-zက-႟]{1,6}\s*\)\s*[0-9၀-၉]{5,6}/g;
const NRC_LOOSE = /[0-9၀-၉]{1,2}\s*\/\s*[A-Za-zက-႟]{2,12}\s*[0-9၀-၉]{6}/g;
const PHONE_PATTERN = /(\+?95|0)9[\s-]?\d{3}[\s-]?\d{3,5}/g;

export function containsNrc(text) {
  NRC_PATTERN.lastIndex = 0; NRC_LOOSE.lastIndex = 0;
  return NRC_PATTERN.test(text) || NRC_LOOSE.test(text);
}

export function redactPii(text) {
  return text
    .replace(NRC_PATTERN, '[NRC removed]')
    .replace(NRC_LOOSE, '[NRC removed]')
    .replace(PHONE_PATTERN, '[phone removed]');
}
