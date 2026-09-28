import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Globe, HandCoins, Mail, MapPin, MessageSquareWarning, Package, Phone } from 'lucide-react';
import { Alert, Badge, Card, CardBody, CardHeader, Timeline } from '@/components/ui';
import { LICENCE_HISTORY } from '@/data/institutions';
import { useStore } from '@/context/StoreContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatDate, formatNumber } from '@/lib/format';
import NotFound from '@/pages/NotFound';
import PageHero, { PageBody } from '../../components/PageHero';
import LicenceBadge from '../../components/LicenceBadge';

function MapEmbed({ lat, lng, name }) {
  const d = 0.02;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div>
      <iframe title={`Map showing head office of ${name}`} src={src} loading="lazy" className="h-64 w-full rounded-lg border border-slate-200" />
      <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline">Open larger map (new tab)</a>
    </div>
  );
}

/** MFI profile. Reads only published Institution Master records. */
export default function MfiProfilePage() {
  const { id } = useParams();
  const { institutions } = useStore();
  const { t } = useI18n();
  const mfi = institutions.find((i) => i.id === id && i.publish === true);
  if (!mfi) return <NotFound />;

  const history = LICENCE_HISTORY[mfi.id] ?? [{ date: mfi.licensedSince, status: 'Licensed', note: 'Initial licence granted' }];
  const blocked = ['Suspended', 'Revoked'].includes(mfi.status);
  const contact = [
    { icon: MapPin, label: 'Head office', value: mfi.address },
    { icon: Phone, label: 'Phone', value: mfi.phone, href: `tel:${mfi.phone.replace(/\s/g, '')}` },
    mfi.email && { icon: Mail, label: 'Email', value: mfi.email, href: `mailto:${mfi.email}` },
    mfi.website && { icon: Globe, label: 'Website', value: mfi.website, href: `https://${mfi.website}` },
  ].filter(Boolean);

  return (
    <>
      <PageHero title={mfi.name} subtitle={`${mfi.type} · ${mfi.township}, ${mfi.region}`} breadcrumbs={[{ label: t('public.nav.directory'), to: '/mfi-directory' }, { label: mfi.short }]}>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-lg bg-white/10 px-3 py-1.5 font-mono text-xs">Licence {mfi.licenceNo}</span>
          <LicenceBadge status={mfi.status} />
        </div>
      </PageHero>
      <PageBody className="space-y-6">
        {blocked && (
          <Alert tone="danger" title={`This institution's licence is ${mfi.status.toLowerCase()}`}>
            {mfi.status === 'Suspended'
              ? 'It may not make new loans while suspended. Existing borrowers should keep repaying as agreed and may contact the helpdesk with questions.'
              : 'It is no longer allowed to offer microfinance services. Do not take new loans from this institution.'}
            {' '}If you are asked to pay or borrow, <Link to={`/help/grievance?mfi=${mfi.id}`} className="font-semibold underline">report it to CIC</Link>.
          </Alert>
        )}
        {mfi.status === 'Under Review' && (
          <Alert tone="warning" title="Under supervisory review">The licence is valid, but the Central Bank is reviewing this institution. Its status may change.</Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Licence no.', mfi.licenceNo], ['Licensed since', formatDate(mfi.licensedSince)], ['Branches', formatNumber(mfi.branches)], ['Tier', mfi.tier]].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 bg-white p-4">
                  <dt className="text-[11px] text-slate-500">{k}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            <Card>
              <CardHeader title="Licence status history" subtitle="From the CBM Institution Master" />
              <CardBody>
                <Timeline items={[...history].reverse().map((h, idx) => ({ title: <LicenceBadge status={h.status} />, time: formatDate(h.date), description: h.note, tone: idx === 0 ? 'current' : 'done' }))} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Location" icon={MapPin} />
              <CardBody>
                <p className="mb-3 text-sm text-slate-700">{mfi.address}</p>
                <MapEmbed lat={mfi.lat} lng={mfi.lng} name={mfi.name} />
              </CardBody>
            </Card>
          </div>
          <aside className="space-y-6">
            {mfi.status === 'Licensed' && mfi.products.length > 0 && (
              <div className="rounded-xl bg-primary p-5 text-white shadow-sm">
                <HandCoins className="h-6 w-6 text-warm" aria-hidden="true" />
                <p className="mt-2 text-base font-semibold">Apply for a loan with this MFI</p>
                <p className="mt-1 text-xs text-primary-100">Apply online through your CIC account. You choose the product and give {mfi.short} a one-time consent to check your credit report. Follow the decision step by step.</p>
                <Link to={`/borrower/loans/apply?mfi=${mfi.id}`} onClick={() => { try { sessionStorage.setItem('cic.applyMfi', mfi.id); } catch { /* storage unavailable */ } }} className="mt-4 inline-flex h-10 items-center rounded-lg bg-warm px-4 text-sm font-semibold text-slate-900 hover:brightness-95">Apply online</Link>
                <p className="mt-2 text-[11px] text-primary-200">No account yet? <Link to="/my-credit" className="font-semibold text-white underline">How to get access</Link></p>
              </div>
            )}
            <Card>
              <CardHeader title="Contact" />
              <CardBody>
                <ul className="space-y-3">
                  {contact.map((c) => (
                    <li key={c.label} className="flex gap-2.5 text-sm">
                      <c.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-500">{c.label}</p>
                        {c.href ? <a href={c.href} className="break-words text-primary hover:underline">{c.value}</a> : <p className="text-slate-700">{c.value}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Loan products" icon={Package} />
              <CardBody>
                {mfi.products.length
                  ? <ul className="flex flex-wrap gap-2">{mfi.products.map((p) => <li key={p}><Badge tone="teal">{p}</Badge></li>)}</ul>
                  : <p className="text-sm text-slate-500">No products currently offered.</p>}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Branches" icon={Building2} />
              <CardBody>
                <p className="text-sm text-slate-700"><strong className="text-2xl text-primary">{formatNumber(mfi.branches)}</strong> branch offices</p>
                <p className="mt-1 text-xs text-slate-500">Head office in {mfi.township}, {mfi.region}. Ask the institution for the branch nearest you.</p>
              </CardBody>
            </Card>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <MessageSquareWarning className="h-5 w-5 text-amber-700" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-slate-900">Problem with this MFI?</p>
              <p className="mt-1 text-xs text-slate-700">Unfair collection, hidden fees or a closed office — tell us. Complaints go to the Central Bank's consumer-protection team.</p>
              <Link to={`/help/grievance?mfi=${mfi.id}`} className="mt-3 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-700">File a complaint about this MFI</Link>
            </div>
          </aside>
        </div>
        <Link to="/mfi-directory" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to directory</Link>
      </PageBody>
    </>
  );
}
