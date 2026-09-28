import clsx from 'clsx';
import { useState } from 'react';
import { CalendarDays, Lock, Monitor, Paperclip, Pin, Smartphone } from 'lucide-react';
import { Badge, Modal } from '@/components/ui';
import { typeLabel } from '../../../data/cms';

function Segmented({ label, value, onChange, options }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}
          className={clsx('inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium', value === o.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
          {o.icon && <o.icon className="h-3.5 w-3.5" aria-hidden="true" />}{o.label}
        </button>
      ))}
    </div>
  );
}

/** Preview per device and language before publish (CMS-11). Renders like a Public-portal notice page. */
export default function PreviewModal({ open, onClose, item }) {
  const [device, setDevice] = useState('desktop');
  const [lang, setLang] = useState('en');
  const pick = (f) => (lang === 'mm' ? item[f]?.mm : item[f]?.en);
  const title = pick('title');
  const body = pick('body');
  const missing = lang === 'mm' && (!item.title?.mm || !item.body?.mm);
  const restricted = item.classification && item.classification !== 'Public';
  const date = item.scheduleAt?.slice(0, 10) ?? item.publishedAt ?? item.updatedAt?.slice(0, 10) ?? '—';

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Preview" subtitle="As readers will see it. Nothing is published from here.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented label="Device" value={device} onChange={setDevice} options={[{ id: 'desktop', label: 'Desktop', icon: Monitor }, { id: 'mobile', label: 'Mobile', icon: Smartphone }]} />
        <Segmented label="Language" value={lang} onChange={setLang} options={[{ id: 'en', label: 'English' }, { id: 'mm', label: 'မြန်မာ' }]} />
        {missing && <Badge tone="red">Myanmar text missing — English fallback shown to MM readers</Badge>}
      </div>

      <div className="flex justify-center rounded-xl bg-slate-100 p-4">
        <div className={clsx('overflow-hidden bg-white shadow-lg transition-all', device === 'mobile' ? 'w-full max-w-[375px] rounded-[2rem] border-[10px] border-slate-800' : 'w-full rounded-lg border border-slate-200')}>
          <div className="flex items-center gap-2 bg-primary px-4 py-2.5 text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-warm text-[11px] font-bold text-slate-900">CIC</span>
            <span className="truncate text-xs font-semibold">{lang === 'mm' ? 'ချေးငွေသတင်းအချက်အလက်စင်တာ' : 'Credit Information Centre'}</span>
          </div>
          <div className="relative">
            {restricted && (
              <div className="flex items-center gap-1.5 bg-violet-600 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                <Lock className="h-3 w-3" aria-hidden="true" /> {item.classification} — not visible on the public website
              </div>
            )}
            <article lang={lang === 'mm' ? 'my' : 'en'} className={clsx(device === 'mobile' ? 'p-4' : 'p-8')}>
              <p className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-teal-700">
                {typeLabel(item.type)}{item.category && <> · {item.category}</>}
                {item.pinned && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 normal-case text-amber-800"><Pin className="h-3 w-3" aria-hidden="true" />Featured</span>}
              </p>
              <h1 className={clsx('mt-2 font-bold leading-snug text-slate-900', device === 'mobile' ? 'text-lg' : 'text-2xl', lang === 'mm' && 'leading-relaxed')}>
                {title || item.title?.en || 'Untitled'}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {date}
              </p>
              <div className={clsx('mt-4 whitespace-pre-wrap text-slate-700', device === 'mobile' ? 'text-sm' : 'text-[15px]', lang === 'mm' && 'leading-loose')}>
                {body || item.body?.en || <span className="italic text-slate-500">No body text</span>}
              </div>
              {item.attachment && (
                <p className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-primary"><Paperclip className="h-3.5 w-3.5" aria-hidden="true" />{item.attachment}</p>
              )}
            </article>
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">cic.gov.mm/{item.type}/{item.slug || '…'}</div>
        </div>
      </div>
    </Modal>
  );
}
