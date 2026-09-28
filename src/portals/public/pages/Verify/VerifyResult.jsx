import clsx from 'clsx';
import { CheckCircle2, Clock, HelpCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/format';

const STYLES = {
  valid: { icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50 text-emerald-900', iconCls: 'text-emerald-600', title: 'Valid report', text: 'This report was issued by CIC and has not been revoked.' },
  expired: { icon: Clock, cls: 'border-amber-200 bg-amber-50 text-amber-900', iconCls: 'text-amber-600', title: 'Expired report', text: 'This report was issued by CIC but is older than its 30-day validity. Ask the holder for a newly issued report.' },
  revoked: { icon: XCircle, cls: 'border-red-200 bg-red-50 text-red-900', iconCls: 'text-red-600', title: 'Revoked report', text: 'This report was issued by CIC but has since been revoked. Do not rely on it — ask for a new report.' },
  not_found: { icon: HelpCircle, cls: 'border-slate-200 bg-slate-50 text-slate-900', iconCls: 'text-slate-500', title: 'Not found', text: 'No report matches this ID and code. Check both values carefully. A report that cannot be verified may not be genuine.' },
};

/** Shows ONLY status, issue date and issuer — never report content. */
export default function VerifyResult({ result, reportId }) {
  const s = STYLES[result.result];
  return (
    <div role="status" aria-live="polite" className={clsx('rounded-xl border p-5', s.cls)}>
      <div className="flex items-start gap-3">
        <s.icon className={clsx('h-7 w-7 shrink-0', s.iconCls)} aria-hidden="true" />
        <div className="flex-1">
          <p className="text-lg font-bold">{s.title}</p>
          <p className="mt-0.5 text-sm opacity-90">{s.text}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-[11px] opacity-70">Report ID</dt><dd className="break-all font-mono font-medium">{reportId}</dd></div>
            {result.issuedAt && <div><dt className="text-[11px] opacity-70">Issue date</dt><dd className="font-medium">{formatDate(result.issuedAt)}</dd></div>}
            {result.issuer && <div><dt className="text-[11px] opacity-70">Issued to</dt><dd className="font-medium">{result.issuer}</dd></div>}
            {result.validUntil && <div><dt className="text-[11px] opacity-70">{result.result === 'expired' ? 'Expired on' : 'Valid until'}</dt><dd className="font-medium">{formatDate(result.validUntil)}</dd></div>}
            {result.revokedAt && <div><dt className="text-[11px] opacity-70">Revoked on</dt><dd className="font-medium">{formatDate(result.revokedAt)}</dd></div>}
          </dl>
        </div>
      </div>
    </div>
  );
}
