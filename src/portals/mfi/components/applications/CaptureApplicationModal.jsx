import { useState } from 'react';
import { ClipboardPlus } from 'lucide-react';
import { Button, Checkbox, Input, Modal, Select, Textarea } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { PRODUCT_TYPES, TOWNSHIPS } from '@/data/reference';
import { parseNrc } from '@/lib/nrc';
import { findByNrc } from '../../data/borrowers';
import { useTenant } from '../MfiState';
import { stampNow } from './appUtils';

const EMPTY = { name: '', nrc: '', phone: '+959', township: '', occupation: '', monthlyIncome: '', product: 'Individual loan', amount: '', tenor: 12, purpose: '', consent: false };

/** Branch-assisted capture of a loan application with the applicant's signed consent for one credit check. */
export default function CaptureApplicationModal({ open, onClose, onCaptured }) {
  const { add, logAudit, loanApplications } = useStore();
  const { user, tenant, institution } = useTenant();
  const [f, setF] = useState(EMPTY);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const parsed = parseNrc(f.nrc);
  const nrcOk = parsed.valid;
  const valid = f.name.trim() && nrcOk && /^\+?95?9\d{7,10}$/.test(f.phone.replace(/\s/g, '')) && f.township && Number(f.amount) >= 50_000 && Number(f.tenor) >= 3 && f.consent;

  const save = () => {
    const at = stampNow();
    const short = institution?.short ?? 'PGMF';
    const seq = String(Math.max(0, ...loanApplications.map((a) => Number(a.id.split('-').pop()) || 0)) + 1).padStart(5, '0');
    const id = `LAP-${at.slice(0, 4)}-${seq}`;
    const known = findByNrc(parsed.normalised);
    const expires = new Date(); expires.setDate(expires.getDate() + 30);
    const app = {
      id, borrowerId: known?.borrowerId ?? `BRW-${String(Math.floor(700000 + Math.random() * 99999))}`, mfiId: tenant, product: f.product,
      amount: Number(f.amount), tenor: Number(f.tenor), purpose: f.purpose.trim() || f.product,
      applicant: { name: f.name.trim(), nrc: parsed.normalised, phone: f.phone.replace(/\s/g, ''), township: f.township, occupation: f.occupation.trim(), monthlyIncome: Number(f.monthlyIncome) || null },
      consent: { ref: `CNS-${short}-${Math.floor(25000 + Math.random() * 9000)}`, grantedAt: at, expiresAt: expires.toISOString().slice(0, 10), scope: 'One credit report (Basic or Full) for this application' },
      channel: 'Branch (assisted)', status: 'Submitted', submittedAt: at, decision: null, inquiryId: null, loanId: null,
      history: [{ at, by: `${user.name} (${short})`, action: 'Application captured at branch with signed consent' }],
    };
    add('loanApplications', app);
    logAudit({ actor: user.name, role: user.role, tenant, action: 'APPLICATION_CAPTURE', module: 'Loan applications', target: id, outcome: 'Success' });
    setF(EMPTY);
    onCaptured(app);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Capture loan application"
      subtitle="For applicants who apply in person. The applicant signs the consent form for one credit check."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button icon={ClipboardPlus} disabled={!valid} onClick={save}>Save application</Button></>}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Applicant name" required value={f.name} onChange={set('name')} />
          <Input label="NRC" required value={f.nrc} onChange={set('nrc')} placeholder="12/OUKAMA(N)245781" error={f.nrc && !nrcOk ? 'Enter a valid NRC, e.g. 12/OUKAMA(N)245781' : undefined} />
          <Input label="Mobile" required value={f.phone} onChange={set('phone')} placeholder="+959..." />
          <Select label="Township" required placeholder="Select township" value={f.township} onChange={set('township')} options={TOWNSHIPS.map((t) => t.name)} />
          <Input label="Occupation" value={f.occupation} onChange={set('occupation')} />
          <Input label="Monthly income (MMK)" type="number" min={0} step={10000} value={f.monthlyIncome} onChange={set('monthlyIncome')} />
          <Select label="Product" value={f.product} onChange={set('product')} options={PRODUCT_TYPES} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (MMK)" required type="number" min={50000} step={50000} value={f.amount} onChange={set('amount')} />
            <Input label="Tenor (months)" required type="number" min={3} max={36} value={f.tenor} onChange={set('tenor')} />
          </div>
        </div>
        <Textarea label="Loan purpose" rows={2} value={f.purpose} onChange={set('purpose')} />
        <Checkbox checked={f.consent} onChange={set('consent')} label="The applicant has signed the consent form for one credit report (Basic or Full) for this application" description="Keep the signed form on file. Consent is valid for 30 days and can be used once." />
      </div>
    </Modal>
  );
}
