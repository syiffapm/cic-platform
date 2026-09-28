import { Link } from 'react-router-dom';
import { Building2, HandCoins, SearchX, ShieldCheck, Sprout, UserRound } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, EmptyState } from '@/components/ui';
import { formatDate, formatMMK, maskNrc, maskPhone } from '@/lib/format';
import { FIELD_HELP } from '../lib/myFile';
import { mfiName } from '../lib/borrower';
import { Explain, Fact } from './Common';

/** Identity block with masked NRC / phone. */
export function IdentityBlock({ file }) {
  return (
    <Card>
      <CardHeader title="Who this report is about" subtitle="Check these details first. If they are wrong, file a dispute with reason “Personal details incorrect”." icon={UserRound} />
      <CardBody>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Full name" value={<>{file.nameEn}{file.nameMm && <span className="ml-1.5 font-normal text-slate-500" lang="my">{file.nameMm}</span>}</>} />
          <Fact label="NRC" value={maskNrc(file.nrc)} help="Part of your NRC is hidden with dots so people looking over your shoulder cannot copy it." />
          {file.previousNrc && <Fact label="Previous NRC (linked)" value={maskNrc(file.previousNrc)} help="Loans reported under your old NRC number are linked to your file." />}
          <Fact label="Date of birth" value={file.dob ? formatDate(file.dob) : 'Not reported yet'} />
          <Fact label="Father's name" value={file.fatherName || 'Not reported yet'} />
          <Fact label="Mobile" value={maskPhone(file.phone)} />
          <Fact label="CIC file number" value={<span className="font-mono">{file.borrowerId}</span>} help="The number CIC uses for your file. Quote it when you call the helpdesk." />
          <Fact label="Occupation (latest reported)" value={file.occupation || 'Not reported yet'} />
          <Fact label="Address (latest reported)" value={file.address || [file.township, file.region].filter(Boolean).join(', ') || 'Not reported yet'} className="sm:col-span-2 lg:col-span-1" />
        </dl>
      </CardBody>
    </Card>
  );
}

/** Loans the borrower has guaranteed for someone else. */
export function GuaranteesBlock({ guarantees }) {
  return (
    <Card>
      <CardHeader title="Loans I have guaranteed" subtitle="You signed as guarantor for these loans or groups." icon={ShieldCheck} />
      <CardBody className="space-y-3">
        {guarantees.length === 0 && <EmptyState compact title="You have not guaranteed anyone's loan" description="If a lender says you are a guarantor and this list is empty, contact the helpdesk." />}
        {guarantees.map((g) => (
          <div key={g.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Guarantee for {g.guaranteeFor}</p>
              <Badge status={g.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Fact label="Lender" value={mfiName(g.mfiId)} />
              <Fact label="Amount guaranteed" value={formatMMK(g.amount)} />
              <Fact label="Last update from lender" value={formatDate(g.dataDate)} help={FIELD_HELP.dataDate} />
            </dl>
          </div>
        ))}
        {guarantees.length > 0 && <Explain>{FIELD_HELP.guarantee}</Explain>}
      </CardBody>
    </Card>
  );
}

/** A file with no loans: never a score, and an explanation of how credit history starts. */
export function NoHitResult({ compact = false }) {
  const steps = [
    { icon: Building2, title: 'Borrow from a licensed MFI', text: 'Choose a lender from the public MFI directory. Only licensed institutions report to CIC.' },
    { icon: HandCoins, title: 'The lender reports every month', text: 'Your loan and each repayment are sent to CIC by the 10th of the following month.' },
    { icon: Sprout, title: 'Your history grows', text: 'After the first monthly report you get a CIC grade. Paying on time builds a strong record.' },
  ];
  return (
    <Card>
      <CardBody className={compact ? 'py-6' : 'py-10'}>
        <div className="text-center">
          <SearchX className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold text-slate-900">No credit history yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
            No licensed lender has reported a loan or guarantee linked to your NRC. That is normal if you have never borrowed from a
            licensed MFI. CIC does not give a score without history — having no record is <strong>not</strong> a bad mark.
          </p>
        </div>
        <ol className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] text-white">{i + 1}</span><s.icon className="h-4 w-4 text-teal-700" aria-hidden="true" />{s.title}</p>
              <p className="mt-1.5 text-xs text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-5 max-w-3xl space-y-1.5 text-xs text-slate-600">
          <p><strong>If a lender checks your file</strong> they also see “No credit history”, never a number or grade.</p>
          <p><strong>Think a loan is missing?</strong> Ask your lender to check your NRC in their records, or <Link to="/borrower/data-requests" className="font-semibold text-primary underline">ask CIC to correct your data</Link>.</p>
          <p><strong>Ready to borrow?</strong> <Link to="/borrower/loans/apply" className="font-semibold text-primary underline">Apply online with a licensed MFI</Link>.</p>
        </div>
      </CardBody>
    </Card>
  );
}
