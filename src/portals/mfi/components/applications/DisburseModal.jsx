import { useState } from 'react';
import { Banknote } from 'lucide-react';
import { Checkbox, Select } from '@/components/ui';
import { formatMMK } from '@/lib/format';
import ConfirmDialog from '../ConfirmDialog';
import { isoDate } from './appUtils';

const METHODS = ['Cash at branch', 'KBZPay wallet', 'Wave Money', 'AYA Pay', 'Bank transfer'];

/** Confirms disbursement; the new loan is reported to the CIC registry immediately. */
export default function DisburseModal({ app, onClose, onConfirm }) {
  const [method, setMethod] = useState(METHODS[0]);
  const [checked, setChecked] = useState(false);
  const d = app.decision;
  return (
    <ConfirmDialog
      open
      size="md"
      onClose={onClose}
      title={`Disburse ${app.id}?`}
      subtitle={`${app.applicant.name} · ${app.product}`}
      tone="teal"
      confirmLabel="Confirm disbursement"
      confirmIcon={Banknote}
      confirmDisabled={!checked}
      onConfirm={() => onConfirm(method)}
      irreversible="The loan is reported to the CIC registry today and appears on the borrower's credit report. A disbursement cannot be reversed here — corrections go through your next monthly batch."
    >
      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
        <div><dt className="text-slate-500">Principal</dt><dd className="font-semibold text-slate-800">{formatMMK(d.approvedAmount)}</dd></div>
        <div><dt className="text-slate-500">Tenor / rate</dt><dd className="font-semibold text-slate-800">{d.tenor} months · {d.rate}% p.a.</dd></div>
        <div><dt className="text-slate-500">Disbursement date</dt><dd className="font-semibold text-slate-800">{isoDate()}</dd></div>
        <div><dt className="text-slate-500">Repayment</dt><dd className="font-semibold text-slate-800">Monthly</dd></div>
      </dl>
      <Select label="Disbursement method" value={method} onChange={(e) => setMethod(e.target.value)} options={METHODS} />
      <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} label="Loan agreement signed and applicant identity re-verified at disbursement" />
      <p className="text-[11px] text-slate-500">A loan ID is assigned and the loan is reported as Active / Standard. It is included in your next monthly batch reconciliation.</p>
    </ConfirmDialog>
  );
}
