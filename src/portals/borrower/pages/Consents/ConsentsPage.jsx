import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldOff } from 'lucide-react';
import { Alert, Badge, Button, Card, CardHeader, DataTable, PageHeader, useToast } from '@/components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDate } from '@/lib/format';
import { AuditFootnote, Explain } from '../../components/Common';
import { consentStatus } from '../../components/LoanApp';
import { mfiName, stamp, useBorrowerAudit, useOwnApplications, useOwnState } from '../../lib/borrower';

/** Consent log per MFI with revoke where the law allows. */
export default function ConsentsPage() {
  const [consents, setConsents] = useOwnState('consents');
  const apps = useOwnApplications();
  const rows = useMemo(() => [
    ...apps.map((a) => ({
      id: a.consent.ref, mfiId: a.mfiId, scope: 'Credit report', purpose: `One check for your online application ${a.id}`, givenAt: a.consent.grantedAt.slice(0, 10),
      status: consentStatus(a), basis: `Given online · valid until ${formatDate(a.consent.expiresAt)}`, applicationId: a.id,
    })),
    ...consents.filter((c) => !apps.some((a) => a.consent.ref === c.id)),
  ].sort((a, b) => b.givenAt.localeCompare(a.givenAt)), [apps, consents]);
  const [target, setTarget] = useState(null);
  const audit = useBorrowerAudit();
  const toast = useToast();

  const revoke = () => {
    setConsents((list) => list.map((c) => (c.id === target.id ? { ...c, status: 'Revoked', revokedAt: stamp() } : c)));
    audit('CONSENT_REVOKE', target.id, { purpose: `${target.scope} · ${mfiName(target.mfiId)}` });
    toast(`Consent ${target.id} revoked. ${mfiName(target.mfiId)} has been notified.`, 'success');
    setTarget(null);
  };

  const columns = [
    { key: 'mfi', header: 'Lender', render: (r) => <span className="font-medium text-slate-800">{mfiName(r.mfiId)}</span> },
    { key: 'givenAt', header: 'Given on', sortable: true, render: (r) => formatDate(r.givenAt) },
    {
      key: 'scope', header: 'What they may use', render: (r) => (
        <div>
          <Badge tone={r.scope === 'Credit report' ? 'navy' : 'teal'}>{r.scope}</Badge>
          <p className="mt-1 text-xs text-slate-500">{r.purpose}</p>
        </div>
      ),
    },
    { key: 'basis', header: 'How you gave it', render: (r) => <span className="text-xs">{r.basis}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    {
      key: 'action', header: 'Action', render: (r) => {
        if (r.applicationId) {
          return r.status === 'Active'
            ? <Link to={`/borrower/loans/${r.applicationId}`} className="inline-flex min-h-[24px] items-center text-xs font-semibold text-primary hover:underline">Withdraw the application to cancel</Link>
            : <Link to={`/borrower/loans/${r.applicationId}`} className="inline-flex min-h-[24px] items-center text-xs text-slate-600 hover:underline">{r.status === 'Used' ? 'Used for the credit check' : 'View application'}</Link>;
        }
        if (r.status !== 'Active') return <span className="text-xs text-slate-500">{r.revokedAt ? `Revoked ${r.revokedAt}` : '—'}</span>;
        if (r.scope === 'Credit report' && r.loanActive) {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500" title="Cannot be revoked while the loan is active">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Cannot be revoked while loan active
            </span>
          );
        }
        return <Button size="sm" variant="outline" icon={ShieldOff} onClick={() => setTarget(r)}>Revoke</Button>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="My consents"
        subtitle="The permissions you gave lenders to look at your credit report or other data about you."
      />

      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <Alert tone="info" title="Credit report consent">
          While you still owe money on a loan, the law lets that lender keep checking and reporting on it. That is why this consent is locked until the loan is closed.
        </Alert>
        <Alert tone="success" title="Alternative data consent">
          Permission to use extra data such as mobile wallet or bill payments is optional. You can take it back at any time, and it will not affect your loan.
        </Alert>
      </div>

      <Card>
        <CardHeader title="Consent log" subtitle={`${rows.length} consents · newest first`} />
        <DataTable columns={columns} rows={rows} emptyTitle="You have not given any lender consent yet" />
        <div className="border-t border-slate-100 px-5 py-3">
          <Explain label="What do “Used” and “Expired” mean?">A consent you give when applying online allows one credit check within 30 days. “Used” means the lender made that check; “Expired” means 30 days passed without it. A consent for a one-off check at a branch (for example as a guarantor) ends automatically after 90 days.</Explain>
        </div>
      </Card>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={revoke}
        title="Revoke this consent?"
        subtitle={target ? `${target.scope} · ${mfiName(target.mfiId)}` : ''}
        confirmLabel="Revoke consent"
        cancelLabel="Keep this consent"
        icon={ShieldOff}
        consequence="This cannot be undone. If you want this lender to use this data again, you will need to give a new consent."
      >
        <p>
          {target && mfiName(target.mfiId)} will no longer be allowed to use your {target?.purpose?.toLowerCase()} for lending decisions.
          Data already used in a past decision is not deleted. Your existing loans and your credit report are not affected.
        </p>
      </ConfirmDialog>

      <AuditFootnote action="Every consent change" />
    </div>
  );
}
