/** Notification templates, delivery log and opt-outs (A11, ADM-11). */
export const CHANNELS = ['Email', 'SMS', 'In-app'];

export const VARIABLES = ['borrower_name', 'mfi_name', 'dispute_id', 'otp', 'report_id', 'batch_id', 'reject_count', 'invoice_no', 'amount', 'due_date', 'notice_title', 'link'];

export const SAMPLE_VALUES = {
  borrower_name: 'Daw Hnin Wai', mfi_name: 'Pact Global Microfinance Fund', dispute_id: 'DSP-2026-0412', otp: '483920', report_id: 'CR-2026-778410',
  batch_id: 'BAT-MFI-004-0917', reject_count: '218', invoice_no: 'INV-2026-09-0007', amount: '1,845,000 MMK', due_date: '15 Oct 2026',
  notice_title: 'New reporting schema v3.2', link: 'https://cic.gov.mm/r/7Hq2',
};

export const EVENTS = [
  { id: 'dispute_filed', label: 'Dispute filed', mandatory: false },
  { id: 'dispute_resolved', label: 'Dispute resolved', mandatory: false },
  { id: 'new_inquiry', label: 'New inquiry on your report', mandatory: false },
  { id: 'otp', label: 'One-time password (OTP)', mandatory: true },
  { id: 'batch_rejected', label: 'Submission batch rejected', mandatory: true },
  { id: 'invoice_issued', label: 'Invoice issued', mandatory: true },
  { id: 'notice_published', label: 'Notice published', mandatory: false },
];

const t = (id, event, channel, en, mm, extra = {}) => ({ id, event, channel, en, mm, status: 'Published', version: 3, updatedAt: '2026-08-14', updatedBy: 'Ma Yamin', ...extra });

export const TEMPLATE_SEED = [
  t('NT-01', 'dispute_filed', 'SMS', 'CIC: Dear {{borrower_name}}, your dispute {{dispute_id}} was received. {{mfi_name}} must respond within 10 working days.', 'CIC: {{borrower_name}} ၏ အငြင်းပွားမှု {{dispute_id}} ကို လက်ခံရရှိပါပြီ။ {{mfi_name}} သည် ရုံးဖွင့်ရက် ၁၀ ရက်အတွင်း တုံ့ပြန်ရပါမည်။'),
  t('NT-02', 'dispute_filed', 'Email', 'Dear {{borrower_name}},\n\nWe have received your dispute {{dispute_id}} about data reported by {{mfi_name}}. You can track progress at {{link}}.\n\nCredit Information Centre', '{{borrower_name}} ခင်ဗျာ၊\n\n{{mfi_name}} မှ တင်သွင်းသော ဒေတာနှင့်ပတ်သက်သည့် အငြင်းပွားမှု {{dispute_id}} ကို လက်ခံရရှိပါသည်။ {{link}} တွင် စောင့်ကြည့်နိုင်ပါသည်။', { subject: 'Dispute {{dispute_id}} received' }),
  t('NT-03', 'dispute_resolved', 'SMS', 'CIC: Dispute {{dispute_id}} is resolved. View the outcome and your corrected report at {{link}}', 'CIC: အငြင်းပွားမှု {{dispute_id}} ဖြေရှင်းပြီးပါပြီ။ ရလဒ်ကို {{link}} တွင် ကြည့်ပါ။'),
  t('NT-04', 'dispute_resolved', 'In-app', 'Your dispute {{dispute_id}} has been resolved. {{mfi_name}} corrected the record.', 'သင်၏ အငြင်းပွားမှု {{dispute_id}} ဖြေရှင်းပြီးပါပြီ။ {{mfi_name}} က မှတ်တမ်းကို ပြင်ဆင်ပြီးပါပြီ။'),
  t('NT-05', 'new_inquiry', 'SMS', 'CIC: {{mfi_name}} viewed your credit report today. Not you? Call 1655 or visit {{link}}', 'CIC: {{mfi_name}} က သင်၏ ချေးငွေအစီရင်ခံစာကို ယနေ့ကြည့်ရှုခဲ့သည်။ မသိပါက 1655 သို့ ဆက်သွယ်ပါ။'),
  t('NT-06', 'new_inquiry', 'In-app', '{{mfi_name}} requested your credit report ({{report_id}}). See who viewed your report.', '{{mfi_name}} က သင်၏ အစီရင်ခံစာ ({{report_id}}) ကို တောင်းခံခဲ့သည်။'),
  t('NT-07', 'otp', 'SMS', 'CIC code: {{otp}}. Valid 5 minutes. Never share this code — CIC staff will never ask for it.', 'CIC ကုဒ်: {{otp}}။ ၅ မိနစ်သာ အကျုံးဝင်သည်။ မည်သူ့ကိုမျှ မပေးပါနှင့်။', { mandatory: true }),
  t('NT-08', 'batch_rejected', 'Email', 'Batch {{batch_id}} from {{mfi_name}} failed validation: {{reject_count}} rows rejected. Download the validation report at {{link}}.', 'အသုတ် {{batch_id}} တွင် အတန်း {{reject_count}} ခု ပယ်ချခံရသည်။ {{link}} တွင် အစီရင်ခံစာ ရယူပါ။', { subject: 'Action required: batch {{batch_id}} rejected', mandatory: true }),
  t('NT-09', 'batch_rejected', 'In-app', 'Batch {{batch_id}} rejected — {{reject_count}} rows need correction.', 'အသုတ် {{batch_id}} ပယ်ချခံရသည် — အတန်း {{reject_count}} ခု ပြင်ရန်လိုသည်။', { mandatory: true }),
  t('NT-10', 'invoice_issued', 'Email', 'Invoice {{invoice_no}} for {{mfi_name}} is available: {{amount}}, due {{due_date}}. Download from the MFI portal.', 'ငွေတောင်းခံလွှာ {{invoice_no}}: {{amount}}၊ နောက်ဆုံးရက် {{due_date}}။', { subject: 'CIC invoice {{invoice_no}}', mandatory: true }),
  t('NT-11', 'notice_published', 'In-app', 'New notice: {{notice_title}}. Read it at {{link}}', 'ကြေညာချက်အသစ်: {{notice_title}}။', { version: 1, updatedAt: '2026-09-02' }),
  t('NT-12', 'notice_published', 'Email', 'A new notice has been published for your institution: {{notice_title}}.\n\nRead: {{link}}', 'သင့်အဖွဲ့အစည်းအတွက် ကြေညာချက်အသစ်: {{notice_title}}။', { subject: 'CIC notice: {{notice_title}}', version: 2 }),
];

export const DELIVERY_LOG = [
  { id: 'DL-90412', at: '2026-09-25 09:41', recipient: '+959421005678', channel: 'SMS', template: 'NT-07', status: 'Delivered', retries: 0, provider: 'MPT SMS Gateway' },
  { id: 'DL-90411', at: '2026-09-25 09:38', recipient: '+959790223415', channel: 'SMS', template: 'NT-05', status: 'Delivered', retries: 0, provider: 'Ooredoo A2P' },
  { id: 'DL-90408', at: '2026-09-25 09:22', recipient: 'thiha@pgmf.org.mm', channel: 'Email', template: 'NT-08', status: 'Delivered', retries: 0, provider: 'SES (ap-southeast-1)' },
  { id: 'DL-90405', at: '2026-09-25 09:05', recipient: '+959260118844', channel: 'SMS', template: 'NT-07', status: 'Retrying', retries: 2, provider: 'ATOM SMS', error: 'Handset unreachable' },
  { id: 'DL-90399', at: '2026-09-25 08:47', recipient: '+959453301276', channel: 'SMS', template: 'NT-01', status: 'Delivered', retries: 1, provider: 'MPT SMS Gateway' },
  { id: 'DL-90391', at: '2026-09-25 08:15', recipient: 'finance@mahamfi.com', channel: 'Email', template: 'NT-10', status: 'Failed', retries: 3, provider: 'SES (ap-southeast-1)', error: 'Mailbox full (552)' },
  { id: 'DL-90387', at: '2026-09-25 08:02', recipient: 'BRW-000184', channel: 'In-app', template: 'NT-04', status: 'Delivered', retries: 0, provider: 'CIC push service' },
  { id: 'DL-90376', at: '2026-09-24 17:44', recipient: '+959977120563', channel: 'SMS', template: 'NT-03', status: 'Failed', retries: 3, provider: 'Mytel Bulk', error: 'Number deactivated' },
  { id: 'DL-90368', at: '2026-09-24 16:30', recipient: 'kyaw.zin@pgmf.org.mm', channel: 'Email', template: 'NT-12', status: 'Delivered', retries: 0, provider: 'SES (ap-southeast-1)' },
  { id: 'DL-90352', at: '2026-09-24 15:12', recipient: '+959421005678', channel: 'SMS', template: 'NT-05', status: 'Delivered', retries: 0, provider: 'MPT SMS Gateway' },
  { id: 'DL-90344', at: '2026-09-24 14:58', recipient: 'MFI-006', channel: 'In-app', template: 'NT-09', status: 'Delivered', retries: 0, provider: 'CIC push service' },
  { id: 'DL-90337', at: '2026-09-24 14:20', recipient: '+959683390127', channel: 'SMS', template: 'NT-07', status: 'Delivered', retries: 1, provider: 'Ooredoo A2P' },
];

export const OPT_OUTS = [
  { id: 'OO-118', recipient: '+959765540912', channel: 'SMS', category: 'New inquiry alerts', date: '2026-09-21', reason: 'Too many messages' },
  { id: 'OO-117', recipient: 'aungko.mdy@gmail.com', channel: 'Email', category: 'Notices', date: '2026-09-18', reason: 'Not relevant' },
  { id: 'OO-114', recipient: '+959254410087', channel: 'SMS', category: 'Dispute updates (SMS)', date: '2026-09-09', reason: 'Prefers in-app only' },
  { id: 'OO-109', recipient: '+959977120563', channel: 'SMS', category: 'All optional SMS', date: '2026-08-30', reason: 'Number shared with family' },
  { id: 'OO-102', recipient: 'research.team@ywef.org', channel: 'Email', category: 'Notices', date: '2026-08-12', reason: 'Duplicate mailbox' },
];
