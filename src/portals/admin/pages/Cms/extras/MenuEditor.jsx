import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';

const cell = 'h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm focus:border-primary-400 disabled:bg-slate-50';

/** CMS-09 header menu: inline-editable rows (label EN/MM, link) with order controls. */
export default function MenuEditor({ items, onChange, readOnly }) {
  const edit = (id, key, value) => onChange(items.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  const swap = (i, j) => {
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => onChange([...items, { id: `MN-${Date.now().toString(36)}`, en: '', mm: '', link: '/' }]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label="Menu items table">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="w-12 px-2 py-2">#</th>
              <th scope="col" className="px-2 py-2">Label (EN)</th>
              <th scope="col" className="px-2 py-2">Label (MM)</th>
              <th scope="col" className="px-2 py-2">Link</th>
              <th scope="col" className="w-28 px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((m, i) => (
              <tr key={m.id}>
                <td className="px-2 py-2 text-xs font-semibold text-slate-500">{i + 1}</td>
                <td className="px-2 py-2"><input aria-label={`Menu item ${i + 1} English label`} className={cell} value={m.en} disabled={readOnly} onChange={(e) => edit(m.id, 'en', e.target.value)} /></td>
                <td className="px-2 py-2"><input aria-label={`Menu item ${i + 1} Myanmar label`} lang="my" className={`${cell} ${!m.mm ? 'border-amber-400 bg-amber-50' : ''}`} value={m.mm} disabled={readOnly} placeholder="Missing translation" onChange={(e) => edit(m.id, 'mm', e.target.value)} /></td>
                <td className="px-2 py-2"><input aria-label={`Menu item ${i + 1} link`} className={`${cell} font-mono text-xs`} value={m.link} disabled={readOnly} onChange={(e) => edit(m.id, 'link', e.target.value)} /></td>
                <td className="px-2 py-2">
                  <div className="flex justify-end gap-0.5">
                    <button type="button" disabled={readOnly || i === 0} onClick={() => swap(i, i - 1)} aria-label={`Move ${m.en || 'item'} up`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" disabled={readOnly || i === items.length - 1} onClick={() => swap(i, i + 1)} aria-label={`Move ${m.en || 'item'} down`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" disabled={readOnly} onClick={() => onChange(items.filter((x) => x.id !== m.id))} aria-label={`Remove ${m.en || 'item'}`} className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button size="sm" variant="outline" icon={Plus} disabled={readOnly || items.length >= 8} onClick={add}>Add menu item</Button>
      {items.length >= 8 && <p className="text-xs text-slate-500">Maximum 8 top-level items for readability on mobile.</p>}
    </div>
  );
}
