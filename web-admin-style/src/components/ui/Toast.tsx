import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const bgColor = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${bgColor[t.type]}`}
          >
            {t.message}
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="ml-2 opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx.toast;
}
