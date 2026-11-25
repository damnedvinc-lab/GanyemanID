"use client";

import { useId } from "react";
import { Minus, Plus } from "lucide-react";
import type { Sku, Uom } from "@/lib/mock-data";
import { stockLevel } from "@/lib/commerce";
import { formatNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const ORDER: { uom: Uom; label: string }[] = [
  { uom: "pack", label: "Pack" },
  { uom: "kg", label: "Kg" },
  { uom: "karton", label: "Karton" },
];

/**
 * Segmented control satuan beli. Satuan yang tidak dijual untuk produk ini
 * tetap terlihat tetapi nonaktif, supaya pelanggan paham pilihannya.
 */
export function UomSelector({
  skus,
  value,
  onChange,
  className,
  size = "md",
}: {
  skus: Sku[];
  value: string;
  onChange: (skuId: string) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label="Satuan beli" className={cn("grid grid-cols-3 rounded-button bg-bg p-1 ring-1 ring-line", className)}>
      {ORDER.map(({ uom, label }) => {
        const sku = skus.find((s) => s.uom === uom);
        const active = sku?.id === value;
        const disabled = !sku;
        return (
          <button
            key={uom}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            title={disabled ? `Produk ini tidak dijual per ${uom}` : undefined}
            onClick={() => sku && onChange(sku.id)}
            className={cn(
              "flex flex-col items-center justify-center rounded-[9px] px-2 font-semibold transition-colors duration-150",
              size === "md" ? "min-h-12 py-1.5 text-sm" : "min-h-9 text-xs",
              active ? "bg-surface text-ink shadow-soft ring-1 ring-line" : "text-muted hover:text-ink",
              disabled && "cursor-not-allowed text-muted/50 hover:text-muted/50",
            )}
          >
            {label}
            {size === "md" && (
              <span className={cn("text-[11px] font-medium", active ? "text-muted" : "text-muted/80", disabled && "text-muted/50")}>
                {sku ? (uom === "karton" ? `${sku.packsPerUnit} pack` : uom === "kg" ? "timbang" : sku.label) : "tidak dijual"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function QtyStepper({
  value,
  onChange,
  step = 1,
  min = 1,
  max,
  unit,
  size = "md",
  label = "Jumlah",
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  size?: "sm" | "md";
  label?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const clamp = (v: number) => {
    const r = Number((Math.round(v / step) * step).toFixed(2));
    return Math.min(max ?? Infinity, Math.max(min, r));
  };
  const btn = cn(
    "grid place-items-center text-ink transition-colors duration-150 hover:bg-frost/70 disabled:cursor-not-allowed disabled:text-muted/40 disabled:hover:bg-transparent",
    size === "md" ? "size-11" : "size-8",
  );
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-button border border-line bg-surface",
        disabled && "opacity-50",
      )}
    >
      <button type="button" className={cn(btn, "rounded-l-button")} onClick={() => onChange(clamp(value - step))} disabled={disabled || value <= min} aria-label={`Kurangi ${label.toLowerCase()}`}>
        <Minus className="size-4" />
      </button>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <div className={cn("flex items-baseline justify-center gap-1 px-1 tnum", size === "md" ? "min-w-16" : "min-w-12")}>
        <input
          id={id}
          inputMode="decimal"
          value={formatNum(value)}
          disabled={disabled}
          onChange={(e) => {
            const n = Number(e.target.value.replace(",", "."));
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          className={cn("w-10 bg-transparent text-center font-semibold focus:outline-none", size === "md" ? "text-base" : "text-sm")}
        />
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </div>
      <button type="button" className={cn(btn, "rounded-r-button")} onClick={() => onChange(clamp(value + step))} disabled={disabled || (max !== undefined && value + step > max)} aria-label={`Tambah ${label.toLowerCase()}`}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function StockBadge({ sku, className }: { sku: Pick<Sku, "stock" | "minStock" | "minQty" | "uom">; className?: string }) {
  const level = stockLevel(sku);
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-xs font-semibold",
        level === "habis" && "bg-ink/80 text-white",
        level === "menipis" && "bg-warning-soft text-ink",
        level === "aman" && "bg-success-soft text-success",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", level === "habis" ? "bg-white" : level === "menipis" ? "bg-warning" : "bg-success")} />
      {level === "habis" ? "Stok habis" : level === "menipis" ? `Sisa ${formatNum(sku.stock)} ${sku.uom}` : "Stok tersedia"}
    </span>
  );
}
