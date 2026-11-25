import Link from "next/link";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 sm:px-6", className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  as: As = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-sm font-semibold text-primary">{eyebrow}</p>}
        <As className={cn("font-display font-semibold text-ink", As === "h1" ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl")}>{title}</As>
        {description && <p className="mt-2 text-base text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-ink">{it.label}</Link>
            ) : (
              <span aria-current="page" className="text-ink">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
