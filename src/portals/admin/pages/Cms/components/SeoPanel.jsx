import { useEffect, useState } from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Input, Textarea } from '@/components/ui';
import { slugify } from '../../../data/cms';

const META_MAX = 160;

/** SEO fields, slug and OG image (CMS-10). Slug follows the EN title until edited by hand. */
export default function SeoPanel({ draft, onChange, disabled, followTitle }) {
  const [manual, setManual] = useState(false);
  const auto = slugify(draft.title?.en);
  const slug = draft.slug ?? '';

  // New items: slug follows the EN title until the editor types their own.
  useEffect(() => {
    if (followTitle && !manual && !disabled && draft.slug !== auto) onChange({ slug: auto });
  }, [followTitle, manual, disabled, auto, draft.slug, onChange]);
  const meta = draft.seo?.meta ?? '';
  const setSeo = (k, v) => onChange((d) => ({ seo: { ...(d.seo ?? {}), [k]: v } }));

  return (
    <Card>
      <CardHeader title="SEO & sharing" icon={Globe} />
      <CardBody className="space-y-3">
        <div>
          <Input label="URL slug" value={slug} disabled={disabled}
            onChange={(e) => { setManual(true); onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').slice(0, 70) }); }}
            hint={`Public URL: cic.gov.mm/${draft.type ?? 'page'}/${slug || '…'}`} />
          {!disabled && slug !== auto && (
            <Button size="sm" variant="ghost" icon={RefreshCw} className="mt-1" onClick={() => { setManual(false); onChange({ slug: auto }); }}>
              Regenerate from EN title
            </Button>
          )}
        </div>
        <Textarea label="Meta description" rows={3} value={meta} disabled={disabled} maxLength={META_MAX + 40}
          onChange={(e) => setSeo('meta', e.target.value)}
          hint={`${meta.length}/${META_MAX} characters${meta.length > META_MAX ? ' — search engines will truncate this' : ''}`}
          error={meta.length > META_MAX ? `${meta.length - META_MAX} characters over the recommended ${META_MAX}` : undefined} />
        <Input label="OG image" placeholder="e.g. og-announcement.jpg (from Media library)" value={draft.seo?.ogImage ?? ''} disabled={disabled}
          onChange={(e) => setSeo('ogImage', e.target.value)} hint="1200 × 630 px, used when the page is shared on Facebook / Viber." />
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">sitemap.xml regenerates automatically on publish; archived and non-Public items are excluded.</p>
      </CardBody>
    </Card>
  );
}
