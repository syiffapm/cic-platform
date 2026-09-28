import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, Tabs } from '@/components/ui';
import { CHANGELOG } from '../data/institution';

const ENDPOINTS = {
  batches: {
    method: 'POST', path: '/v1/batches', scope: 'submission',
    desc: 'Submit a batch of borrower, loan, guarantor and repayment records. Send an Idempotency-Key header: a replay returns the original receipt and never creates duplicate loans.',
    request: {
      schema_version: 'v3.2', reporting_period: '2026-08', licence_no: 'MFI-0001/2012',
      control_totals: { record_count: 2, sum_outstanding: 1060000 },
      records: [{ nrc: '12/OUKAMA(N)245781', full_name_en: 'Daw Hnin Wai', dob: '1987-04-12', loan_id: 'PGMF-LN-118830', product_type: 'Group loan', amount_mmk: 1200000, outstanding_mmk: 640000, dpd: 0, loan_status: 'Active', guarantor_nrc: '12/OUKAMA(N)245990', household_size: 5 }],
    },
    response: { batch_id: 'BAT-PGMF-2026-09-A', status: 'VALIDATING', received: 2, links: { self: '/v1/batches/BAT-PGMF-2026-09-A', errors: '/v1/batches/BAT-PGMF-2026-09-A/errors' } },
  },
  inquiries: {
    method: 'POST', path: '/v1/inquiries', scope: 'inquiry',
    desc: 'Request a Basic or Full credit report. purpose_code and consent_ref are mandatory; the response carries rule_version and data_date per record.',
    request: { nrc: '12/OUKAMA(N)245781', purpose_code: 'NL', consent_ref: 'CNS-PGMF-24410', report_type: 'FULL' },
    response: { result: 'MATCH', report_id: 'CIC-R-2026-0924-7731', borrower_id: 'BRW-000184', grade: 'B', reason_codes: ['R02', 'R03', 'R05'], rule_version: 'GR-2026.2', data_date: '2026-08-31', report_url: '/v1/reports/CIC-R-2026-0924-7731.pdf' },
  },
};

/** Developer docs panel: endpoints, sample JSON, changelog. Full OpenAPI 3.1 spec downloadable. */
export default function DevDocs() {
  const [tab, setTab] = useState('batches');
  const ep = ENDPOINTS[tab];
  return (
    <Card>
      <CardHeader title="Developer documentation" subtitle="Base URLs: https://api.cic.gov.mm (production) · https://sandbox.api.cic.gov.mm (sandbox) · OAuth2 client credentials + mTLS" icon={BookOpen} />
      <Tabs className="px-4" value={tab} onChange={setTab} tabs={[{ id: 'batches', label: 'POST /v1/batches' }, { id: 'inquiries', label: 'POST /v1/inquiries' }, { id: 'changelog', label: 'Changelog' }]} />
      <CardBody>
        {tab === 'changelog' ? (
          <ul className="space-y-3">
            {CHANGELOG.map((c) => (
              <li key={c.version} className="flex gap-3 text-sm">
                <Badge tone="navy">{c.version}</Badge>
                <span className="text-slate-700">{c.note}<span className="block text-[11px] text-slate-500">{c.date}</span></span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-4">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="green">{ep.method}</Badge><code className="font-mono text-slate-800">{ep.path}</code><Badge tone="slate">scope: {ep.scope}</Badge>
            </p>
            <p className="text-sm text-slate-600">{ep.desc}</p>
            <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
              {[['Request', ep.request], ['Response 202 / 200', ep.response]].map(([label, body]) => (
                <div key={label}>
                  <p className="mb-1 text-xs font-semibold text-slate-600">{label}</p>
                  <pre tabIndex={0} role="region" aria-label={`${label} example (JSON)`} className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-emerald-200 scrollbar-thin">{JSON.stringify(body, null, 2)}</pre>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">Webhook payloads are signed with HMAC-SHA256 in the X-CIC-Signature header. Verify with your webhook secret before processing.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
