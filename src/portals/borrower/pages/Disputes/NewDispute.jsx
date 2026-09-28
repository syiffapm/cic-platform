import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Alert, Button, Card, CardBody, PageHeader, Select, Textarea, useToast } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { DISPUTE_REASONS, PURPOSE_CODES } from '@/data/reference';
import { formatDate, formatDateTime, formatMMK } from '@/lib/format';
import { AuditFootnote, Explain, StickyActions } from '../../components/Common';
import EvidenceUpload from '../../components/EvidenceUpload';
import { useMyFile } from '../../lib/myFile';
import { addDays, addWorkingDays, isoDate, mfiName, stamp, useBorrower, useBorrowerAudit, useOwnDisputes, useOwnInquiries } from '../../lib/borrower';

const REASON_HELP = {
  D01: 'Choose this if you never took this loan, or a lender viewed your report without asking you.',
  D02: 'The amount you still owe is wrong, e.g. a payment you made is missing.',
  D03: 'The report says you paid late but you paid on time, or a moratorium was agreed.',
  D04: 'You finished paying this loan but it still shows as active.',
  D05: 'You are shown as guarantor for a loan you did not guarantee, or the details are wrong.',
  D06: 'Your name, date of birth, address or NRC on the report is wrong.',
};

/** File a dispute. Writes to the shared store so the MFI and CIC see it straight away. */
export default function NewDispute() {
  const user = useBorrower();
  const { add, disputes: allDisputes } = useStore();
  const own = useOwnDisputes();
  const inquiries = useOwnInquiries();
  const audit = useBorrowerAudit();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inquiry = inquiries.find((i) => i.id === params.get('inquiry'));
  const { loans, guarantees } = useMyFile();

  const records = useMemo(() => [
    ...(inquiry ? [{ value: `inq:${inquiry.id}`, label: `Report view ${inquiry.id} by ${mfiName(inquiry.mfiId)} on ${formatDateTime(inquiry.at)}`, mfiId: inquiry.mfiId, ref: inquiry.id }] : []),
    ...loans.map((l) => ({ value: `loan:${l.id}`, label: `${mfiName(l.mfiId)} · ${l.product} · ${l.id} · ${l.status} · ${formatMMK(l.balance)}`, mfiId: l.mfiId, ref: l.id })),
    ...guarantees.map((g) => ({ value: `gtr:${g.id}`, label: `Guarantee for ${g.guaranteeFor} · ${mfiName(g.mfiId)}`, mfiId: g.mfiId, ref: g.id })),
  ], [inquiry, loans, guarantees]);

  const [record, setRecord] = useState(inquiry ? `inq:${inquiry.id}` : params.get('loan') ? `loan:${params.get('loan')}` : '');
  const [reason, setReason] = useState(inquiry ? 'D01' : '');
  const [text, setText] = useState(inquiry ? `I do not recognise this report view. I did not apply to ${mfiName(inquiry.mfiId)} and did not give consent (${inquiry.consentRef}).` : '');
  const [files, setFiles] = useState([]);
  const [touched, setTouched] = useState(false);

  const selected = records.find((r) => r.value === record);
  const alreadyOpen = selected && own.find((d) => d.loanId === selected.ref && !['Resolved', 'Rejected', 'Closed'].includes(d.status));
  const scanning = files.some((f) => f.scan !== 'clean');
  const valid = selected && reason && text.trim().length >= 20 && !scanning && !alreadyOpen;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    const now = new Date();
    const nextNo = Math.max(0, ...allDisputes.map((d) => Number(d.id.split('-').pop()) || 0)) + 1;
    const id = `DSP-2026-${String(nextNo).padStart(4, '0')}`;
    const lender = mfiName(selected.mfiId);
    add('disputes', {
      id, borrowerId: user.borrowerId, borrowerName: user.name, mfiId: selected.mfiId, loanId: selected.ref,
      reason, description: text.trim(), status: 'Awaiting MFI',
      filedAt: isoDate(now), mfiDueAt: isoDate(addWorkingDays(now, 10)), dueAt: isoDate(addDays(now, 30)),
      evidence: files.map((f) => f.name), mfiResponse: null, outcome: null, channel: 'Portal 2',
      history: [
        { at: stamp(now), by: user.name, action: 'Dispute filed' },
        ...(files.length ? [{ at: stamp(now), by: 'System', action: `${files.length} evidence file(s) virus-scanned: clean` }] : []),
        { at: stamp(now), by: 'System', action: `Assigned to ${lender}; record flagged "under dispute"` },
      ],
    });
    audit('DISPUTE_FILE', id, { purpose: `${reason} on ${selected.ref}` });
    toast(`Dispute ${id} sent to ${lender}. We will text you when it changes.`, 'success');
    navigate(`/borrower/disputes/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="File a dispute"
        subtitle="Tell us which record is wrong and why. It is free, and the lender must reply within 10 working days."
        breadcrumbs={[{ label: 'My disputes', to: '/borrower/disputes' }, { label: 'New dispute' }]}
      />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_300px]" noValidate>
        <Card>
          <CardBody className="space-y-5">
            {inquiry && <Alert tone="warning" title="Reporting a report view you don't recognise">We will ask {mfiName(inquiry.mfiId)} to show the consent you signed for {PURPOSE_CODES.find((p) => p.code === inquiry.purpose)?.label.toLowerCase()}.</Alert>}

            <div>
              <Select
                label="1. Which record is wrong?"
                required
                value={record}
                onChange={(e) => setRecord(e.target.value)}
                placeholder="Choose a loan or record from your report"
                options={records}
                error={touched && !selected ? 'Choose the record you want to dispute.' : alreadyOpen ? `You already have an open dispute on this record (${alreadyOpen.id}).` : undefined}
              />
              {selected && <p className="mt-1 text-xs text-slate-500">This will be sent to <strong>{mfiName(selected.mfiId)}</strong>, the lender that reported it.</p>}
            </div>

            <div>
              <Select
                label="2. What is wrong?"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Choose the reason"
                options={DISPUTE_REASONS.map((r) => ({ value: r.code, label: r.label }))}
                error={touched && !reason ? 'Choose a reason.' : undefined}
              />
              {reason && <p className="mt-1 rounded-lg bg-primary-50 p-2 text-xs text-slate-700">{REASON_HELP[reason]}</p>}
            </div>

            <Textarea
              label="3. Explain in your own words"
              required
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. I paid instalment 9 on 5 August at the Mandalay branch. The receipt number is 00451."
              hint={`${text.trim().length} characters · at least 20. Include dates, amounts and receipt numbers if you have them.`}
              error={touched && text.trim().length < 20 ? 'Please write at least 20 characters so the lender understands the problem.' : undefined}
            />

            <div>
              <EvidenceUpload label="4. Add proof (optional but helps)" files={files} onChange={setFiles} />
              <Explain>Receipts, a loan closure letter, a moratorium letter or a copy of your NRC. Files are scanned for viruses and only the lender and CIC can open them.</Explain>
            </div>

            {touched && !valid && !alreadyOpen && (
              <Alert tone="danger" title="Your dispute has not been sent yet">Some answers are missing. Fix the fields marked in red above, then press “Submit dispute” again.</Alert>
            )}
            <StickyActions row className="sm:justify-end">
              <Button variant="outline" onClick={() => navigate('/borrower/disputes')}>Cancel</Button>
              <Button type="submit" icon={Send} disabled={scanning}>{scanning ? 'Waiting for virus scan…' : 'Submit dispute'}</Button>
            </StickyActions>
          </CardBody>
        </Card>

        <aside className="space-y-4 text-xs text-slate-600">
          <Card>
            <CardBody className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">What happens next</p>
              <p>• The record is flagged <strong>“under dispute”</strong> on your report straight away. Lenders who view it see the flag.</p>
              <p>• The lender must answer by <strong>{formatDate(addWorkingDays(new Date(), 10))}</strong> (10 working days).</p>
              <p>• CIC must close the case by <strong>{formatDate(addDays(new Date(), 30))}</strong> (30 days).</p>
              <p>• If the lender corrects the data, CIC checks it before your report changes. You will see the old and new values.</p>
            </CardBody>
          </Card>
          <Alert tone="info">Filing a dispute does not stop your repayments. Please keep paying on time while the case is checked.</Alert>
        </aside>
      </form>

      <AuditFootnote action="Filing a dispute" />
    </div>
  );
}
