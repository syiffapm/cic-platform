/** Resolve the MFIs targeted by a notice (tiers AND regions; empty list = all). Revoked institutions are excluded. */
export function resolveRecipients(institutions, tiers = [], regions = []) {
  return institutions.filter((i) => i.status !== 'Revoked'
    && (tiers.length === 0 || tiers.includes(i.tier))
    && (regions.length === 0 || regions.includes(i.region)));
}

export function ackRows(notice, institutions, todayStr) {
  return resolveRecipients(institutions, notice.tiers, notice.regions).map((i) => {
    const a = notice.acks?.[i.id] ?? {};
    const overdue = !a.ackAt && notice.due < todayStr;
    const status = a.ackAt ? 'Acknowledged' : overdue ? 'Overdue' : a.readAt ? 'Read' : 'Unread';
    return { id: i.id, mfi: i.name, short: i.short, tier: i.tier, region: i.region, readAt: a.readAt ?? '—', by: a.by ?? '—', ackAt: a.ackAt ?? '—', status, overdue };
  });
}

export const targetLabel = (n) => [n.tiers.length ? n.tiers.join(', ') : null, n.regions.length ? n.regions.join(', ') : null].filter(Boolean).join(' · ') || 'All MFIs';
