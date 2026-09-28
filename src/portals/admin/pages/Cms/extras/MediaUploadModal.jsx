import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Alert, Button, Field, Input, Modal } from '@/components/ui';
import { looksLikeZawgyi } from '@/lib/nrc';
import { MEDIA_LIMITS } from '../../../data/cmsExtras';

const EMPTY = { file: null, name: '', sizeMb: '', type: 'image', altEn: '', altMm: '' };

const kindOf = (name) => (/\.pdf$/i.test(name) ? 'pdf' : /\.(jpe?g|png|svg|webp|gif)$/i.test(name) ? 'image' : null);

/** CMS-08 upload: mandatory bilingual alt text, size limits per type, then asynchronous virus scan. */
export default function MediaUploadModal({ open, onClose, onUpload }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm((s) => ({ ...s, file: f, name: f.name, sizeMb: (f.size / 1048576).toFixed(2), type: kindOf(f.name) ?? 'unsupported' }));
  };

  const pickRecent = (type) => setForm((s) => ({
    ...s, file: null, type,
    name: type === 'pdf' ? 'mfi-reporting-manual-v5.pdf' : 'township-helpdesk-visit.jpg',
    sizeMb: type === 'pdf' ? '4.70' : '1.85',
  }));

  const close = () => { setForm(EMPTY); setErrors({}); onClose(); };

  const submit = () => {
    const e = {};
    const size = Number(form.sizeMb);
    if (!form.name) e.file = 'Choose a file to upload.';
    else if (form.type === 'unsupported') e.file = 'Only images (JPG, PNG, SVG, WebP) and PDF documents are allowed.';
    else if (size > MEDIA_LIMITS[form.type]) e.file = `File is ${size} MB — the limit for ${form.type === 'pdf' ? 'PDFs' : 'images'} is ${MEDIA_LIMITS[form.type]} MB.`;
    if (!form.altEn.trim()) e.altEn = 'English alt text is mandatory (WCAG 2.1 AA).';
    if (!form.altMm.trim()) e.altMm = 'Myanmar alt text is mandatory.';
    else if (looksLikeZawgyi(form.altMm)) e.altMm = 'Looks like Zawgyi — please enter Myanmar Unicode.';
    setErrors(e);
    if (Object.keys(e).length) return;
    onUpload({ name: form.name, type: form.type, sizeMb: size, altEn: form.altEn.trim(), altMm: form.altMm.trim() });
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Upload media"
      subtitle={`Images ≤ ${MEDIA_LIMITS.image} MB · PDFs ≤ ${MEDIA_LIMITS.pdf} MB · every file is virus-scanned before use`}
      footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button icon={Upload} onClick={submit}>Upload &amp; scan</Button></>}
    >
      <div className="space-y-4">
        <Field label="File" required error={errors.file}>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 focus-within:ring-2 focus-within:ring-warm hover:border-primary-300">
            <Upload className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <span>{form.name ? <><b>{form.name}</b> · {form.sizeMb} MB · {form.type}</> : 'Click to choose an image or PDF'}</span>
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={pick} />
          </label>
        </Field>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Recent files on the CIC shared drive:</span>
          <Button size="sm" variant="outline" onClick={() => pickRecent('image')}>township-helpdesk-visit.jpg</Button>
          <Button size="sm" variant="outline" onClick={() => pickRecent('pdf')}>mfi-reporting-manual-v5.pdf</Button>
          <Button size="sm" variant="ghost" onClick={() => setForm((s) => ({ ...s, name: 'drone-survey-raw.png', sizeMb: '14.20', type: 'image' }))}>drone-survey-raw.png</Button>
        </div>
        <Input label="Alt text (English)" required value={form.altEn} onChange={set('altEn')} error={errors.altEn} hint="Describe what the image or document shows for screen-reader users." />
        <Input label="Alt text (Myanmar)" required value={form.altMm} onChange={set('altMm')} error={errors.altMm} lang="my" />
        <Alert tone="info">After upload the file is quarantined while the antivirus scan runs; it cannot be inserted into content until it is marked Clean.</Alert>
      </div>
    </Modal>
  );
}
