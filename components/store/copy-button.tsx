"use client";

import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast({ title: `${label} disalin` });
        } catch {
          toast({ title: "Tidak bisa menyalin otomatis", description: value, tone: "info" });
        }
      }}
      className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-xs font-semibold text-primary hover:bg-frost/60"
      aria-label={`Salin ${label.toLowerCase()}`}
    >
      <Copy className="size-3.5" aria-hidden /> Salin
    </button>
  );
}
