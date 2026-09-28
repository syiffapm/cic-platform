import { useEffect, useMemo, useState } from 'react';
import { Globe, Image, Link as LinkIcon, Phone, RotateCcw, Save, Siren } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, Input, MakerCheckerBanner, PageHeader, Select, Textarea, Toggle, useToast } from '@/components/ui';
import { looksLikeZawgyi } from '@/lib/nrc';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminObject } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import { GLOBAL_SETTINGS } from '../../data/cmsExtras';
import BannerPreview, { SEVERITIES } from './extras/BannerPreview';

const LABELS = {
  primaryLogo: 'Primary logo', footerLogo: 'Footer logo', hotline: 'Hotline', email: 'Email', addressEn: 'Address (EN)', addressMm: 'Address (MM)',
  officeHours: 'Office hours', footerLinks: 'Footer links', facebook: 'Facebook', viber: 'Viber', youtube: 'YouTube', telegram: 'Telegram',
  bannerOn: 'Emergency banner', bannerSeverity: 'Banner severity', bannerEn: 'Banner text (EN)', bannerMm: 'Banner text (MM)',
};

const show = (v) => (typeof v === 'boolean' ? (v ? 'On' : 'Off') : String(v ?? '—'));

function LogoSlot({ label, value, onChange, readOnly, dark }) {
  return (
    <div className="space-y-2">
      <div className={`flex h-24 items-center justify-center rounded-lg border border-slate-200 ${dark ? 'bg-primary' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${dark ? 'bg-white text-primary' : 'bg-primary text-white'}`}>CIC</span>
          <span className={`text-xs font-semibold ${dark ? 'text-white' : 'text-primary'}`}>{value || 'No file'}</span>
        </div>
      </div>
      <Input label={label} value={value} disabled={readOnly} onChange={onChange} hint="Media library file name (SVG/PNG, Clean scan)" />
    </div>
  );
}

export default function GlobalSettings() {
  const { user, can, requestApproval } = useAdmin('cms.settings');
  const readOnly = !can('update');
  const toast = useToast();
  const [live] = useAdminObject('cmsGlobalSettings', GLOBAL_SETTINGS);
  const [draft, setDraft] = useState(live);
  const [errors, setErrors] = useState({});

  useEffect(() => { setDraft(live); }, [live]);

  const diff = useMemo(() => Object.keys(LABELS).filter((k) => draft[k] !== live[k]).map((k) => ({ field: LABELS[k], from: show(live[k]), to: show(draft[k]) })), [draft, live]);
  const bind = (key) => ({ value: draft[key] ?? '', disabled: readOnly, onChange: (e) => setDraft((d) => ({ ...d, [key]: e.target.value })) });

  const save = () => {
    const e = {};
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(draft.email)) e.email = 'Enter a valid email address.';
    ['addressMm', 'bannerMm'].forEach((k) => { if (draft[k] && looksLikeZawgyi(draft[k])) e[k] = 'Looks like Zawgyi — use Myanmar Unicode.'; });
    if (draft.bannerOn && (!draft.bannerEn.trim() || !draft.bannerMm.trim())) e.banner = 'Banner needs both EN and MM text when switched on.';
    ['facebook', 'youtube', 'telegram'].forEach((k) => { if (draft[k] && !/^https:\/\//.test(draft[k])) e[k] = 'Use an https:// link.'; });
    setErrors(e);
    if (Object.keys(e).length) { toast('Fix the highlighted fields', 'danger'); return; }
    const changes = Object.fromEntries(Object.keys(LABELS).filter((k) => draft[k] !== live[k]).map((k) => [k, draft[k]]));
    const apr = requestApproval({
      type: 'Global settings change',
      summary: `Global settings: ${diff.map((d) => d.field).join(', ')}`,
      checkerRole: 'adm_publisher',
      payload: { diff, effect: { target: 'admin', collection: 'cmsGlobalSettings', op: 'set', changes } },
    });
    toast(`${apr.id} sent to a Publisher — changes go live after approval`, 'success');
  };

  const links = (draft.footerLinks ?? '').split('\n').filter(Boolean).map((l) => l.split('|'));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global settings"
        subtitle="Logos, contact details, footer, social links and the emergency banner shown on every Public page."
        actions={(
          <div className="flex gap-2">
            <Button variant="ghost" icon={RotateCcw} disabled={readOnly || diff.length === 0} onClick={() => { setDraft(live); setErrors({}); }}>Discard</Button>
            <Button icon={Save} disabled={readOnly || diff.length === 0} onClick={save}>Save for approval{diff.length ? ` (${diff.length})` : ''}</Button>
          </div>
        )}
      />
      <MakerCheckerBanner maker={user?.name} checker="CMS Publisher (adm_publisher)" note="Saved settings become a pending request with a field-by-field diff; they reach the Public portal only after a Publisher approves." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader icon={Siren} title="Emergency banner" subtitle="Site-wide notice above the header (outages, fraud warnings, disasters)" action={<Badge tone={draft.bannerOn ? 'red' : 'slate'}>{draft.bannerOn ? 'On' : 'Off'}</Badge>} />
            <CardBody className="space-y-4">
              <Toggle label="Show emergency banner" description="Appears on all Public pages in both languages" checked={!!draft.bannerOn} onChange={(v) => !readOnly && setDraft((d) => ({ ...d, bannerOn: v }))} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Select label="Severity" options={SEVERITIES} {...bind('bannerSeverity')} />
                <Textarea className="md:col-span-2" label="Text (EN)" rows={2} maxLength={180} {...bind('bannerEn')} error={errors.banner} />
              </div>
              <Textarea label="Text (MM)" rows={2} maxLength={240} lang="my" {...bind('bannerMm')} error={errors.bannerMm} />
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-600">Preview</p>
                <BannerPreview on={draft.bannerOn} severity={draft.bannerSeverity} en={draft.bannerEn} mm={draft.bannerMm} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={Phone} title="Contact details" subtitle="Shown in the footer, Help block and contact page" />
            <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Hotline" {...bind('hotline')} />
              <Input label="Email" type="email" {...bind('email')} error={errors.email} />
              <Textarea label="Address (EN)" rows={2} {...bind('addressEn')} />
              <Textarea label="Address (MM)" rows={2} lang="my" {...bind('addressMm')} error={errors.addressMm} />
              <Input className="md:col-span-2" label="Office hours" {...bind('officeHours')} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={LinkIcon} title="Footer & social links" />
            <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Textarea className="md:col-span-2" label="Footer links" rows={4} hint="One per line: Label|/path" {...bind('footerLinks')} />
              <Input label="Facebook" {...bind('facebook')} error={errors.facebook} />
              <Input label="Viber" {...bind('viber')} />
              <Input label="YouTube" {...bind('youtube')} error={errors.youtube} />
              <Input label="Telegram" {...bind('telegram')} error={errors.telegram} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader icon={Image} title="Logos" />
            <CardBody className="space-y-5">
              <LogoSlot label="Primary logo (header)" {...bind('primaryLogo')} readOnly={readOnly} />
              <LogoSlot label="Footer logo" {...bind('footerLogo')} readOnly={readOnly} dark />
            </CardBody>
          </Card>
          <Card>
            <CardHeader icon={Globe} title="Footer preview" />
            <CardBody>
              <div className="space-y-2 rounded-lg bg-primary p-4 text-[11px] text-primary-100">
                <p className="font-semibold text-white">{draft.hotline}</p>
                <p>{draft.email} · {draft.officeHours}</p>
                <p>{draft.addressEn}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-white/15 pt-2 text-white">
                  {links.map(([label, href]) => <span key={`${label}${href}`} title={href}>{label}</span>)}
                </div>
                <p className="text-primary-200">Facebook · Viber · YouTube · Telegram</p>
              </div>
            </CardBody>
          </Card>
          {diff.length > 0 && (
            <Card>
              <CardHeader title="Pending diff" subtitle="What the checker will see" />
              <ul className="divide-y divide-slate-100 text-xs">
                {diff.map((d) => (
                  <li key={d.field} className="px-5 py-2.5">
                    <p className="font-medium text-slate-800">{d.field}</p>
                    <p className="text-red-600 line-through">{d.from}</p>
                    <p className="text-emerald-700">{d.to}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <PendingApprovals moduleLabel="CMS" />
        </div>
      </div>
    </div>
  );
}
