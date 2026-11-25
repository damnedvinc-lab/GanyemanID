import type { Sku } from "@/lib/mock-data";
import { pricePerKg, PRICE_SOURCE, type PriceSource } from "@/lib/commerce";
import { formatRp } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Chip "≈ Rp 95.000/kg" — wajib menyertai harga per satuan */
export function PricePerKgChip({ sku, price, className }: { sku: Pick<Sku, "gramsPerUnit" | "uom">; price: number; className?: string }) {
  if (sku.uom === "kg") {
    return (
      <span className={cn("inline-flex h-6 items-center rounded-full bg-frost px-2 text-xs font-semibold text-primary tnum", className)}>
        timbang aktual
      </span>
    );
  }
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full bg-frost px-2 text-xs font-semibold text-primary tnum", className)}>
      ≈ {formatRp(pricePerKg(sku, price))}/kg
    </span>
  );
}

/** Harga dengan satuan — tidak pernah menampilkan harga tanpa satuan */
export function UnitPrice({
  price,
  unit,
  compareAt,
  className,
  size = "md",
}: {
  price: number;
  unit: string;
  compareAt?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const promo = compareAt !== undefined && compareAt > price;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5 tnum", className)}>
      <span
        className={cn(
          "font-bold",
          size === "sm" && "text-base",
          size === "md" && "text-lg",
          size === "lg" && "text-2xl sm:text-3xl",
          promo ? "text-accent-strong" : "text-ink",
        )}
      >
        {formatRp(price)}
      </span>
      <span className={cn("text-muted", size === "lg" ? "text-base" : "text-sm")}>/ {unit}</span>
      {promo && <s className="text-sm text-muted">{formatRp(compareAt!)}</s>}
    </span>
  );
}

export function PriceSourceLabel({ source, className }: { source: PriceSource; className?: string }) {
  const tone =
    source === "kontrak"
      ? "bg-primary text-white"
      : source === "reseller"
        ? "bg-frost text-primary"
        : source === "tier"
          ? "bg-success-soft text-success"
          : "bg-bg text-muted border border-line";
  return (
    <span
      title={PRICE_SOURCE[source].description}
      className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-semibold", tone, className)}
    >
      <span aria-hidden className="tnum opacity-75">#{PRICE_SOURCE[source].rank}</span>
      {PRICE_SOURCE[source].label}
    </span>
  );
}
