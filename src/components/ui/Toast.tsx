import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useApp } from '@/store/AppContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? XCircle : Info;
        const iconColor = toast.type === 'success' ? 'text-primary-600' : toast.type === 'error' ? 'text-red-600' : 'text-blue-600';
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3 animate-slide-in-right"
          >
            <Icon size={20} className={iconColor + ' shrink-0 mt-0.5'} />
            <p className="text-sm text-neutral-800 dark:text-neutral-100 font-medium flex-1">{toast.message}</p>
            <button onClick={() => dismissToast(toast.id)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
