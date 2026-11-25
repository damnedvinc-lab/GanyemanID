"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { cartRows, cartTotals } from "@/lib/commerce";
import { formatRp, formatWeight } from "@/lib/format";
import { useApp, usePriceContext } from "@/lib/store";

/** Ringkasan keranjang menempel di bawah (mobile) */
export function StickyCartBar() {
  const { state, hydrated } = useApp();
  const ctx = usePriceContext();
  const pathname = usePathname();
  if (!hydrated || state.cart.length === 0) return null;
  if (["/keranjang", "/checkout"].some((p) => pathname.startsWith(p)) || pathname.startsWith("/produk/")) return null;
  const t = cartTotals(cartRows(state.cart, state.skus, ctx));
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm md:hidden">
      <Link href="/keranjang" className="flex h-12 items-center justify-between gap-3 rounded-button bg-primary px-4 text-white">
        <span className="flex items-center gap-2 text-sm">
          <ShoppingBag className="size-5" aria-hidden />
          <span className="font-semibold">{state.cart.length} item</span>
          <span className="text-white/75 tnum">· {formatWeight(t.netGrams)}</span>
        </span>
        <span className="text-sm font-bold tnum">{formatRp(t.subtotal)} · Lihat</span>
      </Link>
    </div>
  );
}
