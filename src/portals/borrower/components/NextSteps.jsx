import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Copy, FileDown, Gavel, HandCoins, Lightbulb, RefreshCcw, Share2 } from 'lucide-react';
import { Card, CardBody, CardHeader, useToast } from '@/components/ui';
import { REASON_TIPS } from '@/lib/creditScore';
import { formatDate } from '@/lib/format';
import { useBorrowerAudit } from '../lib/borrower';
import { ButtonLink } from './Common';
import { validityText } from './ReportRequestCards';

function Item({ icon: Icon, title, children, tone = 'bg-primary-50 text-primary' }) {
  return (
    <li className="flex gap-3 rounded-lg border border-slate-200 p-3.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <div className="mt-0.5 space-y-2 text-xs text-slate-600">{children}</div>
      </div>
    </li>
  );
}

/** "What you can do next" after a report is issued: share/download, dispute & re-issue, improve, apply, alerts. */
export default function NextSteps({ state, compact = false }) {
  const { current, snapshot, correctedDispute } = state;
  const audit = useBorrowerAudit();
  const toast = useToast();
  const [shown, setShown] = useState(false);
  if (!current) return null;
  const r = snapshot;
  const tips = (r.reasons ?? []).filter((x) => x.points > 0).map((x) => REASON_TIPS[x.code]).filter(Boolean);

  const copy = () => {
    const text = `CIC credit report ${r.reportId} · verification code ${r.verificationCode} · check at cic.gov.mm/verify`;
    try { navigator.clipboard?.writeText(text); } catch { /* clipboard unavailable */ }
    audit('OWN_REPORT_SHARE_DETAILS', r.reportId, { purpose: 'Copied report ID and verification code' });
    toast('Report ID and verification code copied.', 'success');
  };

  return (
    <Card>
      <CardHeader title="What you can do next" subtitle={`${validityText(r.validUntil)}.`} icon={Share2} />
      <CardBody>
        <ul className={`grid gap-3 ${compact ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'}`}>
          <Item icon={FileDown} title="Download or share your report">
            <p>Save the official PDF, or give a lender the report ID and verification code so they can check it is genuine at cic.gov.mm/verify.</p>
            {shown ? (
              <p className="rounded bg-slate-50 p-2 font-mono text-[11px] text-slate-800">{r.reportId} · code {r.verificationCode}</p>
            ) : (
              <button type="button" onClick={() => setShown(true)} className="inline-flex min-h-[24px] items-center font-semibold text-primary hover:underline">Show report ID and code</button>
            )}
            <div className="flex flex-wrap gap-2">
              <ButtonLink to="/borrower/report/print" size="sm" icon={FileDown}>Download PDF</ButtonLink>
              <button type="button" onClick={copy} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"><Copy className="h-3.5 w-3.5" aria-hidden="true" />Copy ID and code</button>
            </div>
          </Item>
          {correctedDispute ? (
            <Item icon={RefreshCcw} title="Your record was corrected" tone="bg-emerald-50 text-emerald-700">
              <p>Dispute {correctedDispute.id} was resolved after this report was issued. Request an updated report so lenders see the corrected data — it is free.</p>
              <ButtonLink to="/borrower/requests/new?purpose=corrected" size="sm" variant="warm" icon={RefreshCcw}>Request an updated report (free)</ButtonLink>
            </Item>
          ) : (
            <Item icon={Gavel} title="Something wrong?" tone="bg-violet-50 text-violet-700">
              <p>File a free dispute on the loan or detail that is wrong. The lender must reply in 10 working days. Once it is corrected you can get an updated report for free.</p>
              <Link to="/borrower/disputes/new" className="font-semibold text-primary hover:underline">File a dispute</Link>
            </Item>
          )}
          <Item icon={Lightbulb} title="Improve your score" tone="bg-amber-50 text-amber-700">
            {tips.length ? <ul className="list-disc space-y-1 pl-4">{tips.slice(0, 2).map((t) => <li key={t}>{t}</li>)}</ul> : <p>No negative factors on this report. Keep paying on time to keep your grade.</p>}
          </Item>
          <Item icon={HandCoins} title="Apply for a loan" tone="bg-teal-50 text-teal-700">
            <p>Apply online to a licensed MFI. With your consent the lender checks your report once and sees the same grade.</p>
            <Link to="/borrower/loans/apply" className="font-semibold text-primary hover:underline">Apply for a loan</Link>
          </Item>
          <Item icon={Bell} title="Turn on alerts">
            <p>Get an SMS when a lender checks your report, reports a new loan or marks a payment late.</p>
            <Link to="/borrower/alerts" className="font-semibold text-primary hover:underline">Alert settings</Link>
          </Item>
        </ul>
      </CardBody>
    </Card>
  );
}
