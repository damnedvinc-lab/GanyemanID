"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
}

const ToastContext = createContext<(t: Omit<ToastItem, "id" | "tone"> & { tone?: Tone }) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (t: Omit<ToastItem, "id" | "tone"> & { tone?: Tone }) => {
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs.slice(-2), { id, tone: "success", ...t }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="no-print pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
      >
        {items.map((t) => {
          const Icon = t.tone === "error" ? CircleAlert : t.tone === "info" ? Info : CircleCheck;
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-[14px] border border-line bg-surface p-4 shadow-lift"
            >
              <Icon
                aria-hidden
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  t.tone === "success" && "text-success",
                  t.tone === "error" && "text-danger",
                  t.tone === "info" && "text-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink" aria-label="Tutup notifikasi">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
