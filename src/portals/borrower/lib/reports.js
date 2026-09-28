import { useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { OPEN_STATUSES, REQUEST_STEPS, TODAY, currentReport, quotaFor } from '@/lib/reportRequests';
import { toLoanView } from './myFile';
import { useBorrower, useOwnState, usePersistentState } from './borrower';

/** Plain-language explanation of each request status, shown on the tracker and dashboard. */
export const STATUS_MESSAGES = {
  Submitted: 'We have received your request.',
  Validating: 'CIC is checking your identity and the latest data from every lender that reports to your file.',
  'Pending review': 'A CIC officer is reviewing your file before the report is issued. Decision within 1 working day.',
  Ready: 'Your credit report has been issued. It stays valid for 30 days.',
  Rejected: 'CIC could not issue a report for this request.',
};

/** What the citizen should do after each rejection reason. */
export const REJECT_HELP = {
  RJ01: 'Visit any licensed MFI branch or the CIC counter with your NRC card to confirm your identity, then request again. Helpdesk: 1800 242 242.',
  RJ02: 'No action is needed. When the correction is approved, request an updated report — it is free after a corrected dispute.',
  RJ03: 'Your earlier report is still valid. Open it from “My credit report”, or request again after it expires.',
};

export const stepIndex = (status) => (status === 'Rejected' ? 2 : Math.max(0, REQUEST_STEPS.indexOf(status)));
export const isOpenRequest = (r) => OPEN_STATUSES.includes(r.status);

const RECENT = (() => { const d = new Date(TODAY); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); })();
const resolvedAt = (d) => d.resolvedAt ?? d.history?.[d.history.length - 1]?.at ?? d.dueAt ?? '';

/** Report snapshot → the shapes the report components use (registry loans → loan view). */
export function snapshotView(result) {
  if (!result) return null;
  return {
    ...result,
    loanViews: (result.loans ?? []).map(toLoanView),
    guaranteeViews: (result.guarantees ?? []).map((g, i) => ({ ...g, id: g.id ?? `${result.reportId}-G${i + 1}` })),
  };
}

/**
 * The signed-in citizen's report requests and what they may do next. Always keyed by the session
 * borrowerId: a citizen never sees another person's request or report.
 */
export function useReportRequests() {
  const user = useBorrower();
  const { reportRequests = [], disputes } = useStore();
  const [seen] = usePersistentState(`seenReports.${user?.borrowerId ?? 'anon'}`, []);
  return useMemo(() => {
    const id = user?.borrowerId;
    const requests = reportRequests.filter((r) => r.borrowerId === id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const current = id ? currentReport(reportRequests, id) : null;
    const open = requests.find(isOpenRequest) ?? null;
    const lastIssued = requests.find((r) => r.status === 'Ready' && r.result) ?? null;
    const expired = !current && lastIssued ? lastIssued : null;
    const lastRejected = requests[0]?.status === 'Rejected' ? requests[0] : null;
    const since = (current ?? lastIssued)?.result?.generatedAt?.replace('T', ' ').slice(0, 16) ?? '';
    const correctedDispute = lastIssued
      ? disputes.filter((d) => d.borrowerId === id && d.status === 'Resolved' && resolvedAt(d) > since).sort((a, b) => resolvedAt(b).localeCompare(resolvedAt(a)))[0] ?? null
      : null;
    const quota = quotaFor(reportRequests, id);
    let block = null;
    if (open) block = { kind: 'open', text: `Request ${open.id} is still being processed. You can make a new request once it is decided.` };
    else if (current && !correctedDispute) block = { kind: 'valid', text: `Your report ${current.result.reportId} is valid until ${current.result.validUntil}. You can request a new one after it expires, or straight away when a dispute on your file is corrected.` };
    // Decisions from the last 7 days that the citizen has not opened yet (older ones were notified long ago).
    const unseenReady = requests.filter((r) => ['Ready', 'Rejected'].includes(r.status) && r.reviewedAt >= RECENT && !seen.includes(r.id));
    return { requests, current, snapshot: snapshotView(current?.result), open, lastIssued, expired, lastRejected, correctedDispute, quota, block, canRequest: !block, unseenReady, today: TODAY };
  }, [user, reportRequests, disputes, seen]);
}

/** Marks a decided request as seen (clears the sidebar badge). */
export function useMarkRequestSeen() {
  const user = useBorrower();
  const [, setSeen] = usePersistentState(`seenReports.${user?.borrowerId ?? 'anon'}`, []);
  return (id) => setSeen((list) => (list.includes(id) ? list : [...list, id]));
}

/** In-app alerts derived from the citizen's report requests (report ready / not approved / in review). */
export function requestAlerts(requests, seen = []) {
  return requests.flatMap((r) => {
    if (r.status === 'Ready' && r.result) {
      return [{ id: `${r.id}:ready`, requestId: r.id, type: 'report', title: 'Your credit report is ready', body: `Report ${r.result.reportId} was approved by CIC and is valid until ${r.result.validUntil}.`, at: r.reviewedAt ?? r.submittedAt, read: r.reviewedAt < RECENT || seen.includes(r.id), link: `/borrower/requests/${r.id}` }];
    }
    if (r.status === 'Rejected') {
      return [{ id: `${r.id}:rejected`, requestId: r.id, type: 'report', title: 'Your report request was not approved', body: 'See the reason and what to do next.', at: r.reviewedAt ?? r.submittedAt, read: r.reviewedAt < RECENT || seen.includes(r.id), link: `/borrower/requests/${r.id}` }];
    }
    if (isOpenRequest(r)) {
      return [{ id: `${r.id}:open`, requestId: r.id, type: 'report', title: `Report request ${r.id} received`, body: 'CIC is validating your data. An officer will decide within 1 working day.', at: r.submittedAt, read: true, link: `/borrower/requests/${r.id}` }];
    }
    return [];
  });
}

/** Stored alerts merged with report-request alerts, newest first; markRead works for both. */
export function useAllAlerts() {
  const user = useBorrower();
  const [alerts, setAlerts] = useOwnState('alerts');
  const [seen, setSeen] = usePersistentState(`seenReports.${user?.borrowerId ?? 'anon'}`, []);
  const { reportRequests = [] } = useStore();
  const merged = useMemo(() => {
    const own = reportRequests.filter((r) => r.borrowerId === user?.borrowerId);
    return [...requestAlerts(own, seen), ...alerts].sort((a, b) => b.at.localeCompare(a.at));
  }, [alerts, reportRequests, seen, user]);
  const markRead = (id) => {
    const reqIds = merged.filter((a) => a.requestId && (id === 'all' || a.id === id)).map((a) => a.requestId);
    if (reqIds.length) setSeen((list) => [...new Set([...list, ...reqIds])]);
    setAlerts((list) => list.map((a) => (id === 'all' || a.id === id ? { ...a, read: true } : a)));
  };
  return [merged, markRead];
}
