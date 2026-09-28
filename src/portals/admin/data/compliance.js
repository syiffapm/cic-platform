/** Compliance & data-protection mock data (ADM-14, R12 DSR register). */

export const DSR_TYPES = ['Access', 'Rectification', 'Closure', 'Objection'];
export const DPO_STAFF = ['U Nay Lin', 'Daw Khin Sandar', 'Ko Min Thu'];

/** Data subject requests; due = received + 30 days. */
export const DSRS = [
  { id: 'DSR-2026-0217', type: 'Access', borrower: 'Daw Hnin Wai', nrc: '12/OUKAMA(N)245781', phone: '+959421118834', received: '2026-09-22', due: '2026-10-22', status: 'New', assignee: null, channel: 'Borrower portal' },
  { id: 'DSR-2026-0214', type: 'Rectification', borrower: 'U Kyaw Zin', nrc: '9/MAHAMA(N)118204', phone: '+959790223415', received: '2026-09-15', due: '2026-10-15', status: 'In progress', assignee: 'Daw Khin Sandar', channel: 'Email' },
  { id: 'DSR-2026-0209', type: 'Objection', borrower: 'Ma Ei Phyu', nrc: '14/PATHANA(N)033671', phone: '+959254410987', received: '2026-09-02', due: '2026-10-02', status: 'In progress', assignee: 'U Nay Lin', channel: 'Letter' },
  { id: 'DSR-2026-0203', type: 'Closure', borrower: 'U Aung Myo Min', nrc: '5/MOYWA(N)402198', phone: '+959972203311', received: '2026-08-27', due: '2026-09-26', status: 'In progress', assignee: 'Ko Min Thu', channel: 'Walk-in' },
  { id: 'DSR-2026-0198', type: 'Access', borrower: 'Daw Thida Aye', nrc: '7/PAKHANA(N)221450', phone: '+959450078812', received: '2026-08-20', due: '2026-09-19', status: 'Overdue', assignee: 'Ko Min Thu', channel: 'Hotline' },
  { id: 'DSR-2026-0191', type: 'Rectification', borrower: 'Ko Soe Moe', nrc: '12/DAGANA(N)187302', phone: '+959440091276', received: '2026-08-11', due: '2026-09-10', status: 'Completed', assignee: 'Daw Khin Sandar', channel: 'Borrower portal' },
  { id: 'DSR-2026-0186', type: 'Access', borrower: 'Ma Nwe Nwe', nrc: '8/MAKANA(N)090214', phone: '+959763345120', received: '2026-08-03', due: '2026-09-02', status: 'Completed', assignee: 'U Nay Lin', channel: 'Borrower portal' },
];

export const RETENTION = [
  { id: 'R-01', dataClass: 'Audit log', period: '10 years', basis: 'Credit Information Regulation §24; tamper-evident audit policy', mode: 'WORM · no purge before expiry', purgeJob: 'None (archive tier after 2 y)' },
  { id: 'R-02', dataClass: 'Inquiry log', period: '10 years', basis: 'Borrower right to see who viewed; rule-version traceability', mode: 'Encrypted, pseudonymised in DWH', purgeJob: 'JOB-PURGE (weekly)' },
  { id: 'R-03', dataClass: 'Security log', period: '3 years', basis: 'CBM IT risk guideline', mode: 'SIEM + archive', purgeJob: 'SIEM lifecycle policy' },
  { id: 'R-04', dataClass: 'Data processing log', period: '7 years', basis: 'Data quality accountability', mode: 'Encrypted DB', purgeJob: 'JOB-PURGE (weekly)' },
  { id: 'R-05', dataClass: 'Content log', period: '5 years', basis: 'Public records practice', mode: 'CMS versions', purgeJob: 'JOB-PURGE (weekly)' },
  { id: 'R-06', dataClass: 'Application log', period: '90 days', basis: 'Operational need only', mode: 'Log platform', purgeJob: 'Log platform ILM' },
  { id: 'R-07', dataClass: 'Notification log', period: '2 years', basis: 'Delivery proof; recipients masked', mode: 'Encrypted DB', purgeJob: 'JOB-PURGE (weekly)' },
  { id: 'R-08', dataClass: 'Admin change log', period: '10 years', basis: 'Maker-checker evidence', mode: 'WORM', purgeJob: 'None' },
  { id: 'R-09', dataClass: 'Registry — closed loans', period: '5 years after closure', basis: 'Credit Information Regulation §19', mode: 'Registry → anonymised stats', purgeJob: 'JOB-PURGE (weekly)' },
];

export const BREACH_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

/** detectedAt ISO strings — the 72-hour regulator notification clock runs from here. */
export const BREACHES = [
  { id: 'BR-2026-004', title: 'API key used from non-allow-listed IP (VFM)', detectedAt: '2026-09-24T19:03:00+06:30', severity: 'High', records: 0, categories: 'None confirmed — requests blocked', status: 'Assessing', regulatorNotified: false, subjectsNotified: false },
  { id: 'BR-2026-003', title: 'Report PDF emailed to wrong MFI officer', detectedAt: '2026-08-12T10:40:00+06:30', severity: 'Medium', records: 1, categories: 'Name, NRC, loan balances', status: 'Closed', regulatorNotified: true, notifiedAt: '2026-08-13T16:05:00+06:30', subjectsNotified: true },
  { id: 'BR-2026-002', title: 'Lost laptop — MFI-006 branch (encrypted)', detectedAt: '2026-05-03T08:15:00+06:30', severity: 'Low', records: 0, categories: 'Encrypted disk, no CIC data cached', status: 'Closed', regulatorNotified: true, notifiedAt: '2026-05-04T11:00:00+06:30', subjectsNotified: false },
];

export const DPIAS = [
  { id: 'DPIA-2026-06', system: 'Borrower self-service portal', date: '2026-06-18', risk: 'High', status: 'Approved', reviewer: 'U Nay Lin', next: '2027-06-18' },
  { id: 'DPIA-2026-05', system: 'Alternative data pilot (mobile money)', date: '2026-08-30', risk: 'High', status: 'In review', reviewer: 'U Nay Lin', next: '—' },
  { id: 'DPIA-2026-03', system: 'Identity resolution engine v2', date: '2026-03-11', risk: 'Medium', status: 'Approved', reviewer: 'Daw Khin Sandar', next: '2027-03-11' },
  { id: 'DPIA-2025-09', system: 'Regulator risk intelligence drill-down', date: '2025-11-04', risk: 'Medium', status: 'Approved', reviewer: 'U Nay Lin', next: '2026-11-04' },
  { id: 'DPIA-2025-04', system: 'SMS notification gateway', date: '2025-05-20', risk: 'Low', status: 'Expired', reviewer: 'Daw Khin Sandar', next: '2026-05-20' },
];

export const POLICIES = [
  { id: 'POL-01', policy: 'Information security policy', version: 'v4.1', published: '2026-07-01', acknowledged: 61, total: 64, due: '2026-08-15', overdue: ['Ko Zaw Lin', 'Daw Nilar Win', 'U Thant Zin'] },
  { id: 'POL-02', policy: 'Personal data protection policy', version: 'v2.3', published: '2026-08-20', acknowledged: 48, total: 64, due: '2026-10-05', overdue: [] },
  { id: 'POL-03', policy: 'Acceptable use of CIC systems', version: 'v3.0', published: '2026-01-10', acknowledged: 64, total: 64, due: '2026-02-28', overdue: [] },
  { id: 'POL-04', policy: 'Incident & breach response procedure', version: 'v1.6', published: '2026-06-05', acknowledged: 58, total: 64, due: '2026-07-20', overdue: ['Ma Hsu Lai', 'Ko Min Thu', 'Daw Hla Hla', 'U Kyaw Soe', 'Ma Phyu Sin', 'Ko Aung Ko'] },
  { id: 'POL-05', policy: 'Clean desk & remote work', version: 'v1.2', published: '2026-09-15', acknowledged: 22, total: 64, due: '2026-10-31', overdue: [] },
];
