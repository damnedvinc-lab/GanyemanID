"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, RotateCcw, X } from "lucide-react";
import { useApp, type DemoView, type ViewerId } from "@/lib/store";
import type { ClockMode } from "@/lib/commerce";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** Panel khusus prototype untuk menguji state & skenario. Bukan fitur produk. */
export function DemoPanel() {
  const { state, setDemo, resetAll, login, logout } = useApp();
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const Seg = <T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) => (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-muted">{label}</legend>
      <div className="grid gap-1 rounded-[10px] bg-bg p-1 ring-1 ring-line" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={cn("h-8 rounded-[7px] px-2 text-xs font-semibold", value === o.v ? "bg-surface text-ink shadow-soft ring-1 ring-line" : "text-muted hover:text-ink")}
          >
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="no-print fixed bottom-24 right-3 z-40 md:bottom-4 md:right-4">
      {open ? (
        <div className="w-[min(18rem,calc(100vw-24px))] rounded-card border border-line bg-surface p-4 shadow-lift" role="dialog" aria-label="Panel demo prototype">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <FlaskConical className="size-4 text-primary" aria-hidden /> Panel demo
            </p>
            <button onClick={() => setOpen(false)} className="rounded-[8px] p-1 text-muted hover:bg-frost/60" aria-label="Tutup panel demo">
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-3">
            <Seg<DemoView>
              label="State halaman"
              value={state.demo.view}
              onChange={(v) => setDemo({ view: v })}
              options={[{ v: "normal", l: "Normal" }, { v: "empty", l: "Kosong" }, { v: "loading", l: "Memuat" }]}
            />
            <Seg<ClockMode>
              label="Jam (25 Nov 2026)"
              value={state.demo.clock}
              onChange={(v) => setDemo({ clock: v })}
              options={[{ v: "real", l: "Asli" }, { v: "pagi", l: "10.00" }, { v: "sore", l: "15.30" }]}
            />
            <Seg<ViewerId>
              label="Belanja sebagai"
              value={state.demo.viewer}
              onChange={(v) => setDemo({ viewer: v })}
              options={[{ v: "c-rani", l: "Rani (retail)" }, { v: "c-sejahtera", l: "Reseller" }]}
            />
            <Seg<"in" | "out">
              label="Back-office (mock auth)"
              value={state.admin.authed ? "in" : "out"}
              onChange={(v) => (v === "in" ? login(state.admin.role) : logout())}
              options={[{ v: "in", l: "Masuk" }, { v: "out", l: "Keluar" }]}
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <Link href={state.admin.authed ? "/admin" : "/admin/login"} className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                Buka back-office
              </Link>
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  toast({ title: "Data demo direset", description: "Order, stok, dan kontrak kembali ke data awal." });
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink"
              >
                <RotateCcw className="size-3.5" aria-hidden /> Reset data
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka panel demo"
          className="inline-flex size-10 items-center justify-center gap-1.5 rounded-full border border-line bg-surface text-xs font-semibold text-muted shadow-lift hover:text-ink md:h-9 md:w-auto md:px-3 md:shadow-soft"
        >
          <FlaskConical className="size-4 text-primary md:size-3.5" aria-hidden /> <span className="hidden md:inline">Demo</span>
          {state.demo.view !== "normal" && <span className="hidden rounded-full bg-warning-soft px-1.5 text-ink md:inline">{state.demo.view === "empty" ? "Kosong" : "Memuat"}</span>}
        </button>
      )}
    </div>
  );
}
