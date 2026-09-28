import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, History } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, PageHeader, Stepper, Timeline, useToast } from '@/components/ui';
import { REQUEST_STEPS } from '@/lib/reportRequests';
import { useAdmin } from '../../lib/useAdmin';
import { ChecksPanel, DataProcessingPanel, RequesterPanel } from './components/FilePanels';
import DecisionPanel from './components/DecisionPanel';
import { useRequestFile } from './components/useRequestFile';
import { STATUS_TONE, slaState } from './components/requestUtils';

export default function ReportRequestDetail() {
  const { id } = useParams();
  const { user, store, can, nrc, phone, audit } = useAdmin('adm.reportRequests');
  const readOnly = !can('update');
  const toast = useToast();
  const req = (store.reportRequests ?? []).find((r) => r.id === id);
  const file = useRequestFile(req);
  const viewed = useRef(null);

  useEffect(() => {
    if (req && viewed.current !== req.id) {
      viewed.current = req.id;
      audit('REPORT_REQUEST_VIEWED', `${req.id} · ${req.borrowerId}`, { purpose: 'Review of personal credit report request' });
    }
  }, [req, audit]);

  if (!req) {
    return (
      <div className="py-10">
        <EmptyState title="Request not found" description={`No credit report request with reference ${id}.`}
          action={<Link to="/gov/admin/report-requests"><Button variant="outline" icon={ArrowLeft}>Back to the queue</Button></Link>} />
      </div>
    );
  }

  const sla = slaState(req);
  const ownFile = !!(user?.nrc && user.nrc === req.nrc) || user?.borrowerId === req.borrowerId;
  const stepIndex = req.status === 'Rejected' ? 2 : Math.max(0, REQUEST_STEPS.indexOf(req.status === 'Submitted' ? 'Submitted' : req.status));
  const locked = !['Submitted', 'Validating', 'Pending review'].includes(req.status);

  const rerun = () => {
    const c = file.rerun();
    toast(c.fail ? `Validation complete — ${c.fail} check(s) failed` : c.warn ? `Validation complete — ${c.warn} warning(s)` : 'Validation complete — no issues', c.fail ? 'danger' : c.warn ? 'warning' : 'success');
  };
  const approve = (opts) => {
    const result = file.approve(opts);
    toast(`Report ${result.reportId} issued — ${req.notify} sent to the citizen`, 'success');
  };
  const reject = (opts) => {
    file.reject(opts);
    toast(`${req.id} rejected — ${req.notify} sent to the citizen`, 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Report request ${req.id}`}
        subtitle={`${req.name} · submitted ${req.submittedAt}`}
        breadcrumbs={[{ label: 'Credit report requests', to: '/gov/admin/report-requests' }, { label: req.id }]}
        actions={(
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[req.status]}>{req.status === 'Ready' ? 'Issued' : req.status}</Badge>
            {sla && <span className={clsx('text-xs font-medium', sla.breached ? 'text-red-700' : 'text-slate-600')}>Decision due {sla.due} · {sla.label}</span>}
          </div>
        )}
      />

      <Card>
        <CardBody>
          <Stepper steps={req.status === 'Rejected' ? ['Submitted', 'Validating', 'Rejected'] : ['Submitted', 'Validating', 'Pending review', 'Issued']} current={req.status === 'Ready' ? 4 : stepIndex} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <ChecksPanel checks={req.checks} onRerun={rerun} readOnly={readOnly} locked={locked} mask={(t) => t.split(req.nrc).join(nrc(req.nrc))} />
          <DataProcessingPanel file={file.file} openDisputes={file.openDisputes} pendingCorrections={file.pendingCorrections} recentInquiries={file.recentInquiries} />
          <DecisionPanel key={`${req.id}-${req.status}`} req={req} readOnly={!can('approve')} ownFile={ownFile} onApprove={approve} onReject={reject} />
        </div>
        <div className="space-y-6">
          <RequesterPanel req={req} account={file.account} file={file.file} nrc={nrc} phone={phone} />
          <Card>
            <CardHeader icon={History} title="History" subtitle="Every step is also in the audit log" />
            <CardBody>
              <Timeline items={[...(req.history ?? [])].reverse().map((h, i) => ({ title: h.action, time: h.at, actor: h.by, tone: i === 0 ? 'current' : 'done' }))} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
