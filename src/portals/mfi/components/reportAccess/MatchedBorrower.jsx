import { RotateCcw, UserCheck } from 'lucide-react';
import { Alert, Button, Card, CardBody, CardHeader } from '@/components/ui';
import { maskNrc } from '@/lib/format';
import TierChoice from './TierChoice';

/** Borrower matched, nothing unlocked yet: identity only (masked) and the Basic / Full choice. */
export default function MatchedBorrower({ borrower, req, institution, onChoose, onNewSearch }) {
  return (
    <Card>
      <CardHeader title="Borrower found — choose a credit report" subtitle="No report content is shown until a report is unlocked for your institution." icon={UserCheck}
        action={<Button size="sm" variant="outline" icon={RotateCcw} onClick={onNewSearch}>New search</Button>} />
      <CardBody className="space-y-4">
        <dl className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-3">
          <div><dt className="text-[11px] text-slate-500">Name</dt><dd className="font-medium text-slate-800">{borrower.nameEn}</dd></div>
          <div><dt className="text-[11px] text-slate-500">NRC</dt><dd className="font-mono text-xs text-slate-800">{maskNrc(borrower.nrc)}</dd></div>
          <div><dt className="text-[11px] text-slate-500">CIC borrower ID</dt><dd className="font-mono text-xs text-slate-800">{borrower.borrowerId}</dd></div>
        </dl>
        {req ? (
          <TierChoice institution={institution} consentRef={req.consentRef} purpose={req.purpose} subject={`${borrower.nameEn} · ${maskNrc(borrower.nrc)}`} feature="mfi.inquiry" action="create" what="buy credit reports" onChoose={onChoose} />
        ) : (
          <Alert tone="info" title="Access for this borrower has ended">Reports stay open for 30 days. Run a new search with a purpose and the borrower's consent to choose a report again.</Alert>
        )}
      </CardBody>
    </Card>
  );
}
