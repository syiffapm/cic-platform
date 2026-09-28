/** Portal 5 CMS mock data: media, navigation, targeted notices, forms, global settings, analytics (CMS-08…16). */

export const MEDIA_LIMITS = { image: 10, pdf: 25 }; // MB

export const MEDIA = [
  { id: 'MED-1041', name: 'cic-hero-yangon.jpg', type: 'image', sizeMb: 2.4, altEn: 'CIC staff assisting a borrower at the Yangon help desk', altMm: 'ရန်ကုန် အကူအညီဌာနတွင် CIC ဝန်ထမ်းက ချေးငွေယူသူကို ကူညီနေပုံ', scan: 'Clean', usage: 3, uploadedBy: 'Ma Yamin', uploadedAt: '2026-09-18 10:12' },
  { id: 'MED-1042', name: 'annual-report-2025.pdf', type: 'pdf', sizeMb: 18.6, altEn: 'CIC Annual Report 2025 (PDF)', altMm: 'CIC နှစ်ပတ်လည်အစီရင်ခံစာ ၂၀၂၅', scan: 'Clean', usage: 2, uploadedBy: 'Daw Moe Moe', uploadedAt: '2026-08-30 15:40' },
  { id: 'MED-1043', name: 'statistical-bulletin-q2-2026.pdf', type: 'pdf', sizeMb: 6.2, altEn: 'Statistical bulletin Q2 2026', altMm: 'စာရင်းအင်း သတင်းလွှာ Q2 ၂၀၂၆', scan: 'Clean', usage: 1, uploadedBy: 'Ma Yamin', uploadedAt: '2026-09-02 09:05' },
  { id: 'MED-1044', name: 'how-it-works-steps.png', type: 'image', sizeMb: 0.8, altEn: 'Four steps: MFI reports, CIC validates, inquiry with consent, borrower checks', altMm: 'အဆင့်လေးဆင့် ပုံကြမ်း', scan: 'Clean', usage: 1, uploadedBy: 'Ma Yamin', uploadedAt: '2026-07-14 11:22' },
  { id: 'MED-1045', name: 'cbm-logo-footer.svg', type: 'image', sizeMb: 0.1, altEn: 'Central Bank of Myanmar logo', altMm: 'မြန်မာနိုင်ငံတော်ဗဟိုဘဏ် တံဆိပ်', scan: 'Clean', usage: 12, uploadedBy: 'U Soe Paing', uploadedAt: '2026-01-05 08:30' },
  { id: 'MED-1046', name: 'dispute-guideline-2026.pdf', type: 'pdf', sizeMb: 1.9, altEn: 'Borrower dispute guideline 2026', altMm: 'အငြင်းပွားမှု လမ်းညွှန် ၂၀၂၆', scan: 'Quarantined', usage: 0, uploadedBy: 'Ma Yamin', uploadedAt: '2026-09-24 16:48' },
  { id: 'MED-1047', name: 'mfi-directory-banner.jpg', type: 'image', sizeMb: 3.1, altEn: 'Map of Myanmar with licensed MFI branch locations', altMm: 'လိုင်စင်ရ MFI ရုံးခွဲများ မြေပုံ', scan: 'Clean', usage: 0, uploadedBy: 'Daw Moe Moe', uploadedAt: '2026-09-10 13:15' },
  { id: 'MED-1048', name: 'privacy-notice-v3.pdf', type: 'pdf', sizeMb: 0.6, altEn: 'Privacy notice version 3', altMm: 'ကိုယ်ရေးအချက်အလက် ကာကွယ်မှု သတိပေးချက် ဗားရှင်း ၃', scan: 'Clean', usage: 4, uploadedBy: 'U Nay Lin', uploadedAt: '2026-06-21 10:00' },
];

export const LANDING_BLOCKS = [
  { id: 'header', label: 'Government header', detail: 'CBM/CIC logos, EN/MM switch, accessibility toolbar, search', visible: true, locked: true },
  { id: 'hero', label: 'Hero', detail: 'Mission + CTAs "Check my credit report", "Find a licensed MFI"', visible: true },
  { id: 'services', label: 'Service catalogue', detail: 'Service cards linking to service detail pages', visible: true },
  { id: 'stats', label: 'Key statistics', detail: 'Reporting MFIs, borrowers covered, townships, reports issued (as-of date)', visible: true },
  { id: 'announcements', label: 'Latest announcements', detail: '3 newest public notices', visible: true },
  { id: 'how', label: 'How it works', detail: 'MFI reports → CIC validates → inquiry with consent → borrower checks and disputes', visible: true },
  { id: 'rights', label: 'Know your rights', detail: 'Borrower rights, dispute timeline, privacy notice', visible: true },
  { id: 'publications', label: 'Publications', detail: 'Annual report, statistical bulletin, regulations, guidelines', visible: true },
  { id: 'help', label: 'Help', detail: 'FAQ, AI assistant, helpdesk contacts, grievance form', visible: true },
  { id: 'footer', label: 'Footer', detail: 'Legal notices, privacy, accessibility statement, sitemap, last updated', visible: true, locked: true },
];

export const MENU_ITEMS = [
  { id: 'MN-1', en: 'Home', mm: 'ပင်မစာမျက်နှာ', link: '/' },
  { id: 'MN-2', en: 'Services', mm: 'ဝန်ဆောင်မှုများ', link: '/services' },
  { id: 'MN-3', en: 'MFI directory', mm: 'MFI လမ်းညွှန်', link: '/directory' },
  { id: 'MN-4', en: 'Announcements', mm: 'ကြေညာချက်များ', link: '/announcements' },
  { id: 'MN-5', en: 'Publications', mm: 'ထုတ်ဝေမှုများ', link: '/publications' },
  { id: 'MN-6', en: 'Help & FAQ', mm: 'အကူအညီ', link: '/faq' },
];

export const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];

/** acks: { [mfiId]: { readAt, by, ackAt } } */
export const NOTICES = [
  { id: 'TN-2031', title: 'Mandatory NRC format change for October submissions', body: 'From the October 2026 reporting cycle, NRC numbers must use the Unicode format 12/OUKAMA(N)245781. Legacy Zawgyi values will be rejected at validation.', tiers: ['Tier 1', 'Tier 2', 'Tier 3'], regions: [], due: '2026-09-30', sentAt: '2026-09-15 09:00', sentBy: 'Daw Moe Moe',
    acks: { 'MFI-001': { readAt: '2026-09-15 10:02', by: 'Daw Khin Myat (Compliance)', ackAt: '2026-09-15 10:05' }, 'MFI-002': { readAt: '2026-09-16 08:44', by: 'U Kyaw Zin', ackAt: '2026-09-16 09:10' }, 'MFI-003': { readAt: '2026-09-15 14:20', by: 'Ma Thiri', ackAt: '2026-09-17 11:00' }, 'MFI-005': { readAt: '2026-09-18 13:30', by: 'Ko Aung Min', ackAt: '2026-09-18 13:31' }, 'MFI-008': { readAt: '2026-09-20 09:15' }, 'MFI-012': { readAt: '2026-09-16 16:00', by: 'Daw Nwe Nwe', ackAt: '2026-09-16 16:12' } } },
  { id: 'TN-2027', title: 'Tier 3 capital adequacy data call — Q3 2026', body: 'Tier 3 institutions must upload the capital adequacy template by 20 September 2026.', tiers: ['Tier 3'], regions: [], due: '2026-09-20', sentAt: '2026-09-05 11:30', sentBy: 'U Soe Paing',
    acks: { 'MFI-009': { readAt: '2026-09-06 09:00', by: 'U Min Thu', ackAt: '2026-09-06 09:20' }, 'MFI-010': { readAt: '2026-09-12 10:10' } } },
  { id: 'TN-2019', title: 'Ayeyarwady flood relief: repayment reporting guidance', body: 'Rescheduled loans in flood-affected townships must be flagged with restructure code R2.', tiers: [], regions: ['Ayeyarwady'], due: '2026-10-05', sentAt: '2026-09-22 15:00', sentBy: 'Daw Moe Moe',
    acks: { 'MFI-003': { readAt: '2026-09-22 16:40', by: 'Ma Thiri', ackAt: '2026-09-23 09:00' } } },
];

export const FIELD_TYPES = ['text', 'textarea', 'select', 'radio', 'file', 'date'];

export const FORMS = [
  { id: 'FRM-GRV', name: 'Grievance form', kind: 'Grievance', status: 'Published', submissions: 412, version: 4,
    routing: { queue: 'Helpdesk · Grievances', slaDays: 15, autoAck: true },
    fields: [
      { id: 'f1', en: 'Full name', mm: 'အမည်အပြည့်အစုံ', type: 'text', required: true, options: [] },
      { id: 'f2', en: 'Phone number', mm: 'ဖုန်းနံပါတ်', type: 'text', required: true, options: [] },
      { id: 'f3', en: 'Complaint about', mm: 'တိုင်ကြားသည့် အကြောင်းအရာ', type: 'select', required: true, options: ['CIC service', 'An MFI', 'My credit report', 'Other'] },
      { id: 'f4', en: 'Describe your grievance', mm: 'အသေးစိတ် ဖော်ပြပါ', type: 'textarea', required: true, options: [] },
      { id: 'f5', en: 'Supporting document (PDF/JPG ≤ 5 MB)', mm: 'အထောက်အထား', type: 'file', required: false, options: [] },
    ] },
  { id: 'FRM-FBK', name: 'Website feedback', kind: 'Feedback', status: 'Published', submissions: 1286, version: 2,
    routing: { queue: 'Helpdesk · General', slaDays: 5, autoAck: true },
    fields: [
      { id: 'f1', en: 'Was this page useful?', mm: 'ဤစာမျက်နှာ အသုံးဝင်ပါသလား', type: 'radio', required: true, options: ['Yes', 'Partly', 'No'] },
      { id: 'f2', en: 'Comments', mm: 'မှတ်ချက်', type: 'textarea', required: false, options: [] },
    ] },
  { id: 'FRM-SRV', name: 'Borrower awareness survey 2026', kind: 'Survey', status: 'Draft', submissions: 87, version: 1,
    routing: { queue: 'Helpdesk · Research', slaDays: 30, autoAck: false },
    fields: [
      { id: 'f1', en: 'Region', mm: 'တိုင်းဒေသကြီး/ပြည်နယ်', type: 'select', required: true, options: ['Yangon', 'Mandalay', 'Ayeyarwady', 'Shan', 'Other'] },
      { id: 'f2', en: 'Did you know you can check your own credit report?', mm: '', type: 'radio', required: true, options: ['Yes', 'No'] },
      { id: 'f3', en: 'Date of last loan', mm: 'နောက်ဆုံးချေးငွေ ရက်စွဲ', type: 'date', required: false, options: [] },
    ] },
];

export const SUBMISSIONS = [
  { id: 'SUB-88412', form: 'FRM-GRV', at: '2026-09-25 08:41', summary: 'MFI charged extra fee for report copy', township: 'Hlaingthaya', ticket: 'HD-24518', status: 'Open' },
  { id: 'SUB-88409', form: 'FRM-GRV', at: '2026-09-24 17:05', summary: 'Wrong loan balance shown by Golden Delta', township: 'Hinthada', ticket: 'HD-24511', status: 'In review' },
  { id: 'SUB-88401', form: 'FRM-FBK', at: '2026-09-24 14:22', summary: 'Partly — Myanmar font too small on mobile', township: 'Mandalay', ticket: 'HD-24503', status: 'Resolved' },
  { id: 'SUB-88397', form: 'FRM-GRV', at: '2026-09-24 10:18', summary: 'Could not activate account with OTP', township: 'Monywa', ticket: 'HD-24498', status: 'Resolved' },
  { id: 'SUB-88390', form: 'FRM-SRV', at: '2026-09-23 19:47', summary: 'Survey response (Ayeyarwady)', township: 'Pathein', ticket: 'HD-24490', status: 'Closed' },
  { id: 'SUB-88386', form: 'FRM-FBK', at: '2026-09-23 12:30', summary: 'Yes — directory search helpful', township: 'Taunggyi', ticket: 'HD-24485', status: 'Closed' },
];

export const GLOBAL_SETTINGS = {
  primaryLogo: 'cic-logo-primary.svg',
  footerLogo: 'cbm-logo-footer.svg',
  hotline: '1800-CIC-MM (+95 1 230 5000)',
  email: 'helpdesk@cic.cbm.gov.mm',
  addressEn: 'Central Bank of Myanmar, Office No. 55, Yaza Thingaha Road, Nay Pyi Taw',
  addressMm: 'မြန်မာနိုင်ငံတော်ဗဟိုဘဏ်၊ ရုံးအမှတ် ၅၅၊ ရာဇသင်္ဂဟလမ်း၊ နေပြည်တော်',
  officeHours: 'Mon–Fri 09:30–16:30 (closed on public holidays)',
  footerLinks: 'Privacy notice|/privacy\nAccessibility statement|/accessibility\nTerms of use|/terms\nSitemap|/sitemap.xml',
  facebook: 'https://facebook.com/cicmyanmar',
  viber: 'viber://pa?chatURI=cicmyanmar',
  youtube: 'https://youtube.com/@cicmyanmar',
  telegram: 'https://t.me/cicmyanmar',
  bannerOn: false,
  bannerSeverity: 'Warning',
  bannerEn: 'Scheduled maintenance: Borrower portal unavailable Sat 27 Sep 22:00–02:00.',
  bannerMm: 'စနစ်ပြုပြင်ထိန်းသိမ်းမှု - စက်တင်ဘာ ၂၇ စနေ ၂၂:၀၀–၀၂:၀၀ တွင် ချေးငွေယူသူ ပေါ်တယ် ရပ်နားမည်။',
};

export const VIEWS_TREND = [
  { week: '28 Jul', en: 18200, mm: 26400 }, { week: '04 Aug', en: 19100, mm: 28900 }, { week: '11 Aug', en: 17600, mm: 27300 },
  { week: '18 Aug', en: 20400, mm: 31200 }, { week: '25 Aug', en: 22800, mm: 34600 }, { week: '01 Sep', en: 21900, mm: 35800 },
  { week: '08 Sep', en: 23500, mm: 38100 }, { week: '15 Sep', en: 24700, mm: 40200 }, { week: '22 Sep', en: 25300, mm: 41900 },
];

export const TOP_PAGES = [
  { id: 'p1', path: '/', title: 'Home', views: 58420, avgSec: 74, bounce: 38 },
  { id: 'p2', path: '/directory', title: 'MFI directory', views: 31280, avgSec: 142, bounce: 22 },
  { id: 'p3', path: '/services/credit-report', title: 'Check my credit report', views: 24610, avgSec: 118, bounce: 29 },
  { id: 'p4', path: '/faq', title: 'FAQ', views: 17940, avgSec: 96, bounce: 31 },
  { id: 'p5', path: '/verify', title: 'Report authenticity check', views: 9820, avgSec: 51, bounce: 44 },
  { id: 'p6', path: '/announcements', title: 'Announcements', views: 8730, avgSec: 63, bounce: 47 },
  { id: 'p7', path: '/publications', title: 'Publications', views: 5410, avgSec: 88, bounce: 35 },
];

export const NO_RESULT_SEARCHES = [
  { id: 's1', term: 'loan interest rate cap', count: 342, action: 'Create FAQ' },
  { id: 's2', term: 'ချေးငွေ အတိုးနှုန်း', count: 287, action: 'Create FAQ (MM)' },
  { id: 's3', term: 'delete my credit history', count: 164, action: 'Link to Know your rights' },
  { id: 's4', term: 'Zawgyi NRC', count: 118, action: 'Add synonym → NRC format' },
  { id: 's5', term: 'mobile money loan', count: 96, action: 'Review glossary' },
  { id: 's6', term: 'CIC office Mandalay', count: 71, action: 'Add office contact page' },
];

/** Mock not-helpful votes for store FAQs (keyed by FAQ id). */
export const FAQ_NOT_HELPFUL = { 'FAQ-01': 12, 'FAQ-02': 41, 'FAQ-03': 9, 'FAQ-04': 33, 'FAQ-05': 4, 'FAQ-06': 18, 'FAQ-07': 22, 'FAQ-08': 15, 'FAQ-09': 11, 'FAQ-10': 7 };
