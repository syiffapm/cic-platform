/**
 * Seed data for the shared, cross-portal store (StoreContext).
 * Only records that flow between portals live here; portal-private mock data lives in each portal's own data file.
 */

/** Announcements / notices — classification enforced by selectors, never only UI (PUB-06, CMS-05, AC07). */
/** Relative timestamps keep the demo queues fresh ('YYYY-MM-DD HH:mm', local time). */
const stamp = (d) => { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const ago = (h) => stamp(new Date(Date.now() - h * 3600000));
const inDays = (days) => stamp(new Date(Date.now() + days * 86400000)).slice(0, 10);

export const ANNOUNCEMENTS = [
  { id: 'ANN-2026-031', title: { en: 'Submission schema v3.2 becomes mandatory from 1 November 2026', mm: 'တင်သွင်းမှု schema v3.2 ကို ၂၀၂၆ နိုဝင်ဘာ ၁ မှစ၍ မဖြစ်မနေ အသုံးပြုရမည်' }, body: { en: 'All reporting institutions must use schema v3.2, which adds guarantor NRC and household size. The v3.1 template will be rejected after the October cut-off.', mm: 'တင်သွင်းသည့် အဖွဲ့အစည်းအားလုံး schema v3.2 ကို အသုံးပြုရမည်။' }, category: 'Regulation', classification: 'Public', status: 'Published', publishedAt: '2026-09-20', author: 'Ma Yamin', approver: 'Daw Moe Moe', attachment: 'CIC-Circular-31-2026.pdf', pinned: true, mandatory: false },
  { id: 'ANN-2026-030', title: { en: 'Borrowers can now check their own credit report online', mm: 'ချေးငွေယူသူများ မိမိ၏ ချေးငွေအစီရင်ခံစာကို အွန်လိုင်းတွင် စစ်ဆေးနိုင်ပြီ' }, body: { en: 'The Borrower Self-Service Portal lets individuals see their own report once every 12 months free of charge, see who accessed it and file disputes.', mm: '' }, category: 'Service', classification: 'Public', status: 'Published', publishedAt: '2026-09-12', author: 'Ma Yamin', approver: 'Daw Moe Moe', attachment: null, pinned: false, mandatory: false },
  { id: 'ANN-2026-029', title: { en: 'Monthly sector credit bulletin — August 2026', mm: 'လစဉ် ကဏ္ဍချေးငွေ သတင်းလွှာ — ၂၀၂၆ ဩဂုတ်' }, body: { en: 'Gross portfolio reached 1.39 trillion MMK across 12 reporting institutions; PAR30 improved to 3.2%.', mm: '' }, category: 'Statistics', classification: 'Public', status: 'Published', publishedAt: '2026-09-05', author: 'Ko Zaw Lin', approver: 'Dr. Than Than Nwe', attachment: 'Bulletin-2026-08.pdf', pinned: false, mandatory: false },
  { id: 'ANN-2026-028', title: { en: 'September cut-off extended to 10 October for flood-affected townships', mm: '' }, body: { en: 'MFIs with branches in Ayeyarwady flood-affected townships may submit September data until 10 October without a late flag.', mm: '' }, category: 'Operations', classification: 'MFI-only', status: 'Published', publishedAt: '2026-09-18', author: 'Ma Yamin', approver: 'Daw Moe Moe', attachment: null, pinned: false, mandatory: true },
  { id: 'ANN-2026-027', title: { en: 'Supervisory review: Myanmar Ahtwin Microfinance', mm: '' }, body: { en: 'Internal note: on-site examination scheduled for 7–11 October. Do not disclose outside FRD.', mm: '' }, category: 'Supervision', classification: 'Regulator-only', status: 'Published', publishedAt: '2026-09-16', author: 'U Min Htet', approver: 'Dr. Than Than Nwe', attachment: null, pinned: false, mandatory: false },
  { id: 'ANN-2026-026', title: { en: 'Planned maintenance 28 September 22:00–02:00 MMT', mm: 'စနစ်ပြုပြင်ထိန်းသိမ်းမှု စက်တင်ဘာ ၂၈' }, body: { en: 'Inquiry and submission services will be unavailable during this window.', mm: '' }, category: 'Operations', classification: 'Public', status: 'Published', publishedAt: '2026-09-15', author: 'Ma Yamin', approver: 'Daw Moe Moe', attachment: null, pinned: false, mandatory: false },
  { id: 'ANN-2026-025', title: { en: 'Consent form template updated (v2)', mm: '' }, body: { en: 'The borrower consent template now includes alternative-data consent as a separate optional tick box.', mm: '' }, category: 'Regulation', classification: 'MFI-only', status: 'Published', publishedAt: '2026-09-02', author: 'Ma Yamin', approver: 'Daw Moe Moe', attachment: 'Consent-Template-v2.docx', pinned: false, mandatory: true },
  { id: 'ANN-2026-024', title: { en: 'CIC staff security awareness training — Q4', mm: '' }, body: { en: 'Internal: all CIC staff must complete training by 31 October.', mm: '' }, category: 'Internal', classification: 'Internal', status: 'Published', publishedAt: '2026-09-01', author: 'Ko Htet Naing', approver: 'U Soe Paing', attachment: null, pinned: false, mandatory: false },
  { id: 'ANN-2026-032', title: { en: 'Guideline on responsible lending and over-indebtedness', mm: '' }, body: { en: 'Draft guideline on a debt-to-income cap for microfinance loans, open for review.', mm: '' }, category: 'Regulation', classification: 'Public', status: 'In review', publishedAt: null, author: 'Ma Yamin', approver: null, attachment: 'Draft-Guideline-DTI.pdf', pinned: false, mandatory: false },
];

export const FAQS = [
  { id: 'FAQ-01', category: 'Credit report', q: { en: 'What is a credit report?', mm: 'ချေးငွေအစီရင်ခံစာ ဆိုသည်မှာ အဘယ်နည်း' }, a: { en: 'A credit report is a record of your loans with licensed microfinance institutions: the amounts, balances and how you repaid them. Lenders use it, with your consent, to decide on new loans.', mm: 'ချေးငွေအစီရင်ခံစာသည် လိုင်စင်ရ အသေးစားငွေရေးအဖွဲ့များထံမှ သင်၏ ချေးငွေမှတ်တမ်း ဖြစ်သည်။' }, helpful: 184 },
  { id: 'FAQ-02', category: 'Credit report', q: { en: 'How do I check my own credit report?', mm: '' }, a: { en: 'Register on the Borrower Self-Service Portal with your NRC and mobile number and verify your identity. We send your user ID and a temporary password by SMS or email. Sign in, choose your own password, then request your credit report. CIC validates the data from every lender and an officer approves it, usually within 1 working day; you get an SMS or email when it is ready. One report every 12 months is free.', mm: '' }, helpful: 312 },
  { id: 'FAQ-03', category: 'Credit report', q: { en: 'Does "no credit record found" mean I am a bad borrower?', mm: '' }, a: { en: 'No. It only means no licensed institution has reported a loan in your name. A no-hit result is never a low score.', mm: '' }, helpful: 97 },
  { id: 'FAQ-04', category: 'Disputes', q: { en: 'What can I do if my report is wrong?', mm: '' }, a: { en: 'File a dispute in the Borrower portal. The reporting MFI must respond within 10 working days and CIC resolves the case within 30 days. You are notified at every step.', mm: '' }, helpful: 221 },
  { id: 'FAQ-05', category: 'Disputes', q: { en: 'Is there a fee to file a dispute?', mm: '' }, a: { en: 'No. Disputes are always free.', mm: '' }, helpful: 76 },
  { id: 'FAQ-06', category: 'Privacy', q: { en: 'Who can see my credit report?', mm: '' }, a: { en: 'Only licensed institutions with your consent and a valid purpose, and supervisors of the Central Bank under strict logging. You can see every access in "Who viewed my report".', mm: '' }, helpful: 158 },
  { id: 'FAQ-07', category: 'Privacy', q: { en: 'How long is my data kept?', mm: '' }, a: { en: 'Closed loans are kept for 5 years after closure, in line with the retention schedule approved by CBM.', mm: '' }, helpful: 41 },
  { id: 'FAQ-08', category: 'For MFIs', q: { en: 'How often must MFIs submit data?', mm: '' }, a: { en: 'At least monthly, by the 7th calendar day after month end. Daily submission via API is encouraged.', mm: '' }, helpful: 63 },
  { id: 'FAQ-09', category: 'For MFIs', q: { en: 'How do I verify an MFI is licensed?', mm: '' }, a: { en: 'Search the MFI Directory by name, licence number or township. Only institutions shown as "Licensed" may lend.', mm: '' }, helpful: 129 },
];

export const PUBLICATIONS = [
  { id: 'PUB-D-01', type: 'Regulation', title: 'Directive on Credit Reporting by Microfinance Institutions', version: '2.0', effective: '2026-01-01', size: '1.2 MB', format: 'PDF' },
  { id: 'PUB-D-02', type: 'Guideline', title: 'Data Submission Guideline and Schema v3.2', version: '3.2', effective: '2026-11-01', size: '2.4 MB', format: 'PDF' },
  { id: 'PUB-D-03', type: 'Guideline', title: 'Borrower Consent and Purpose of Inquiry Guideline', version: '1.1', effective: '2026-06-01', size: '640 KB', format: 'PDF' },
  { id: 'PUB-D-04', type: 'Form', title: 'Borrower Consent Form (EN/MM)', version: '2.0', effective: '2026-09-02', size: '120 KB', format: 'DOCX' },
  { id: 'PUB-D-05', type: 'Form', title: 'Offline Dispute Form', version: '1.0', effective: '2025-10-15', size: '95 KB', format: 'PDF' },
  { id: 'PUB-D-06', type: 'Report', title: 'CIC Annual Report 2025', version: '1.0', effective: '2026-03-31', size: '8.6 MB', format: 'PDF' },
  { id: 'PUB-D-07', type: 'Report', title: 'Statistical Bulletin Q2 2026', version: '1.0', effective: '2026-07-30', size: '3.1 MB', format: 'PDF' },
  { id: 'PUB-D-08', type: 'Guideline', title: 'Dispute Handling Standard for Reporting Institutions', version: '1.2', effective: '2026-04-01', size: '410 KB', format: 'PDF' },
];

/** Disputes flow Borrower (file) → MFI (respond) → Admin/CIC (approve correction) → Regulator (oversight). */
export const DISPUTES = [
  { id: 'DSP-2026-0412', borrowerId: 'BRW-000184', borrowerName: 'Daw Hnin Wai', mfiId: 'MFI-002', loanId: 'AMM-LN-778120', reason: 'D02', description: 'Outstanding shows 1,850,000 MMK but I paid instalment 9 on 5 Aug. Receipt attached.', status: 'Awaiting MFI', filedAt: '2026-09-10', mfiDueAt: '2026-09-24', dueAt: '2026-10-10', evidence: ['receipt-aug.jpg'], mfiResponse: null, outcome: null, channel: 'Portal 2', history: [{ at: '2026-09-10 09:12', by: 'Daw Hnin Wai', action: 'Dispute filed' }, { at: '2026-09-10 09:13', by: 'System', action: 'Assigned to Alliance Myanmar Microfinance; loan flagged "under dispute"' }] },
  { id: 'DSP-2026-0398', borrowerId: 'BRW-000184', borrowerName: 'Daw Hnin Wai', mfiId: 'MFI-001', loanId: 'PGMF-LN-104552', reason: 'D04', description: 'This group loan was fully repaid in March 2026 but still shows as active.', status: 'Resolved', filedAt: '2026-08-02', mfiDueAt: '2026-08-16', dueAt: '2026-09-01', evidence: ['closure-letter.pdf'], mfiResponse: 'Confirmed. Closure was not sent in the March batch. Correction submitted.', outcome: 'Corrected — loan status changed to Closed (2026-03-28)', channel: 'Portal 2', history: [{ at: '2026-08-02 14:03', by: 'Daw Hnin Wai', action: 'Dispute filed' }, { at: '2026-08-09 10:40', by: 'Ma Ei Phyu (PGMF)', action: 'MFI responded and submitted correction' }, { at: '2026-08-12 16:20', by: 'Ko Pyae Sone (CIC)', action: 'Correction approved; record version 4 created' }, { at: '2026-08-12 16:21', by: 'System', action: 'Borrower notified by SMS' }] },
  { id: 'DSP-2026-0405', borrowerId: 'BRW-002331', borrowerName: 'U Tun Tun Oo', mfiId: 'MFI-001', loanId: 'PGMF-LN-220981', reason: 'D03', description: 'Shows 60 days past due for June but I was granted a flood moratorium.', status: 'Investigating', filedAt: '2026-09-05', mfiDueAt: '2026-09-19', dueAt: '2026-10-05', evidence: ['moratorium-letter.pdf'], mfiResponse: null, outcome: null, channel: 'Helpdesk', history: [{ at: '2026-09-05 11:00', by: 'Ma Hsu Lai (Helpdesk)', action: 'Dispute logged on behalf of borrower' }] },
  { id: 'DSP-2026-0409', borrowerId: 'BRW-004410', borrowerName: 'Ma Phyu Phyu', mfiId: 'MFI-001', loanId: 'PGMF-LN-301177', reason: 'D01', description: 'I never took this loan. Someone used my NRC.', status: 'Awaiting MFI', filedAt: '2026-09-08', mfiDueAt: '2026-09-22', dueAt: '2026-10-08', evidence: [], mfiResponse: null, outcome: null, channel: 'Portal 2', history: [{ at: '2026-09-08 08:30', by: 'Ma Phyu Phyu', action: 'Dispute filed' }] },
  { id: 'DSP-2026-0415', borrowerId: 'BRW-005120', borrowerName: 'Ko Myo Min', mfiId: 'MFI-004', loanId: 'MAHA-LN-55102', reason: 'D06', description: 'Date of birth is wrong on my record.', status: 'Pending CIC approval', filedAt: '2026-09-12', mfiDueAt: '2026-09-26', dueAt: '2026-10-12', evidence: ['nrc-copy.jpg'], mfiResponse: 'DOB corrected from 1988-02-11 to 1986-02-11 per NRC copy.', outcome: null, channel: 'Portal 2', history: [{ at: '2026-09-12 13:45', by: 'Ko Myo Min', action: 'Dispute filed' }, { at: '2026-09-17 09:10', by: 'MAHA Dispute Officer', action: 'Correction submitted' }] },
  { id: 'DSP-2026-0371', borrowerId: 'BRW-006003', borrowerName: 'Daw San San', mfiId: 'MFI-006', loanId: 'AHT-LN-9021', reason: 'D02', description: 'Balance includes a penalty that was waived.', status: 'Escalated', filedAt: '2026-07-20', mfiDueAt: '2026-08-03', dueAt: '2026-08-19', evidence: ['waiver.pdf'], mfiResponse: null, outcome: null, channel: 'Portal 2', history: [{ at: '2026-07-20 10:00', by: 'Daw San San', action: 'Dispute filed' }, { at: '2026-08-04 00:00', by: 'System', action: 'MFI response SLA breached' }, { at: '2026-08-20 00:00', by: 'System', action: 'Resolution SLA breached — escalated to CBM Consumer Protection' }] },
];

/** Who-viewed / inquiry log (BOR-06, MFI-19). */
export const INQUIRIES = [
  { id: 'INQ-88213', borrowerId: 'BRW-000184', mfiId: 'MFI-001', user: 'Ma Su Myat', purpose: 'NL', consentRef: 'CNS-PGMF-24410', reportType: 'Full', reportId: 'CIC-R-2026-0918-7731', ruleVersion: 'GR-2026.2', at: '2026-09-18 10:22', billable: true },
  { id: 'INQ-87002', borrowerId: 'BRW-000184', mfiId: 'MFI-002', user: 'AMM Credit Officer', purpose: 'RV', consentRef: 'CNS-AMM-11904', reportType: 'Basic', reportId: 'CIC-R-2026-0801-2210', ruleVersion: 'GR-2026.2', at: '2026-08-01 15:04', billable: true },
  { id: 'INQ-80551', borrowerId: 'BRW-000184', mfiId: 'MFI-005', user: 'SMF Loan Officer', purpose: 'NL', consentRef: 'CNS-SMF-3308', reportType: 'Full', reportId: 'CIC-R-2026-0514-0921', ruleVersion: 'GR-2026.1', at: '2026-05-14 09:47', billable: true },
  { id: 'INQ-71220', borrowerId: 'BRW-000184', mfiId: 'MFI-001', user: 'Ma Su Myat', purpose: 'GR', consentRef: 'CNS-PGMF-19002', reportType: 'Basic', reportId: 'CIC-R-2026-0110-4410', ruleVersion: 'GR-2025.4', at: '2026-01-10 11:30', billable: true },
  { id: 'INQ-88240', borrowerId: 'BRW-002331', mfiId: 'MFI-001', user: 'Ma Su Myat', purpose: 'RV', consentRef: 'CNS-PGMF-24418', reportType: 'Basic', reportId: 'CIC-R-2026-0918-7755', ruleVersion: 'GR-2026.2', at: '2026-09-18 14:02', billable: true },
];

/** Generic maker-checker queue (SEC-03). type identifies the module; payload holds the change. */
export const APPROVALS = [
  { id: 'APR-5521', type: 'Licence status', module: 'Government · Institution register', summary: 'Change Myanmar Ahtwin Microfinance: Under Review → Suspended', maker: 'Ma Thandar', makerRole: 'gov_licensing', checkerRole: 'gov_exec', status: 'Pending', createdAt: '2026-09-22 16:10', payload: { institutionId: 'MFI-006', from: 'Under Review', to: 'Suspended' } },
  { id: 'APR-5518', type: 'Role change', module: 'Admin · IAM', summary: 'Grant "Data Steward" to Ko Pyae Sone (additional role)', maker: 'Ko Htet Naing', makerRole: 'adm_security', checkerRole: 'adm_super', status: 'Pending', createdAt: '2026-09-21 11:45', payload: {} },
  { id: 'APR-5514', type: 'Rule activation', module: 'Admin · Rules', summary: 'Activate grade rule set GR-2026.3 effective 1 Oct 2026', maker: 'Ko Pyae Sone', makerRole: 'adm_steward', checkerRole: 'adm_super', status: 'Pending', createdAt: '2026-09-20 09:30', payload: { ruleSetId: 'GR-2026.3', diff: [{ field: 'GR-2026.3 status', from: 'Draft', to: 'Active from 2026-10-01' }, { field: 'GR-2026.2 status', from: 'Active', to: 'Superseded' }], effect: [{ target: 'admin', collection: 'ruleSets', op: 'patch', id: 'GR-2026.3', changes: { status: 'Active', effectiveFrom: '2026-10-01', approvedBy: 'U Soe Paing' } }, { target: 'admin', collection: 'ruleSets', op: 'patch', id: 'GR-2026.2', changes: { status: 'Superseded', supersededOn: '2026-10-01' } }] } },
  { id: 'APR-5516', type: 'Identity merge', module: 'Admin · Identity resolution', summary: 'Merge BRW-006003 (Daw San San) with BRW-010550 (San San) — similarity 81', maker: 'Ko Pyae Sone', makerRole: 'adm_steward', checkerRole: 'adm_super', status: 'Pending', createdAt: '2026-09-20 10:05', payload: { pairId: 'IDP-20902', diff: [{ field: 'IDP-20902', from: 'Pending checker', to: 'Merged' }], effect: { target: 'admin', collection: 'identityPairs', op: 'patch', id: 'IDP-20902', changes: { status: 'Merged', resolvedAt: '2026-09-20 10:05' } } } },
  { id: 'APR-5509', type: 'Config change', module: 'Admin · System', summary: 'Audit retention 3650 → 3650 days; backup frequency hourly → every 30 min', maker: 'U Soe Paing', makerRole: 'adm_super', checkerRole: 'adm_security', status: 'Pending', createdAt: '2026-09-19 17:02', payload: {} },
];

export const GRIEVANCES = [
  { id: 'GRV-2026-1102', category: 'MFI conduct', mfiId: 'MFI-006', subject: 'Aggressive collection visits at night', channel: 'Public form', status: 'Open', createdAt: '2026-09-19', sla: '2026-10-03', assignee: 'Daw Nilar Win' },
  { id: 'GRV-2026-1098', category: 'Website', mfiId: null, subject: 'Myanmar font not showing on old phone', channel: 'Public form', status: 'Resolved', createdAt: '2026-09-14', sla: '2026-09-28', assignee: 'Ma Hsu Lai' },
  { id: 'GRV-2026-1091', category: 'MFI conduct', mfiId: 'MFI-007', subject: 'MFI office closed, cannot repay loan', channel: 'Hotline', status: 'Investigating', createdAt: '2026-09-09', sla: '2026-09-23', assignee: 'Daw Nilar Win' },
  { id: 'GRV-2026-1087', category: 'Unlicensed lender', mfiId: null, subject: 'Unlicensed lender using CIC logo on Facebook', channel: 'Public form', status: 'Escalated', createdAt: '2026-09-04', sla: '2026-09-18', assignee: 'U Min Htet' },
];

export const AUDIT_LOG = [
  { id: 'AUD-900412', at: '2026-09-24 09:58:12', actor: 'Ma Su Myat', role: 'mfi_officer', tenant: 'MFI-001', ip: '103.25.12.40', action: 'INQUIRY_FULL_REPORT', module: 'Inquiry', target: 'BRW-002331', purpose: 'RV', outcome: 'Success', hash: '9f2c…a71e' },
  { id: 'AUD-900411', at: '2026-09-24 09:51:40', actor: 'Unknown', role: '—', tenant: 'MFI-002', ip: '185.220.101.7', action: 'LOGIN_FAILED', module: 'IAM', target: 'amm.admin', purpose: '—', outcome: 'Denied', hash: '41bd…09c2' },
  { id: 'AUD-900410', at: '2026-09-24 09:40:03', actor: 'Ko Thiha Aung', role: 'mfi_maker', tenant: 'MFI-001', ip: '103.25.12.41', action: 'BATCH_UPLOAD', module: 'Submission', target: 'BAT-PGMF-2026-09-A', purpose: '—', outcome: 'Success', hash: '7a90…cc13' },
  { id: 'AUD-900409', at: '2026-09-24 09:12:55', actor: 'Ma Su Myat', role: 'mfi_officer', tenant: 'MFI-001', ip: '103.25.12.40', action: 'CROSS_TENANT_READ', module: 'Inquiry', target: 'MFI-002/portfolio', purpose: '—', outcome: 'Denied', hash: 'c3e1…5f80' },
  { id: 'AUD-900408', at: '2026-09-24 08:47:21', actor: 'Daw Moe Moe', role: 'adm_publisher', tenant: 'CIC', ip: '10.10.4.22', action: 'CONTENT_PUBLISH', module: 'CMS', target: 'ANN-2026-031', purpose: '—', outcome: 'Success', hash: '22ab…e7d4' },
  { id: 'AUD-900407', at: '2026-09-24 08:30:09', actor: 'U Min Htet', role: 'gov_supervisor', tenant: 'CBM', ip: '10.20.1.15', action: 'BORROWER_DRILLDOWN', module: 'Risk Intelligence', target: 'BRW-006003', purpose: 'EWS-0192 investigation', outcome: 'Success', hash: 'e810…3b6a' },
  { id: 'AUD-900406', at: '2026-09-23 17:55:40', actor: 'U Soe Paing', role: 'adm_super', tenant: 'CIC', ip: '10.10.4.2', action: 'CONFIG_CHANGE_REQUEST', module: 'System', target: 'backup.frequency', purpose: '—', outcome: 'Pending approval', hash: '5d4f…a012' },
  { id: 'AUD-900405', at: '2026-09-23 16:20:18', actor: 'Ko Pyae Sone', role: 'adm_steward', tenant: 'CIC', ip: '10.10.4.31', action: 'MERGE_REVIEW_APPROVE', module: 'Identity Resolution', target: 'BRW-003318 ⇄ BRW-003902', purpose: '—', outcome: 'Success', hash: '0b77…d5e9' },
  { id: 'AUD-900404', at: '2026-09-23 15:02:44', actor: 'Daw Hnin Wai', role: 'borrower', tenant: 'PUBLIC', ip: '37.111.8.90', action: 'OWN_REPORT_VIEW', module: 'Borrower', target: 'BRW-000184', purpose: 'Self access', outcome: 'Success', hash: '6c1a…77b0' },
];

/**
 * Citizen accounts for the Borrower Self-Service Portal (C1 IAM, citizen realm).
 * Created by online registration after identity verification; linked to a registry borrower ID.
 */
export const ACCOUNTS = [
  { id: 'ACC-000184', borrowerId: 'BRW-000184', name: 'Daw Hnin Wai', nameMm: 'ဒေါ်နှင်းဝေ', nrc: '12/OUKAMA(N)245781', phone: '+959421005678', email: 'hnin.wai@example.mm', password: 'Cic@2026', status: 'Active', verifiedVia: 'OTP to phone on record at an MFI', createdAt: '2026-09-12 08:41', township: 'Okkalapa North', region: 'Yangon' },
  { id: 'ACC-003902', borrowerId: 'BRW-003902', name: 'Ko Aung Aung', nameMm: 'ကိုအောင်အောင်', nrc: '12/LAMANA(N)402917', phone: '+959799402917', email: '', password: 'Cic@2026', status: 'Active', verifiedVia: 'NRC + selfie eKYC', createdAt: '2026-09-15 19:02', township: 'Hlaingthaya', region: 'Yangon' },
];

/**
 * Online loan applications (Borrower portal → MFI portal). The borrower's digital consent lets the
 * chosen MFI make one purpose-bound credit inquiry for this application.
 * Status: Submitted → Credit check → Approved | Rejected → Disbursed (or Withdrawn by the applicant).
 */
export const LOAN_APPLICATIONS = [
  {
    id: 'LAP-2026-00318', borrowerId: 'BRW-003902', mfiId: 'MFI-001', product: 'Individual loan', amount: 1_000_000, tenor: 12, purpose: 'Buy a sewing machine for home tailoring work',
    applicant: { name: 'Ko Aung Aung', nrc: '12/LAMANA(N)402917', phone: '+959799402917', township: 'Hlaingthaya', occupation: 'Garment factory worker', monthlyIncome: 450_000 },
    consent: { ref: 'CNS-PGMF-24502', grantedAt: ago(5), expiresAt: inDays(30), scope: 'One credit report (Basic or Full) for this application' },
    channel: 'Borrower portal', status: 'Submitted', submittedAt: ago(5), decision: null, inquiryId: null, loanId: null,
    history: [{ at: ago(5), by: 'Ko Aung Aung', action: 'Application submitted with consent to a credit check' }],
  },
  {
    id: 'LAP-2026-00309', borrowerId: 'BRW-004777', mfiId: 'MFI-001', product: 'SME loan', amount: 2_000_000, tenor: 18, purpose: 'Expand tailoring shop stock before Thadingyut',
    applicant: { name: 'U Aung Aung', nrc: '5/MAYANA(N)077120', phone: '+959440077120', township: 'Monywa', occupation: 'Tailor', monthlyIncome: 900_000 },
    consent: { ref: 'CNS-PGMF-24477', grantedAt: ago(26), expiresAt: inDays(29), scope: 'One credit report (Basic or Full) for this application' },
    channel: 'Branch (assisted)', status: 'Credit check', submittedAt: ago(26), decision: null, inquiryId: 'INQ-88190', loanId: null,
    history: [
      { at: ago(26), by: 'PGMF Monywa branch', action: 'Application captured at branch with signed consent' },
      { at: ago(22), by: 'Ma Su Myat (PGMF)', action: 'Full report purchased — grade A' },
    ],
  },
  {
    id: 'LAP-2026-00144', borrowerId: 'BRW-000184', mfiId: 'MFI-001', product: 'Group loan', amount: 1_200_000, tenor: 12, purpose: 'Grocery shop working capital',
    applicant: { name: 'Daw Hnin Wai', nrc: '12/OUKAMA(N)245781', phone: '+959421005678', township: 'Okkalapa North', occupation: 'Grocery shop owner', monthlyIncome: 800_000 },
    consent: { ref: 'CNS-PGMF-20931', grantedAt: '2026-03-25 09:30', expiresAt: '2026-04-24', scope: 'One credit report (Basic or Full) for this application' },
    channel: 'Borrower portal', status: 'Disbursed', submittedAt: '2026-03-25 09:30',
    decision: { by: 'Ma Su Myat', at: '2026-03-27 14:10', outcome: 'Approved', approvedAmount: 1_200_000, rate: 28, tenor: 12, note: 'Good repayment history' },
    inquiryId: 'INQ-61220', loanId: 'PGMF-LN-118830',
    history: [
      { at: '2026-03-25 09:30', by: 'Daw Hnin Wai', action: 'Application submitted with consent to a credit check' },
      { at: '2026-03-26 11:02', by: 'Ma Su Myat (PGMF)', action: 'Credit check completed — grade B' },
      { at: '2026-03-27 14:10', by: 'Ma Su Myat (PGMF)', action: 'Approved: 1,200,000 MMK, 12 months, 28% p.a.' },
      { at: '2026-04-02 10:00', by: 'PGMF Okkalapa branch', action: 'Loan disbursed — PGMF-LN-118830, reported to CIC' },
    ],
  },
];

/** Loans reported after the monthly registry load (e.g. disbursed from an online application). */
export const REPORTED_LOANS = [];

/** Reasons an MFI can give when declining — shown to the applicant in plain language. */
export const DECLINE_REASONS = [
  { code: 'L01', label: 'Existing debt too high for your income' },
  { code: 'L02', label: 'Recent late payments on another loan' },
  { code: 'L03', label: 'Too many active loans at the same time' },
  { code: 'L04', label: 'Incomplete or unverifiable information' },
  { code: 'L05', label: 'Outside our service area or product rules' },
];

/** Outgoing SMS / email log (C10 Notification). Registration sends sign-in details here. */
export const OUTBOX = [
  { id: 'MSG-SEED-0913', kind: 'report-ready', channel: 'SMS', to: '+959421005678', accountId: 'ACC-000184', sentAt: '2026-09-13T10:20:00.000Z', status: 'Delivered', body: 'CIC Myanmar: your credit report CIC-P-260913-4417 is ready. Sign in at cic.gov.mm/login to view it. Valid until 2026-10-13.' },
];

/**
 * Personal credit report requests (Borrower portal → CIC back office). Seeded with one issued report
 * for Daw Hnin Wai and one request waiting for review; Ko Aung Aung has not requested yet.
 */
import { generateReportSnapshot as _snapshot, runAutomatedChecks as _checks } from '@/lib/reportRequests';
import { getBorrowerFile as _file } from '@/data/registry';

const _hninFile = _file('BRW-000184', { accounts: ACCOUNTS });
const _hninResult = { ..._snapshot({ file: _hninFile, inquiries: INQUIRIES.filter((i) => i.at < '2026-09-13'), disputes: DISPUTES, requestId: 'CRQ-2026-00871', generatedAt: '2026-09-13T10:20:00.000Z' }), reportId: 'CIC-P-260913-4417', verificationCode: '615204' };

/** Local 'YYYY-MM-DD HH:mm' a few hours ago, so the seeded review item is always fresh in the queue. */
const _hoursAgo = (h) => { const d = new Date(Date.now() - h * 3600000); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };

export const REPORT_REQUESTS = [
  {
    id: 'CRQ-2026-00871', borrowerId: 'BRW-000184', accountId: 'ACC-000184', name: 'Daw Hnin Wai', nrc: '12/OUKAMA(N)245781',
    purpose: 'Preparing to apply for a loan', notify: 'SMS', fee: 0, status: 'Ready', submittedAt: '2026-09-12 20:05',
    checks: _checks({ file: _hninFile, account: ACCOUNTS[0], disputes: DISPUTES, requests: [] }),
    reviewedBy: 'Ma Hsu Lai', reviewedAt: '2026-09-13 10:20', result: _hninResult,
    history: [
      { at: '2026-09-12 20:05', by: 'Daw Hnin Wai', action: 'Report requested (free annual report)' },
      { at: '2026-09-12 20:05', by: 'CIC system', action: 'Automated validation completed — 1 warning (record under dispute)' },
      { at: '2026-09-13 10:20', by: 'Ma Hsu Lai (CIC)', action: 'Approved — report CIC-P-260913-4417 issued' },
      { at: '2026-09-13 10:20', by: 'CIC system', action: 'SMS sent: your credit report is ready' },
    ],
  },
  {
    id: 'CRQ-2026-00894', borrowerId: 'BRW-004777', accountId: null, name: 'U Aung Aung', nrc: '5/MAYANA(N)077120',
    purpose: 'Check my own record', notify: 'SMS', fee: 0, status: 'Pending review', submittedAt: _hoursAgo(3),
    checks: [
      { id: 'identity', label: 'Identity matched to CIC file', result: 'pass', detail: 'NRC 5/MAYANA(N)077120 → file BRW-004777, verified at a branch (activation code).' },
      { id: 'freshness', label: 'Latest data received from every lender', result: 'pass', detail: '1 lender(s) reported up to 2026-08-31.' },
      { id: 'disputes', label: 'Records under dispute', result: 'pass', detail: 'None.' },
      { id: 'corrections', label: 'Pending data corrections', result: 'pass', detail: 'None.' },
      { id: 'quota', label: 'Free annual report available', result: 'pass', detail: '1 free report left for the last 12 months.' },
    ],
    reviewedBy: null, reviewedAt: null, result: null,
    history: [
      { at: _hoursAgo(3), by: 'U Aung Aung', action: 'Report requested at a branch counter (free annual report)' },
      { at: _hoursAgo(3), by: 'CIC system', action: 'Automated validation completed — no issues' },
    ],
  },
];

/** Report purchases by institutions (pay-per-report: Basic USD 2, Full USD 4; shared across the institution for 30 days). */
export const REPORT_PURCHASES = [
  { id: 'RPU-2026-00009', mfiId: 'MFI-001', borrowerId: 'BRW-004777', tier: 'Full', price: 4, currency: 'USD', purchasedBy: 'Ma Su Myat', purchasedByRole: 'mfi_officer', at: '2026-09-20 09:15', validUntil: '2026-10-20', purpose: 'NL', consentRef: 'CNS-PGMF-24477', inquiryId: 'INQ-88190', applicationId: 'LAP-2026-00309', billing: 'Invoiced monthly' },
  { id: 'RPU-2026-00010', mfiId: 'MFI-001', borrowerId: 'BRW-002331', tier: 'Basic', price: 2, currency: 'USD', purchasedBy: 'Ma Su Myat', purchasedByRole: 'mfi_officer', at: '2026-09-18 14:02', validUntil: '2026-10-18', purpose: 'RV', consentRef: 'CNS-PGMF-24418', inquiryId: 'INQ-88240', applicationId: null, billing: 'Invoiced monthly' },
  { id: 'RPU-2026-00011', mfiId: 'MFI-001', borrowerId: 'BRW-000184', tier: 'Full', price: 4, currency: 'USD', purchasedBy: 'Ma Su Myat', purchasedByRole: 'mfi_officer', at: '2026-09-18 10:22', validUntil: '2026-10-18', purpose: 'NL', consentRef: 'CNS-PGMF-24410', inquiryId: 'INQ-88213', applicationId: null, billing: 'Invoiced monthly' },
  { id: 'RPU-2026-00012', mfiId: 'MFI-002', borrowerId: 'BRW-000184', tier: 'Basic', price: 2, currency: 'USD', purchasedBy: 'AMM Credit Officer', purchasedByRole: 'mfi_officer', at: '2026-08-01 15:04', validUntil: '2026-08-31', purpose: 'RV', consentRef: 'CNS-AMM-11904', inquiryId: 'INQ-87002', applicationId: null, billing: 'Invoiced monthly' },
];
