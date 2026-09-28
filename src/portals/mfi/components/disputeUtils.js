import { DISPUTE_REASONS } from '@/data/reference';

export const OPEN = ['Awaiting MFI', 'Investigating', 'Open'];
export const CLOSED = ['Resolved', 'Closed', 'Rejected'];
export const reasonLabel = (c) => DISPUTE_REASONS.find((r) => r.code === c)?.label ?? c;
