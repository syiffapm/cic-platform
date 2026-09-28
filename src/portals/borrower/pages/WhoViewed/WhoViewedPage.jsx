import { Link } from 'react-router-dom';
import { Eye, HelpCircle } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, DataTable, PageHeader } from '@/components/ui';
import { PURPOSE_CODES } from '@/data/reference';
import { formatDateTime } from '@/lib/format';
import { AuditFootnote } from '../../components/Common';
import { mfiName, useOwnInquiries } from '../../lib/borrower';

const purposeLabel = (code) => PURPOSE_CODES.find((p) => p.code === code)?.label ?? code;
const CUTOFF = new Date(Date.now() - 730 * 864e5);

const REASONS = [
  ['New loan application', 'You applied for a loan and the lender checked your history before deciding.'],
  ['Review of existing loan', 'A lender you already borrow from checked your file, e.g. before a top-up or renewal.'],
  ['Guarantor assessment', 'Someone named you as a guarantor and the lender checked you can support the loan.'],
  ['Collection', 'A lender you owe money to checked your current contact details or other loans.'],
];

/** Who viewed my report: every inquiry on the session borrower's file in the last 24 months. */
export default function WhoViewedPage() {
  const inquiries = useOwnInquiries();
  const rows = inquiries
    .filter((i) => new Date(i.at) >= CUTOFF)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((i) => ({ ...i, mfi: mfiName(i.mfiId), purposeText: purposeLabel(i.purpose) }));

  const columns = [
    { key: 'at', header: 'Date', sortable: true, render: (r) => <span className="whitespace-nowrap">{formatDateTime(r.at)}</span> },
    { key: 'mfi', header: 'Lender (MFI)', sortable: true, render: (r) => <span className="font-medium text-slate-800">{r.mfi}</span> },
    {
      key: 'purposeText', header: 'Reason they gave', render: (r) => (
        <div>
          <Badge tone={r.purpose === 'CL' ? 'amber' : 'blue'}>{r.purposeText}</Badge>
          {r.applicationId && <Link to={`/borrower/loans/${r.applicationId}`} className="mt-1 block text-xs font-medium text-primary hover:underline">Your online application {r.applicationId}</Link>}
        </div>
      ),
    },
    { key: 'reportType', header: 'Report type', render: (r) => (r.reportType === 'Full' ? 'Full (all loans + history)' : 'Basic (summary only)') },
    { key: 'consentRef', header: 'Your consent ref.', render: (r) => <span className="font-mono text-xs">{r.consentRef}</span> },
    {
      key: 'act', header: '', render: (r) => (
        <Link to={`/borrower/disputes/new?inquiry=${r.id}`} className="whitespace-nowrap text-xs font-semibold text-primary hover:underline">
          I don&apos;t recognise this
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Who viewed my report"
        subtitle="Every time a lender looks at your credit file it is recorded here. You see the full list for the last 24 months."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title={`${rows.length} views in the last 24 months`} subtitle="Newest first" icon={Eye} />
          <DataTable columns={columns} rows={rows} emptyTitle="Nobody has viewed your report in the last 24 months" pageSize={10} />
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Why would a lender look?" icon={HelpCircle} />
            <CardBody>
              <dl className="space-y-3 text-xs">
                {REASONS.map(([t, d]) => (
                  <div key={t}>
                    <dt className="font-semibold text-slate-800">{t}</dt>
                    <dd className="mt-0.5 text-slate-600">{d}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-slate-600">
                A lender may only look at your file with your consent and a reason. When you apply online, the check made for that application is linked to it here. Views of your own report by you are not listed and never affect you.
              </p>
            </CardBody>
          </Card>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <p className="font-semibold">Don&apos;t recognise a view?</p>
            <p className="mt-1">It could mean someone used your NRC to apply for a loan. Use “I don&apos;t recognise this” on that line to file a free complaint. We will ask the lender to show your signed consent.</p>
          </div>
        </aside>
      </div>

      <AuditFootnote action="Opening this list" />
    </div>
  );
}
