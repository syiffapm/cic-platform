import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, HelpCircle, Search, ThumbsDown, ThumbsUp } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { readLocal, writeLocal } from '../../lib/storage';

const VOTES_KEY = 'cic.public.faqVotes';

/** FAQ with categories, search and helpfulness votes. */
export default function FaqList({ openId }) {
  const { faqs, patch } = useStore();
  const { bi } = useI18n();
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(openId ? [openId] : []);
  const [votes, setVotes] = useState(() => readLocal(VOTES_KEY, {}));

  useEffect(() => {
    if (!openId) return;
    setOpen((o) => (o.includes(openId) ? o : [...o, openId]));
    document.getElementById(`faq-${openId}`)?.scrollIntoView({ block: 'center' });
  }, [openId]);

  const categories = useMemo(() => [...new Set(faqs.map((f) => f.category))], [faqs]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return faqs.filter((f) => (!category || f.category === category)
      && (!needle || `${bi(f.q)} ${bi(f.a)} ${f.q.en} ${f.a.en}`.toLowerCase().includes(needle)));
  }, [faqs, category, q, bi]);

  const toggle = (id) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const vote = (f, up) => {
    if (votes[f.id]) return;
    const next = { ...votes, [f.id]: up ? 'up' : 'down' };
    setVotes(next);
    writeLocal(VOTES_KEY, next);
    if (up) patch('faqs', f.id, (x) => ({ helpful: (x.helpful ?? 0) + 1 }));
  };

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="FAQ categories" className="flex flex-wrap gap-2">
          {['', ...categories].map((c) => (
            <button key={c || 'all'} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
              className={clsx('rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset', category === c ? 'bg-primary text-white ring-primary' : 'bg-white text-slate-600 ring-slate-200 hover:ring-primary-300')}>
              {c || 'All topics'}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <label htmlFor="faq-search" className="sr-only">Search the FAQ</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input id="faq-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions…" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm" />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No questions match" description="Try other words, ask the CIC assistant, or contact the helpdesk." compact />
      ) : (
        <ul className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          {list.map((f) => {
            const isOpen = open.includes(f.id);
            return (
              <li key={f.id} id={`faq-${f.id}`}>
                <h3>
                  <button type="button" aria-expanded={isOpen} aria-controls={`faq-a-${f.id}`} onClick={() => toggle(f.id)} className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left">
                    <span>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-teal-700">{f.category}</span>
                      <span className="mt-0.5 block text-sm font-semibold text-slate-900">{bi(f.q)}</span>
                    </span>
                    <ChevronDown className={clsx('mt-3 h-4 w-4 shrink-0 text-slate-500 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
                  </button>
                </h3>
                {isOpen && (
                  <div id={`faq-a-${f.id}`} className="px-5 pb-5">
                    <p className="text-sm leading-relaxed text-slate-700">{bi(f.a)}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {votes[f.id] ? (
                        <span role="status">Thank you for your feedback.</span>
                      ) : (
                        <>
                          <span>Was this helpful?</span>
                          <button type="button" onClick={() => vote(f, true)} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-emerald-50 hover:text-emerald-700"><ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />Yes</button>
                          <button type="button" onClick={() => vote(f, false)} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-red-50 hover:text-red-700"><ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />No</button>
                        </>
                      )}
                      <span className="ml-auto text-[11px]">{f.helpful} people found this helpful</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
