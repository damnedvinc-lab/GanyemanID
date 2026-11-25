import Link from "next/link";
import { formatKg, formatRp, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

function Bar({ value, max, tone, label }: { value: number; max: number; tone: "primary" | "warning" | "danger" | "success"; label: string }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-250 ease-out",
          tone === "primary" && "bg-primary",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-danger",
          tone === "success" && "bg-success",
        )}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

/** Progress kuota kontrak, mis. 950/1.000 kg */
export function QuotaBar({ usedGrams, quotaGrams, pendingGrams = 0, label, className }: { usedGrams: number; quotaGrams: number; pendingGrams?: number; label: string; className?: string }) {
  const after = usedGrams + pendingGrams;
  const ratio = quotaGrams ? after / quotaGrams : 0;
  const tone = after > quotaGrams ? "danger" : ratio >= 0.9 ? "warning" : "primary";
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs tnum">
        <span className="font-semibold text-ink">
          {formatKg(after).replace(" kg", "")}/{formatKg(quotaGrams)}
          {pendingGrams > 0 && <span className="font-normal text-muted"> (termasuk {formatKg(pendingGrams)} call-off ini)</span>}
        </span>
        <span className={cn(tone === "danger" ? "font-semibold text-danger" : "text-muted")}>
          {after > quotaGrams ? `lebih ${formatKg(after - quotaGrams)}` : `sisa ${formatKg(quotaGrams - after)}`}
        </span>
      </div>
      <Bar value={after} max={quotaGrams} tone={tone} label={label} />
    </div>
  );
}

/** Terpakai vs credit limit */
export function CreditLimitMeter({ used, limit, pending = 0, className, compact }: { used: number; limit: number; pending?: number; className?: string; compact?: boolean }) {
  const total = used + pending;
  const ratio = limit ? total / limit : 1;
  const tone = total > limit ? "danger" : ratio >= 0.8 ? "warning" : "success";
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs tnum">
        <span>
          <span className="text-sm font-semibold text-ink">{formatRp(total)}</span>
          <span className="text-muted"> / {formatRp(limit)}</span>
        </span>
        <span className={cn(tone === "danger" ? "font-semibold text-danger" : "text-muted")}>
          {total > limit ? `lewat ${formatRp(total - limit)}` : `tersedia ${formatRp(limit - total)}`} · {pct(ratio)}
        </span>
      </div>
      <Bar value={total} max={limit} tone={tone} label="Pemakaian credit limit" />
      {!compact && pending > 0 && <p className="text-xs text-muted">Termasuk call-off yang sedang dibuat {formatRp(pending)}.</p>}
    </div>
  );
}

export function StatTile({ label, value, hint, icon: Icon, tone = "neutral", href }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon: React.ComponentType<{ className?: string }>; tone?: "neutral" | "warning" | "danger"; href?: string }) {
  const cls = cn("flex flex-col gap-3 rounded-card border border-line bg-surface p-4 transition-shadow", href && "hover:shadow-lift");
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={cn("grid size-8 place-items-center rounded-full", tone === "danger" ? "bg-danger-soft text-danger" : tone === "warning" ? "bg-warning-soft text-warning" : "bg-frost text-primary")}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="text-3xl font-bold tnum">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </>
  );
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}
