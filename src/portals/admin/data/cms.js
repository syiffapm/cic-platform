/**
 * Portal-local CMS content (CMS-01). Announcements live in the shared store (they feed the
 * Public / MFI / Regulator portals); every other content type is kept here.
 */

export const CONTENT_TYPES = [
  { id: 'page', label: 'Page' },
  { id: 'service', label: 'Service' },
  { id: 'announcement', label: 'Announcement' },
  { id: 'news', label: 'News' },
  { id: 'faq', label: 'FAQ' },
  { id: 'publication', label: 'Publication' },
  { id: 'banner', label: 'Banner' },
  { id: 'statistic', label: 'Statistic block' },
  { id: 'glossary', label: 'Glossary term' },
  { id: 'contact', label: 'Contact / office' },
];

export const typeLabel = (id) => CONTENT_TYPES.find((t) => t.id === id)?.label ?? id;

export const WORKFLOW = ['Draft', 'In review', 'Approved', 'Scheduled', 'Published', 'Archived'];

export const CLASSIFICATIONS = [
  { value: 'Public', label: 'Public', help: 'Visible on the Public portal, Borrower portal and public API.' },
  { value: 'MFI-only', label: 'MFI-only', help: 'Only signed-in reporting institutions (MFI portal) and CIC / regulator staff.' },
  { value: 'Regulator-only', label: 'Regulator-only', help: 'Only CBM / FRD supervisors and CIC staff in the Government Portal.' },
  { value: 'Internal', label: 'Internal', help: 'CIC staff in the Government Portal (Content management) only.' },
];

export const CLASSIFICATION_TONES = { Public: 'green', 'MFI-only': 'blue', 'Regulator-only': 'violet', Internal: 'red' };

export const CATEGORIES = ['Regulation', 'Service', 'Operations', 'Statistics', 'Supervision', 'Internal', 'Consumer education', 'Corporate', 'Contact'];

export const CMS_SETTINGS = { blockPublishIfMmMissing: true };

/** Fields captured in every version snapshot and compared in the diff view (CMS-06). */
export const SNAPSHOT_FIELDS = ['title', 'body', 'category', 'classification', 'status', 'slug', 'seo', 'scheduleAt', 'expiresAt', 'pinned'];

export const slugify = (s) => (s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 70);

export const snapshotOf = (item) => JSON.parse(JSON.stringify(Object.fromEntries(SNAPSHOT_FIELDS.map((k) => [k, item[k] ?? null]))));

/** Builds a seed item whose version history replays `history` ([at, by, note, overrides]) up to the current state. */
function seed(base, history) {
  const item = {
    classification: 'Public', category: 'Corporate', pinned: false, scheduleAt: null, expiresAt: null, approver: null,
    seo: { meta: '', ogImage: '' }, ...base,
  };
  item.slug = item.slug ?? slugify(item.title.en);
  const current = snapshotOf(item);
  item.versions = history.map(([at, by, note, overrides = {}], i) => ({
    version: i + 1, at, by, note,
    snapshot: i === history.length - 1 ? current : { ...current, ...JSON.parse(JSON.stringify(overrides)) },
  }));
  const last = history[history.length - 1];
  item.updatedAt = item.updatedAt ?? last[0];
  item.lastEditor = item.lastEditor ?? history.filter((h) => !/approved|published|scheduled|archived/i.test(h[2])).pop()?.[1] ?? item.author;
  item.enUpdatedAt = item.enUpdatedAt ?? last[0];
  item.mmUpdatedAt = item.mmUpdatedAt ?? (item.body.mm ? last[0] : null);
  return item;
}

const t = (en, mm = '') => ({ en, mm });

export const CMS_ITEMS = [
  seed({ id: 'CMS-P01', type: 'page', title: t('About the Credit Information Centre', 'ချေးငွေသတင်းအချက်အလက်စင်တာ အကြောင်း'), body: t('The Credit Information Centre (CIC) collects loan data from licensed microfinance institutions under the supervision of the Financial Regulatory Department, and provides credit reports to lenders and borrowers.', 'ချေးငွေသတင်းအချက်အလက်စင်တာ (CIC) သည် လိုင်စင်ရ အသေးစားငွေရေးအဖွဲ့များထံမှ ချေးငွေအချက်အလက်များကို စုဆောင်းပြီး ချေးငွေအစီရင်ခံစာများ ထုတ်ပေးသည်။'), status: 'Published', author: 'Ma Yamin', approver: 'Daw Moe Moe', publishedAt: '2026-06-02', seo: { meta: 'What the Myanmar Credit Information Centre does, who supervises it and how it protects borrower data.', ogImage: 'og-about-cic.png' } }, [
    ['2026-05-20 10:14', 'Ma Yamin', 'First draft', { title: t('About CIC'), body: t('CIC collects loan data from MFIs.'), status: 'Draft' }],
    ['2026-05-28 15:02', 'Ma Yamin', 'Added Myanmar translation', { status: 'In review' }],
    ['2026-06-02 09:30', 'Daw Moe Moe', 'Approved and published'],
  ]),
  seed({ id: 'CMS-P02', type: 'page', title: t('Privacy notice', 'ကိုယ်ရေးအချက်အလက် လုံခြုံမှု အသိပေးချက်'), body: t('We process borrower data only for credit reporting purposes permitted by the CBM Directive. Borrowers may request access, correction and a record of who viewed their report. Retention: 5 years after loan closure.', 'ချေးငွေအစီရင်ခံခြင်း ရည်ရွယ်ချက်အတွက်သာ ချေးငွေယူသူ၏ အချက်အလက်များကို အသုံးပြုသည်။'), status: 'In review', author: 'Ma Yamin', enUpdatedAt: '2026-09-23 11:20', mmUpdatedAt: '2026-08-14 10:00' }, [
    ['2026-08-14 10:00', 'Ma Yamin', 'Initial version', { body: t('We process borrower data only for credit reporting purposes.', 'ချေးငွေအစီရင်ခံခြင်း ရည်ရွယ်ချက်အတွက်သာ ချေးငွေယူသူ၏ အချက်အလက်များကို အသုံးပြုသည်။'), status: 'Published' }],
    ['2026-09-23 11:20', 'Ma Yamin', 'Added retention period (EN only)', { status: 'Draft' }],
    ['2026-09-23 11:25', 'Ma Yamin', 'Submitted for review'],
  ]),
  seed({ id: 'CMS-S01', type: 'service', category: 'Service', title: t('Check your own credit report', 'သင်၏ ချေးငွေအစီရင်ခံစာကို စစ်ဆေးပါ'), body: t('Register with your NRC and mobile number, verify your identity and download your report. The first report every 12 months is free.', 'မှတ်ပုံတင်နှင့် ဖုန်းနံပါတ်ဖြင့် စာရင်းသွင်းပြီး အစီရင်ခံစာကို ရယူပါ။ ၁၂ လတစ်ကြိမ် အခမဲ့ ဖြစ်သည်။'), status: 'Published', pinned: true, author: 'Ko Zaw Lin', approver: 'Daw Moe Moe', publishedAt: '2026-09-12' }, [
    ['2026-09-02 13:40', 'Ko Zaw Lin', 'Draft created', { status: 'Draft', pinned: false }],
    ['2026-09-10 16:05', 'Ma Yamin', 'Copy edit, featured on landing page', { status: 'In review' }],
    ['2026-09-12 08:55', 'Daw Moe Moe', 'Approved and published'],
  ]),
  seed({ id: 'CMS-S02', type: 'service', category: 'Service', classification: 'MFI-only', title: t('Data submission via REST API'), body: t('Reporting institutions can submit daily loan files through the mutual-TLS API. Batches are validated against schema v3.2 and results returned within 15 minutes.'), status: 'Published', author: 'Ma Yamin', approver: 'U Soe Paing', publishedAt: '2026-08-21' }, [
    ['2026-08-18 09:12', 'Ma Yamin', 'Draft created', { status: 'Draft' }],
    ['2026-08-21 14:30', 'U Soe Paing', 'Approved and published (MM waiver: technical audience)'],
  ]),
  seed({ id: 'CMS-N01', type: 'news', category: 'Corporate', title: t('CIC signs data-sharing MoU with Myanmar Microfinance Association', 'CIC နှင့် မြန်မာအသေးစားငွေရေးအသင်း နားလည်မှုစာချွန်လွှာ လက်မှတ်ရေးထိုး'), body: t('The MoU sets out joint borrower-education activities in 40 townships and a quarterly data-quality forum.', 'မြို့နယ် ၄၀ တွင် ချေးငွေယူသူ ပညာပေးလုပ်ငန်းများ ပူးတွဲဆောင်ရွက်မည်။'), status: 'Published', author: 'Ko Zaw Lin', approver: 'Daw Moe Moe', publishedAt: '2026-09-09', seo: { meta: 'CIC and MMFA agree on borrower education and data-quality cooperation.', ogImage: 'og-mou-mmfa.jpg' } }, [
    ['2026-09-08 11:00', 'Ko Zaw Lin', 'Draft created', { status: 'Draft' }],
    ['2026-09-08 17:45', 'Ko Zaw Lin', 'Submitted for review', { status: 'In review' }],
    ['2026-09-09 09:10', 'Daw Moe Moe', 'Approved and published'],
  ]),
  seed({ id: 'CMS-N02', type: 'news', category: 'Consumer education', title: t('Borrower awareness week in Magway Region', 'မကွေးတိုင်းတွင် ချေးငွေယူသူ အသိပညာပေး ရက်သတ္တပတ်'), body: t('CIC staff will hold information sessions in Magway, Minbu and Pakokku from 1 to 5 October 2026.', 'CIC ဝန်ထမ်းများသည် အောက်တိုဘာ ၁ မှ ၅ ရက်အထိ မကွေး၊ မင်းဘူး၊ ပခုက္ကူတို့တွင် ဆွေးနွေးပွဲများ ပြုလုပ်မည်။'), status: 'Scheduled', scheduleAt: '2026-10-01T08:00', expiresAt: '2026-10-06', author: 'Ma Yamin', approver: 'Daw Moe Moe' }, [
    ['2026-09-19 10:30', 'Ma Yamin', 'Draft created', { status: 'Draft', scheduleAt: null }],
    ['2026-09-22 15:10', 'Ma Yamin', 'Set publish date', { status: 'In review' }],
    ['2026-09-23 09:00', 'Daw Moe Moe', 'Approved — scheduled for 1 Oct 08:00'],
  ]),
  seed({ id: 'CMS-F01', type: 'faq', category: 'Consumer education', title: t('Is my credit report free?'), body: t('Yes. Every borrower can view one report free of charge every 12 months. Additional copies cost 1,000 MMK.'), status: 'Published', author: 'Ma Yamin', approver: 'Daw Moe Moe', publishedAt: '2026-07-15' }, [
    ['2026-07-14 10:00', 'Ma Yamin', 'Draft created', { status: 'Draft', body: t('Yes, once a year.') }],
    ['2026-07-15 08:40', 'Ma Yamin', 'Clarified fee for extra copies', { status: 'In review' }],
    ['2026-07-15 11:20', 'Daw Moe Moe', 'Approved and published'],
  ]),
  seed({ id: 'CMS-F02', type: 'faq', category: 'Regulation', classification: 'MFI-only', title: t('How do we correct a record after a dispute?', 'အငြင်းပွားမှုအပြီး မှတ်တမ်းကို မည်သို့ ပြင်ဆင်ရမည်နည်း'), body: t('Submit a correction batch referencing the dispute ID. The CIC data steward approves it and a new record version is created.', 'အငြင်းပွားမှု ID ဖြင့် ပြင်ဆင်မှုအစုကို တင်သွင်းပါ။'), status: 'Draft', author: 'Ko Zaw Lin' }, [
    ['2026-09-21 14:00', 'Ko Zaw Lin', 'Draft created', { body: t('Submit a correction batch.') }],
    ['2026-09-24 10:15', 'Ko Zaw Lin', 'Expanded answer'],
  ]),
  seed({ id: 'CMS-D01', type: 'publication', category: 'Corporate', title: t('CIC Annual Report 2025', 'CIC နှစ်ပတ်လည် အစီရင်ခံစာ ၂၀၂၅'), body: t('Coverage, data quality and dispute statistics for 2025. PDF, 8.6 MB.', '၂၀၂၅ ခုနှစ် ဖုံးလွှမ်းမှု၊ အချက်အလက်အရည်အသွေးနှင့် အငြင်းပွားမှု စာရင်းဇယားများ။'), status: 'Published', author: 'Ko Zaw Lin', approver: 'U Soe Paing', publishedAt: '2026-03-31', seo: { meta: 'Download the CIC Annual Report 2025.', ogImage: 'annual-report-2025-cover.jpg' } }, [
    ['2026-03-25 09:00', 'Ko Zaw Lin', 'Draft created', { status: 'Draft' }],
    ['2026-03-31 10:00', 'U Soe Paing', 'Approved and published'],
  ]),
  seed({ id: 'CMS-B01', type: 'banner', category: 'Operations', title: t('Flood-affected townships: September cut-off extended', 'ရေဘေးသင့်မြို့နယ်များ၊ စက်တင်ဘာ နောက်ဆုံးရက် တိုးမြှင့်'), body: t('Institutions in Ayeyarwady flood areas may submit until 10 October without a late flag.', 'ဧရာဝတီ ရေဘေးသင့်ဒေသရှိ အဖွဲ့များ အောက်တိုဘာ ၁၀ ရက်အထိ တင်သွင်းနိုင်သည်။'), status: 'Archived', expiresAt: '2026-09-20', pinned: false, author: 'Ma Yamin', approver: 'Daw Moe Moe', publishedAt: '2026-09-05' }, [
    ['2026-09-04 16:00', 'Ma Yamin', 'Draft created', { status: 'Draft', pinned: true }],
    ['2026-09-05 08:00', 'Daw Moe Moe', 'Approved and published', { status: 'Published', pinned: true }],
    ['2026-09-20 00:00', 'System', 'Auto-expired and archived'],
  ]),
  seed({ id: 'CMS-B02', type: 'banner', category: 'Service', title: t('New: check your credit report online', 'အသစ် — ချေးငွေအစီရင်ခံစာကို အွန်လိုင်းတွင် စစ်ဆေးပါ'), body: t('Borrowers can now see their own report and who viewed it. Start at borrower.cic.gov.mm.', 'ချေးငွေယူသူများ မိမိအစီရင်ခံစာနှင့် ကြည့်ရှုသူများကို ယခု ကြည့်နိုင်ပြီ။'), status: 'Approved', pinned: true, author: 'Ma Yamin', approver: 'Daw Moe Moe' }, [
    ['2026-09-22 09:30', 'Ma Yamin', 'Draft created', { status: 'Draft' }],
    ['2026-09-23 10:10', 'Ma Yamin', 'Submitted for review', { status: 'In review' }],
    ['2026-09-24 14:45', 'Daw Moe Moe', 'Approved — awaiting publish'],
  ]),
  seed({ id: 'CMS-T01', type: 'statistic', category: 'Statistics', title: t('Sector at a glance', 'ကဏ္ဍ အကျဉ်းချုပ်'), body: t('12 reporting institutions · 2.41 million borrowers · 1.39 trillion MMK gross portfolio · PAR30 3.2% (as of 31 Aug 2026).', 'အစီရင်ခံအဖွဲ့ ၁၂ ခု · ချေးငွေယူသူ ၂.၄၁ သန်း · PAR30 ၃.၂%'), status: 'Published', author: 'Ko Zaw Lin', approver: 'Daw Moe Moe', publishedAt: '2026-09-05', mmUpdatedAt: '2026-09-05 09:00', enUpdatedAt: '2026-09-05 09:00' }, [
    ['2026-08-05 09:00', 'Ko Zaw Lin', 'July figures', { body: t('12 reporting institutions · 2.38 million borrowers · PAR30 3.4% (as of 31 Jul 2026).', 'အစီရင်ခံအဖွဲ့ ၁၂ ခု · PAR30 ၃.၄%') }],
    ['2026-09-05 09:00', 'Ko Zaw Lin', 'August figures', { status: 'In review' }],
    ['2026-09-05 11:30', 'Daw Moe Moe', 'Approved and published'],
  ]),
  seed({ id: 'CMS-G01', type: 'glossary', category: 'Consumer education', title: t('PAR30 (portfolio at risk, 30 days)', 'PAR30 (ရက် ၃၀ အန္တရာယ်ရှိ ချေးငွေ)'), body: t('The share of outstanding loan balance with at least one instalment more than 30 days overdue, including restructured loans.', 'ရက် ၃၀ ကျော် ပေးချေရန် ကျန်ရှိသော ချေးငွေလက်ကျန် အချိုး။'), status: 'Published', author: 'Ko Zaw Lin', approver: 'Daw Moe Moe', publishedAt: '2026-08-02', enUpdatedAt: '2026-09-18 10:00', mmUpdatedAt: '2026-08-01 10:00' }, [
    ['2026-08-01 10:00', 'Ko Zaw Lin', 'Draft created', { status: 'Draft', body: t('Share of loan balance more than 30 days overdue.', 'ရက် ၃၀ ကျော် ပေးချေရန် ကျန်ရှိသော ချေးငွေလက်ကျန် အချိုး။') }],
    ['2026-08-02 09:00', 'Daw Moe Moe', 'Approved and published', { body: t('Share of loan balance more than 30 days overdue.', 'ရက် ၃၀ ကျော် ပေးချေရန် ကျန်ရှိသော ချေးငွေလက်ကျန် အချိုး။') }],
    ['2026-09-18 10:00', 'Ma Yamin', 'EN definition aligned with KPI dictionary'],
  ]),
  seed({ id: 'CMS-G02', type: 'glossary', category: 'Consumer education', title: t('No-hit'), body: t('A search that finds no loan record for the person. A no-hit is not a low score and must not be treated as negative information.'), status: 'In review', author: 'U Soe Paing', lastEditor: 'U Soe Paing' }, [
    ['2026-09-23 16:20', 'U Soe Paing', 'Draft created', { status: 'Draft' }],
    ['2026-09-24 09:05', 'U Soe Paing', 'Submitted for review'],
  ]),
  seed({ id: 'CMS-C01', type: 'contact', category: 'Contact', title: t('CIC Head Office — Nay Pyi Taw', 'CIC ရုံးချုပ် — နေပြည်တော်'), body: t('Office No. 55, Central Bank of Myanmar compound, Nay Pyi Taw. Hotline +95 67 3410 220, Mon–Fri 09:30–16:30.', 'ရုံးအမှတ် ၅၅၊ မြန်မာနိုင်ငံတော်ဗဟိုဘဏ် ဝင်း၊ နေပြည်တော်။ ဖုန်း +၉၅ ၆၇ ၃၄၁၀ ၂၂၀'), status: 'Published', author: 'Ma Yamin', approver: 'Daw Moe Moe', publishedAt: '2026-04-10' }, [
    ['2026-04-08 10:00', 'Ma Yamin', 'Draft created', { status: 'Draft', body: t('Office No. 55, Nay Pyi Taw.', 'ရုံးအမှတ် ၅၅၊ နေပြည်တော်။') }],
    ['2026-04-09 11:30', 'Ma Yamin', 'Added hotline and hours', { status: 'In review' }],
    ['2026-04-10 09:00', 'Daw Moe Moe', 'Approved and published'],
  ]),
  seed({ id: 'CMS-C02', type: 'contact', category: 'Internal', classification: 'Internal', title: t('Yangon liaison office (staff only)'), body: t('No. 26 Sule Pagoda Road, Kyauktada Township, Yangon. Duty officer +9594 5021 7733. Not for publication.'), status: 'Draft', author: 'Daw Moe Moe', lastEditor: 'Daw Moe Moe' }, [
    ['2026-09-20 13:00', 'Daw Moe Moe', 'Draft created (before role change to publisher)'],
    ['2026-09-24 17:10', 'Daw Moe Moe', 'Updated duty officer number'],
  ]),
];

/** Unicode samples used by the simulated Zawgyi → Unicode converter (CMS-02). */
export const UNICODE_SAMPLE = {
  title: 'မြောက်ပိုင်းဒေသ ချေးငွေယူသူများအတွက် အသိပေးချက်',
  body: 'မြောက်ပိုင်းဒေသရှိ ချေးငွေယူသူများသည် မိမိ၏ ချေးငွေအစီရင်ခံစာကို အခမဲ့ စစ်ဆေးနိုင်ပါသည်။',
};
export const ZAWGYI_SAMPLE = 'ေျမာက္ပိုင္းေဒသ ေခ်းေငြယူသူမ်ား';
