import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge, Button, DataTable, Input, MakerCheckerBanner, Modal, Select, Textarea } from '@/components/ui';
import { roleName } from '@/data/roles';
import { formatDate, formatMMK } from '@/lib/format';
import { PAYMENTS } from '../../../data/billing';

/** Credit notes (ADM-10): create → maker-checker → Issued. */
export default function CreditNotes({ notes, institutions, readOnly, maker, checkerRole, onCreate }) {
  const [open, setOpen] = useState(false);
  const empty = { invoice: PAYMENTS[0].invoice, amount: '', reason: '' };
  const [form, setForm] = useState(empty);
  const inv = PAYMENTS.find((p) => p.invoice === form.invoice);
  const amt = Number(form.amount);
  const amountError = form.amount && (!(amt > 0) || amt > inv.total) ? `Must be between 1 and ${formatMMK(inv.total)}` : null;
  const valid = amt > 0 && !amountError && form.reason.trim().length >= 10;
  const name = (id) => institutions.find((i) => i.id === id)?.short ?? id;

  const columns = [
    { key: 'id', header: 'Credit note', className: 'font-mono text-xs' },
    { key: 'invoice', header: 'Against invoice', className: 'font-mono text-xs' },
    { key: 'mfiId', header: 'MFI', render: (r) => name(r.mfiId) },
    { key: 'amount', header: 'Amount', sortable: true, render: (r) => formatMMK(r.amount), className: 'text-right whitespace-nowrap' },
    { key: 'reason', header: 'Reason', render: (r) => <span className="text-xs">{r.reason}</span> },
    { key: 'date', header: 'Date', sortable: true, render: (r) => formatDate(r.date), className: 'whitespace-nowrap' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Issued' || r.status === 'Applied' ? 'green' : 'amber'}>{r.status}</Badge> },
  ];

  return (
    <div>
      <DataTable columns={columns} rows={notes} searchKeys={['id', 'invoice', 'reason']} pageSize={10}
        toolbar={<Button size="sm" icon={Plus} disabled={readOnly} onClick={() => { setForm(empty); setOpen(true); }}>New credit note</Button>} />
      <Modal open={open} onClose={() => setOpen(false)} title="New credit note" subtitle="Issued to the MFI only after approval"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!valid} onClick={() => { onCreate({ ...form, amount: amt, mfiId: inv.mfiId }); setOpen(false); }}>Submit for approval</Button></>}>
        <div className="space-y-4">
          <MakerCheckerBanner maker={maker} checker={roleName(checkerRole)} />
          <Select label="Invoice" value={form.invoice} onChange={(e) => setForm({ ...form, invoice: e.target.value })}
            options={PAYMENTS.map((p) => ({ value: p.invoice, label: `${p.invoice} · ${name(p.mfiId)} · ${formatMMK(p.total)}` }))} />
          <Input label="Credit amount (MMK)" type="number" min="1" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} error={amountError} />
          <Textarea label="Reason" required rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. 42 retries billed during API gateway incident INC-2026-104" hint="Minimum 10 characters; shown on the credit note" />
        </div>
      </Modal>
    </div>
  );
}
