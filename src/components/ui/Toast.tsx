"use client";

import { createContext, useContext, useCallback, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

type ShowToast = (message: string, type?: ToastType) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

const styles: Record<ToastType, { ring: string; icon: React.ReactNode; bar: string }> = {
  success: {
    ring: "ring-emerald-200",
    bar: "bg-emerald-500",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  },
  error: {
    ring: "ring-red-200",
    bar: "bg-red-500",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  },
  info: {
    ring: "ring-blue-200",
    bar: "bg-blue-500",
    icon: <Info className="h-5 w-5 text-blue-500" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback<ShowToast>((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-4 right-4 z-[700] flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const s = styles[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto relative flex items-center gap-3 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-900/5 ring-1 ring-inset ring-slate-100 pl-4 pr-2 py-3 overflow-hidden animate-in fade-in slide-in-from-top-2 slide-in-from-right-4 duration-300"
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar}`} />
              {s.icon}
              <p className="flex-1 text-sm font-medium text-slate-700 leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
