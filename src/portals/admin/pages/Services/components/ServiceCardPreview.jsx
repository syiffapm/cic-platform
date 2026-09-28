import { ArrowRight, FileText, icons } from 'lucide-react';
import { Badge } from '@/components/ui';

/** Mirrors the Public portal service card (Portal 1 · Services) so editors see what citizens will see. */
export default function ServiceCardPreview({ service, lang = 'en' }) {
  const Icon = icons[service.icon] ?? FileText;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <span className="h-fit rounded-lg bg-primary-50 p-2.5 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-slate-500">{service.id}</span>
            <Badge tone="teal">{service.audience}</Badge>
          </div>
          <h4 className={`mt-1 font-semibold text-slate-900 ${lang === 'mm' ? 'leading-relaxed' : ''}`} lang={lang === 'mm' ? 'my' : 'en'}>
            {service.title?.[lang] || <span className="italic text-slate-500">Missing {lang.toUpperCase()} title</span>}
          </h4>
          <p className="mt-1 text-sm text-slate-600">{service.summary}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-slate-500">Fee</dt><dd className="font-medium text-slate-700">{service.fee}</dd></div>
            <div><dt className="text-slate-500">Service level</dt><dd className="font-medium text-slate-700">{service.sla}</dd></div>
            <div className="col-span-2"><dt className="text-slate-500">Channel</dt><dd className="font-medium text-slate-700">{service.channel}</dd></div>
          </dl>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">View details <ArrowRight className="h-3 w-3" aria-hidden="true" /></span>
        </div>
      </div>
    </div>
  );
}
