import { useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui';
import { GRADE_TONES } from '@/lib/creditScore';
import { formatDate, formatDateTime, formatMMK, maskNrc, maskPhone } from '@/lib/format';
import { isOpenDispute, mfiName, useBorrower, useBorrowerAudit, useOwnDisputes } from '../lib/borrower';
import { RATING_LABEL, summariseHistory, useMyFile } from '../lib/myFile';
import { useReportRequests } from '../lib/reports';
import { validityText } from './ReportRequestCards';
import RepaymentGrid, { RepaymentLegend } from './RepaymentGrid';

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  .no-print { display: none !important; }
  body { background: #fff !important; }
  .print-sheet { box-shadow: none !important; border: 0 !important; margin: 0 !important; max-width: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/**
 * Printable own-report, built from the same registry file and score as the on-screen report. Rendered as a full-page route so window.print() produces a clean PDF.
 * Watermark = borrower name + generation timestamp; QR points to the public verification page.
 */
export default function ReportPrintView() {
  const user = useBorrower();
  const audit = useBorrowerAudit();
  const disputes = useOwnDisputes();
  const { file } = useMyFile();
  const report = useReportRequests().snapshot;
  const logged = useRef(false);
  useEffect(() => {
    if (logged.current || !report) return;
    logged.current = true;
    audit('OWN_REPORT_DOWNLOAD', report.reportId, { purpose: 'Personal report PDF' });
  }, [audit, report]);
  if (!report || !file) return <Navigate to="/borrower/report" replace />;

  const { reportId, generatedAt, verificationCode: code, dataAsOf, validUntil } = report;
  const loans = report.loanViews;
  const guarantees = report.guaranteeViews;
  const holder = user?.name ?? file.nameEn;
  const verifyUrl = `${window.location.origin}/verify?id=${encodeURIComponent(reportId)}${code ? `&code=${code}` : ''}`;
  const watermark = `${holder} · ${formatDateTime(generatedAt)}`;
  const openDisputeFor = (loanId) => disputes.find((d) => d.loanId === loanId && report.disputeFlags.includes(d.id)) ?? disputes.find((d) => d.loanId === loanId && isOpenDispute(d));

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      <style>{PRINT_CSS}</style>
      <div className="no-print mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4">
        <Link to="/borrower/report" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to my report
        </Link>
        <Button icon={Printer} onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>

      <div className="print-sheet relative mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        {/* Watermark */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-around overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <p key={i} className="-rotate-[24deg] whitespace-nowrap text-2xl font-bold uppercase tracking-widest text-slate-900/[0.06] sm:text-4xl">{watermark}</p>
          ))}
        </div>

        <div className="relative">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-primary pb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-warm">Central Bank of Myanmar</p>
              <h1 className="mt-1 text-xl font-bold text-primary">Credit Information Center — Personal Credit Report</h1>
              <p className="mt-1 text-xs text-slate-500">Personal report issued to the data subject on request {report.requestId}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <dt className="text-slate-500">Report ID</dt><dd className="font-mono font-semibold">{reportId}</dd>
                <dt className="text-slate-500">Issued</dt><dd>{formatDateTime(generatedAt)}</dd>
                <dt className="text-slate-500">Valid</dt><dd>{validityText(validUntil)}</dd>
                {code && <><dt className="text-slate-500">Verification code</dt><dd className="font-mono font-semibold">{code}</dd></>}
                <dt className="text-slate-500">Lenders' information up to</dt><dd>{formatDate(dataAsOf)}</dd>
                <dt className="text-slate-500">Issued to</dt><dd>{holder}</dd>
              </dl>
            </div>
            <div className="text-center">
              <QRCodeSVG value={verifyUrl} size={104} level="M" />
              <p className="mt-1 max-w-[120px] text-[9px] leading-tight text-slate-500">Scan to verify this report at cic.gov.mm/verify</p>
            </div>
          </header>

          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary">1. Identity</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-3">
              <div><dt className="text-slate-500">Name</dt><dd className="font-semibold">{file.nameEn}</dd></div>
              <div><dt className="text-slate-500">NRC</dt><dd className="font-semibold">{maskNrc(file.nrc)}</dd></div>
              <div><dt className="text-slate-500">Date of birth</dt><dd className="font-semibold">{file.dob ? formatDate(file.dob) : '—'}</dd></div>
              <div><dt className="text-slate-500">CIC file number</dt><dd className="font-mono font-semibold">{file.borrowerId}</dd></div>
              <div><dt className="text-slate-500">Mobile</dt><dd className="font-semibold">{maskPhone(file.phone)}</dd></div>
              <div className="col-span-2 sm:col-span-1"><dt className="text-slate-500">Address</dt><dd className="font-semibold">{file.address || [file.township, file.region].filter(Boolean).join(', ') || '—'}</dd></div>
            </dl>
          </section>

          <section className="mt-6 break-inside-avoid">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary">2. CIC credit score</h2>
            {report.noHit ? (
              <p className="mt-2 text-xs text-slate-700">No credit history yet — no licensed lender has reported a loan or guarantee. No score is given.</p>
            ) : (
              <div className="mt-2 flex flex-wrap items-start gap-4 text-xs">
                <span className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl font-bold text-white ${GRADE_TONES[report.grade]}`}>{report.grade}</span>
                <div className="min-w-[220px] flex-1">
                  <p className="text-sm font-semibold">{report.score} / 100 · {report.gradeLabel}</p>
                  <ul className="mt-1 list-disc pl-4 text-slate-600">{report.reasons.map((r) => <li key={r.code}>{r.text}{r.points ? ` (−${r.points})` : ''}</li>)}</ul>
                  <p className="mt-1 text-[11px] text-slate-500">Active loans {report.activeCount} · total owed {formatMMK(report.exposure)} · credit checks in 12 months {report.inquiriesCount}.</p>
                </div>
              </div>
            )}
          </section>

          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary">3. Loans</h2>
            {loans.length === 0 && <p className="mt-2 text-xs text-slate-600">No loans reported.</p>}
            <div className="mt-2 space-y-4">
              {loans.map((l) => {
                const d = openDisputeFor(l.id);
                return (
                  <div key={l.id} className="break-inside-avoid rounded border border-slate-200 p-3 text-xs">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold">{mfiName(l.mfiId)} — {l.product} <span className="font-mono font-normal text-slate-500">{l.id}</span></p>
                      <p>{l.status}{d && <span className="ml-2 rounded bg-violet-100 px-1.5 font-semibold text-violet-800">DISPUTED ({d.id})</span>}</p>
                    </div>
                    <p className="mt-1 text-slate-600">
                      Amount {formatMMK(l.amount)} · Still owed {formatMMK(l.balance)} · {l.dpd ? `${l.dpd} days late` : 'Up to date'} · Lender's rating: {RATING_LABEL[l.classification] ?? l.classification} · Opened {formatDate(l.disbursedAt)}{l.closedAt ? ` · Closed ${formatDate(l.closedAt)}` : ''} · Last update from lender {formatDate(l.dataDate)}
                    </p>
                    <p className="mt-1 font-medium text-slate-800">{summariseHistory(l).text}</p>
                    <div className="mt-2"><RepaymentGrid history={l.history} compact label={`Loan ${l.id}, repayments month by month`} /></div>
                  </div>
                );
              })}
            </div>
            <RepaymentLegend className="mt-3" />
          </section>

          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary">4. Guarantees given</h2>
            {guarantees.length === 0 ? <p className="mt-2 text-xs text-slate-600">None reported.</p> : (
              <table className="mt-2 w-full text-left text-xs">
                <thead className="text-slate-500"><tr><th className="py-1">Lender</th><th>Guarantee for</th><th>Guaranteed</th><th>Status</th><th>Last update</th></tr></thead>
                <tbody>
                  {guarantees.map((g) => (
                    <tr key={g.id} className="border-t border-slate-100">
                      <td className="py-1">{mfiName(g.mfiId)}</td><td>{g.guaranteeFor}</td><td>{formatMMK(g.amount)}</td><td>{g.status}</td><td>{formatDate(g.dataDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <footer className="mt-8 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500">
            This report contains information supplied by licensed MFIs under the Credit Information Reporting Regulation. The CIC grade is
            calculated by the same rules used for lender reports. If any information is wrong you may file a free dispute at cic.gov.mm/borrower. Issued by CIC Borrower Self-Service
            for {holder} at {formatDateTime(generatedAt)}, valid until {formatDate(validUntil)}. Verify authenticity at cic.gov.mm/verify with report ID {reportId}{code ? ` and code ${code}` : ''}.
          </footer>
        </div>
      </div>
    </div>
  );
}
