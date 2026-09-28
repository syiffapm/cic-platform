import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, FileEdit } from 'lucide-react';
import { usePermissions } from '@/lib/rbac';
import { useRegionScope } from '@/portals/government/lib/access';
import { useStore } from '@/context/StoreContext';
import { AS_OF } from '@/data/kpis';
import { formatDate, formatMMK, formatNumber } from '@/lib/format';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, PageHeader, StatCard, Timeline } from '@/components/ui';
import { LicenceApprovals, LicenceChangeModal, statusHistoryOf } from '../../components/mfi/licence';
import MonthGrid from '../../components/mfi/MonthGrid';
import { DefList, SeverityBadge } from '../../components/common';
import { COMPLIANCE, PRUDENTIAL } from '../../data/supervision';
import { ruleById } from '../../data/ews';
import { useRegulator } from '../../lib/RegulatorStore';
import { CASE_STAGES, round } from '../../lib/util';

export default function InstitutionDetail() {
  const { id } = useParams();
  const { can } = usePermissions('gov');
  const { inRegion, label: scopeLabel } = useRegionScope();
  const { institutions, approvals, disputes } = useStore();
  const { cases, alerts } = useRegulator();
  const [open, setOpen] = useState(false);
  const inst = institutions.find((i) => i.id === id);

  if (!inst) {
    return <EmptyState title="Institution not found" description={`No institution with ID ${id} in the Institution Master.`} action={<Link to="/gov/mfi"><Button variant="outline">Back to register</Button></Link>} />;
  }
  if (!inRegion(inst.region)) {
    return <EmptyState title="Outside your regional scope" description={`${inst.name} is headquartered in ${inst.region}; your access covers ${scopeLabel}.`} action={<Link to="/gov/mfi"><Button variant="outline">Back to register</Button></Link>} />;
  }

  const hasPending = approvals.some((a) => a.type === 'Licence status' && a.status === 'Pending' && a.payload?.institutionId === id);
  const pru = PRUDENTIAL[id]?.at(-1);
  const comp = COMPLIANCE.find((c) => c.mfiId === id);
  const linkedCases = cases.filter((c) => c.mfiId === id);
  const linkedAlerts = alerts.filter((a) => a.mfiId === id && a.status !== 'Dismissed');
  const openDisputes = disputes.filter((d) => d.mfiId === id && !['Resolved', 'Closed', 'Rejected'].includes(d.status)).length;
  const history = statusHistoryOf(inst);

  return (
    <div>
      <PageHeader
        title={inst.name}
        subtitle={`${inst.licenceNo} · ${inst.type} · ${inst.tier} · HQ ${inst.address}`}
        breadcrumbs={[{ label: 'Institution register', to: '/gov/mfi' }, { label: inst.short }]}
        actions={
          <>
            <Badge status={inst.status} className="text-xs">{inst.status}</Badge>
            {can('gov.institutions', 'update') && (
              <Button icon={FileEdit} onClick={() => setOpen(true)} disabled={hasPending} title={hasPending ? 'A request is already pending approval' : undefined}>
                {hasPending ? 'Change pending approval' : 'Request status change'}
              </Button>
            )}
          </>
        }
      />
      <LicenceApprovals institutionId={id} />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Prudential snapshot">
        <StatCard label="PAR30" value={`${inst.par30}%`} tone={inst.par30 > 5 ? 'red' : 'warm'} definition="Outstanding of loans ≥ 30 DPD ÷ gross portfolio" asOf={AS_OF} />
        <StatCard label="NPL ratio" value={`${inst.npl}%`} tone="warm" definition="Outstanding of non-performing loans ÷ gross portfolio" asOf={AS_OF} />
        <StatCard label="Loan-to-deposit ratio" value={pru ? `${pru.ldr}%` : '—'} tone="navy" definition="Gross loans ÷ compulsory + voluntary savings (prudential return)" asOf={AS_OF} />
        <StatCard label="Capital ÷ portfolio" value={inst.portfolio ? `${round((inst.capital / inst.portfolio) * 100)}%` : '—'} tone="teal" definition="Paid-up capital ÷ gross portfolio; EWS-R06 threshold 6%" asOf={AS_OF} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Institution profile" subtitle="Institution Master" />
          <CardBody>
            <DefList cols={3} items={[
              ['Licensed since', formatDate(inst.licensedSince)], ['Branches', inst.branches], ['Borrowers', formatNumber(inst.borrowers)],
              ['Gross portfolio', formatMMK(inst.portfolio, { compact: true })], ['Paid-up capital', formatMMK(inst.capital, { compact: true })], ['Top-borrower concentration', pru ? `${pru.concentration}% (top 20)` : '—'],
              ['Products', inst.products.join(', ') || '—'], ['Contact', inst.phone], ['Email', inst.email || '—'],
            ]} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Licence status history" subtitle="Also shown on the public directory" />
          <CardBody>
            <Timeline items={[...history].reverse().map((h, i) => ({ title: h.status, time: formatDate(h.date), description: h.note, tone: i === 0 ? 'current' : 'done' }))} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Reporting compliance" subtitle="Last 6 monthly cut-offs" action={<Link to="/gov/compliance" className="text-xs font-medium text-primary hover:underline">All MFIs</Link>} />
          <CardBody>
            {comp ? (
              <>
                <MonthGrid months={comp.months} />
                <div className="mt-4"><DefList cols={3} items={[['On-time', `${comp.onTime}%`], ['DQ score', `${comp.dqScore}%`], ['Rejected rows', `${comp.rejectedRate}%`]]} /></div>
              </>
            ) : <p className="text-sm text-slate-500">No submissions — institution not reporting.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Linked supervisory items" subtitle={`${linkedCases.length} cases · ${linkedAlerts.length} alerts · ${openDisputes} open disputes`} />
          <CardBody className="space-y-2">
            {linkedCases.map((c) => (
              <Link key={c.id} to={`/gov/cases/${c.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50">
                <span className="min-w-0"><span className="font-mono text-[11px] text-slate-500">{c.id}</span><span className="block truncate text-sm font-medium text-slate-800">{c.title}</span></span>
                <span className="flex shrink-0 items-center gap-2"><SeverityBadge severity={c.severity} /><Badge tone="violet">{CASE_STAGES[c.stage]}</Badge><ArrowRight className="h-4 w-4 text-slate-500" /></span>
              </Link>
            ))}
            {linkedAlerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2.5 text-sm">
                <span><span className="font-mono text-[11px] text-slate-500">{a.id}</span> {ruleById(a.ruleId)?.name} — {a.triggered} vs {a.threshold}</span>
                <Badge status={a.status}>{a.status}</Badge>
              </div>
            ))}
            {!linkedCases.length && !linkedAlerts.length && <p className="text-sm text-slate-500">No cases or active alerts.</p>}
          </CardBody>
        </Card>
      </div>
      <LicenceChangeModal inst={inst} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
