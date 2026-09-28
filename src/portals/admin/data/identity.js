/** Identity resolution candidate pairs (ADM-07, AC03). Never auto-merged — steward decision + checker approval. */
const rec = (o) => ({ prevNrc: '', phone: '', loans: 1, ...o });

export const IDENTITY_PAIRS = [
  {
    id: 'IDP-20931', score: 94, status: 'Open', detectedAt: '2026-09-24 03:10', source: 'Nightly match run',
    matched: ['NRC', 'DOB', 'Father\'s name', 'Township'],
    a: rec({ rid: 'BRW-004410', nrc: '12/OUKAMA(N)245781', prevNrc: '', nameMm: 'မဖြူဖြူ', nameEn: 'Ma Phyu Phyu', dob: '1991-06-14', father: 'U Aung Myint', township: 'Okkalapa North', phone: '+959421118734', mfis: ['PGMF'], loans: 2 }),
    b: rec({ rid: 'BRW-008872', nrc: '12/OUKAMA(N)245781', prevNrc: '', nameMm: 'ဒေါ်ဖြူဖြူ', nameEn: 'Daw Phyu Phyu', dob: '1991-06-14', father: 'U Aung Myint', township: 'Okkalapa North', phone: '+959795502211', mfis: ['YWEF'], loans: 1 }),
  },
  {
    id: 'IDP-20928', score: 87, status: 'Open', detectedAt: '2026-09-23 03:12', source: 'Nightly match run',
    matched: ['Previous NRC', 'Name', 'DOB'],
    a: rec({ rid: 'BRW-005120', nrc: '8/MAKANA(N)120934', prevNrc: '', nameMm: 'ကိုမျိုးမင်း', nameEn: 'Ko Myo Min', dob: '1986-02-11', father: 'U Tin Win', township: 'Magway', phone: '+959261140987', mfis: ['MAHA'], loans: 1 }),
    b: rec({ rid: 'BRW-009341', nrc: '8/MAKANA(N)120955', prevNrc: '8/MAKANA(N)120934', nameMm: 'မောင်မျိုးမင်း', nameEn: 'Maung Myo Min', dob: '1986-02-11', father: 'U Tin Win', township: 'Magway', phone: '+959261140987', mfis: ['AMM', 'SMF'], loans: 2 }),
  },
  {
    id: 'IDP-20917', score: 72, status: 'Open', detectedAt: '2026-09-22 03:09', source: 'Dispute DSP-2026-0409',
    matched: ['Name', 'Township'],
    a: rec({ rid: 'BRW-002331', nrc: '14/PATHEIN(N)330112', nameMm: 'ဦးထွန်းထွန်းဦး', nameEn: 'U Tun Tun Oo', dob: '1979-11-30', father: 'U Ba Tun', township: 'Pathein', phone: '+959450032118', mfis: ['PGMF', 'VFM'], loans: 3 }),
    b: rec({ rid: 'BRW-011204', nrc: '14/PATHEIN(N)330211', nameMm: 'ထွန်းထွန်းဦး', nameEn: 'Tun Tun Oo', dob: '1981-03-02', father: 'U Hla Maung', township: 'Pathein', phone: '+959977120045', mfis: ['VFM'], loans: 1 }),
  },
  {
    id: 'IDP-20902', score: 81, status: 'Pending checker', decision: 'Merge', decidedBy: 'Ko Pyae Sone', detectedAt: '2026-09-20 03:11', source: 'Nightly match run',
    matched: ['NRC (Myanmar digits normalised)', 'DOB', 'Phone'],
    a: rec({ rid: 'BRW-006003', nrc: '10/MALAMA(N)087612', nameMm: 'ဒေါ်စန်းစန်း', nameEn: 'Daw San San', dob: '1974-01-22', father: 'U Kyaw Nyunt', township: 'Mawlamyine', phone: '+959254407712', mfis: ['AHTWIN'], loans: 1 }),
    b: rec({ rid: 'BRW-010550', nrc: '10/MALAMA(N)087612', nameMm: 'စန်းစန်း', nameEn: 'San San', dob: '1974-01-22', father: 'U Kyaw Nyunt', township: 'Mawlamyine', phone: '+959254407712', mfis: ['MCM'], loans: 1 }),
  },
  {
    id: 'IDP-20877', score: 91, status: 'Merged', decision: 'Merge', decidedBy: 'Ko Pyae Sone', checker: 'U Soe Paing', detectedAt: '2026-09-11 03:08', source: 'Nightly match run',
    matched: ['NRC', 'DOB', 'Father\'s name', 'Phone'],
    a: rec({ rid: 'BRW-000184', nrc: '12/KAMATA(N)118204', nameMm: 'ဒေါ်နှင်းဝေ', nameEn: 'Daw Hnin Wai', dob: '1985-09-03', father: 'U Thein Zaw', township: 'Kamayut', phone: '+959420118822', mfis: ['PGMF', 'SMF'], loans: 2 }),
    b: rec({ rid: 'BRW-007719', nrc: '12/KAMATA(N)118204', nameMm: 'မနှင်းဝေ', nameEn: 'Ma Hnin Wai', dob: '1985-09-03', father: 'U Thein Zaw', township: 'Kamayut', phone: '+959420118822', mfis: ['AMM'], loans: 1 }),
  },
  {
    id: 'IDP-20840', score: 68, status: 'Not same person', decision: 'Not same person', decidedBy: 'Ko Pyae Sone', checker: 'U Soe Paing', detectedAt: '2026-09-05 03:10', source: 'Nightly match run',
    matched: ['Name', 'Township', 'Father\'s name'],
    a: rec({ rid: 'BRW-003318', nrc: '5/MAYANA(N)204417', nameMm: 'ကိုအောင်ကျော်', nameEn: 'Ko Aung Kyaw', dob: '1990-12-01', father: 'U Soe Win', township: 'Monywa', phone: '+959402210987', mfis: ['AHTWIN'], loans: 1 }),
    b: rec({ rid: 'BRW-003902', nrc: '5/MAYANA(N)204871', nameMm: 'မောင်အောင်ကျော်', nameEn: 'Maung Aung Kyaw', dob: '1996-07-15', father: 'U Soe Win', township: 'Monywa', phone: '+959783301126', mfis: ['AHTWIN'], loans: 1 }),
  },
];

/** Lineage events for resolved identities (shown for the selected pair's surviving ID). */
export const LINEAGE = {
  'BRW-000184': [
    { title: 'Identity created', time: '2019-04-12', actor: 'MFI-001 batch BAT-PGMF-2019-04-A', description: 'First seen with NRC 12/KAMATA(N)118204', tone: 'done' },
    { title: 'Loan linked from SMF', time: '2022-01-09', actor: 'Deterministic match (NRC + DOB)', description: 'Auto-linked: exact NRC and DOB — no merge needed', tone: 'done' },
    { title: 'Merged with BRW-007719', time: '2026-09-12', actor: 'Ko Pyae Sone → approved by U Soe Paing', description: 'IDP-20877 · AMM record under honorific "Ma"; 1 loan re-pointed', tone: 'done' },
    { title: 'Split of AMM-LN-610044 reviewed', time: '2026-09-18', actor: 'Ko Pyae Sone', description: 'Loan confirmed as belonging to this borrower; no split', tone: 'current' },
  ],
};

export const lineageFor = (pair) => LINEAGE[pair.a.rid] ?? [
  { title: 'Identity created', time: 'Initial load', actor: `${pair.a.mfis[0]} batch · Aug 2026`, description: `First seen with NRC on ${pair.a.township} record`, tone: 'done' },
  { title: 'Candidate pair detected', time: pair.detectedAt, actor: pair.source, description: `${pair.id} · similarity ${pair.score}% with ${pair.b.rid}`, tone: 'done' },
  ...(pair.status === 'Pending checker' ? [{ title: `${pair.decision} proposed`, time: '', actor: pair.decidedBy, description: 'Awaiting checker approval — records unchanged until approved', tone: 'current' }] : []),
  ...(['Merged', 'Not same person', 'Split'].includes(pair.status) ? [{ title: pair.status === 'Merged' ? `Merged with ${pair.b.rid}` : pair.status === 'Split' ? 'Split into separate identities' : 'Marked not same person', time: '', actor: `${pair.decidedBy} → approved by ${pair.checker ?? 'checker'}`, tone: 'done' }] : [{ title: 'Awaiting steward decision', time: '', tone: 'pending' }]),
];
