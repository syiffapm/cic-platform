import { Badge } from '@/components/ui';

const TONE = { Licensed: 'green', 'Under Review': 'amber', Suspended: 'red', Revoked: 'red' };

export default function LicenceBadge({ status }) {
  return <Badge tone={TONE[status] ?? 'slate'}>{status}</Badge>;
}
