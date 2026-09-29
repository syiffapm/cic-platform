import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Building2, Landmark } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BrandMark from '@/components/layout/BrandMark';
import { STAFF_LOGIN } from '@/config/access';
import { WORKSPACES } from '@/config/app';

const CARDS = { gov: ['Government Portal', '/gov', Landmark], mfi: ['MFI Member Portal', '/mfi', Building2] };

/** /workspace — the staff entry point. Signed-out users go to the staff sign-in. */
export default function StaffHome() {
  const { sessions } = useAuth();
  const open = WORKSPACES.filter((p) => sessions[p]);
  if (open.length === 0) return <Navigate to={STAFF_LOGIN} replace />;
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <BrandMark light subtitle="Secure Staff Workspace" />
        <h1 className="mt-10 text-2xl font-bold">Your workspaces</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {open.map((p) => {
            const [label, to, Icon] = CARDS[p];
            return (
              <Link key={p} to={to} className="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-warm">
                <Icon className="h-6 w-6 text-warm" />
                <p className="mt-3 font-semibold">{label}</p>
                <p className="text-xs text-slate-500">{sessions[p].name} · {sessions[p].roleName}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-warm">Open <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
            );
          })}
        </div>
        <Link to={STAFF_LOGIN} className="mt-6 inline-block text-xs text-slate-500 hover:text-white">Sign in with another staff account</Link>
      </div>
    </div>
  );
}
