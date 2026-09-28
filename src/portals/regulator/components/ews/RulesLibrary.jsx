import { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, History } from 'lucide-react';
import { Alert, Badge, Card } from '@/components/ui';
import { SeverityBadge } from '../common';
import { useRegulator } from '../../lib/RegulatorStore';

/** Versioned EWS rules library (GOV-08). Only one version is active; history is retained for audit. */
export default function RulesLibrary() {
  const { rules, alerts } = useRegulator();
  const [openId, setOpenId] = useState(null);
  return (
    <div className="space-y-4">
      <Alert tone="info" title="Rule governance">
        Thresholds are versioned. A new version is proposed by Risk Intelligence and activated only after Director approval; every alert records the rule version that fired it.
      </Alert>
      <Card>
        <ul className="divide-y divide-slate-100">
          {rules.map((r) => {
            const active = r.versions.find((v) => v.version === r.activeVersion);
            const isOpen = openId === r.id;
            const fired = alerts.filter((a) => a.ruleId === r.id).length;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                  className="grid grid-cols-1 w-full gap-2 px-4 py-3 text-left hover:bg-slate-50 sm:grid-cols-[110px_1fr_200px_120px_110px_24px] sm:items-center"
                >
                  <span className="font-mono text-xs text-slate-500">{r.id}</span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{r.name}</span>
                    <span className="text-[11px] text-slate-500">{r.category} · fired {fired}× this period</span>
                  </span>
                  <span className="font-mono text-xs text-slate-700">{r.metric} {r.operator} <b>{active.threshold}</b></span>
                  <span className="flex gap-1.5"><Badge tone="navy">{r.activeVersion} active</Badge></span>
                  <SeverityBadge severity={r.severity} />
                  <ChevronDown className={clsx('h-4 w-4 text-slate-500 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="bg-slate-50 px-4 pb-4 pt-2">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><History className="h-3.5 w-3.5" /> Version history</p>
                    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Rule version history">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[11px] uppercase text-slate-500">
                          <tr><th className="py-1.5 pr-4">Version</th><th className="pr-4">Threshold</th><th className="pr-4">Effective</th><th className="pr-4">Author</th><th className="pr-4">Approved by</th><th>Note</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {r.versions.map((v) => (
                            <tr key={v.version}>
                              <td className="py-1.5 pr-4 font-mono">{v.version} {v.version === r.activeVersion && <Badge tone="green">Active</Badge>}</td>
                              <td className="pr-4 font-mono">{r.operator} {v.threshold}</td>
                              <td className="pr-4">{v.effective}</td>
                              <td className="pr-4">{v.author}</td>
                              <td className="pr-4">{v.approvedBy}</td>
                              <td className="text-slate-600">{v.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
