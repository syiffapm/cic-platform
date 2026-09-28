import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { PURPOSE_CODES } from '@/data/reference';
import ReportSections from './ReportSections';
import { RULE_VERSION } from './reportModel';

/**
 * Printable / PDF credit report: report ID, verification QR, diagonal watermark
 * "PGMF · user · timestamp" and a footer with rule version, purpose and consent reference.
 */
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #cic-report-print, #cic-report-print * { visibility: visible !important; }
  #cic-report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
  @page { size: A4; margin: 12mm; }
}`;

export default function ReportDocument({ open, onClose, onPrinted, borrower, model, meta }) {
  const watermark = `${meta.mfiShort} · ${meta.user} · ${meta.at}`;
  const purpose = PURPOSE_CODES.find((p) => p.code === meta.purpose);
  const print = () => {
    onPrinted?.();
    window.print();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={`Credit report ${meta.reportId}`}
      subtitle="Print preview — use your browser's “Save as PDF” to create the PDF copy."
      footer={<><Button variant="outline" onClick={onClose}>Close</Button><Button icon={Printer} onClick={print}>Print / save PDF</Button></>}
    >
      <style>{PRINT_CSS}</style>
      <article id="cic-report-print" className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-around overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <p key={i} className="-rotate-[28deg] whitespace-nowrap text-center text-2xl font-bold uppercase tracking-widest text-slate-900/[0.06]">
              {watermark} &nbsp;&nbsp; {watermark}
            </p>
          ))}
        </div>

        <div className="relative z-10 space-y-6">
          <header className="flex flex-col gap-4 border-b-2 border-primary pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-warm">Credit Information Centre · Myanmar</p>
              <h2 className="mt-1 text-xl font-bold text-primary">{meta.reportType} Credit Report</h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[11px] text-slate-600">
                <dt>Report ID</dt><dd className="font-mono font-semibold text-slate-900">{meta.reportId}</dd>
                <dt>Generated</dt><dd>{meta.at}</dd>
                <dt>Requested by</dt><dd>{meta.user} ({meta.mfiName})</dd>
                <dt>Data as of</dt><dd>31 Aug 2026 (per record dates below)</dd>
              </dl>
            </div>
            <div className="flex flex-col items-center gap-1">
              <QRCodeSVG value={`https://cic.gov.mm/verify/${meta.reportId}`} size={96} level="M" />
              <span className="text-[11px] text-slate-500">Scan to verify authenticity</span>
            </div>
          </header>

          <ReportSections borrower={borrower} model={model} reportType={meta.reportType} tenant={meta.tenant} />

          <footer className="border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500">
            <p>
              Rule version <b>{RULE_VERSION}</b> · Purpose <b>{meta.purpose} — {purpose?.label}</b> · Consent ref <b>{meta.consentRef}</b> · Report {meta.reportId}
            </p>
            <p>Confidential. Issued under the Directive on Credit Reporting by Microfinance Institutions v2.0 for the stated purpose only. Re-disclosure is prohibited. Verify at cic.gov.mm/verify. No credit record does not mean low risk.</p>
          </footer>
        </div>
      </article>
    </Modal>
  );
}
