/** Turns internal channel codes ("Portal 2", "Portals 2, 3") into wording a citizen understands. */
const NAMES = { 1: 'This website', 2: 'Borrower self-service portal', 3: 'Through your lender (MFI)', 4: 'Central Bank', 5: 'CIC office' };

export default function channelLabel(channel = '') {
  const nums = (channel.match(/\d/g) ?? []).map(Number);
  if (!/portal/i.test(channel) || nums.length === 0) return channel;
  return nums.map((n) => NAMES[n] ?? `Portal ${n}`).join(' · ');
}
