"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/mock-data";
import { findSku, productSkus, resolvePrice, categoryById } from "@/lib/commerce";
import { useApp, usePriceContext } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";
import { PricePerKgChip, UnitPrice } from "./price";
import { StockBadge } from "./uom";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { state, addToCart } = useApp();
  const ctx = usePriceContext();
  const toast = useToast();
  const sku = findSku(state.skus, product.defaultSkuId)!;
  const { price, source } = resolvePrice(sku, sku.minQty, ctx);
  const others = productSkus(state.skus, product).filter((s) => s.id !== sku.id);
  const soldOut = sku.stock < sku.minQty;
  const unit = sku.uom === "kg" ? "kg" : `pack ${sku.label}`;

  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-shadow duration-200 hover:shadow-lift", className)}>
      <Link href={`/produk/${product.slug}`} className="flex flex-1 flex-col focus-visible:outline-offset-[-2px]">
        <div className="relative">
          <ProductImage product={product} className="aspect-[4/5] w-full" hoverZoom />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            <StockBadge sku={sku} />
          </div>
          {source === "reseller" && (
            <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">Reseller</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4 pb-16">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{categoryById(product.category)?.name}</p>
          <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-ink">
            {product.name} <span className="font-normal text-muted">{sku.uom === "kg" ? "· timbang" : sku.label}</span>
          </h3>
          <div className="mt-auto flex flex-col gap-1.5">
            <UnitPrice price={price} unit={unit} size="sm" />
            <div className="flex flex-wrap items-center gap-1.5">
              <PricePerKgChip sku={sku} price={price} />
              {others.some((o) => o.uom === "karton") && <span className="text-xs text-muted">+ karton</span>}
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute inset-x-4 bottom-4">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            const r = addToCart(sku.id, sku.minQty);
            toast({ title: r.ok ? `${product.name} ditambahkan` : "Tidak bisa ditambahkan", description: r.ok ? `${sku.minQty} ${sku.uom} · cek berat & ongkir di keranjang` : r.message, tone: r.ok ? "success" : "error" });
          }}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-1.5 rounded-button text-sm font-semibold transition-colors duration-150",
            soldOut ? "cursor-not-allowed bg-bg text-muted ring-1 ring-line" : "bg-primary text-white hover:bg-primary-hover",
          )}
          aria-label={soldOut ? `${product.name} stok habis` : `Tambah ${product.name} ke keranjang`}
        >
          {soldOut ? "Stok habis" : (<><Plus className="size-4" aria-hidden /> Tambah</>)}
        </button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
