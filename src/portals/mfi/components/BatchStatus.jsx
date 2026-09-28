import { Badge } from '@/components/ui';

const TONES = {
  Uploaded: 'slate', Validating: 'blue', 'Validation failed': 'red', 'Awaiting approval': 'amber', Approved: 'teal',
  'Identity resolution': 'violet', Loaded: 'green', 'Rejected by checker': 'red', Withdrawn: 'slate',
};

export default function BatchStatus({ status }) {
  return <Badge tone={TONES[status] ?? 'slate'}>{status}</Badge>;
}
