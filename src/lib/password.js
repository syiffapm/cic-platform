/** Password policy shared by citizen first sign-in and staff password changes. */
export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'One capital letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One small letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'One number (0–9)', test: (p) => /\d/.test(p) },
  { id: 'symbol', label: 'One symbol, e.g. ! @ # $', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const passwordOk = (p) => PASSWORD_RULES.every((r) => r.test(p));

/** Temporary password sent by SMS / email after registration, e.g. "Kx7-pQ29". */
export function temporaryPassword() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const pick = (set, n) => Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join('');
  return `${pick(letters, 2)}${pick('23456789', 1)}-${pick(letters, 1)}${pick('23456789', 3)}`;
}
