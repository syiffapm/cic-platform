/** Formatting helpers shared by every portal (LOC-04). */

export const formatNumber = (n) => new Intl.NumberFormat('en-US').format(n);

/** MMK amounts; `compact` renders e.g. 12.4B. */
export function formatMMK(n, { compact = false } = {}) {
  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T MMK`;
    if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B MMK`;
    if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M MMK`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K MMK`;
  }
  return `${formatNumber(Math.round(n))} MMK`;
}

/** Lakh-style grouping option (LOC-04): 12,34,56,789 */
export function formatLakh(n) {
  const s = Math.round(n).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
}

export const formatPercent = (n, digits = 1) => `${Number(n).toFixed(digits)}%`;

export function formatDate(d, opts = {}) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...opts });
}

export function formatDateTime(d) {
  const date = d instanceof Date ? d : new Date(d);
  return `${formatDate(date)} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Masks personal data for roles that must not see it in full (Helpdesk, notification logs). */
export function maskNrc(nrc) {
  if (!nrc) return '';
  return nrc.replace(/(\d{2})(\d{4})$/, '••••$2');
}

export function maskPhone(phone) {
  if (!phone) return '';
  return phone.replace(/^(\+?\d{2,4})\d+(\d{3})$/, '$1•••••$2');
}

export const uid = (prefix = 'ID') => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

/** Days remaining until an SLA due date; negative = breached. */
export function slaDaysLeft(dueDate, now = new Date('2026-09-24T10:00:00')) {
  return Math.ceil((new Date(dueDate) - now) / 86400000);
}
