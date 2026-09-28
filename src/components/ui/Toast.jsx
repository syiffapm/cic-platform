import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const toast = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => dismiss(id), 4000);
  }, []);
  const icons = { success: CheckCircle2, warning: AlertTriangle, info: Info, danger: AlertTriangle };
  const tones = { success: 'text-emerald-500', warning: 'text-amber-500', info: 'text-blue-500', danger: 'text-red-500' };
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div key={t.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-sm shadow-lg">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tones[t.tone]}`} aria-hidden="true" />
              <p className="flex-1 text-slate-700">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate-500 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** const toast = useToast(); toast('Saved', 'success' | 'warning' | 'info' | 'danger') */
export const useToast = () => useContext(ToastContext);
