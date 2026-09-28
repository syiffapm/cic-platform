import clsx from 'clsx';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, Circle, Eye, FileSearch, PartyPopper, X } from 'lucide-react';
import { Card, CardBody } from '@/components/ui';
import { useOwnState } from '../lib/borrower';
import { useReportRequests } from '../lib/reports';

const ITEMS = [
  { id: 'report', to: '/borrower/requests/new', icon: FileSearch, title: 'Request your first credit report', text: 'CIC validates your data and an officer approves it — usually within 1 working day. Then you see your grade and every loan.' },
  { id: 'viewed', to: '/borrower/who-viewed', icon: Eye, title: 'Check who viewed my report', text: 'Every lender that checked your file, when and why.' },
  { id: 'alerts', to: '/borrower/alerts', icon: Bell, title: 'Set up my alerts', text: 'Get an SMS when a lender checks you or reports a new loan.' },
];

/** First-time onboarding checklist, shown after registration until dismissed or completed. */
export default function WelcomeChecklist({ firstVisit }) {
  const [state, setState] = useOwnState('onboarding');
  const { requests } = useReportRequests();
  const done = { ...(Array.isArray(state) ? {} : state), ...(requests.length ? { report: true } : {}) };
  const mark = (id) => setState((s) => ({ ...(Array.isArray(s) ? {} : s), [id]: true }));
  useEffect(() => { if (firstVisit && !done.started) mark('started'); }, [firstVisit, done.started]); // eslint-disable-line react-hooks/exhaustive-deps
  const complete = ITEMS.filter((i) => done[i.id]).length;
  if (done.dismissed || !(firstVisit || done.started)) return null;

  return (
    <Card className="mb-6 border-teal-200 bg-teal-50/40">
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-slate-900">{firstVisit ? 'Your account is ready' : 'Get started'}</h2>
              <p className="text-sm text-slate-600">Three quick things to do first · {complete} of {ITEMS.length} done</p>
            </div>
          </div>
          <button type="button" onClick={() => setState((s) => ({ ...(Array.isArray(s) ? {} : s), dismissed: true }))} className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-600" aria-label="Hide the getting-started checklist">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full bg-teal transition-all" style={{ width: `${(complete / ITEMS.length) * 100}%` }} /></div>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {ITEMS.map((i) => (
            <li key={i.id}>
              <Link to={i.to} onClick={() => mark(i.id)} className={clsx('flex h-full gap-3 rounded-lg border bg-white p-3 transition-colors hover:border-primary-300', done[i.id] ? 'border-emerald-200' : 'border-slate-200')}>
                {done[i.id] ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Done" /> : <Circle className="h-5 w-5 shrink-0 text-slate-300" aria-label="Not done yet" />}
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><i.icon className="h-4 w-4 text-primary" aria-hidden="true" />{i.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{i.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
