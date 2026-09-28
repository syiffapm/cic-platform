import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gavel, Plus } from 'lucide-react';
import { Card, DataTable, PageHeader, Tabs } from '@/components/ui';
import { DISPUTE_REASONS } from '@/data/reference';
import { formatDate } from '@/lib/format';
import { AuditFootnote, ButtonLink } from '../../components/Common';
import { DisputeBadge, SlaCountdown } from '../../components/DisputeStatus';
import { isOpenDispute, mfiName, useOwnDisputes } from '../../lib/borrower';

const reasonLabel = (code) => DISPUTE_REASONS.find((r) => r.code === code)?.label ?? code;

/** Dispute list. Only disputes of the signed-in borrower. */
export default function DisputesPage() {
  const disputes = useOwnDisputes();
  const [tab, setTab] = useState('open');
  const open = disputes.filter(isOpenDispute);
  const closed = disputes.filter((d) => !isOpenDispute(d));
  const rows = (tab === 'open' ? open : tab === 'closed' ? closed : disputes).map((d) => ({ ...d, mfi: mfiName(d.mfiId) }));

  const columns = [
    { key: 'id', header: 'Case', render: (r) => <Link to={`/borrower/disputes/${r.id}`} className="inline-flex min-h-[24px] items-center font-mono text-xs font-semibold text-primary underline-offset-2 hover:underline" aria-label={`Open case ${r.id}`}>{r.id}</Link> },
    { key: 'filedAt', header: 'Filed', sortable: true, render: (r) => formatDate(r.filedAt) },
    { key: 'mfi', header: 'Lender', render: (r) => <span className="font-medium text-slate-800">{r.mfi}</span> },
    { key: 'record', header: 'Record', render: (r) => <span className="font-mono text-xs">{r.loanId}</span> },
    { key: 'reason', header: 'Problem', render: (r) => <span className="text-xs">{reasonLabel(r.reason)}</span> },
    { key: 'status', header: 'Status', render: (r) => <DisputeBadge status={r.status} /> },
    { key: 'dueAt', header: 'Deadline', render: (r) => <SlaCountdown dueAt={r.dueAt} closed={!isOpenDispute(r)} label="Due" /> },
  ];

  return (
    <div>
      <PageHeader
        title="My disputes"
        subtitle="If something in your report is wrong, the lender must check it. CIC makes sure every case is closed within 30 days."
        actions={<ButtonLink to="/borrower/disputes/new" icon={Plus} variant="warm">File a new dispute</ButtonLink>}
      />

      <ol className="mb-5 grid gap-3 text-xs sm:grid-cols-4">
        {[
          ['1. You file', 'Pick the wrong record, tell us why and add proof. It is free.'],
          ['2. Lender checks', 'The lender has 10 working days to reply and, if needed, correct its data.'],
          ['3. CIC reviews', 'CIC checks the correction before your report changes.'],
          ['4. You are told', 'You get an SMS and see the outcome and the corrected record here.'],
        ].map(([t, d]) => (
          <li key={t} className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="font-semibold text-slate-800">{t}</p>
            <p className="mt-0.5 text-slate-500">{d}</p>
          </li>
        ))}
      </ol>

      <Card>
        <div className="px-4 pt-2">
          <Tabs
            tabs={[{ id: 'open', label: 'Open', count: open.length }, { id: 'closed', label: 'Closed', count: closed.length }, { id: 'all', label: 'All', count: disputes.length }]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <DataTable columns={columns} rows={rows} emptyTitle={tab === 'open' ? 'You have no open disputes' : tab === 'closed' ? 'You have no closed disputes yet' : 'You have not filed a dispute'} />
        <p className="flex items-center gap-1.5 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
          <Gavel className="h-3.5 w-3.5" aria-hidden="true" /> Open a case number to see the full case history, the lender&apos;s answer and the outcome.
        </p>
      </Card>

      <AuditFootnote action="Every dispute you file or open" />
    </div>
  );
}
