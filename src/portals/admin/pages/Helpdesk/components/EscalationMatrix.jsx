import { ArrowUpCircle } from 'lucide-react';
import { Badge, Card, CardHeader } from '@/components/ui';
import { ESCALATION_MATRIX } from '../../../data/helpdesk';

/** Escalation matrix (ADM-09): who owns a case at each level and who is notified. */
export default function EscalationMatrix() {
  return (
    <Card>
      <CardHeader icon={ArrowUpCircle} title="Escalation matrix" subtitle="Automatic escalation on SLA triggers" />
      <div className="overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label="Escalation matrix">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Escalation levels, triggers, owners and notifications</caption>
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-semibold">Level</th>
              <th scope="col" className="px-4 py-2 font-semibold">Trigger · owner · notify</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ESCALATION_MATRIX.map((e) => (
              <tr key={e.level} className="align-top">
                <th scope="row" className="px-4 py-3"><Badge tone={e.level === 'L1' ? 'blue' : e.level === 'L2' ? 'amber' : 'red'}>{e.level}</Badge></th>
                <td className="px-4 py-3 text-slate-700">
                  <p className="font-medium text-slate-800">{e.trigger}</p>
                  <p className="mt-1"><span className="text-slate-500">Owner:</span> {e.owner}</p>
                  <p><span className="text-slate-500">Notify:</span> {e.notify}</p>
                  <p className="text-slate-500">Target: {e.sla}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
