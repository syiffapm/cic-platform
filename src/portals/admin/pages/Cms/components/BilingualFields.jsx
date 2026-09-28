import { useState } from 'react';
import { ClipboardPaste, Languages, Wand2 } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Input, Textarea, useToast } from '@/components/ui';
import { looksLikeZawgyi } from '@/lib/nrc';
import { UNICODE_SAMPLE, ZAWGYI_SAMPLE } from '../../../data/cms';
import { stampSec as stamp, translationStatus } from './cmsLogic';

/**
 * EN and MM side by side (CMS-03) with Zawgyi detection on paste into Myanmar fields (CMS-02).
 * onChange receives a function (draft) => changes.
 */
export default function BilingualFields({ draft, onChange, disabled, onAudit }) {
  const toast = useToast();
  const [zawgyi, setZawgyi] = useState(null); // 'title' | 'body' | null
  const tr = translationStatus(draft);

  const setLang = (field, lang, value) => onChange((d) => ({
    [field]: { ...d[field], [lang]: value },
    ...(lang === 'en' ? { enUpdatedAt: stamp() } : { mmUpdatedAt: stamp() }),
  }));

  const onMmPaste = (field) => (e) => {
    const text = e.clipboardData?.getData('text') ?? '';
    if (looksLikeZawgyi(text)) setZawgyi(field);
  };

  const simulatePaste = () => {
    if (disabled) return;
    setLang('body', 'mm', `${draft.body?.mm ? `${draft.body.mm}\n` : ''}${ZAWGYI_SAMPLE}`);
    setZawgyi('body');
  };

  const convert = () => {
    setLang(zawgyi, 'mm', UNICODE_SAMPLE[zawgyi]);
    onAudit?.('CONTENT_ZAWGYI_CONVERTED', zawgyi);
    toast(`Myanmar ${zawgyi} converted from Zawgyi to Unicode. Please proof-read the result.`, 'success');
    setZawgyi(null);
  };

  const outdatedHint = tr.id === 'outdated' ? 'English changed after the Myanmar text was last updated — review the translation.' : undefined;

  return (
    <Card>
      <CardHeader
        title="Content"
        subtitle="English and Myanmar (Unicode) side by side"
        icon={Languages}
        action={<Badge tone={tr.tone}>Translation: {tr.label}</Badge>}
      />
      <CardBody className="space-y-4">
        {zawgyi && (
          <Alert
            tone="warning"
            title="Zawgyi-encoded text detected"
            action={(
              <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                <Button size="sm" variant="warm" icon={Wand2} onClick={convert}>Convert to Unicode</Button>
                <Button size="sm" variant="ghost" onClick={() => setZawgyi(null)}>Dismiss</Button>
              </div>
            )}
          >
            The text pasted into Myanmar {zawgyi} looks like Zawgyi. CIC portals render Myanmar in Unicode only; Zawgyi text will
            appear garbled for most readers and breaks search.
          </Alert>
        )}
        {outdatedHint && <Alert tone="warning">{outdatedHint}</Alert>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section aria-label="English" className="space-y-3 rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">English</p>
            <Input label="Title (EN)" required value={draft.title?.en ?? ''} disabled={disabled} onChange={(e) => setLang('title', 'en', e.target.value)} />
            <Textarea label="Body (EN)" rows={9} value={draft.body?.en ?? ''} disabled={disabled} onChange={(e) => setLang('body', 'en', e.target.value)} />
          </section>
          <section aria-label="Myanmar" lang="my" className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">မြန်မာ (Myanmar)</p>
              {!disabled && (
                <button type="button" onClick={simulatePaste} className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                  <ClipboardPaste className="h-3 w-3" aria-hidden="true" /> Test Zawgyi conversion
                </button>
              )}
            </div>
            <Input label="Title (MM)" value={draft.title?.mm ?? ''} disabled={disabled} onPaste={onMmPaste('title')}
              onChange={(e) => setLang('title', 'mm', e.target.value)} placeholder="မြန်မာ ခေါင်းစဉ်" />
            <Textarea label="Body (MM)" rows={9} value={draft.body?.mm ?? ''} disabled={disabled} onPaste={onMmPaste('body')}
              onChange={(e) => setLang('body', 'mm', e.target.value)} placeholder="မြန်မာ စာသား (Unicode)"
              hint={draft.mmUpdatedAt ? `MM last updated ${draft.mmUpdatedAt}` : 'No Myanmar text yet'} />
          </section>
        </div>
      </CardBody>
    </Card>
  );
}
