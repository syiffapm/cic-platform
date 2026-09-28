import { useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { ACCOUNTS as SEED_ACCOUNTS, DECLINE_REASONS } from '@/data/seed';
import { getBorrowerFile } from '@/data/registry';
import { DECLINE_COUNTS, DISBURSED_BY_MFI, DISBURSED_BY_REGION, LENDING_MONTHLY } from '../../data/lending';

const STATUSES = ['Submitted', 'Credit check', 'Approved', 'Rejected', 'Disbursed', 'Withdrawn'];
const PERIOD = { '3m': 3, '6m': 6, '12m': 12 };

/**
 * Aggregated view of the citizen lending journey: monthly DWH aggregates plus today's live
 * application pipeline. Returns counts only — never names, NRCs or application IDs.
 */
export default function useLendingData(period = '12m') {
  const { loanApplications = [], accounts = [], reportedLoans = [], institutions } = useStore();

  return useMemo(() => {
    const months = LENDING_MONTHLY.slice(-PERIOD[period]);
    const last = LENDING_MONTHLY[LENDING_MONTHLY.length - 1];
    const prev = LENDING_MONTHLY[LENDING_MONTHLY.length - 2];
    const sum = (k) => months.reduce((s, m) => s + m[k], 0);
    const total = sum('total');
    const scale = months.length / 12;

    const kpis = {
      applications: total,
      onlineShare: last.onlineShare,
      onlineDelta: Math.round((last.onlineShare - prev.onlineShare) * 10) / 10,
      approvalRate: Math.round((sum('approved') / (sum('approved') + sum('declined'))) * 1000) / 10,
      daysOnline: last.daysOnline,
      daysBranch: last.daysBranch,
      disbursedBn: Math.round(sum('disbursedBn')),
      multiShare: last.multiShare,
      multiApproval: last.multiApproval,
      multiApps: sum('multiApps'),
      accounts: last.accounts + Math.max(0, accounts.length - SEED_ACCOUNTS.length),
      newAccounts: last.accounts - prev.accounts,
      reportViews: last.reportViews,
      disputesFiled: last.disputesFiled,
    };

    const declines = DECLINE_REASONS.map((r) => ({ code: r.code, label: r.label, count: Math.round(DECLINE_COUNTS[r.code] * scale) }));
    const declineTotal = declines.reduce((s, d) => s + d.count, 0);
    declines.forEach((d) => { d.pct = Math.round((d.count / declineTotal) * 1000) / 10; });

    const byRegion = DISBURSED_BY_REGION.map((r) => ({ name: r.region, bn: Math.round(r.bn * scale * 10) / 10 }));
    const byMfi = Object.entries(DISBURSED_BY_MFI)
      .map(([id, bn]) => ({ name: institutions.find((i) => i.id === id)?.short ?? id, bn: Math.round(bn * scale * 10) / 10 }))
      .sort((a, b) => b.bn - a.bn);

    const activeLoans = (borrowerId) => (getBorrowerFile(borrowerId, { reportedLoans, accounts })?.loans ?? [])
      .filter((l) => l.status === 'Active').length;
    const open = loanApplications.filter((a) => ['Submitted', 'Credit check'].includes(a.status));
    const pipeline = {
      byStatus: STATUSES.map((s) => ({ status: s, count: loanApplications.filter((a) => a.status === s).length })),
      online: loanApplications.filter((a) => a.channel === 'Borrower portal').length,
      branch: loanApplications.filter((a) => a.channel !== 'Borrower portal').length,
      open: open.length,
      openMulti: open.filter((a) => activeLoans(a.borrowerId) >= 3).length,
      allMulti: loanApplications.filter((a) => activeLoans(a.borrowerId) >= 3).length,
      total: loanApplications.length,
    };

    return { months, kpis, declines, byRegion, byMfi, pipeline };
  }, [period, loanApplications, accounts, reportedLoans, institutions]);
}
