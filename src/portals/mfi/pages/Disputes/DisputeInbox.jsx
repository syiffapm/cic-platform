import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Badge, Card, DataTable, PageHeader, StatCard, Tabs } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { formatDate, slaDaysLeft } from '@/lib/format';
import { useTenant } from '../../components/MfiState';
import SlaBadge from '../../components/SlaBadge';
import { CLOSED, OPEN, reasonLabel } from '../../components/disputeUtils';
import { PermButton, ViewOnlyBanner } from '../../components/access';
import { downloadFile, toCsv } from '../../components/download';


/** Dispute inbox — disputes on own data only. */
export default function DisputeInbox() {
  const { user, tenant } = useTenant();
  const { disputes, logAudit } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('open');

  const own = disputes.filter((d) => d.mfiId === tenant);
  const groups = {
    open: own.filter((d) => OPEN.includes(d.status)),
    pending: own.filter((d) => !OPEN.includes(d.status) && !CLOSED.includes(d.status)),
    closed: own.filter((d) => CLOSED.includes(d.status)),
    all: own,
  };
  const breached = groups.open.filter((d) => slaDaysLeft(d.mfiDueAt) < 0).length;

  const exportCsv = () => {
    const rows = groups[tab].map((d) => ({ ...d, reasonText: reasonLabel(d.reason) }));
    downloadFile(`disputes-${tenant}-${tab}.csv`, toCsv(rows, [
      { key: 'id', header: 'Dispute' }, { key: 'filedAt', header: 'Filed' }, { key: 'borrowerId', header: 'Borrower ID' }, { key: 'loanId', header: 'Loan' },
      { key: 'reasonText', header: 'Reason' }, { key: 'status', header: 'Status' }, { key: 'mfiDueAt', header: 'MFI response due' },
    ]));
    logAudit({ actor: user.name, role: user.role, tenant, action: 'DISPUTES_EXPORT', module: 'Disputes', target: `${rows.length} disputes`, outcome: 'Success' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispute inbox"
        subtitle="Disputes raised by borrowers on data your institution reported. Respond within 10 working days; corrections take effect only after CIC approval."
        actions={<PermButton feature="mfi.disputes" action="export" what="export disputes" variant="outline" icon={Download} onClick={exportCsv}>Export CSV</PermButton>}
      />
      <ViewOnlyBanner feature="mfi.disputes" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting your response" value={groups.open.length} tone="warm" definition="Disputes assigned to your institution with no response yet." />
        <StatCard label="MFI SLA breached" value={breached} tone="red" definition="Open disputes past the 10-working-day MFI response deadline. Breaches are escalated to CBM Consumer Protection." />
        <StatCard label="With CIC for approval" value={groups.pending.length} tone="violet" definition="Responses or corrections submitted and waiting for CIC Data Steward review." />
      </div>

      <Card>
        <Tabs
          className="px-4"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'open', label: 'Needs response', count: groups.open.length },
            { id: 'pending', label: 'With CIC', count: groups.pending.length },
            { id: 'closed', label: 'Closed', count: groups.closed.length },
            { id: 'all', label: 'All', count: own.length },
          ]}
        />
        <DataTable
          rows={groups[tab]}
          searchKeys={['id', 'borrowerName', 'loanId']}
          onRowClick={(r) => navigate(`/mfi/disputes/${r.id}`)}
          emptyTitle="No disputes in this view"
          columns={[
            { key: 'id', header: 'Dispute', sortable: true, render: (r) => <span className="font-mono text-xs font-semibold text-primary">{r.id}</span> },
            { key: 'borrowerName', header: 'Borrower', render: (r) => <>{r.borrowerName}<span className="block text-[11px] text-slate-500">{r.borrowerId}</span></> },
            { key: 'loanId', header: 'Loan', className: 'font-mono text-xs' },
            { key: 'reason', header: 'Reason', render: (r) => <span className="text-xs">{r.reason} · {reasonLabel(r.reason)}</span> },
            { key: 'filedAt', header: 'Filed', sortable: true, render: (r) => formatDate(r.filedAt) },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} tone={r.status === 'Pending CIC approval' ? 'violet' : undefined} /> },
            { key: 'mfiDueAt', header: 'MFI SLA', render: (r) => <SlaBadge due={r.mfiDueAt} done={!OPEN.includes(r.status)} /> },
          ]}
        />
      </Card>
    </div>
  );
}
