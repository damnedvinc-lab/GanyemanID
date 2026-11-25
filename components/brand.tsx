import Link from "next/link";
import { Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, tone = "dark", href = "/" }: { className?: string; tone?: "dark" | "light"; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)} aria-label="U-Frost ID — beranda">
      <span className={cn("grid size-8 place-items-center rounded-[10px]", tone === "dark" ? "bg-primary text-white" : "bg-white/15 text-white")}>
        <Snowflake className="size-4.5" aria-hidden />
      </span>
      <span className={cn("font-display text-xl font-semibold tracking-[-0.02em]", tone === "dark" ? "text-ink" : "text-white")}>
        U-Frost<span className={tone === "dark" ? "text-primary" : "text-frost"}> ID</span>
      </span>
    </Link>
  );
}
