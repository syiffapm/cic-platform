/** Early-warning system: versioned rules library and alert queue (GOV-08). */
export const EWS_RULES = [
  {
    id: 'EWS-R01', name: 'PAR30 breach', metric: 'PAR30 (%)', operator: '>', category: 'Credit risk', severity: 'High', activeVersion: 'v3',
    versions: [
      { version: 'v3', threshold: 5.0, effective: '2026-04-01', author: 'U Min Htet', approvedBy: 'Dr. Than Than Nwe', note: 'Lowered from 6% after sector PAR improvement' },
      { version: 'v2', threshold: 6.0, effective: '2025-07-01', author: 'U Min Htet', approvedBy: 'Dr. Than Than Nwe', note: 'Post-flood recalibration' },
      { version: 'v1', threshold: 5.0, effective: '2024-11-01', author: 'FRD Risk Unit', approvedBy: 'Director FRD', note: 'Initial rule' },
    ],
  },
  {
    id: 'EWS-R02', name: 'PAR30 month-on-month jump', metric: 'Δ PAR30 (pp)', operator: '>', category: 'Credit risk', severity: 'Medium', activeVersion: 'v2',
    versions: [
      { version: 'v2', threshold: 1.0, effective: '2026-01-01', author: 'Ko Zaw Lin', approvedBy: 'Dr. Than Than Nwe', note: 'Uses 3-month rolling baseline' },
      { version: 'v1', threshold: 1.5, effective: '2024-11-01', author: 'FRD Risk Unit', approvedBy: 'Director FRD', note: 'Initial rule' },
    ],
  },
  {
    id: 'EWS-R03', name: 'Late or missing submission', metric: 'Days late', operator: '>', category: 'Reporting', severity: 'Medium', activeVersion: 'v1',
    versions: [{ version: 'v1', threshold: 5, effective: '2024-11-01', author: 'FRD Risk Unit', approvedBy: 'Director FRD', note: 'Cut-off 7th + 5 days grace' }],
  },
  {
    id: 'EWS-R04', name: 'Data quality score drop', metric: 'DQ score (%)', operator: '<', category: 'Reporting', severity: 'Low', activeVersion: 'v2',
    versions: [
      { version: 'v2', threshold: 85, effective: '2026-03-01', author: 'Ko Zaw Lin', approvedBy: 'Dr. Than Than Nwe', note: 'Critical-field weighting added' },
      { version: 'v1', threshold: 80, effective: '2024-11-01', author: 'FRD Risk Unit', approvedBy: 'Director FRD', note: 'Initial rule' },
    ],
  },
  {
    id: 'EWS-R05', name: 'Township multiple-borrowing concentration', metric: 'Borrowers ≥3 loans (%)', operator: '>', category: 'Over-indebtedness', severity: 'High', activeVersion: 'v1',
    versions: [{ version: 'v1', threshold: 9.0, effective: '2025-06-01', author: 'Ko Zaw Lin', approvedBy: 'Dr. Than Than Nwe', note: 'Township level, monthly' }],
  },
  {
    id: 'EWS-R06', name: 'Capital adequacy shortfall', metric: 'Capital ÷ portfolio (%)', operator: '<', category: 'Prudential', severity: 'Critical', activeVersion: 'v1',
    versions: [{ version: 'v1', threshold: 6.0, effective: '2024-11-01', author: 'FRD Risk Unit', approvedBy: 'Director FRD', note: 'Per FRD Directive 1/2024' }],
  },
  {
    id: 'EWS-R07', name: 'Dispute SLA breaches', metric: 'Breached disputes (30 d)', operator: '≥', category: 'Consumer protection', severity: 'Medium', activeVersion: 'v1',
    versions: [{ version: 'v1', threshold: 1, effective: '2025-10-15', author: 'Daw Nilar Win', approvedBy: 'Dr. Than Than Nwe', note: 'Any breach triggers' }],
  },
];

export const EWS_ALERTS = [
  { id: 'ALT-2026-0214', ruleId: 'EWS-R01', ruleVersion: 'v3', mfiId: 'MFI-007', triggered: 18.3, threshold: 5.0, severity: 'Critical', raisedAt: '2026-09-11', status: 'Case open', caseId: 'CASE-2026-041' },
  { id: 'ALT-2026-0219', ruleId: 'EWS-R06', ruleVersion: 'v1', mfiId: 'MFI-007', triggered: 5.9, threshold: 6.0, severity: 'Critical', raisedAt: '2026-09-11', status: 'Case open', caseId: 'CASE-2026-041' },
  { id: 'ALT-2026-0223', ruleId: 'EWS-R01', ruleVersion: 'v3', mfiId: 'MFI-006', triggered: 9.7, threshold: 5.0, severity: 'High', raisedAt: '2026-09-11', status: 'Case open', caseId: 'CASE-2026-038' },
  { id: 'ALT-2026-0231', ruleId: 'EWS-R03', ruleVersion: 'v1', mfiId: 'MFI-006', triggered: 12, threshold: 5, severity: 'Medium', raisedAt: '2026-09-13', status: 'New', caseId: null },
  { id: 'ALT-2026-0236', ruleId: 'EWS-R01', ruleVersion: 'v3', mfiId: 'MFI-004', triggered: 5.8, threshold: 5.0, severity: 'High', raisedAt: '2026-09-11', status: 'New', caseId: null },
  { id: 'ALT-2026-0238', ruleId: 'EWS-R02', ruleVersion: 'v2', mfiId: 'MFI-009', triggered: 1.4, threshold: 1.0, severity: 'Medium', raisedAt: '2026-09-11', status: 'New', caseId: null },
  { id: 'ALT-2026-0240', ruleId: 'EWS-R05', ruleVersion: 'v1', mfiId: 'MFI-003', triggered: 10.5, threshold: 9.0, severity: 'High', raisedAt: '2026-09-12', status: 'New', caseId: null, township: 'Hinthada' },
  { id: 'ALT-2026-0242', ruleId: 'EWS-R04', ruleVersion: 'v2', mfiId: 'MFI-009', triggered: 84.1, threshold: 85, severity: 'Low', raisedAt: '2026-09-14', status: 'Acknowledged', caseId: null },
  { id: 'ALT-2026-0245', ruleId: 'EWS-R07', ruleVersion: 'v1', mfiId: 'MFI-006', triggered: 1, threshold: 1, severity: 'Medium', raisedAt: '2026-08-20', status: 'Case open', caseId: 'CASE-2026-038' },
  { id: 'ALT-2026-0249', ruleId: 'EWS-R01', ruleVersion: 'v3', mfiId: 'MFI-009', triggered: 6.1, threshold: 5.0, severity: 'High', raisedAt: '2026-09-11', status: 'New', caseId: null },
  { id: 'ALT-2026-0251', ruleId: 'EWS-R03', ruleVersion: 'v1', mfiId: 'MFI-004', triggered: 7, threshold: 5, severity: 'Medium', raisedAt: '2026-09-13', status: 'Dismissed', caseId: null, note: 'Flood extension ANN-2026-028 applies' },
];

export const ruleById = (id) => EWS_RULES.find((r) => r.id === id);
