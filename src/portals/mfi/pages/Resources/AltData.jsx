import { Lock, Signal, Smartphone, Zap } from 'lucide-react';
import { Alert, Badge, Card, CardBody, CardHeader, PageHeader } from '@/components/ui';
import { ALT_DATA } from '../../data/monitoring';

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
      <div><p className="text-[11px] text-slate-500">{label}</p><p className="text-sm font-medium text-slate-800">{value}</p></div>
    </div>
  );
}

/** Alternative data view — shown only where the borrower gave separate alt-data consent. */
export default function AltData() {
  return (
    <div className="space-y-6">
      <PageHeader title="Alternative data" subtitle="Telco and utility payment signals for borrowers who gave separate, optional consent. Not used in the grade." />

      <Alert tone="info" title="Separate consent · information only">
        Signals are supplied under CIC data-sharing agreements with mobile network operators and electricity supply corporations and refreshed monthly.
        They are shown only where the borrower gave separate alternative-data consent and are never used in the CIC grade.
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ALT_DATA.map((b) => (
          <Card key={b.borrowerId}>
            <CardHeader title={b.name} subtitle={b.borrowerId} icon={Signal} action={b.consent ? <Badge tone="green">Consent {b.consentRef}</Badge> : <Badge tone="slate">No consent</Badge>} />
            <CardBody>
              {b.consent ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Metric icon={Smartphone} label="SIM tenure" value={b.telcoTenure} />
                    <Metric icon={Signal} label="Top-up pattern" value={b.topUpRegularity} />
                    <Metric icon={Smartphone} label="Mobile money" value={b.mobileMoney} />
                    <Metric icon={Zap} label="Utility bills on time (12 m)" value={`${b.utilityOnTime}%`} />
                  </div>
                  <p className="text-[11px] text-slate-500">Source: {b.source} · updated {b.updated}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Hidden — the borrower has not ticked the alternative-data consent box. Nothing is retrieved or shown.
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
