import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Unlock } from 'lucide-react';
import { Alert, Badge, Card, CardHeader, DataTable, PageHeader, StatCard } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { ACCESS_DAYS, entitlementFor } from '@/lib/reportAccess';
import { formatDate, maskNrc } from '@/lib/format';
import { getBorrowerFile } from '../../data/borrowers';
import { useTenant } from '../../components/MfiState';

/** Reports the institution currently holds — every user sees what has already been paid for. */
export default function UnlockedReports() {
  const store = useStore();
  const { reportPurchases } = store;
  const { tenant, institution } = useTenant();
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const ids = [...new Set(reportPurchases.filter((p) => p.mfiId === tenant).map((p) => p.borrowerId))];
    return ids.map((id) => {
      const e = entitlementFor(reportPurchases, tenant, id);
      const p = e.full ?? e.basic;
      if (!p) return null;
      const file = getBorrowerFile(id, store);
      const paid = [...new Set([e.basic, e.full].filter(Boolean))];
      return { id, name: file?.nameEn ?? id, nrc: file?.nrc, tier: p.tier, by: p.purchasedBy, at: p.at, validUntil: p.validUntil, cost: paid.reduce((s, x) => s + x.price, 0), covered: p.coveredBy === 'Subscription', applicationId: p.applicationId };
    }).filter(Boolean).sort((a, b) => b.at.localeCompare(a.at));
  }, [reportPurchases, tenant, store]);

  const full = rows.filter((r) => r.tier === 'Full').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Unlocked reports" subtitle={`Credit reports ${institution?.short ?? 'your institution'} has already paid for. Any user with inquiry access can open them without a further charge until they expire.`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Reports open now" value={rows.length} icon={Unlock} tone="teal" definition={`Borrowers with an active Basic or Full report for ${institution?.short ?? 'your institution'}. Access lasts ${ACCESS_DAYS} days from purchase.`} asOf="25 Sep 2026" />
        <StatCard label="Full reports" value={full} tone="navy" definition="Full includes everything in Basic plus 24-month history, closed loans, guarantees, inquiries, reason codes and PDF." asOf="25 Sep 2026" />
        <StatCard label="Basic only" value={rows.length - full} tone="warm" definition="Basic reports can be upgraded to Full for USD 4." asOf="25 Sep 2026" />
      </div>
      <Alert tone="info">Opening an unlocked report is free, but it is still recorded against your name in the audit trail and must be used only for the original purpose.</Alert>
      <Card>
        <CardHeader title="Active entitlements" subtitle="Select a row to open the report" />
        <DataTable
          rows={rows}
          searchKeys={['name', 'id', 'by']}
          onRowClick={(r) => navigate(r.applicationId ? `/mfi/applications/${r.applicationId}` : `/mfi/credit/inquiry?open=${r.id}`)}
          columns={[
            { key: 'name', header: 'Borrower', sortable: true, render: (r) => <>{r.name}<span className="block font-mono text-[11px] text-slate-500">{maskNrc(r.nrc)} · {r.id}</span></> },
            { key: 'tier', header: 'Report', render: (r) => <Badge tone={r.tier === 'Full' ? 'navy' : 'slate'}>{r.tier}</Badge> },
            { key: 'by', header: 'Unlocked by', sortable: true },
            { key: 'at', header: 'Date', sortable: true, render: (r) => formatDate(r.at.slice(0, 10)) },
            { key: 'validUntil', header: 'Valid until', sortable: true, render: (r) => formatDate(r.validUntil) },
            { key: 'cost', header: 'Cost', render: (r) => (r.covered ? 'Subscription' : `USD ${r.cost}`) },
          ]}
        />
      </Card>
    </div>
  );
}
