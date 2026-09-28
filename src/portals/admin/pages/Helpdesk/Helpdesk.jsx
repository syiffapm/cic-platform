import { useEffect, useState } from 'react';
import { useFocusParam } from '@/portals/government/components/FocusBanner';
import { Link } from 'react-router-dom';
import { AlertTriangle, Inbox, Timer, UserCheck } from 'lucide-react';
import { Alert, PageHeader, StatCard } from '@/components/ui';
import { useAdmin } from '../../lib/useAdmin';
import { AVG_RESOLUTION_DAYS } from '../../data/helpdesk';
import { useCases } from './components/useCases';
import CaseQueue from './components/CaseQueue';
import CaseDetail from './components/CaseDetail';
import EscalationMatrix from './components/EscalationMatrix';

const AS_OF_NOW = '24 Sep 2026 10:00';

export default function Helpdesk() {
  const { piiUnmasked, can, store } = useAdmin('adm.helpdesk');
  const reportsToDecide = (store.reportRequests ?? []).filter((r) => ['Submitted', 'Validating', 'Pending review'].includes(r.status)).length;
  const { cases, addNote, setAssignee } = useCases();
  const [focus] = useFocusParam();
  const [selectedId, setSelectedId] = useState(() => (focus && cases.some((c) => c.id === focus) ? focus : cases.find((c) => c.status === 'Pending CIC approval')?.id ?? cases[0]?.id));
  useEffect(() => {
    if (focus) document.getElementById('case-detail')?.scrollIntoView({ block: 'start' });
  }, [focus]);
  const selected = cases.find((c) => c.id === selectedId);

  const open = cases.filter((c) => c.open);
  const breached = open.filter((c) => c.breached).length;
  const pendingCic = cases.filter((c) => c.status === 'Pending CIC approval').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes & helpdesk"
        subtitle="One queue for borrower disputes, identity-verification tickets and public grievances — with assignment, SLA timers, response templates and the CIC checker step for MFI corrections."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Open cases" value={open.length} icon={Inbox} definition="Disputes, ID-verification tickets and grievances not yet Resolved/Closed" asOf={AS_OF_NOW} />
        <StatCard label="SLA breached" value={breached} icon={AlertTriangle} tone="red" definition="Open cases whose current SLA due date (MFI response or resolution) has passed" asOf={AS_OF_NOW} />
        <StatCard label="Pending CIC approval" value={pendingCic} icon={UserCheck} tone="violet" definition="MFI-submitted corrections awaiting the CIC checker (Data Steward / Super Admin)" asOf={AS_OF_NOW} />
        <StatCard label="Avg resolution (days)" value={AVG_RESOLUTION_DAYS} icon={Timer} tone="teal" definition="Mean calendar days from filing to Resolved, cases closed in the last 90 days" asOf={AS_OF_NOW} />
      </div>

      {!piiUnmasked && (
        <Alert tone="info" title="Borrower PII is masked for your role">
          NRC and phone numbers are partially hidden. {can('update') && !can('approve') ? 'You can view, assign and respond; corrections are approved by a Data Steward.' : ''}
        </Alert>
      )}

      {can('read', 'adm.reportRequests') && (
        <Alert tone="info" title={`${reportsToDecide} personal credit report request${reportsToDecide === 1 ? '' : 's'} awaiting a decision`}
          action={<Link to="/gov/admin/report-requests" className="whitespace-nowrap text-sm font-medium text-primary hover:underline">Open report requests →</Link>}>
          Citizens&apos; own report requests are validated and issued from their own queue, with a 1-working-day decision target.
        </Alert>
      )}

      <CaseQueue cases={cases} selectedId={selectedId} onSelect={setSelectedId} onAssign={setAssignee} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div id="case-detail" className="scroll-mt-20 xl:col-span-2">
          {selected ? <CaseDetail key={selected.id} item={selected} addNote={addNote} /> : null}
        </div>
        <EscalationMatrix />
      </div>
    </div>
  );
}
