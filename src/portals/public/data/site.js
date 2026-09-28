/** Public-portal content blocks (CMS-managed in production — A2 CMS / CMS-14 global settings). */
export const LAST_UPDATED = '2026-09-24';

export const HELPDESK = [
  { id: 'hotline', label: 'Borrower hotline', value: '1800 242 242', href: 'tel:1800242242', hours: 'Mon–Fri 9:00–17:00, free call' },
  { id: 'email', label: 'Helpdesk email', value: 'helpdesk@cic.cbm.gov.mm', href: 'mailto:helpdesk@cic.cbm.gov.mm', hours: 'Reply within 2 working days' },
  { id: 'mfi', label: 'MFI support desk', value: '+95 1 9 380 544', href: 'tel:+9519380544', hours: 'Mon–Fri 8:30–17:30' },
  { id: 'office', label: 'Visit us', value: 'CIC Office, Central Bank of Myanmar, Office No. 55, Nay Pyi Taw', href: null, hours: 'Mon–Fri 9:30–16:00' },
];

export const HOW_IT_WORKS = [
  { icon: 'Upload', title: 'MFIs report', text: 'Licensed microfinance institutions submit loan and repayment data every month.' },
  { icon: 'ShieldCheck', title: 'CIC validates', text: 'Data is checked for quality, matched to the right person and loaded to the registry.' },
  { icon: 'FileSearch', title: 'Inquiry with consent', text: 'A lender can see your report only with your consent and a stated purpose.' },
  { icon: 'UserCheck', title: 'You check and dispute', text: 'You can see your own report, who viewed it, and dispute anything that is wrong — for free.' },
];

export const RIGHTS = [
  { title: 'See your own report', text: 'One free report every 12 months through the Borrower Self-Service Portal.' },
  { title: 'Know who looked', text: 'Every lender that viewed your report, when, and for what purpose.' },
  { title: 'Correct mistakes', text: 'File a dispute free of charge. The MFI must respond in 10 working days; CIC resolves within 30 days.' },
  { title: 'Consent comes first', text: 'Lenders need your consent and a valid purpose before they search your record.' },
];

export const GRIEVANCE_CATEGORIES = ['MFI conduct', 'Unlicensed lender', 'Credit report', 'Data privacy', 'Website', 'Other feedback'];
export const GRIEVANCE_SLA_DAYS = 14;

/** Published aggregates not held in the KPI dictionary (approved via GOV-18 before publishing). */
export const TOWNSHIPS_COVERED = 238;
