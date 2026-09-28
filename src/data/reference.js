/** Reference tables (ADM-05). */
export const REGIONS = [
  'Yangon', 'Mandalay', 'Ayeyarwady', 'Bago', 'Magway', 'Sagaing', 'Tanintharyi',
  'Mon', 'Shan', 'Kayin', 'Kachin', 'Rakhine', 'Chin', 'Kayah', 'Nay Pyi Taw',
];

export const TOWNSHIPS = [
  { code: 'OUKAMA', name: 'Okkalapa North', region: 'Yangon' },
  { code: 'KAMATA', name: 'Kamayut', region: 'Yangon' },
  { code: 'HLAINGTHAYA', name: 'Hlaingthaya', region: 'Yangon' },
  { code: 'CHANAYETHAZAN', name: 'Chanayethazan', region: 'Mandalay' },
  { code: 'PATHEIN', name: 'Pathein', region: 'Ayeyarwady' },
  { code: 'HINTHADA', name: 'Hinthada', region: 'Ayeyarwady' },
  { code: 'BAGO', name: 'Bago', region: 'Bago' },
  { code: 'TAUNGOO', name: 'Taungoo', region: 'Bago' },
  { code: 'MAGWAY', name: 'Magway', region: 'Magway' },
  { code: 'MONYWA', name: 'Monywa', region: 'Sagaing' },
  { code: 'DAWEI', name: 'Dawei', region: 'Tanintharyi' },
  { code: 'MAWLAMYINE', name: 'Mawlamyine', region: 'Mon' },
  { code: 'TAUNGGYI', name: 'Taunggyi', region: 'Shan' },
  { code: 'PAAN', name: 'Hpa-An', region: 'Kayin' },
];

export const PRODUCT_TYPES = ['Group loan', 'Individual loan', 'Agriculture loan', 'SME loan', 'Housing improvement', 'Education loan', 'Emergency loan'];

export const PURPOSE_CODES = [
  { code: 'NL', label: 'New loan application' },
  { code: 'RV', label: 'Review of existing loan' },
  { code: 'CL', label: 'Collection' },
  { code: 'GR', label: 'Guarantor assessment' },
];

export const DISPUTE_REASONS = [
  { code: 'D01', label: 'Loan not mine / identity error' },
  { code: 'D02', label: 'Incorrect outstanding balance' },
  { code: 'D03', label: 'Incorrect days past due / repayment history' },
  { code: 'D04', label: 'Loan already closed' },
  { code: 'D05', label: 'Incorrect guarantor record' },
  { code: 'D06', label: 'Personal details incorrect' },
];

export const CLASSIFICATIONS = ['Public', 'MFI-only', 'Regulator-only', 'Internal'];
