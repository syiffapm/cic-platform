import { useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { DISPUTE_REASONS } from '@/data/reference';
import { getInstitution } from '@/data/institutions';
import { slaDaysLeft } from '@/lib/format';
import { useAdminCollection, useAdminObject } from '../../../context/AdminStore';
import { BORROWER_PII, ID_TICKETS } from '../../../data/helpdesk';

const CLOSED = ['Resolved', 'Closed', 'Rejected'];

/** Unified case queue: disputes + identity-verification tickets + grievances. */
export function useCases() {
  const { disputes, grievances } = useStore();
  const [tickets, ticketApi] = useAdminCollection('idTickets', ID_TICKETS);
  const [assign, setAssign] = useAdminObject('helpdeskAssign', {});
  const [notes, setNotes] = useAdminObject('helpdeskNotes', {});

  const cases = useMemo(() => {
    const fromDisputes = disputes.map((d) => ({
      id: d.id, kind: 'dispute', type: 'Dispute',
      subject: `${DISPUTE_REASONS.find((r) => r.code === d.reason)?.label ?? d.reason} · ${d.loanId}`,
      detail: d.description, mfi: getInstitution(d.mfiId)?.short ?? d.mfiId,
      borrowerId: d.borrowerId, borrowerName: d.borrowerName,
      channel: d.channel, status: d.status,
      due: d.status === 'Awaiting MFI' ? d.mfiDueAt : d.dueAt, dueLabel: d.status === 'Awaiting MFI' ? 'MFI response due' : 'Resolution due',
      assignee: assign[d.id] ?? (d.channel === 'Helpdesk' ? 'Ma Hsu Lai' : 'Ko Pyae Sone'),
      history: d.history, raw: d,
    }));
    const fromTickets = tickets.map((t) => ({
      id: t.id, kind: 'idv', type: 'Identity verification', subject: t.subject, detail: t.subject,
      borrowerId: t.borrowerId, borrowerName: t.borrowerName, channel: t.channel, status: t.status,
      due: t.dueAt, dueLabel: 'Verification due', assignee: assign[t.id] ?? t.assignee, history: t.history, raw: t,
    }));
    const fromGrievances = grievances.map((g) => ({
      id: g.id, kind: 'grievance', type: 'Grievance', subject: g.subject, detail: `${g.category}${g.mfiId ? ` · ${getInstitution(g.mfiId)?.short}` : ''}`,
      mfi: g.mfiId ? getInstitution(g.mfiId)?.short : null,
      borrowerId: null, borrowerName: 'Anonymous / public', channel: g.channel, status: g.status,
      due: g.sla, dueLabel: 'Grievance SLA', assignee: assign[g.id] ?? g.assignee,
      history: [{ at: `${g.createdAt} 09:00`, by: g.channel, action: `Grievance received (${g.category})` }], raw: g,
    }));
    return [...fromDisputes, ...fromTickets, ...fromGrievances].map((c) => {
      const open = !CLOSED.includes(c.status);
      const days = open ? slaDaysLeft(c.due) : null;
      const extra = notes[c.id] ?? [];
      return {
        ...c, open, days, breached: open && days < 0,
        pii: BORROWER_PII[c.borrowerId] ?? null,
        history: [...c.history, ...extra].sort((a, b) => a.at.localeCompare(b.at)),
      };
    });
  }, [disputes, grievances, tickets, assign, notes]);

  const addNote = (id, entry) => setNotes((cur) => ({ [id]: [...(cur[id] ?? []), entry] }));
  const setAssignee = (id, name) => setAssign({ [id]: name });

  return { cases, addNote, setAssignee, ticketApi };
}
