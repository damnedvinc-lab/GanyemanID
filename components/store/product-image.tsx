"use client";

import { useState } from "react";
import { Package, Snowflake, UtensilsCrossed } from "lucide-react";
import { PHOTOS, type IconKey, type Product } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { PRODUCT_ICONS } from "./icons";

export type ImageKind = "produk" | "kemasan" | "penyajian";

/**
 * Foto produk dengan fallback frost + ikon — tidak pernah menampilkan gambar rusak.
 * Sumber foto: PHOTOS[product.id] di lib/mock-data.ts.
 */
export function ProductImage({
  product,
  icon,
  kind = "produk",
  alt,
  className,
  iconClassName,
  showCaption = false,
  hoverZoom = false,
}: {
  product?: Pick<Product, "id" | "name" | "icon">;
  icon?: IconKey;
  kind?: ImageKind;
  alt?: string;
  className?: string;
  iconClassName?: string;
  showCaption?: boolean;
  hoverZoom?: boolean;
}) {
  const src = product && kind === "produk" ? PHOTOS[product.id] : undefined;
  const [failed, setFailed] = useState(false);
  const label = alt ?? (product ? `${product.name} beku dalam kemasan` : "Produk beku");
  const Icon =
    kind === "kemasan" ? Package : kind === "penyajian" ? UtensilsCrossed : PRODUCT_ICONS[icon ?? product?.icon ?? "box"];

  if (src && !failed) {
    return (
      <div className={cn("relative overflow-hidden bg-frost", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn(
            "size-full object-cover transition-transform duration-250 ease-out",
            hoverZoom && "group-hover:scale-[1.02]",
          )}
        />
      </div>
    );
  }

  return (
    <div role="img" aria-label={label} className={cn("frost-pattern relative grid place-items-center overflow-hidden", className)}>
      <Snowflake aria-hidden className="absolute -right-4 -top-4 size-24 text-white/70" strokeWidth={1} />
      <Snowflake aria-hidden className="absolute -bottom-6 left-3 size-16 text-white/60" strokeWidth={1} />
      <span
        className={cn(
          "relative grid place-items-center rounded-full bg-white/70 p-5 transition-transform duration-250 ease-out",
          hoverZoom && "group-hover:scale-[1.02]",
        )}
      >
        <Icon aria-hidden className={cn("size-12 text-primary", iconClassName)} strokeWidth={1.4} />
      </span>
      {showCaption && (
        <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium capitalize text-primary">
          {kind}
        </span>
      )}
    </div>
  );
}
