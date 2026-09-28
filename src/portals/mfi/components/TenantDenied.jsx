import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { useStore } from '@/context/StoreContext';
import { useTenant } from './MfiState';

/**
 * Shown when a record is missing or belongs to another institution. The response is identical in both
 * cases so record existence is not disclosed; a cross-institution attempt is written to the audit trail.
 */
export default function TenantDenied({ module, resource, crossTenant, backTo, backLabel }) {
  const { user, tenant } = useTenant();
  const { logAudit } = useStore();
  const logged = useRef(false);
  useEffect(() => {
    if (!crossTenant || logged.current) return;
    logged.current = true;
    logAudit({ actor: user.name, role: user.role, tenant, action: 'CROSS_TENANT_READ', module, target: resource, purpose: '—', outcome: 'Denied' });
  }, [crossTenant, logAudit, module, resource, tenant, user.name, user.role]);
  return (
    <EmptyState
      icon={ShieldX}
      title="Record not available"
      description={`${resource} does not exist or is not held by your institution. Access is limited to your own institution's records; attempts to open other records are logged.`}
      action={backTo && <Link to={backTo}><Button variant="outline">{backLabel}</Button></Link>}
    />
  );
}
