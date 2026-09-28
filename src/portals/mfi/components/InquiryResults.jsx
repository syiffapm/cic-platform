import { SearchX } from 'lucide-react';
import { Alert, Button, Card, CardBody } from '@/components/ui';

/** No-hit: no grade is ever shown and the result is explained. */
export function NoHit({ query, inquiryId, onNewSearch }) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center py-10 text-center">
        <div className="rounded-full bg-slate-100 p-4 text-slate-500"><SearchX className="h-7 w-7" aria-hidden="true" /></div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No record found — you are not charged</h2>
        <p className="mt-1 text-sm text-slate-500">Search: <span className="font-mono">{query}</span> · Inquiry {inquiryId}</p>
        <Alert tone="info" title="No credit record ≠ low risk" className="mt-5 max-w-xl text-left">
          No licensed institution has reported a loan for this identity as of 31 Aug 2026. This is not a positive or negative signal and <b>no grade is produced</b>.
          The person may be new to credit, or may have borrowed under a previous NRC — search again with the previous NRC or the CIC borrower ID.
        </Alert>
        <Button variant="outline" className="mt-5" onClick={onNewSearch}>New search</Button>
      </CardBody>
    </Card>
  );
}
