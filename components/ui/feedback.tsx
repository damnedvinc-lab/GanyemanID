import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-[10px]", className)} />;
}

/** Wrapper untuk area yang sedang memuat — diumumkan ke pembaca layar */
export function LoadingRegion({ children, label = "Memuat…" }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-line bg-surface text-center",
        compact ? "px-6 py-8" : "px-6 py-14",
        className,
      )}
    >
      <span className="frost-pattern grid size-14 place-items-center rounded-full">
        <Icon className="size-6 text-primary" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

const TONE: Record<Tone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-bg text-muted border-line", dot: "bg-muted" },
  info: { pill: "bg-frost text-primary border-transparent", dot: "bg-primary" },
  success: { pill: "bg-success-soft text-success border-transparent", dot: "bg-success" },
  warning: { pill: "bg-warning-soft text-ink border-transparent", dot: "bg-warning" },
  danger: { pill: "bg-danger-soft text-danger border-transparent", dot: "bg-danger" },
  accent: { pill: "bg-accent-strong text-white border-transparent", dot: "bg-white" },
};

export function StatusPill({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold",
        TONE[tone].pill,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", TONE[tone].dot)} />
      {children}
    </span>
  );
}

export function Chip({ children, className, icon: Icon }: { children: React.ReactNode; className?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full bg-frost px-3 text-xs font-semibold text-primary", className)}>
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  className,
  action,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const Icon = tone === "success" ? CircleCheck : tone === "warning" ? TriangleAlert : tone === "danger" ? CircleAlert : Info;
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "flex gap-3 rounded-[14px] border p-4 text-sm",
        tone === "info" && "border-primary/15 bg-frost/60",
        tone === "success" && "border-success/20 bg-success-soft",
        tone === "warning" && "border-warning/40 bg-warning-soft",
        tone === "danger" && "border-danger/25 bg-danger-soft",
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 size-5 shrink-0",
          tone === "info" && "text-primary",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
        )}
      />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className={cn("text-ink/85", title && "mt-0.5")}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card border border-line bg-surface", className)} {...props} />;
}
