/** Pure helpers for the credit report request queue (SLA, timings, status tones). */

export const STATUS_TONE = { Submitted: 'blue', Validating: 'blue', 'Pending review': 'amber', Ready: 'green', Rejected: 'red', Expired: 'slate' };
export const CHECK_TONE = { pass: 'green', warn: 'amber', fail: 'red' };
export const CHECK_LABEL = { pass: 'Passed', warn: 'Warning', fail: 'Failed' };

const parse = (stamp) => new Date(String(stamp).replace(' ', 'T'));

/** Decision due 1 working day after submission (Saturday/Sunday skipped). */
export function slaDue(submittedAt) {
  const d = parse(submittedAt);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

const pad = (n) => String(n).padStart(2, '0');
export const stampOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** { due, hoursLeft, breached, label } for open requests; null once decided. */
export function slaState(req, now = new Date()) {
  if (!['Submitted', 'Validating', 'Pending review'].includes(req.status)) return null;
  const due = slaDue(req.submittedAt);
  const hoursLeft = Math.round((due - now) / 36e5);
  return {
    due: stampOf(due), hoursLeft, breached: hoursLeft < 0,
    label: hoursLeft < 0 ? `Overdue ${Math.abs(hoursLeft)} h` : hoursLeft < 1 ? 'Due within the hour' : `${hoursLeft} h left`,
  };
}

/** Hours from submission to decision, or null. */
export const hoursToDecision = (req) => (req.reviewedAt ? Math.max(0, (parse(req.reviewedAt) - parse(req.submittedAt)) / 36e5) : null);

export const formatHours = (h) => (h == null ? '—' : h < 24 ? `${Math.round(h * 10) / 10} h` : `${Math.round((h / 24) * 10) / 10} d`);

export const counts = (checks = []) => ({
  fail: checks.filter((c) => c.result === 'fail').length,
  warn: checks.filter((c) => c.result === 'warn').length,
});

/** Queue-level figures used by the queue page and the operations dashboard. */
export function requestStats(requests, now = new Date()) {
  const today = stampOf(now).slice(0, 10);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week = stampOf(weekStart).slice(0, 10);
  const issued = requests.filter((r) => r.status === 'Ready' && r.reviewedAt);
  const times = issued.map(hoursToDecision).filter((h) => h != null);
  return {
    pendingReview: requests.filter((r) => r.status === 'Pending review').length,
    open: requests.filter((r) => ['Submitted', 'Validating', 'Pending review'].includes(r.status)).length,
    overdue: requests.filter((r) => slaState(r, now)?.breached).length,
    issuedToday: issued.filter((r) => r.reviewedAt.slice(0, 10) === today).length,
    issuedWeek: issued.filter((r) => r.reviewedAt.slice(0, 10) >= week).length,
    issuedTotal: issued.length,
    rejected: requests.filter((r) => r.status === 'Rejected').length,
    avgHours: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
  };
}
