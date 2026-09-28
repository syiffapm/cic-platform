import { DISPUTE_REASONS, PRODUCT_TYPES, PURPOSE_CODES, REGIONS, TOWNSHIPS } from '@/data/reference';

/** Master data reference tables (ADM-05). Each table is an admin collection; edits go through maker-checker. */
export const CURRENCIES = [
  { id: 'MMK', code: 'MMK', name: 'Myanmar Kyat', rate: 1, base: true, updated: '2026-09-24' },
  { id: 'USD', code: 'USD', name: 'US Dollar', rate: 2100, base: false, updated: '2026-09-24' },
  { id: 'THB', code: 'THB', name: 'Thai Baht', rate: 62.4, base: false, updated: '2026-09-24' },
  { id: 'CNY', code: 'CNY', name: 'Chinese Yuan', rate: 295.6, base: false, updated: '2026-09-24' },
];

export const HOLIDAYS_2026 = [
  { id: 'H-01', date: '2026-01-04', name: 'Independence Day', type: 'Public' },
  { id: 'H-02', date: '2026-02-12', name: 'Union Day', type: 'Public' },
  { id: 'H-03', date: '2026-03-02', name: 'Peasants\' Day', type: 'Public' },
  { id: 'H-04', date: '2026-03-03', name: 'Full Moon Day of Tabaung', type: 'Public' },
  { id: 'H-05', date: '2026-03-27', name: 'Armed Forces Day', type: 'Public' },
  { id: 'H-06', date: '2026-04-13', name: 'Thingyan Water Festival (13–16 Apr)', type: 'Public' },
  { id: 'H-07', date: '2026-04-17', name: 'Myanmar New Year', type: 'Public' },
  { id: 'H-08', date: '2026-05-01', name: 'Labour Day', type: 'Public' },
  { id: 'H-09', date: '2026-05-01', name: 'Full Moon Day of Kasong', type: 'Public' },
  { id: 'H-10', date: '2026-07-19', name: 'Martyrs\' Day', type: 'Public' },
  { id: 'H-11', date: '2026-07-29', name: 'Full Moon Day of Waso', type: 'Public' },
  { id: 'H-12', date: '2026-10-26', name: 'Full Moon Day of Thadingyut (3 days)', type: 'Public' },
  { id: 'H-13', date: '2026-11-24', name: 'Full Moon Day of Tazaungmone', type: 'Public' },
  { id: 'H-14', date: '2026-12-04', name: 'National Day', type: 'Public' },
  { id: 'H-15', date: '2026-12-25', name: 'Christmas Day', type: 'Public' },
  { id: 'H-16', date: '2026-12-31', name: 'Bank holiday (year-end closing)', type: 'Bank' },
];

/**
 * Tab config: key = admin collection key; fields drive both the table and the edit form.
 * `idField` is the business key that cannot be edited once created.
 */
export const REFERENCE_TABLES = {
  regions: {
    label: 'Regions', key: 'refRegions', noun: 'region', idField: 'code',
    seed: REGIONS.map((r, i) => ({ id: `RG-${String(i + 1).padStart(2, '0')}`, code: `RG-${String(i + 1).padStart(2, '0')}`, name: r, kind: r === 'Nay Pyi Taw' ? 'Union territory' : ['Yangon', 'Mandalay', 'Ayeyarwady', 'Bago', 'Magway', 'Sagaing', 'Tanintharyi'].includes(r) ? 'Region' : 'State', active: true })),
    fields: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'kind', label: 'Type', options: ['Region', 'State', 'Union territory'] }],
  },
  townships: {
    label: 'Townships', key: 'refTownships', noun: 'township', idField: 'code',
    seed: TOWNSHIPS.map((t) => ({ id: t.code, code: t.code, name: t.name, region: t.region, active: true })),
    fields: [{ key: 'code', label: 'NRC code' }, { key: 'name', label: 'Name' }, { key: 'region', label: 'Region / state', options: REGIONS }],
  },
  products: {
    label: 'Product types', key: 'refProducts', noun: 'product type', idField: 'code',
    seed: PRODUCT_TYPES.map((p, i) => ({ id: `PT${String(i + 1).padStart(2, '0')}`, code: `PT${String(i + 1).padStart(2, '0')}`, name: p, active: true })),
    fields: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }],
  },
  purposes: {
    label: 'Purpose codes', key: 'refPurposes', noun: 'purpose code', idField: 'code',
    seed: PURPOSE_CODES.map((p) => ({ id: p.code, code: p.code, name: p.label, billable: 'Yes', active: true })),
    fields: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Description' }, { key: 'billable', label: 'Billable', options: ['Yes', 'No'] }],
  },
  reasons: {
    label: 'Reason codes', key: 'refReasons', noun: 'reason code', idField: 'code',
    seed: DISPUTE_REASONS.map((d) => ({ id: d.code, code: d.code, name: d.label, sla: '14', active: true })),
    fields: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Description' }, { key: 'sla', label: 'MFI SLA (days)' }],
  },
  currencies: {
    label: 'Currencies', key: 'refCurrencies', noun: 'currency', idField: 'code',
    seed: CURRENCIES.map((c) => ({ ...c, active: true })),
    fields: [{ key: 'code', label: 'ISO code' }, { key: 'name', label: 'Name' }, { key: 'rate', label: 'Rate to MMK (CBM reference)' }, { key: 'updated', label: 'Rate date' }],
  },
  holidays: {
    label: 'Holidays 2026', key: 'refHolidays', noun: 'holiday', idField: 'id',
    seed: HOLIDAYS_2026.map((h) => ({ ...h, active: true })),
    fields: [{ key: 'date', label: 'Date', type: 'date' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Type', options: ['Public', 'Bank', 'Regional'] }],
  },
};

export const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];

/** Steward and super admin check each other: the maker's own role never approves. */
export const stewardChecker = (role) => (role === 'adm_steward' ? 'adm_super' : 'adm_steward');
