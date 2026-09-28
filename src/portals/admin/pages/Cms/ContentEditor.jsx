import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { Alert, Button, Card, CardBody, CardHeader, EmptyState, MakerCheckerBanner, PageHeader, Toggle, useToast } from '@/components/ui';
import ConfirmReasonModal from '@/portals/government/components/ConfirmReasonModal';
import { useAdmin } from '../../lib/useAdmin';
import { today } from '../../lib/time';
import { CONTENT_TYPES, snapshotOf, typeLabel } from '../../data/cms';
import { useCmsItems } from './useCmsItems';
import { stampSec, workflowPermissions } from './components/cmsLogic';
import BilingualFields from './components/BilingualFields';
import ItemSettings from './components/ItemSettings';
import SeoPanel from './components/SeoPanel';
import WorkflowPanel from './components/WorkflowPanel';
import VersionHistory from './components/VersionHistory';
import PreviewModal from './components/PreviewModal';

const PUBLISHER_ACTIONS = ['approve', 'publish', 'schedule', 'archive', 'returnDraft'];

export default function ContentEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, role, can, readOnly, audit, requestApproval } = useAdmin('cms.content');
  const rights = useMemo(() => ({ create: can('create'), update: can('update'), approve: can('approve') }), [can]);
  const { get, save, settings, setSettings } = useCmsItems();
  const isNew = !id;
  const original = id ? get(id) : null;

  const blank = useMemo(() => {
    const t = params.get('type');
    return {
      type: CONTENT_TYPES.some((c) => c.id === t) ? t : 'page', title: { en: '', mm: '' }, body: { en: '', mm: '' },
      classification: 'Public', category: '', status: 'Draft', slug: '', seo: { meta: '', ogImage: '' },
      scheduleAt: null, expiresAt: null, pinned: false, author: user?.name, versions: [],
    };
  }, [params, user?.name]);

  const [draft, setDraft] = useState(original ?? blank);
  const [preview, setPreview] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const versionCount = original?.versions?.length;
  useEffect(() => { setDraft(original ?? blank); }, [id, versionCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback((changes) => setDraft((d) => ({ ...d, ...(typeof changes === 'function' ? changes(d) : changes) })), []);

  const dirty = isNew || (original && JSON.stringify(snapshotOf(draft)) !== JSON.stringify(snapshotOf(original)));
  const perms = useMemo(() => {
    const p = workflowPermissions({ item: draft, user, rights, settings, isNew });
    if (dirty && !isNew) {
      PUBLISHER_ACTIONS.forEach((k) => { if (p.actions[k].allowed) p.actions[k] = { allowed: false, reason: 'Save or discard your unsaved changes first.' }; });
    }
    if (!draft.title?.en?.trim()) {
      ['save', 'submit'].forEach((k) => { if (p.actions[k].allowed) p.actions[k] = { allowed: false, reason: 'An English title is required.' }; });
    }
    return p;
  }, [draft, user, rights, settings, isNew, dirty]);

  if (id && !original) {
    return (
      <div>
        <PageHeader title="Content not found" breadcrumbs={[{ label: 'Content management', to: '/gov/admin/cms' }, { label: id }]} />
        <EmptyState title={`No content item ${id}`} description="It may have been removed or the link is wrong." />
        <Link to="/gov/admin/cms" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Back to content list</Link>
      </div>
    );
  }

  const commit = (changes, note, action) => {
    const saved = save({ ...draft, ...changes }, { versionNote: note, by: user.name });
    audit(`CONTENT_${action}`, saved.id, { outcome: `Status ${saved.status}` });
    setDraft(saved);
    if (isNew) navigate(`/gov/admin/cms/edit/${saved.id}`, { replace: true });
    return saved;
  };

  const asEditor = () => ({ lastEditor: user.name, author: draft.author ?? user.name });

  const handlers = {
    save: () => { commit({ ...asEditor(), status: 'Draft' }, isNew ? 'Draft created' : 'Draft saved', isNew ? 'CREATE' : 'SAVE'); toast('Draft saved as a new version.', 'success'); },
    submit: () => { commit({ ...(dirty ? asEditor() : {}), status: 'In review' }, 'Submitted for review', 'SUBMIT'); toast('Submitted. A Content Publisher other than you must approve it.', 'info'); },
    approve: () => {
      const scheduled = perms.futureSchedule;
      commit({ status: scheduled ? 'Scheduled' : 'Approved', approver: user.name }, scheduled ? `Approved — scheduled for ${draft.scheduleAt.replace('T', ' ')}` : 'Approved', 'APPROVE');
      toast(scheduled ? 'Approved and scheduled.' : 'Approved. It can now be published or scheduled.', 'success');
    },
    publish: () => {
      const s = commit({ status: 'Published', publishedAt: today(), approver: draft.approver ?? user.name }, 'Published', 'PUBLISH');
      const where = s.classification === 'Public' ? 'Now live on the Public portal' : `Visible only to ${s.classification} audiences`;
      toast(`${where}. sitemap.xml regenerated.`, 'success');
    },
    schedule: () => { commit({ status: 'Scheduled' }, `Scheduled for ${draft.scheduleAt.replace('T', ' ')}`, 'SCHEDULE'); toast('Scheduled for automatic publication.', 'success'); },
    returnDraft: () => { commit({ status: 'Draft' }, `Returned to draft by ${user.name}`, 'RETURN'); toast('Returned to the editor as Draft.', 'info'); },
    archive: () => setArchiving(true),
  };

  const restore = (v) => {
    const s = stampSec();
    commit({ ...v.snapshot, status: 'Draft', lastEditor: user.name, enUpdatedAt: s, mmUpdatedAt: s }, `Restored from v${v.version}`, 'RESTORE');
    toast(`Version ${v.version} restored as a new Draft version.`, 'success');
  };

  const canToggleRule = can('approve', 'cms.settings');
  const toggleRule = (on) => {
    if (on) {
      setSettings({ blockPublishIfMmMissing: true });
      audit('CONTENT_SETTING_CHANGED', 'cms.blockPublishIfMmMissing', { outcome: 'Enabled' });
      toast('Publishing is now blocked when Myanmar text is missing.', 'success');
      return;
    }
    requestApproval({
      type: 'CMS publishing rule',
      summary: 'Allow publishing content without Myanmar translation (lift the Myanmar-required block)',
      checkerRole: role === 'adm_super' ? 'adm_publisher' : 'adm_super',
      payload: { diff: [{ field: 'Block publish if MM missing', from: 'On', to: 'Off' }], effect: { target: 'admin', collection: 'cmsSettings', op: 'set', changes: { blockPublishIfMmMissing: false } } },
    });
    toast('Weakening a publishing control needs a second approver — request sent to the Approvals inbox.', 'info');
  };

  const title = isNew ? `New ${typeLabel(draft.type).toLowerCase()}` : draft.title?.en || 'Untitled';

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={isNew ? 'Draft bilingual content. It is not visible anywhere until a publisher approves and publishes it.' : `${typeLabel(draft.type)} · ${draft.id} · updated ${draft.updatedAt ?? '—'}`}
        breadcrumbs={[{ label: 'Content management', to: '/gov/admin/cms' }, { label: isNew ? 'New' : draft.id }]}
        actions={<Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/gov/admin/cms')}>Back to list</Button>}
      />

      <div className="space-y-6">
        <MakerCheckerBanner
          maker={isNew ? user?.name : draft.lastEditor ?? draft.author}
          checker="Content Publisher (not the author or last editor)"
          note="Content Editors write and revise; a different Content Publisher approves, schedules and publishes. Nobody may approve content they authored or last edited."
        />
        {rights.approve && !rights.update && (
          <Alert tone="info">Fields are read-only for publishers so the person approving is never the person changing the content. Use “Return to draft” to send it back to an editor.</Alert>
        )}

        <WorkflowPanel item={draft} perms={perms} dirty={dirty} isNew={isNew} canApprove={rights.approve} userName={user?.name}
          onAction={(k) => handlers[k]()} onPreview={() => setPreview(true)} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <BilingualFields draft={draft} onChange={onChange} disabled={!perms.canEditFields} onAudit={audit} />
            <VersionHistory item={draft} canRestore={perms.canEditFields && !isNew} onRestore={restore}
              restoreReason={readOnly ? 'Read-only access.' : 'Only a Content Editor can restore a version; it then goes through approval again.'} />
          </div>
          <div className="space-y-6">
            <ItemSettings draft={draft} onChange={onChange} disabled={!perms.canEditFields} isNew={isNew} />
            <SeoPanel draft={draft} onChange={onChange} disabled={!perms.canEditFields} followTitle={isNew} />
            <Card>
              <CardHeader title="Publishing rules" icon={Settings2} />
              <CardBody>
                <div className={canToggleRule ? undefined : 'pointer-events-none opacity-60'} aria-disabled={!canToggleRule}>
                  <Toggle label="Block publish if MM translation missing" checked={!!settings.blockPublishIfMmMissing}
                    description="Applies to all content. Turning it off requires a second approver."
                    onChange={(v) => canToggleRule && toggleRule(v)} />
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)} item={draft} />
      <ConfirmReasonModal
        open={archiving}
        title="Archive this content?"
        subtitle={draft.title?.en}
        body={<p>It is removed from every portal straight away. The item and its version history stay here and can be restored as a new draft.</p>}
        confirmLabel="Archive"
        reasonLabel="Reason for archiving"
        onCancel={() => setArchiving(false)}
        onConfirm={(reason) => {
          commit({ status: 'Archived', pinned: false }, `Archived — ${reason}`, 'ARCHIVE');
          setArchiving(false);
          toast('Archived and removed from every portal.', 'info');
        }}
      />
    </div>
  );
}
