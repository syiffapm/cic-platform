/** Helpdesk mock data (ADM-09): borrower PII lookup, identity-verification tickets, templates, escalation matrix. */
export const BORROWER_PII = {
  'BRW-000184': { nrc: '12/OUKAMA(N)245781', phone: '+959421005678' },
  'BRW-002331': { nrc: '14/PATHEIN(N)330112', phone: '+959450032118' },
  'BRW-004410': { nrc: '12/DAGANA(N)330871', phone: '+959421118734' },
  'BRW-005120': { nrc: '8/MAKANA(N)120934', phone: '+959261140987' },
  'BRW-006003': { nrc: '10/MALAMA(N)087612', phone: '+959254407712' },
  'BRW-012877': { nrc: '9/MAHTAMA(N)448210', phone: '+959440981273' },
  'BRW-013340': { nrc: '13/TAKANA(N)051176', phone: '+959977331402' },
  'BRW-000921': { nrc: '7/PAKHANA(N)219904', phone: '+959250774019' },
};

export const ID_TICKETS = [
  {
    id: 'IDV-2026-0231', borrowerId: 'BRW-012877', borrowerName: 'U Kyaw Zin Htet', subject: 'Cannot pass NRC + phone OTP check — phone number changed', channel: 'Hotline', status: 'Open', createdAt: '2026-09-22', dueAt: '2026-09-25', assignee: 'Ma Hsu Lai',
    history: [{ at: '2026-09-22 10:14', by: 'Hotline IVR', action: 'Ticket created from call-back request' }],
  },
  {
    id: 'IDV-2026-0228', borrowerId: 'BRW-013340', borrowerName: 'Daw Khin Mar Lwin', subject: 'Registered with Zawgyi name; self-service login fails name match', channel: 'Borrower portal', status: 'Investigating', createdAt: '2026-09-19', dueAt: '2026-09-23', assignee: 'Ma Hsu Lai',
    history: [{ at: '2026-09-19 15:02', by: 'Daw Khin Mar Lwin', action: 'Ticket raised from login help page' }, { at: '2026-09-20 09:30', by: 'Ma Hsu Lai (Helpdesk)', action: 'Requested NRC photo via secure upload' }],
  },
  {
    id: 'IDV-2026-0219', borrowerId: 'BRW-000921', borrowerName: 'Ko Nay Myo Aung', subject: 'New NRC card issued — report shows old NRC only', channel: 'Walk-in', status: 'Resolved', createdAt: '2026-09-09', dueAt: '2026-09-16', assignee: 'Ko Zaw Lin',
    history: [{ at: '2026-09-09 11:20', by: 'Ko Zaw Lin (Helpdesk)', action: 'Walk-in verification completed' }, { at: '2026-09-13 16:45', by: 'Ko Pyae Sone (CIC)', action: 'Previous NRC linked; identity lineage updated' }],
  },
];

export const ASSIGNEES = ['Ma Hsu Lai', 'Ko Zaw Lin', 'Daw Nilar Win', 'U Min Htet', 'Ko Pyae Sone'];

export const TEMPLATES = [
  { value: 'ack', label: 'Acknowledgement', body: 'Dear borrower, we have received your case {id}. We will update you within 5 working days. — CIC Helpdesk' },
  { value: 'docs', label: 'Request documents', body: 'Dear borrower, to continue case {id} please upload a clear photo of both sides of your NRC card and any receipt, using the secure link sent by SMS. — CIC Helpdesk' },
  { value: 'mfi', label: 'Forwarded to MFI', body: 'Your case {id} has been forwarded to the lender. They must respond within 14 days. You will receive an SMS when they reply. — CIC Helpdesk' },
  { value: 'resolved', label: 'Resolution notice', body: 'Your case {id} is resolved. Your updated credit report is available free of charge in the Borrower Portal. If you disagree you may escalate to the CBM Consumer Protection Unit. — CIC Helpdesk' },
];

export const ESCALATION_MATRIX = [
  { level: 'L1', trigger: 'New case / ticket', owner: 'Helpdesk Agent', notify: 'Borrower (SMS acknowledgement)', sla: '1 working day to acknowledge' },
  { level: 'L2', trigger: 'MFI SLA breached — 10 working days without response', owner: 'Data Steward', notify: 'MFI Dispute Officer + MFI Compliance Head', sla: '3 working days' },
  { level: 'L3', trigger: 'Resolution SLA breached (30 days) or identity fraud suspected', owner: 'CIC Operations Manager', notify: 'Regulator Consumer Protection Officer (Regulator portal)', sla: '5 working days' },
  { level: 'L4', trigger: 'Repeat breaches by same MFI in a quarter', owner: 'CBM FRD Supervisor', notify: 'MFI CEO; supervisory action logged', sla: 'Per supervisory calendar' },
];

export const AVG_RESOLUTION_DAYS = 9.6;
