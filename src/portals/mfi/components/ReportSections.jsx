import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui';
import { PURPOSE_CODES } from '@/data/reference';
import { formatDate, formatMMK } from '@/lib/format';
import RepaymentGrid from './RepaymentGrid';
import { GRADE_TONES, RULE_VERSION, mfiName } from './reportModel';
import { LockedSection } from './reportAccess/AccessNotes';

const purposeLabel = (c) => PURPOSE_CODES.find((p) => p.code === c)?.label ?? c;

function Section({ title, children, note }) {
  return (
    <section className="break-inside-avoid space-y-3">
      <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-1.5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h3>
        {note && <span className="text-[11px] text-slate-500">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function Pair({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value || '—'}</dd>
    </div>
  );
}

const dpdTone = (dpd) => (dpd > 30 ? 'text-red-700' : dpd > 0 ? 'text-amber-700' : 'text-slate-700');

function LoanTable({ loans, tenant }) {
  return (
    <>
    {/* Phones: one card per loan. */}
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 sm:hidden print:hidden">
      {loans.map((l) => (
        <li key={l.loanId} className="space-y-1 px-3 py-2.5 text-xs">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-slate-800">{mfiName(l.mfiId)}{l.mfiId === tenant && <span className="block text-[11px] font-normal text-teal-700">your institution</span>}</span>
            <span className={clsx('shrink-0 font-semibold', dpdTone(l.dpd))}>{l.dpd} DPD</span>
          </div>
          <p className="font-mono text-slate-600">{l.loanId}{l.disputed && <Badge tone="violet" className="ml-1 font-sans">Under dispute</Badge>}</p>
          <p className="text-slate-600">{l.product} · {formatMMK(l.amount)} disbursed {formatDate(l.disbursed)}</p>
          <p className="text-slate-700"><span className="text-slate-500">Outstanding </span><b>{l.status === 'Active' ? formatMMK(l.outstanding) : `Closed ${l.closedOn ? formatDate(l.closedOn) : ''}`}</b> · {l.classification} · data {formatDate(l.dataDate)}</p>
        </li>
      ))}
    </ul>
    <div className="hidden overflow-x-auto scrollbar-thin sm:block print:block" tabIndex={0} role="region" aria-label="Loans — scroll horizontally for more columns">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>{['Institution', 'Loan ID', 'Product', 'Disbursed', 'Amount', 'Outstanding', 'DPD', 'Class', 'Data date'].map((h) => <th key={h} scope="col" className="whitespace-nowrap px-2.5 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loans.map((l) => (
            <tr key={l.loanId}>
              <td className="px-2.5 py-2">{mfiName(l.mfiId)}{l.mfiId === tenant && <span className="block text-[11px] text-teal-700">your institution</span>}</td>
              <td className="whitespace-nowrap px-2.5 py-2 font-mono">{l.loanId}{l.disputed && <Badge tone="violet" className="ml-1">Under dispute</Badge>}</td>
              <td className="px-2.5 py-2">{l.product}</td>
              <td className="whitespace-nowrap px-2.5 py-2">{formatDate(l.disbursed)}</td>
              <td className="whitespace-nowrap px-2.5 py-2">{formatMMK(l.amount)}</td>
              <td className="whitespace-nowrap px-2.5 py-2 font-medium">{l.status === 'Active' ? formatMMK(l.outstanding) : `Closed ${l.closedOn ? formatDate(l.closedOn) : ''}`}</td>
              <td className={clsx('px-2.5 py-2 font-semibold', dpdTone(l.dpd))}>{l.dpd}</td>
              <td className="px-2.5 py-2">{l.classification}</td>
              <td className="whitespace-nowrap px-2.5 py-2 text-slate-500">{formatDate(l.dataDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

/** Report body. Full-only sections are replaced by a locked card while only the Basic report is unlocked. */
export default function ReportSections({ borrower: b, model: m, reportType, tenant, onUpgrade, upgradeFeature, upgradeAction }) {
  const full = reportType === 'Full';
  return (
    <div className="space-y-7">
      <div className="grid gap-6 md:grid-cols-3">
        <Section title="Identity">
          <dl className="grid grid-cols-2 gap-3">
            <Pair label="Name" value={<>{b.nameEn} <span className="font-normal text-slate-500">{b.nameMm}</span></>} />
            <Pair label="CIC borrower ID" value={b.borrowerId} />
            <Pair label="NRC" value={b.nrc} />
            <Pair label="Previous NRC" value={b.previousNrc} />
            <Pair label="Date of birth" value={b.dob ? formatDate(b.dob) : ''} />
            <Pair label="Gender" value={b.gender} />
            <Pair label="Father's name" value={b.fatherName} />
            <Pair label="Township / region" value={[b.township, b.region].filter(Boolean).join(', ')} />
            {full && <Pair label="Address" value={b.address} />}
            {full && <Pair label="Occupation · household" value={[b.occupation, b.householdSize ? `${b.householdSize} persons` : null].filter(Boolean).join(' · ')} />}
          </dl>
        </Section>
        <div className="md:col-span-2">
          <Section title="Rule-based grade" note={`Rule version ${RULE_VERSION}`}>
            {m.grade == null ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">No credit record — this is not a low score</p>
                <p className="mt-1 text-xs text-slate-600">
                  No licensed institution has reported a loan or guarantee for this person, so no grade is produced. The person may be new to formal credit.
                  Assess the application on income, references and your own product rules; do not treat the absence of a record as a negative signal.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 px-6 py-4">
                  <span className={clsx('flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold text-white', GRADE_TONES[m.grade])} role="img" aria-label={`Grade ${m.grade}`}>{m.grade}</span>
                  <span className="mt-2 text-xs font-medium text-slate-700">{m.gradeLabel}</span>
                  <span className="text-[11px] text-slate-500">Points {m.score}/100</span>
                </div>
                {full ? (
                  <ul className="flex-1 space-y-1.5">
                    {m.reasons.map((r) => (
                      <li key={r.code} className="flex items-start gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs">
                        <span className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">{r.code}</span>
                        <span className="flex-1 text-slate-700">{r.text}</span>
                        {r.points > 0 && <span className="text-[11px] text-slate-500">−{r.points}</span>}
                      </li>
                    ))}
                    <li className="text-[11px] text-slate-500">The grade is a transparent rule-based indicator, not a statistical score. Lending decisions remain with the institution.</li>
                  </ul>
                ) : (
                  <p className="flex-1 self-center text-xs text-slate-600">{m.gradeLabel}. Grade reason codes are included in the Full report. The grade is a transparent rule-based indicator; lending decisions remain with the institution.</p>
                )}
              </div>
            )}
          </Section>
        </div>
      </div>

      <Section title="Summary across all institutions" note="Data as of 31 Aug 2026">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Pair label="Active loans" value={m.active.length} />
          <Pair label="Institutions" value={m.institutions.length} />
          <Pair label="Total exposure" value={formatMMK(m.exposure)} />
          <Pair label="Delinquency" value={m.worstDpd > 0 ? `Yes — ${m.worstDpd} days past due` : 'None — all loans current'} />
          <Pair label="Worst current DPD" value={m.worstDpd} />
          {full && <Pair label="Guarantee exposure" value={formatMMK(m.guaranteeExposure)} />}
          {full && <Pair label="Inquiries (12 months)" value={m.inquiries.length} />}
        </dl>
      </Section>

      {m.disputeFlags.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Dispute flags</p>
            {full
              ? m.disputeFlags.map((d) => <p key={d.id}>{d.id} · loan {d.loanId} ({mfiName(d.mfiId)}) · {d.status} since {formatDate(d.filedAt)}</p>)
              : <p>{m.disputeFlags.length} record(s) under dispute — details in the Full report.</p>}
          </div>
        </div>
      )}

      <Section title={`Active loans (${m.active.length})`}>{m.active.length ? <LoanTable loans={m.active} tenant={tenant} /> : <p className="text-xs text-slate-500">None reported.</p>}</Section>

      {full ? (
        <>
          <Section title="24-month payment history" note="Sep 2024 – Aug 2026"><RepaymentGrid loans={b.loans} /></Section>
          <Section title={`Closed loans (${m.closed.length})`}>{m.closed.length ? <LoanTable loans={m.closed} tenant={tenant} /> : <p className="text-xs text-slate-500">None reported.</p>}</Section>
          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Guarantees given">
              {b.guarantees.length ? b.guarantees.map((g) => (
                <p key={g.guaranteeFor} className="text-xs text-slate-700">{g.guaranteeFor} · {mfiName(g.mfiId)} · {formatMMK(g.amount)} · {g.status} <span className="text-slate-500">(data {formatDate(g.dataDate)})</span></p>
              )) : <p className="text-xs text-slate-500">None reported.</p>}
            </Section>
            <Section title="Inquiries in the last 12 months">
              <ul className="space-y-1 text-xs text-slate-700">
                {m.inquiries.map((q, i) => <li key={i}>{formatDate(q.at)} · {mfiName(q.mfiId)} · {purposeLabel(q.purpose)}</li>)}
                {m.inquiries.length === 0 && <li className="text-slate-500">None.</li>}
              </ul>
            </Section>
          </div>
        </>
      ) : (
        <LockedSection onUpgrade={onUpgrade} feature={upgradeFeature} action={upgradeAction} />
      )}
    </div>
  );
}
