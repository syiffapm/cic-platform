/**
 * Citizen (Borrower portal) accounts as seen by CIC operations. Accounts created by online
 * registration live in the shared store (`accounts`); this list adds the other realm accounts
 * that currently need operator attention or were recently active.
 */
export const CITIZEN_AS_OF = '25 Sep 2026 09:00';

export const CITIZEN_OPS = {
  totalAccounts: 199_864, // verified + pending, excluding closed
  newThisWeek: 3_412,
  pendingVerification: 1_128,
  locked: 64,
  consentsInForce: 48_917, // borrower consents to MFI inquiries not yet expired or used
  verificationSplit: [
    { method: 'OTP to phone on record at an MFI', pct: 58 },
    { method: 'NRC + selfie eKYC', pct: 34 },
    { method: 'In person at a CIC help desk', pct: 8 },
  ],
};

export const CITIZEN_ACCOUNT_SEED = [
  { id: 'ACC-012877', borrowerId: 'BRW-012877', name: 'U Kyaw Zin Htet', nrc: '9/MAHTAMA(N)448210', phone: '+959440981273', status: 'Pending verification', verifiedVia: 'NRC + selfie eKYC (selfie rejected — retry)', createdAt: '2026-09-22 10:02', lastLogin: '—', mfa: 'SMS OTP', failedLogins: 0, township: 'Chanmyathazi', region: 'Mandalay' },
  { id: 'ACC-013340', borrowerId: 'BRW-013340', name: 'Daw Khin Mar Lwin', nrc: '13/TAKANA(N)051176', phone: '+959977331402', status: 'Locked', verifiedVia: 'OTP to phone on record at an MFI', createdAt: '2026-06-14 18:40', lastLogin: '2026-09-19 15:00', mfa: 'SMS OTP', failedLogins: 5, township: 'Taunggyi', region: 'Shan' },
  { id: 'ACC-005120', borrowerId: 'BRW-005120', name: 'Ma Thida Soe', nrc: '8/MAKANA(N)120934', phone: '+959261140987', status: 'Active', verifiedVia: 'OTP to phone on record at an MFI', createdAt: '2026-04-03 07:55', lastLogin: '2026-09-24 20:11', mfa: 'SMS OTP', failedLogins: 0, township: 'Magway', region: 'Magway' },
  { id: 'ACC-006003', borrowerId: 'BRW-006003', name: 'U Than Htike', nrc: '10/MALAMA(N)087612', phone: '+959254407712', status: 'Locked', verifiedVia: 'In person at a CIC help desk', createdAt: '2026-02-18 11:20', lastLogin: '2026-09-23 06:48', mfa: 'SMS OTP', failedLogins: 5, township: 'Mawlamyine', region: 'Mon' },
  { id: 'ACC-002331', borrowerId: 'BRW-002331', name: 'Daw Aye Myat Mon', nrc: '14/PATHEIN(N)330112', phone: '+959450032118', status: 'Active', verifiedVia: 'NRC + selfie eKYC', createdAt: '2026-01-09 14:31', lastLogin: '2026-09-21 09:02', mfa: 'SMS OTP', failedLogins: 0, township: 'Pathein', region: 'Ayeyarwady' },
  { id: 'ACC-000921', borrowerId: 'BRW-000921', name: 'Ko Nay Myo Aung', nrc: '7/PAKHANA(N)219904', phone: '+959250774019', status: 'Pending verification', verifiedVia: 'Walk-in check scheduled', createdAt: '2026-09-24 16:12', lastLogin: '—', mfa: 'Not enrolled', failedLogins: 0, township: 'Bago', region: 'Bago' },
];
