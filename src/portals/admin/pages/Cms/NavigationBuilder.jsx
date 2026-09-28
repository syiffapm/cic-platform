import { useEffect, useState } from 'react';
import { LayoutList, Map as MapIcon, Menu, RotateCcw, Send } from 'lucide-react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, MakerCheckerBanner, PageHeader, useToast } from '@/components/ui';
import { useAdmin } from '../../lib/useAdmin';
import { useAdminObject } from '../../context/AdminStore';
import PendingApprovals from '../../components/PendingApprovals';
import { NAV_SEED } from '../../data/seedRegistry';
import BlockOrderList from './extras/BlockOrderList';
import MenuEditor from './extras/MenuEditor';



const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function blockDiff(from, to) {
  const diff = [];
  to.forEach((b, i) => {
    if (from[i]?.id !== b.id) diff.push({ field: `Position ${i + 1}`, from: from[i]?.label ?? '—', to: b.label });
  });
  to.forEach((b) => {
    const old = from.find((x) => x.id === b.id);
    if (old && old.visible !== b.visible) diff.push({ field: `${b.label} visibility`, from: old.visible ? 'Shown' : 'Hidden', to: b.visible ? 'Shown' : 'Hidden' });
  });
  return diff;
}

function menuDiff(from, to) {
  const fmt = (list) => list.map((m) => `${m.en} (${m.link})`).join(' · ');
  return [{ field: 'Header menu', from: fmt(from), to: fmt(to) }];
}

export default function NavigationBuilder() {
  const { user, can, requestApproval, store } = useAdmin('cms.navigation');
  const readOnly = !can('update');
  const toast = useToast();
  const [nav] = useAdminObject('cmsNavigation', NAV_SEED);
  const [blocks, setBlocks] = useState(nav.blocks);
  const [menu, setMenu] = useState(nav.menu);

  // When a checker approves, the published layout changes — resync untouched drafts.
  useEffect(() => { setBlocks(nav.blocks); }, [nav.blocks]);
  useEffect(() => { setMenu(nav.menu); }, [nav.menu]);

  const blocksDirty = !same(blocks, nav.blocks);
  const menuDirty = !same(menu, nav.menu);
  const pendingLayout = store.approvals.some((a) => a.status === 'Pending' && a.type === 'Landing block order');

  const submitBlocks = () => {
    const diff = blockDiff(nav.blocks, blocks);
    const apr = requestApproval({
      type: 'Landing block order',
      summary: `Reorder landing page blocks (${diff.length} change${diff.length === 1 ? '' : 's'})`,
      checkerRole: 'adm_publisher',
      payload: { diff, effect: { target: 'admin', collection: 'cmsNavigation', op: 'set', changes: { blocks, publishedBy: user?.name } } },
    });
    toast(`${apr.id} sent to a Publisher for approval`, 'success');
  };

  const submitMenu = () => {
    const invalid = menu.find((m) => !m.en.trim() || !m.link.startsWith('/'));
    if (invalid) { toast('Every menu item needs an English label and an internal link starting with "/"', 'danger'); return; }
    const apr = requestApproval({
      type: 'Header menu change',
      summary: `Update header menu (${menu.length} items)`,
      checkerRole: 'adm_publisher',
      payload: { diff: menuDiff(nav.menu, menu), effect: { target: 'admin', collection: 'cmsNavigation', op: 'set', changes: { menu, publishedBy: user?.name } } },
    });
    toast(`${apr.id} sent to a Publisher for approval`, 'success');
  };

  const missingMm = menu.filter((m) => !m.mm.trim()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Navigation builder"
        subtitle="Order the Public landing page blocks and edit the header menu. Changes go live only after a Publisher approves."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              icon={LayoutList}
              title="Landing page blocks"
              subtitle="Drag rows, or use the arrow buttons (keyboard). Header and footer are pinned."
              action={blocksDirty ? <Badge tone="amber">Unsaved order</Badge> : <Badge tone="green">Matches live site</Badge>}
            />
            <CardBody className="space-y-4">
              {pendingLayout && <Alert tone="warning">A block-order change is already awaiting approval. A new submission will be reviewed separately.</Alert>}
              <BlockOrderList blocks={blocks} onChange={setBlocks} readOnly={readOnly} baseline={nav.blocks} />
              <MakerCheckerBanner maker={user?.name} checker="CMS Publisher (adm_publisher)" note="The new order is published only after a Publisher approves the diff." />
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" icon={RotateCcw} disabled={!blocksDirty || readOnly} onClick={() => setBlocks(nav.blocks)}>Reset</Button>
                <Button icon={Send} disabled={!blocksDirty || readOnly} onClick={submitBlocks}>Submit order for approval</Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={Menu} title="Header menu" subtitle="Top-level navigation on every Public page (EN/MM)" action={missingMm > 0 && <Badge tone="amber">{missingMm} missing MM</Badge>} />
            <CardBody className="space-y-4">
              <MenuEditor items={menu} onChange={setMenu} readOnly={readOnly} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" icon={RotateCcw} disabled={!menuDirty || readOnly} onClick={() => setMenu(nav.menu)}>Reset</Button>
                <Button icon={Send} disabled={!menuDirty || readOnly} onClick={submitMenu}>Submit menu for approval</Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader icon={MapIcon} title="Live preview" subtitle={`Published ${nav.publishedAt ?? ''} by ${nav.publishedBy ?? '—'}`} />
            <CardBody>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex flex-wrap gap-x-3 gap-y-1 bg-primary px-3 py-2 text-[11px] text-white">
                  {menu.map((m) => <span key={m.id}>{m.en || '…'}</span>)}
                </div>
                <div className="space-y-1 bg-slate-50 p-2">
                  {blocks.filter((b) => b.visible).map((b) => (
                    <div key={b.id} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700">{b.label}</div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
          <Alert tone="info" title="Sitemap">
            sitemap.xml is regenerated automatically when a navigation change is approved. Hidden blocks stay out of the landing page but their pages remain in the sitemap.
          </Alert>
          <PendingApprovals moduleLabel="CMS" />
        </div>
      </div>
    </div>
  );
}
