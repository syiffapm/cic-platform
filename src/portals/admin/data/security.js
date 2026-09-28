/** Security monitoring mock data (ADM-12, §9 Security dashboard, SEC-08). */

export const SECURITY_KPIS = {
  failedLogins24h: 142,
  mfaFailures24h: 23,
  ipAnomalies24h: 6,
  privileged24h: 18,
  breakGlass30d: 1,
};

/** Last 14 days of security signals. */
export const SECURITY_TREND = [
  ['11 Sep', 96, 14, 2, 11], ['12 Sep', 88, 12, 1, 9], ['13 Sep', 54, 6, 0, 3], ['14 Sep', 49, 5, 1, 2],
  ['15 Sep', 104, 17, 3, 14], ['16 Sep', 118, 15, 2, 16], ['17 Sep', 97, 11, 4, 12], ['18 Sep', 131, 19, 2, 15],
  ['19 Sep', 126, 21, 5, 19], ['20 Sep', 61, 8, 1, 4], ['21 Sep', 58, 7, 0, 3], ['22 Sep', 122, 18, 3, 17],
  ['23 Sep', 137, 20, 4, 21], ['24 Sep', 142, 23, 6, 18],
].map(([day, failedLogins, mfaFailures, ipAnomalies, privileged]) => ({ day, failedLogins, mfaFailures, ipAnomalies, privileged }));

export const SECURITY_EVENTS = [
  { id: 'SEC-7731', at: '2026-09-25 08:52', type: 'Failed login burst', account: 'amm.admin', tenant: 'MFI-002', ip: '185.220.101.7', geo: 'Frankfurt, DE (Tor exit)', severity: 'High', status: 'Open', detail: '27 failed attempts in 4 min; account auto-locked' },
  { id: 'SEC-7730', at: '2026-09-25 07:14', type: 'MFA failure', account: 'ko.thiha', tenant: 'MFI-001', ip: '103.25.12.41', geo: 'Yangon, MM', severity: 'Low', status: 'Closed', detail: 'OTP expired twice, third attempt succeeded' },
  { id: 'SEC-7728', at: '2026-09-24 22:41', type: 'Geo anomaly', account: 'shcf.officer2', tenant: 'MFI-008', ip: '49.0.112.18', geo: 'Bangkok, TH', severity: 'Medium', status: 'Investigating', detail: 'Login from TH 40 min after login from Taunggyi — impossible travel' },
  { id: 'SEC-7725', at: '2026-09-24 19:03', type: 'IP anomaly', account: 'vfm.api', tenant: 'MFI-003', ip: '45.77.10.201', geo: 'Singapore, SG', severity: 'High', status: 'Open', detail: 'API key used from IP outside MFI allow-list; requests blocked' },
  { id: 'SEC-7722', at: '2026-09-24 16:30', type: 'Privileged action', account: 'U Soe Paing', tenant: 'CIC', ip: '10.10.4.2', geo: 'CIC HQ, Nay Pyi Taw', severity: 'Low', status: 'Closed', detail: 'Config change request: backup.frequency' },
  { id: 'SEC-7719', at: '2026-09-24 11:12', type: 'Cross-tenant attempt', account: 'Ma Su Myat', tenant: 'MFI-001', ip: '103.25.12.40', geo: 'Yangon, MM', severity: 'Medium', status: 'Investigating', detail: 'Read of MFI-002/portfolio denied' },
  { id: 'SEC-7716', at: '2026-09-23 23:58', type: 'Failed login burst', account: 'gdf.maker', tenant: 'MFI-007', ip: '103.47.184.9', geo: 'Hinthada, MM', severity: 'Medium', status: 'Closed', detail: 'Suspended institution — logins rejected by policy' },
  { id: 'SEC-7710', at: '2026-09-22 03:15', type: 'Break-glass use', account: 'breakglass-01', tenant: 'CIC', ip: '10.10.1.5', geo: 'CIC DR site', severity: 'Critical', status: 'Closed', detail: 'Emergency DB access during INC-2026-039; reviewed by Security Admin' },
  { id: 'SEC-7704', at: '2026-09-21 14:47', type: 'MFA failure', account: 'daw.nilar', tenant: 'CIC', ip: '10.10.4.44', geo: 'CIC HQ, Nay Pyi Taw', severity: 'Low', status: 'Closed', detail: 'Authenticator re-enrolled after phone replacement' },
  { id: 'SEC-7699', at: '2026-09-20 09:30', type: 'IP anomaly', account: 'mcm.admin', tenant: 'MFI-009', ip: '202.165.80.12', geo: 'Mawlamyine, MM', severity: 'Low', status: 'Closed', detail: 'New branch IP — allow-list updated via IAM approval APR-5490' },
];

/** Log types from §9 with WORM/retention (ADM-12 log catalogue). */
export const LOG_CATALOGUE = [
  { id: 'audit', name: 'Audit log', content: 'Every read of personal data, decision, export, config change; hash of previous entry', retention: '10 years', storage: 'WORM object store', integrity: 'Hash chain + daily anchor', owner: 'Security Administrator' },
  { id: 'inquiry', name: 'Inquiry log', content: 'Inquiry purpose, consent ref, rule version, data date', retention: '10 years', storage: 'Encrypted DB + archive', integrity: 'Row hash', owner: 'Data Steward' },
  { id: 'security', name: 'Security log', content: 'Logins, MFA, IP/geo anomalies, lockouts, break-glass', retention: '3 years', storage: 'SIEM + archive', integrity: 'SIEM signed', owner: 'Security Administrator' },
  { id: 'processing', name: 'Data processing log', content: 'Batch ingestion, validation, merges, corrections', retention: '7 years', storage: 'Encrypted DB', integrity: 'Row hash', owner: 'Data Steward' },
  { id: 'content', name: 'Content log', content: 'CMS versions, approvals, publish/unpublish', retention: '5 years', storage: 'CMS DB', integrity: 'Version hash', owner: 'Content Publisher' },
  { id: 'application', name: 'Application log', content: 'Errors, performance traces, job runs', retention: '90 days', storage: 'Log platform', integrity: '—', owner: 'Super Administrator' },
  { id: 'notification', name: 'Notification log', content: 'Email/SMS/in-app delivery, retries, opt-outs (masked recipient)', retention: '2 years', storage: 'Encrypted DB', integrity: '—', owner: 'Content Editor' },
  { id: 'adminchange', name: 'Admin change log', content: 'Maker-checker requests, diffs and decisions', retention: '10 years', storage: 'WORM object store', integrity: 'Hash chain', owner: 'Super Administrator' },
];

export const SIEM_DEFAULTS = { endpoint: 'syslog+tls://siem.cic.gov.mm:6514', format: 'CEF', tls: true, batchSeconds: 30, includeReads: true };

export const INTEGRITY = { entries: 12_418, lastAnchor: 'sha256:7c1e4b09d2f8a36e51f0c9ab44d27e18b6a3f5d0e9c21784aa0b3f6d5e92c1a7', anchoredAt: '2026-09-25 00:00', retention: 'WORM · 10 years' };
