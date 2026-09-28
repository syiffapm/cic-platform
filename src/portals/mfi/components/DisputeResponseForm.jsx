import { useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Checkbox, Input, MakerCheckerBanner, Select, Textarea } from '@/components/ui';

const FIELDS = ['Outstanding balance', 'Days past due', 'Loan status', 'Closure date', 'Repayment history (month)', 'Date of birth', 'Name', 'Guarantor record'];

/** MFI response + optional correction submitted for CIC approval. */
export default function DisputeResponseForm({ onSubmit }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [correct, setCorrect] = useState(true);
  const [field, setField] = useState(FIELDS[0]);
  const [oldValue, setOldValue] = useState('');
  const [newValue, setNewValue] = useState('');

  const valid = text.trim().length >= 10 && (!correct || (oldValue.trim() && newValue.trim()));

  const submit = () => onSubmit({
    text: text.trim(),
    evidence: files,
    correction: correct ? { field, oldValue: oldValue.trim(), newValue: newValue.trim() } : null,
  });

  return (
    <Card>
      <CardHeader title="Respond to dispute" subtitle="Your response and evidence are shared with the borrower and CIC." icon={Send} />
      <CardBody className="space-y-4">
        <Textarea label="Response to borrower and CIC" required rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Explain what you checked and what you found…" hint="At least 10 characters." />
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700"><Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> Evidence (loan ledger, receipts, closure letter)</span>
          <input type="file" multiple onChange={(e) => setFiles([...(e.target.files ?? [])].map((f) => f.name))} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium" />
          {files.length > 0 && <p className="text-[11px] text-slate-500">{files.join(', ')}</p>}
        </label>

        <div className="rounded-lg border border-slate-200 p-4">
          <Checkbox checked={correct} onChange={(e) => setCorrect(e.target.checked)} label="Submit a data correction for approval" description="Leave unticked if the reported data is correct and the dispute should be rejected." />
          {correct && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Select label="Field" value={field} onChange={(e) => setField(e.target.value)} options={FIELDS} />
              <Input label="Current (old) value" required value={oldValue} onChange={(e) => setOldValue(e.target.value)} placeholder="Active" />
              <Input label="Corrected (new) value" required value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Closed on 2026-03-28" />
            </div>
          )}
        </div>
        {correct && <MakerCheckerBanner note="The correction is saved as a pending request. CIC Data Steward approves it before the registry changes; a new record version is created and the history is kept." />}
        <div className="flex justify-end">
          <Button icon={Send} disabled={!valid} onClick={submit}>{correct ? 'Submit response & correction for approval' : 'Send response'}</Button>
        </div>
      </CardBody>
    </Card>
  );
}
