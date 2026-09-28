import { useCallback, useMemo } from 'react';
import { getBorrowerFile } from '@/data/registry';
import { generateReportSnapshot, runAutomatedChecks } from '@/lib/reportRequests';
import { formatDate } from '@/lib/format';
import { useAdmin } from '../../../lib/useAdmin';
import { counts, stampOf } from './requestUtils';

const CLOSED_DISPUTE = ['Resolved', 'Rejected', 'Closed', 'Withdrawn'];

/**
 * Loads everything the reviewer needs for one request (registry file, linked account, disputes,
 * inquiries) and exposes the officer actions: re-run validation, approve and issue, reject.
 */
export function useRequestFile(req) {
  const { user, store, audit } = useAdmin('reportRequests');
  const { accounts = [], reportedLoans = [], disputes = [], inquiries = [], reportRequests = [], add, patch } = store;

  const data = useMemo(() => {
    if (!req) return null;
    const file = getBorrowerFile(req.borrowerId, { reportedLoans, accounts });
    const account = accounts.find((a) => a.id === req.accountId) ?? accounts.find((a) => a.borrowerId === req.borrowerId) ?? null;
    const openDisputes = disputes.filter((d) => d.borrowerId === req.borrowerId && !CLOSED_DISPUTE.includes(d.status));
    const since = stampOf(new Date(Date.now() - 365 * 864e5)).slice(0, 10);
    const recentInquiries = inquiries.filter((i) => i.borrowerId === req.borrowerId && i.at >= since);
    return { file, account, openDisputes, pendingCorrections: openDisputes.filter((d) => d.status === 'Pending CIC approval'), recentInquiries };
  }, [req, reportedLoans, accounts, disputes, inquiries]);

  const officer = `${user?.name} (CIC)`;
  const recipient = useCallback(() => {
    const { account, file } = data;
    const to = req.notify === 'Email' ? account?.email : account?.phone;
    return to || account?.phone || file?.phone || '';
  }, [data, req]);

  const pushHistory = (entries) => (x) => ({ history: [...(x.history ?? []), ...entries] });

  const rerun = useCallback(() => {
    const checks = runAutomatedChecks({
      file: data.file, account: data.account ?? { nrc: req.nrc, verifiedVia: 'activation code at a lender branch' }, disputes, requests: reportRequests.filter((r) => r.id !== req.id),
    });
    const c = counts(checks);
    const at = stampOf(new Date());
    const summary = c.fail ? `${c.fail} failed, ${c.warn} warning(s)` : c.warn ? `${c.warn} warning(s)` : 'no issues';
    patch('reportRequests', req.id, (x) => ({
      checks, status: ['Submitted', 'Validating'].includes(x.status) ? 'Pending review' : x.status,
      ...pushHistory([{ at, by: officer, action: `Validation re-run — ${summary}` }])(x),
    }));
    audit('REPORT_REQUEST_REVALIDATED', `${req.id} · ${req.borrowerId}`, { outcome: summary });
    return c;
  }, [data, req, disputes, reportRequests, patch, audit, officer]);

  const notify = useCallback((kind, body) => {
    add('outbox', {
      id: `MSG-${Date.now().toString(36).toUpperCase()}`, kind, channel: req.notify, to: recipient(), accountId: req.accountId,
      requestId: req.id, sentAt: new Date().toISOString(), status: 'Delivered', body,
    });
  }, [add, req, recipient]);

  const approve = useCallback(({ reviewedWarnings }) => {
    const result = generateReportSnapshot({ file: data.file, inquiries, disputes, requestId: req.id });
    const at = stampOf(new Date());
    const channel = req.notify === 'Email' ? 'Email' : 'SMS';
    patch('reportRequests', req.id, (x) => ({
      status: 'Ready', reviewedBy: user?.name, reviewedAt: at, result,
      ...pushHistory([
        { at, by: officer, action: `Approved — report ${result.reportId} issued${reviewedWarnings ? ' (warnings reviewed)' : ''}` },
        { at, by: 'CIC system', action: `${channel} sent: your credit report is ready` },
      ])(x),
    }));
    notify('report-ready', `CIC Myanmar: your credit report ${result.reportId} is ready. Sign in at cic.gov.mm/login to view it. Valid until ${formatDate(result.validUntil)}.`);
    audit('REPORT_ISSUED', `${req.id} → ${result.reportId} · ${req.borrowerId}`, { purpose: req.purpose, outcome: `Issued · valid until ${result.validUntil}` });
    return result;
  }, [data, inquiries, disputes, req, patch, user, officer, notify, audit]);

  const reject = useCallback(({ reason, note }) => {
    const at = stampOf(new Date());
    const channel = req.notify === 'Email' ? 'Email' : 'SMS';
    patch('reportRequests', req.id, (x) => ({
      status: 'Rejected', reviewedBy: user?.name, reviewedAt: at, rejectReason: { code: reason.code, label: reason.label, note },
      ...pushHistory([
        { at, by: officer, action: `Rejected — ${reason.label}` },
        { at, by: 'CIC system', action: `${channel} sent: request could not be completed` },
      ])(x),
    }));
    notify('report-rejected', `CIC Myanmar: we could not issue the credit report you requested (${req.id}). Reason: ${reason.label}. Sign in at cic.gov.mm/login for details or call the CIC helpdesk.`);
    audit('REPORT_REQUEST_REJECTED', `${req.id} · ${req.borrowerId}`, { purpose: `${reason.code} ${reason.label}`, outcome: 'Rejected' });
  }, [req, patch, user, officer, notify, audit]);

  return { ...data, rerun, approve, reject };
}
