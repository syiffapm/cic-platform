import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Alert, Button, Modal, Select, Textarea } from '@/components/ui';
import { TOWNSHIP_STATS } from '../../data/townships';
import { useRegionScope } from '@/portals/government/lib/access';
import { useRegulator } from '../../lib/RegulatorStore';

const MIN = 20;

/** Justification gate for borrower-level drill-down (GOV-10). Nothing is shown until this is submitted. */
export default function DrilldownModal({ open, onClose, onConfirm, defaultTownship }) {
  const { filterByRegion } = useRegionScope();
  const { cases } = useRegulator();
  const [township, setTownship] = useState(defaultTownship ?? '');
  const [caseRef, setCaseRef] = useState('');
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const len = text.trim().length;

  const confirm = () => {
    setTouched(true);
    if (!township || len < MIN) return;
    onConfirm({ township, caseRef, justification: text.trim() });
    setText(''); setCaseRef(''); setTouched(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Borrower-level drill-down"
      subtitle="Access to pseudonymised borrower records requires a recorded justification"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button icon={ShieldAlert} onClick={confirm} disabled={len < MIN || !township}>Confirm and view</Button></>}
    >
      <div className="space-y-4">
        <Alert tone="warning" title="This access is logged and reviewable">
          Your name, role, time, IP, township and justification are written to the tamper-evident audit log and reviewed monthly by the DPO. Names and NRC numbers remain hidden; rows show pseudonymous tokens only.
        </Alert>
        <Select label="Township" required value={township} onChange={(e) => setTownship(e.target.value)} placeholder="Select township…" options={filterByRegion(TOWNSHIP_STATS).map((t) => ({ value: t.code, label: `${t.name} (${t.region})` }))} />
        <Select label="Related case (optional)" value={caseRef} onChange={(e) => setCaseRef(e.target.value)} placeholder="No case" options={cases.filter((c) => c.stage < 5).map((c) => ({ value: c.id, label: `${c.id} — ${c.title}` }))} />
        <Textarea
          label="Justification"
          required
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. Verify multiple-borrowing pattern behind EWS alert ALT-2026-0240 before on-site visit"
          hint={`${len}/${MIN} characters minimum`}
          error={touched && len < MIN ? `Justification must be at least ${MIN} characters (${len} entered).` : undefined}
        />
      </div>
    </Modal>
  );
}
