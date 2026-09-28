import { FileSignature } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader } from '@/components/ui';
import { consentState } from './appUtils';

/** Digital consent evidence captured when the applicant submitted the application. */
export default function ConsentCard({ app }) {
  const c = consentState(app);
  const rows = [
    ['Consent reference', <span className="font-mono">{app.consent.ref}</span>],
    ['Granted', app.consent.grantedAt],
    ['Expires', app.consent.expiresAt],
    ['Granted via', app.channel.startsWith('Borrower') ? 'CIC borrower portal (OTP-signed)' : 'Signed form at branch, scanned'],
    ['Scope', app.consent.scope],
    ['Purpose', 'NL — New loan application'],
    ['Permitted inquirer', 'This institution only'],
  ];
  return (
    <Card>
      <CardHeader title="Digital consent" subtitle="Evidence stored by CIC with the application" icon={FileSignature} action={<Badge tone={c.tone}>{c.label}</Badge>} />
      <CardBody className="space-y-3">
        <dl className="space-y-2 text-xs">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-medium text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600">
          {c.text}. The consent allows one purpose-bound credit inquiry for this application. A second inquiry, or an inquiry after expiry, is refused by CIC.
        </p>
      </CardBody>
    </Card>
  );
}
