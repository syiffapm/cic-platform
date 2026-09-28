import { useState } from 'react';
import { FileText, Lock, Printer, RotateCcw } from 'lucide-react';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { PURPOSE_CODES } from '@/data/reference';
import ReportDocument from '../../components/ReportDocument';
import ReportSections from '../../components/ReportSections';
import { RULE_VERSION } from '../../components/reportModel';
import { PermButton } from '../../components/access';

/**
 * On-screen credit report with PDF / print view. `meta.reportType` is the tier the institution holds:
 * with Basic, Full-only sections and the PDF are locked and an upgrade is offered (when `onUpgrade` is set).
 */
export default function CreditReport({ borrower, model, meta, onNewSearch, actor, exportFeature = 'mfi.inquiry', notice, onUpgrade, upgradeFeature = 'mfi.inquiry', upgradeAction = 'create' }) {
  const [printOpen, setPrintOpen] = useState(false);
  const { logAudit } = useStore();
  const purpose = PURPOSE_CODES.find((p) => p.code === meta.purpose);
  const full = meta.reportType === 'Full';

  const logPrint = () => logAudit({ ...actor, action: 'REPORT_DOWNLOAD_PDF', module: 'Inquiry', target: meta.reportId, purpose: meta.purpose, outcome: 'Success' });

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary-50 p-2 text-primary"><FileText className="h-5 w-5" aria-hidden="true" /></div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{meta.reportType} credit report · {borrower.nameEn}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
              <span className="font-mono text-slate-700">{meta.reportId}</span>
              <span>· {meta.at}</span>
              <Badge tone="navy">Purpose {meta.purpose} — {purpose?.label}</Badge>
              <Badge tone="teal">Consent {meta.consentRef}</Badge>
              <Badge tone="slate">Rule {RULE_VERSION}</Badge>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 whitespace-nowrap">
          {onNewSearch && <Button variant="outline" size="sm" icon={RotateCcw} onClick={onNewSearch}>New search</Button>}
          {full ? (
            <PermButton feature={exportFeature} action="export" what="download or print credit reports" size="sm" icon={Printer} onClick={() => setPrintOpen(true)}>PDF / print view</PermButton>
          ) : (
            <span className="inline-flex cursor-not-allowed" title="The printable PDF is included in the Full report.">
              <Button size="sm" variant="outline" icon={Lock} disabled className="pointer-events-none">PDF — Full report</Button>
              <span className="sr-only">The printable PDF is included in the Full report.</span>
            </span>
          )}
        </div>
      </div>
      <CardBody className="space-y-5">
        {notice}
        <ReportSections borrower={borrower} model={model} reportType={meta.reportType} tenant={meta.tenant} onUpgrade={onUpgrade} upgradeFeature={upgradeFeature} upgradeAction={upgradeAction} />
      </CardBody>
      {full && <ReportDocument open={printOpen} onClose={() => setPrintOpen(false)} onPrinted={logPrint} borrower={borrower} model={model} meta={meta} />}
    </Card>
  );
}
