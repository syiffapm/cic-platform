/**
 * Supervisory cases (GOV-06). stage indexes CASE_STAGES:
 * 0 Triage · 1 Investigate · 2 Request info · 3 Decision · 4 Action · 5 Closed.
 */
export const CASES = [
  {
    id: 'CASE-2026-041', title: 'Golden Delta Finance — PAR30 18.3% and capital shortfall', mfiId: 'MFI-007', source: 'EWS alert', sourceRef: 'ALT-2026-0214',
    severity: 'Critical', owner: 'U Min Htet', stage: 3, openedAt: '2026-09-11', slaDue: '2026-10-11',
    summary: 'Suspended MFI continues to deteriorate. Recapitalisation plan overdue since 31 Aug. Assess whether to recommend licence revocation.',
    documents: [
      { name: 'GDF-recap-plan-draft.pdf', size: '1.8 MB', by: 'Golden Delta Finance', at: '2026-09-02' },
      { name: 'Onsite-exam-notes-Sep26.docx', size: '240 KB', by: 'U Min Htet', at: '2026-09-15' },
    ],
    correspondence: [
      { at: '2026-09-11 10:05', from: 'U Min Htet', to: 'GDF Board', channel: 'Portal notice', message: 'Supervisory case opened following EWS alerts ALT-2026-0214 and ALT-2026-0219.' },
      { at: '2026-09-16 14:20', from: 'GDF CEO', to: 'U Min Htet', channel: 'Letter', message: 'Shareholder injection of 400M MMK expected by end October.' },
    ],
    decision: { text: 'Recommend licence revocation if recapitalisation is not completed by 31 Oct 2026; impose fine of 5,000,000 MMK for late reporting.', proposedBy: 'U Min Htet', proposedById: 'U-G002', status: 'Pending approval', approver: null },
    action: null, publishIfPublic: true, closedAt: null,
  },
  {
    id: 'CASE-2026-038', title: 'Myanmar Ahtwin — PAR30 breach, late reporting, dispute SLA breach', mfiId: 'MFI-006', source: 'EWS alert', sourceRef: 'ALT-2026-0223',
    severity: 'High', owner: 'U Min Htet', stage: 2, openedAt: '2026-08-21', slaDue: '2026-09-30',
    summary: 'Multiple early-warning triggers. On-site examination scheduled 7–11 Oct. Awaiting portfolio-at-risk breakdown by branch.',
    documents: [{ name: 'Ahtwin-branch-PAR-request.pdf', size: '96 KB', by: 'U Min Htet', at: '2026-09-02' }],
    correspondence: [
      { at: '2026-08-21 09:00', from: 'U Min Htet', to: 'Ahtwin Compliance', channel: 'Portal notice', message: 'Case opened. Please nominate a contact person.' },
      { at: '2026-09-02 11:30', from: 'U Min Htet', to: 'Ahtwin Compliance', channel: 'Information request', message: 'IR-2026-114 sent: PAR by branch and collection practices.' },
    ],
    decision: null, action: null, publishIfPublic: false, closedAt: null,
  },
  {
    id: 'CASE-2026-036', title: 'Complaint cluster — night-time collection visits (Monywa)', mfiId: 'MFI-006', source: 'Complaint', sourceRef: 'GRV-2026-1102',
    severity: 'Medium', owner: 'Daw Nilar Win', stage: 1, openedAt: '2026-09-19', slaDue: '2026-10-19',
    summary: 'Three complaints in 30 days about collection visits after 21:00 in Monywa township. Possible breach of Fair Collection Practices guideline.',
    documents: [], correspondence: [{ at: '2026-09-19 15:40', from: 'Daw Nilar Win', to: 'File', channel: 'Note', message: 'Linked GRV-2026-1102 and two hotline reports.' }],
    decision: null, action: null, publishIfPublic: false, closedAt: null,
  },
  {
    id: 'CASE-2026-033', title: 'Maha Agriculture — rising PAR in Magway dry zone', mfiId: 'MFI-004', source: 'Examination', sourceRef: 'EXAM-2026-Q3',
    severity: 'Medium', owner: 'U Min Htet', stage: 0, openedAt: '2026-09-18', slaDue: '2026-10-30',
    summary: 'Thematic review of agriculture portfolios after poor monsoon. Triage pending owner confirmation.',
    documents: [], correspondence: [], decision: null, action: null, publishIfPublic: false, closedAt: null,
  },
  {
    id: 'CASE-2026-027', title: 'Mon Coastal — data quality remediation', mfiId: 'MFI-009', source: 'EWS alert', sourceRef: 'ALT-2026-0175',
    severity: 'Low', owner: 'Ko Zaw Lin', stage: 4, openedAt: '2026-07-02', slaDue: '2026-09-02',
    summary: 'DQ score fell below 85%. MFI submitted remediation plan; warning letter issued.',
    documents: [{ name: 'MCM-DQ-remediation-plan.pdf', size: '410 KB', by: 'Mon Coastal Microcredit', at: '2026-07-20' }],
    correspondence: [{ at: '2026-08-05 10:00', from: 'U Min Htet', to: 'MCM CEO', channel: 'Letter', message: 'Formal warning FRD/W/2026/19 issued.' }],
    decision: { text: 'Issue formal warning; require monthly DQ report for 3 months.', proposedBy: 'U Min Htet', proposedById: 'U-G002', status: 'Approved', approver: 'Dr. Than Than Nwe' },
    action: { type: 'Warning', ref: 'FRD/W/2026/19', amount: null, at: '2026-08-05' }, publishIfPublic: false, closedAt: null,
  },
  {
    id: 'CASE-2026-019', title: 'Kayin Unity — orderly wind-down', mfiId: 'MFI-011', source: 'Examination', sourceRef: 'EXAM-2025-11',
    severity: 'High', owner: 'U Min Htet', stage: 5, openedAt: '2025-05-02', slaDue: '2025-08-31',
    summary: 'Voluntary wind-down supervised; all borrowers transferred to Pact Global Microfinance Fund.',
    documents: [{ name: 'KUM-portfolio-transfer-deed.pdf', size: '2.2 MB', by: 'Kayin Unity Microfinance', at: '2025-07-28' }],
    correspondence: [],
    decision: { text: 'Revoke licence on completion of portfolio transfer.', proposedBy: 'U Min Htet', proposedById: 'U-G002', status: 'Approved', approver: 'Dr. Than Than Nwe' },
    action: { type: 'Licence revocation', ref: 'FRD Order 22/2025', amount: null, at: '2025-08-09' }, publishIfPublic: true, closedAt: '2025-08-09',
  },
];

export const CASE_OWNERS = ['U Min Htet', 'Daw Nilar Win', 'Ko Zaw Lin', 'Ma Thandar'];
export const ACTION_TYPES = ['Warning', 'Fine', 'Suspension', 'Licence revocation', 'No action'];
