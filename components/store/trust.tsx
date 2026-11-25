import { BadgeCheck, ShieldCheck, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

export function ColdChainBadge({ className, variant = "soft" }: { className?: string; variant?: "soft" | "solid" | "onDark" }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold",
        variant === "soft" && "bg-frost text-primary",
        variant === "solid" && "bg-primary text-white",
        variant === "onDark" && "bg-white/12 text-white ring-1 ring-white/25",
        className,
      )}
    >
      <Snowflake aria-hidden className="size-3.5" />
      Dikirim -18°C
    </span>
  );
}

export function CertChips({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-xs font-semibold text-ink">
        <BadgeCheck aria-hidden className="size-3.5 text-success" />
        Halal
      </span>
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-xs font-semibold text-ink">
        <ShieldCheck aria-hidden className="size-3.5 text-primary" />
        BPOM
      </span>
    </div>
  );
}
