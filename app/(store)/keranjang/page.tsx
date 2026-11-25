"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Package, ShoppingBag, Trash2 } from "lucide-react";
import { bundleDiscount, cartRows, cartTotals, minOrderStatus, shippingFee, zoneForPostal } from "@/lib/commerce";
import { formatNum, formatRp, formatWeight } from "@/lib/format";
import { STORE } from "@/lib/mock-data";
import { useApp, usePageState, usePriceContext } from "@/lib/store";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingRegion, Notice, Skeleton } from "@/components/ui/feedback";
import { ProductImage } from "@/components/store/product-image";
import { PricePerKgChip, PriceSourceLabel } from "@/components/store/price";
import { QtyStepper } from "@/components/store/uom";
import { MinOrderMeter, ShippingEstimator } from "@/components/store/order-ui";
import { ColdChainBadge } from "@/components/store/trust";
import { Container } from "@/components/store/section";

export default function CartPage() {
  const { state, viewer, setCartQty, removeFromCart } = useApp();
  const ctx = usePriceContext();
  const router = useRouter();
  const rows = cartRows(state.cart, state.skus, ctx);
  const view = usePageState(rows.length === 0);
  const t = cartTotals(rows);
  const bundle = bundleDiscount(state.cart, state.skus, viewer.type);
  const min = minOrderStatus(t.subtotal, t.netGrams);
  const address = viewer.addresses[0];
  const zone = address ? zoneForPostal(address.postal) : undefined;
  const fee = zone ? shippingFee(t.shipGrams, zone) : 0;
  const overStock = rows.some((r) => r.overStock);
  const canCheckout = min.ok && !overStock && rows.length > 0;

  return (
    <Container className="pt-6 md:pt-10">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Keranjang</h1>
      {view === "loading" ? (
        <LoadingRegion label="Memuat keranjang">
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-8">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}</div>
            <Skeleton className="h-96 lg:col-span-4" />
          </div>
        </LoadingRegion>
      ) : view === "empty" ? (
        <EmptyState
          className="mt-6"
          icon={ShoppingBag}
          title="Keranjangmu masih kosong"
          description={`Minimum order ${formatRp(STORE.minOrderValue)} atau ${formatWeight(STORE.minOrderGrams)} — pas untuk stok lauk seminggu.`}
          action={<ButtonLink href="/katalog" variant="primary">Mulai belanja</ButtonLink>}
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section aria-label="Item di keranjang" className="lg:col-span-8">
            <ul className="divide-y divide-line rounded-card border border-line bg-surface">
              {rows.map((r) => {
                const unitWord = r.sku.uom === "kg" ? "kg" : r.sku.uom;
                return (
                  <li key={r.line.key} className="flex gap-4 p-4 sm:p-5">
                    <Link href={`/produk/${r.product.slug}`} className="shrink-0">
                      <ProductImage product={r.product} className="size-20 rounded-[14px] sm:size-24" iconClassName="size-8" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link href={`/produk/${r.product.slug}`} className="font-semibold hover:underline">{r.product.name}</Link>
                        <p className="text-sm text-muted">
                          {r.sku.uom === "karton" ? `Karton · ${r.sku.packsPerUnit} pack × ${formatWeight(r.sku.gramsPerUnit / (r.sku.packsPerUnit ?? 1))}` : r.sku.uom === "kg" ? "Timbang per kg" : `Pack ${r.sku.label}`}
                          {r.variantLabel && ` · ${r.variantLabel}`}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm tnum">
                          <span className="font-semibold">{formatRp(r.unitPrice)}</span>
                          <span className="text-muted">/ {unitWord}</span>
                          <PricePerKgChip sku={r.sku} price={r.unitPrice} />
                          {r.source !== "retail" && <PriceSourceLabel source={r.source} />}
                        </div>
                        {r.overStock && <p className="mt-2 text-sm font-medium text-danger">Stok tersisa {formatNum(r.sku.stock)} {unitWord}. Kurangi jumlah untuk lanjut.</p>}
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <QtyStepper size="sm" value={r.line.qty} step={r.sku.step} min={r.sku.minQty} max={Math.max(r.sku.minQty, r.sku.stock)} unit={unitWord} label={`Jumlah ${r.product.name}`} onChange={(v) => setCartQty(r.line.key, v)} />
                        <div className="text-right tnum">
                          <p className="font-bold">{formatRp(r.subtotal)}</p>
                          <p className="text-xs text-muted">{formatWeight(r.netGrams)}</p>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(r.line.key)} className="self-start rounded-button p-2 text-muted hover:bg-danger-soft hover:text-danger" aria-label={`Hapus ${r.product.name} dari keranjang`}>
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-card bg-frost/60 p-4 text-sm">
              <ColdChainBadge />
              <span className="text-ink/85">
                {t.boxes} box insulated + ice gel untuk {formatWeight(t.netGrams)} produk. Box & ice gel menambah {formatWeight(t.boxes * STORE.boxTareGrams)} ke berat kirim.
              </span>
            </div>
            <Link href="/katalog" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">+ Tambah produk lain</Link>
          </section>

          <aside aria-label="Ringkasan belanja" className="lg:col-span-4">
            <div className="space-y-5 rounded-card border border-line bg-surface p-5 lg:sticky lg:top-32">
              <h2 className="font-display text-xl font-semibold">Ringkasan</h2>
              <dl className="space-y-2.5 text-sm tnum">
                <div className="flex justify-between gap-3"><dt className="text-muted">Subtotal ({rows.length} item)</dt><dd className="font-semibold">{formatRp(t.subtotal)}</dd></div>
                {bundle.applied.map((b) => (
                  <div key={b.id} className="flex justify-between gap-3"><dt className="text-muted">Potongan {b.name}{b.sets > 1 ? ` ×${b.sets}` : ""}</dt><dd className="font-semibold text-accent-strong">−{formatRp(b.saving)}</dd></div>
                ))}
                <div className="flex justify-between gap-3"><dt className="text-muted">Berat bersih</dt><dd>{formatWeight(t.netGrams)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Berat kirim ({t.boxes} box)</dt><dd>{formatWeight(t.shipGrams)}</dd></div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Estimasi ongkir{zone ? ` · ${zone.name.split("·")[0].trim()}` : ""}</dt>
                  <dd>{zone ? formatRp(fee) : "—"}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-3 text-base"><dt className="font-semibold">Estimasi total</dt><dd className="font-bold">{formatRp(t.subtotal - bundle.discount + fee)}</dd></div>
              </dl>
              <p className="text-xs text-muted">Ongkir dihitung ke alamat utama ({address?.city} {address?.postal}). Angka final mengikuti alamat yang kamu pilih di checkout.</p>
              <MinOrderMeter subtotal={t.subtotal} netGrams={t.netGrams} />
              {overStock && <Notice tone="danger">Ada item melebihi stok tersedia.</Notice>}
              <Button variant="cta" size="lg" block disabled={!canCheckout} onClick={() => router.push("/checkout")}>
                Lanjut ke checkout <ArrowRight className="size-4" aria-hidden />
              </Button>
              <details className="group rounded-[12px] bg-bg p-3">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><Package className="size-4 text-primary" aria-hidden /> Cek ongkir ke kode pos lain</summary>
                <div className="pt-3"><ShippingEstimator netGrams={t.netGrams} packagingGrams={t.packagingGrams} /></div>
              </details>
            </div>
          </aside>
        </div>
      )}
    </Container>
  );
}
