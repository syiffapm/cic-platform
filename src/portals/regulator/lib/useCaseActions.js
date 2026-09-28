import { useCallback } from 'react';
import { useSession } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useRegulator } from './RegulatorStore';
import { ruleById } from '../data/ews';
import { TODAY, addDays, nowStamp } from './util';

const SLA_DAYS = { Critical: 14, High: 30, Medium: 45, Low: 60 };

/** "From charts to action": every alert or complaint becomes a case with owner and deadline (GOV-06/08). */
export default function useCaseActions() {
  const user = useSession('gov');
  const { institutions, logAudit } = useStore();
  const { cases, add, patch } = useRegulator();

  const nextId = useCallback(() => {
    const max = Math.max(...cases.map((c) => Number(c.id.split('-').at(-1)) || 0), 41);
    return `CASE-2026-${String(max + 1).padStart(3, '0')}`;
  }, [cases]);

  const openCase = useCallback(({ title, mfiId, source, sourceRef, severity, summary }) => {
    const id = nextId();
    const item = {
      id, title, mfiId, source, sourceRef, severity, owner: user.name, stage: 0, openedAt: TODAY,
      slaDue: addDays(TODAY, SLA_DAYS[severity] ?? 30), summary, documents: [],
      correspondence: [{ at: nowStamp(), from: user.name, to: 'File', channel: 'Note', message: `Case opened from ${source} ${sourceRef}.` }],
      decision: null, action: null, publishIfPublic: false, closedAt: null,
    };
    add('cases', item);
    logAudit({ actor: user.name, role: user.role, tenant: 'CBM', action: 'CASE_OPEN', module: 'Supervision', target: `${id} ← ${sourceRef}`, outcome: 'Success' });
    return id;
  }, [add, logAudit, nextId, user]);

  const investigateAlert = useCallback((alert) => {
    if (alert.caseId) return alert.caseId;
    const rule = ruleById(alert.ruleId);
    const inst = institutions.find((i) => i.id === alert.mfiId);
    const id = openCase({
      title: `${inst?.name ?? alert.mfiId} — ${rule?.name ?? alert.ruleId}${alert.township ? ` (${alert.township})` : ''}`,
      mfiId: alert.mfiId, source: 'EWS alert', sourceRef: alert.id, severity: alert.severity,
      summary: `${rule?.name}: ${rule?.metric} ${alert.triggered} ${rule?.operator} threshold ${alert.threshold} (rule ${alert.ruleId} ${alert.ruleVersion}).`,
    });
    patch('alerts', alert.id, { status: 'Case open', caseId: id });
    return id;
  }, [institutions, openCase, patch]);

  return { openCase, investigateAlert };
}
