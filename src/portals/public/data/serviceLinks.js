/** Where each service is used (CTA to the right portal) and its related FAQ entries (PUB-02, PUB-14). */
export const SERVICE_LINKS = {
  'credit-data-reporting': { cta: { label: 'MFI Member Portal (staff only)', to: '/workspace/login' }, faqs: ['FAQ-08'] },
  'credit-report-basic': { cta: { label: 'MFI Member Portal (staff only)', to: '/workspace/login' }, faqs: ['FAQ-01', 'FAQ-06'] },
  'credit-report-full': { cta: { label: 'MFI Member Portal (staff only)', to: '/workspace/login' }, faqs: ['FAQ-01', 'FAQ-06'] },
  'risk-grade': { cta: { label: 'MFI Member Portal (staff only)', to: '/workspace/login' }, faqs: ['FAQ-03'] },
  'personal-credit-report': { cta: { label: 'Check my credit report', to: '/my-credit', warm: true }, faqs: ['FAQ-02', 'FAQ-03', 'FAQ-06'] },
  'dispute-correction': { cta: { label: 'File a dispute in the Borrower portal', to: '/borrower/disputes/new', warm: true }, faqs: ['FAQ-04', 'FAQ-05'] },
  'mfi-directory': { cta: { label: 'Search the MFI Directory', to: '/mfi-directory' }, faqs: ['FAQ-09'] },
  'report-verification': { cta: { label: 'Verify a report', to: '/verify' }, faqs: [] },
  'portfolio-monitoring': { cta: { label: 'MFI Member Portal (staff only)', to: '/workspace/login' }, faqs: [] },
  'supervisory-analytics': { cta: { label: 'Government Portal (staff only)', to: '/workspace/login' }, faqs: [] },
  'open-data': { cta: { label: 'Open Statistics', to: '/statistics' }, faqs: [] },
  'financial-literacy': { cta: { label: 'Browse publications', to: '/publications' }, faqs: ['FAQ-01', 'FAQ-04'] },
  'alternative-data': { cta: { label: 'Read the FAQ', to: '/help' }, faqs: ['FAQ-06'] },
};
