import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { usePermissions } from '@/lib/rbac';
import { landingFor } from './navigation';

/** Each role lands on its own home page (Director → dashboard, Licensing → institution register, Content Editor → CMS…). */
export default function RoleHome() {
  const { role, can } = usePermissions('gov');
  const to = landingFor(role, can);
  if (to) return <Navigate to={to} replace />;
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <EmptyState icon={ShieldAlert} title="No modules assigned" description="Your role does not currently give access to any Government Portal module. Contact the CIC security administrator." />
    </div>
  );
}
