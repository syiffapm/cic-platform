import { useState } from 'react';
import { Banknote, CheckCircle2, Gavel, Lock, XCircle } from 'lucide-react';
import { Alert, Button, Card, CardBody, CardHeader, Input, MakerCheckerBanner, Select, Textarea, useToast } from '@/components/ui';
import { DECLINE_REASONS } from '@/data/seed';
import { formatMMK } from '@/lib/format';
import { useTenant } from '../MfiState';
import DisburseModal from './DisburseModal';
import { denied } from '../access';
import { DEFAULT_RATE, SECOND_APPROVAL_LIMIT, monthlyInstalment } from './appUtils';
import { STRONG } from '../buttonTones';

function Summary({ d, extra }) {
  const approved = d.outcome === 'Approved';
  return (
    <div className={`rounded-lg border p-4 text-sm ${approved ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'}`}>
      <p className="flex items-center gap-2 font-semibold text-slate-800">
        {approved ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />}
        {approved ? `Approved ${formatMMK(d.approvedAmount)} · ${d.tenor} months · ${d.rate}% p.a.` : `Declined — ${d.reason ?? DECLINE_REASONS.find((r) => r.code === d.reasonCode)?.label ?? d.reasonCode}`}
      </p>
      <p className="mt-1 text-xs text-slate-600">By {d.by} on {d.at}{d.note ? ` · “${d.note}”` : ''}</p>
      {approved && <p className="mt-1 text-xs text-slate-600">Estimated instalment {formatMMK(monthlyInstalment(d.approvedAmount, d.rate, d.tenor))} per month.</p>}
      {extra}
    </div>
  );
}

/** Approve / decline, second approval above the limit, then disbursement. */
export default function DecisionCard({ app, canAct, canApprove, actions, reportReady }) {
  const { user } = useTenant();
  const toast = useToast();
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({ approvedAmount: app.amount, rate: DEFAULT_RATE, tenor: app.tenor, note: '', reasonCode: '', declineNote: '' });
  const [disburseOpen, setDisburseOpen] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const amount = Number(form.approvedAmount) || 0;

  const submitApprove = () => {
    const r = actions.approve({ approvedAmount: amount, rate: Number(form.rate), tenor: Number(form.tenor), note: form.note.trim() });
    toast(r === 'pending' ? 'Recommendation sent to MFI Administrator for second approval' : `Application ${app.id} approved — the applicant has been notified`, r === 'pending' ? 'info' : 'success');
    setMode(null);
  };
  const submitDecline = () => {
    actions.decline({ reasonCode: form.reasonCode, note: form.declineNote.trim() });
    toast(`Application ${app.id} declined — the applicant has been notified with the reason`, 'warning');
    setMode(null);
  };

  let body;
  if (app.status === 'Withdrawn') body = <Alert tone="info" title="Withdrawn by applicant">No decision is required.</Alert>;
  else if (app.status === 'Disbursed') body = <Summary d={app.decision} extra={<p className="mt-2 flex items-center gap-2 text-xs font-medium text-teal-700"><Banknote className="h-4 w-4" aria-hidden="true" /> Disbursed as <span className="font-mono">{app.loanId}</span>{app.disbursementMethod ? ` via ${app.disbursementMethod}` : ''} and reported to CIC.</p>} />;
  else if (app.status === 'Rejected') body = <Summary d={app.decision} />;
  else if (app.status === 'Approved') {
    body = (
      <div className="space-y-3">
        <Summary d={app.decision} />
        {canApprove
          ? <Button variant="teal" className={STRONG.teal} icon={Banknote} onClick={() => setDisburseOpen(true)}>Disburse and report to CIC</Button>
          : canAct && (
            <span className="inline-flex cursor-not-allowed" title={denied('authorise disbursements')}>
              <Button variant="teal" icon={Banknote} disabled className={`pointer-events-none ${STRONG.teal}`}>Disburse and report to CIC</Button>
              <span className="sr-only">{denied('authorise disbursements')}</span>
            </span>
          )}
        {!canApprove && canAct && <p className="text-[11px] text-slate-500">Disbursement is authorised by a user with approval rights (MFI Administrator).</p>}
      </div>
    );
  } else if (!reportReady) {
    body = <p className="text-sm text-slate-500">Choose a credit report first — at least the Basic report (USD 2). A decision can only be recorded against a current credit report.</p>;
  } else if (app.pendingApproval) {
    const p = app.pendingApproval;
    const canConfirm = canApprove && p.makerId !== user.id;
    body = (
      <div className="space-y-3">
        <MakerCheckerBanner maker={p.by} checker="MFI Administrator" note={`Recommended: ${formatMMK(p.approvedAmount)}, ${p.tenor} months, ${p.rate}% p.a. Approvals above ${formatMMK(SECOND_APPROVAL_LIMIT)} need a second approver.`} />
        {canConfirm ? (
          <div className="flex gap-2">
            <Button variant="success" className={STRONG.success} icon={CheckCircle2} onClick={() => { actions.confirmSecond(true); toast('Second approval recorded — application approved', 'success'); }}>Confirm approval</Button>
            <Button variant="outline" onClick={() => { actions.confirmSecond(false); toast('Returned to credit officer', 'info'); }}>Return to officer</Button>
          </div>
        ) : <p className="text-xs text-slate-500">{p.makerId === user.id ? 'You recommended this approval, so a different user with approval rights must confirm it.' : `Waiting for a second approver. ${denied('give second approval on large loans')}`}</p>}
      </div>
    );
  } else if (!canAct) {
    body = <p className="flex items-center gap-2 text-xs text-slate-500"><Lock className="h-4 w-4" aria-hidden="true" /> {denied('record credit decisions')} Decisions are recorded by credit officers and administrators.</p>;
  } else {
    body = (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant={mode === 'approve' ? 'success' : 'outline'} className={mode === 'approve' ? STRONG.success : undefined} icon={CheckCircle2} onClick={() => setMode('approve')} aria-pressed={mode === 'approve'}>Approve</Button>
          <Button variant={mode === 'decline' ? 'danger' : 'outline'} icon={XCircle} onClick={() => setMode('decline')} aria-pressed={mode === 'decline'}>Decline</Button>
        </div>
        {mode === 'approve' && (
          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Approved amount (MMK)" type="number" min={50000} step={50000} required value={form.approvedAmount} onChange={set('approvedAmount')} hint={`Requested ${formatMMK(app.amount)}`} />
              <Input label="Interest rate (% p.a.)" type="number" min={1} max={28} step={0.5} required value={form.rate} onChange={set('rate')} hint="Regulatory cap 28% p.a." />
              <Input label="Tenor (months)" type="number" min={3} max={36} required value={form.tenor} onChange={set('tenor')} />
            </div>
            <Textarea label="Credit officer note" rows={2} value={form.note} onChange={set('note')} placeholder="e.g. Verified income with employer letter; good repayment record" />
            <p className="text-xs text-slate-600">Instalment {formatMMK(monthlyInstalment(amount, Number(form.rate) || 0, Number(form.tenor) || 1))} per month.</p>
            {amount <= SECOND_APPROVAL_LIMIT && <p className="text-[11px] text-slate-500">Approvals above {formatMMK(SECOND_APPROVAL_LIMIT)} are routed to an MFI Administrator for second approval.</p>}
            {amount > SECOND_APPROVAL_LIMIT && <MakerCheckerBanner note={`Approvals above ${formatMMK(SECOND_APPROVAL_LIMIT)} need a second approver with the MFI Administrator role.`} maker={user.name} checker="MFI Administrator" />}
            <Button icon={Gavel} onClick={submitApprove} disabled={!amount || Number(form.rate) > 28 || !form.tenor}>
              {amount > SECOND_APPROVAL_LIMIT && !canApprove ? 'Send for second approval' : 'Record approval'}
            </Button>
          </div>
        )}
        {mode === 'decline' && (
          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <Select label="Reason shown to the applicant" required placeholder="Select a reason" value={form.reasonCode} onChange={set('reasonCode')} options={DECLINE_REASONS.map((r) => ({ value: r.code, label: r.label }))} />
            <Textarea label="Internal note" rows={2} value={form.declineNote} onChange={set('declineNote')} placeholder="Not shown to the applicant" />
            <p className="text-[11px] text-slate-500">The applicant sees the reason in plain language and is told how to get a free copy of their credit report and dispute any error.</p>
            <Button variant="danger" icon={XCircle} onClick={submitDecline} disabled={!form.reasonCode}>Record decline</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader title="Decision" subtitle="The applicant is notified in the borrower portal and by SMS" icon={Gavel} />
      <CardBody>{body}</CardBody>
      {disburseOpen && <DisburseModal app={app} onClose={() => setDisburseOpen(false)} onConfirm={(method) => { const id = actions.disburse({ method }); setDisburseOpen(false); toast(`Loan ${id} disbursed and reported to CIC`, 'success'); }} />}
    </Card>
  );
}
