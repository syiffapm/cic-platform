/** System configuration, jobs, backup and API client mock data (ADM-13, SEC-10, AC09). */

export const SYSTEM_DEFAULTS = {
  maintenanceMode: false,
  auditRetentionDays: 3650,
  backupFrequency: 'Hourly',
  sessionIdleMinutes: 10,
};

export const BACKUP_FREQUENCIES = ['Hourly', 'Every 30 min', 'Every 15 min'];

export const JOBS = [
  { id: 'JOB-INGEST', name: 'Ingestion validation', cron: '*/10 * * * *', lastRun: '2026-09-25 08:50', nextRun: '2026-09-25 09:00', duration: '1 m 12 s', status: 'Success' },
  { id: 'JOB-REPORT', name: 'Nightly report generation', cron: '0 1 * * *', lastRun: '2026-09-25 01:00', nextRun: '2026-09-26 01:00', duration: '1 h 48 m', status: 'Warning' },
  { id: 'JOB-PURGE', name: 'Retention purge', cron: '0 3 * * 0', lastRun: '2026-09-20 03:00', nextRun: '2026-09-27 03:00', duration: '22 m 05 s', status: 'Success' },
  { id: 'JOB-SITEMAP', name: 'Sitemap regeneration', cron: '30 2 * * *', lastRun: '2026-09-25 02:30', nextRun: '2026-09-26 02:30', duration: '41 s', status: 'Success' },
  { id: 'JOB-EWS', name: 'EWS recompute', cron: '0 5 * * *', lastRun: '2026-09-25 05:00', nextRun: '2026-09-26 05:00', duration: '14 m 30 s', status: 'Failed' },
  { id: 'JOB-INVOICE', name: 'Monthly invoice run', cron: '0 6 1 * *', lastRun: '2026-09-01 06:00', nextRun: '2026-10-01 06:00', duration: '8 m 17 s', status: 'Success' },
  { id: 'JOB-BACKUP', name: 'Incremental backup', cron: '0 * * * *', lastRun: '2026-09-25 08:30', nextRun: '2026-09-25 09:30', duration: '6 m 02 s', status: 'Success' },
];

export const BACKUP_STATUS = [
  { label: 'Last full backup', value: '2026-09-24 23:00', note: '2.84 TB · encrypted AES-256' },
  { label: 'Last incremental', value: '2026-09-25 08:30', note: '41.2 GB · replicated to DR site' },
  { label: 'RPO achieved', value: '28 min', note: 'Target ≤ 1 h' },
  { label: 'Next restore test', value: '2026-10-13', note: 'Quarterly · Q4 2026' },
];

/** Quarterly restore tests (AC09: restore meets RPO 1 h / RTO 4 h). Minutes. */
export const RESTORE_TESTS = [
  { id: 'RT-2026-Q3', date: '2026-07-14', backupSet: 'FULL-20260713-2300 + INC ×9', rpo: 28, rto: 161, scope: 'Full registry + DWH', verifiedBy: 'Ko Htet Naing' },
  { id: 'RT-2026-Q2', date: '2026-04-16', backupSet: 'FULL-20260415-2300 + INC ×11', rpo: 41, rto: 198, scope: 'Full registry + DWH', verifiedBy: 'Ko Htet Naing' },
  { id: 'RT-2026-Q1', date: '2026-01-21', backupSet: 'FULL-20260120-2300 + INC ×14', rpo: 52, rto: 274, scope: 'Registry only', verifiedBy: 'U Soe Paing' },
  { id: 'RT-2025-Q4', date: '2025-10-09', backupSet: 'FULL-20251008-2300 + INC ×7', rpo: 35, rto: 222, scope: 'Full registry + DWH', verifiedBy: 'U Soe Paing' },
];
export const RPO_TARGET = 60;
export const RTO_TARGET = 240;

export const FEATURE_FLAGS = [
  { id: 'FF-BORROWER-PORTAL', name: 'Borrower self-service portal', description: 'Borrower portal — own report, who-viewed, disputes', enabled: true, scope: 'All users' },
  { id: 'FF-ALT-DATA', name: 'Alternative data in reports', description: 'Utility & mobile-money repayment history in full report', enabled: false, scope: 'Pilot MFIs' },
  { id: 'FF-ZAWGYI-CONVERT', name: 'Zawgyi auto-conversion', description: 'Convert Zawgyi on paste in CMS and forms', enabled: true, scope: 'All users' },
  { id: 'FF-LOW-BANDWIDTH', name: 'Low-bandwidth mode', description: 'Offer text-only mode on slow connections', enabled: true, scope: 'Public, Borrower' },
  { id: 'FF-EWS-V2', name: 'EWS model v2', description: 'New early-warning thresholds for over-indebtedness', enabled: false, scope: 'Regulator' },
  { id: 'FF-BULK-INQUIRY', name: 'Bulk inquiry API', description: 'Batch inquiry endpoint for portfolio reviews (RV)', enabled: false, scope: 'Tier 1 MFIs' },
];

export const API_CLIENTS = [
  { id: 'cli_pgmf_prod', mfi: 'PGMF', scopes: 'inquiry:full submission:write', certExpiry: '2027-03-14', keyRotated: '2026-06-02', status: 'Active' },
  { id: 'cli_amm_prod', mfi: 'AMM', scopes: 'inquiry:basic submission:write', certExpiry: '2026-10-19', keyRotated: '2026-03-28', status: 'Active' },
  { id: 'cli_vfm_prod', mfi: 'VFM', scopes: 'inquiry:full submission:write', certExpiry: '2027-01-08', keyRotated: '2026-07-11', status: 'Active' },
  { id: 'cli_maha_prod', mfi: 'MAHA', scopes: 'inquiry:basic submission:write', certExpiry: '2026-12-01', keyRotated: '2026-02-17', status: 'Active' },
  { id: 'cli_gdf_prod', mfi: 'GDF', scopes: 'submission:write', certExpiry: '2026-11-30', keyRotated: '2025-11-30', status: 'Suspended' },
  { id: 'cli_cbm_sup', mfi: 'CBM (Regulator)', scopes: 'supervision:read', certExpiry: '2027-05-20', keyRotated: '2026-05-20', status: 'Active' },
  { id: 'cli_kum_prod', mfi: 'KUM', scopes: '—', certExpiry: '2026-03-01', keyRotated: '2025-03-01', status: 'Revoked' },
];
