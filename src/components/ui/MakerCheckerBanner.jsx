import { UserCheck } from 'lucide-react';

/** Reminds users that an action is dual-controlled (SEC-03). */
export default function MakerCheckerBanner({ maker, checker, note }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
      <UserCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">Maker-checker control</p>
        <p className="mt-0.5">
          {note ?? 'This change is saved as a pending request and takes effect only after a different authorised user approves it.'}
          {maker && <> Maker: <b>{maker}</b>.</>}
          {checker && <> Checker role: <b>{checker}</b>.</>}
        </p>
      </div>
    </div>
  );
}
