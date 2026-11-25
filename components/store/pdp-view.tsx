"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MessageCircle, PackageSearch, Scale, ShoppingBag, Snowflake, Thermometer, UtensilsCrossed } from "lucide-react";
import { PRODUCTS, STORE } from "@/lib/mock-data";
import { categoryById, findSku, pricePerKg, productBySlug, productSkus, resolvePrice, shippingWeight } from "@/lib/commerce";
import { formatNum, formatRp, formatWeight } from "@/lib/format";
import { useApp, usePageState, usePriceContext } from "@/lib/store";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingRegion, Notice, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ProductImage, type ImageKind } from "./product-image";
import { PricePerKgChip, PriceSourceLabel } from "./price";
import { CertChips, ColdChainBadge } from "./trust";
import { QtyStepper, StockBadge, UomSelector } from "./uom";
import { ShippingEstimator } from "./order-ui";
import { ProductCard } from "./product-card";
import { Breadcrumbs, Container } from "./section";

export function PdpView({ slug }: { slug: string }) {
  const product = productBySlug(slug);
  const { state, viewer, addToCart } = useApp();
  const ctx = usePriceContext();
  const toast = useToast();
  const router = useRouter();
  const view = usePageState(!product);
  const [skuId, setSkuId] = useState(product?.defaultSkuId ?? "");
  const [qty, setQty] = useState(findSku(state.skus, product?.defaultSkuId ?? "")?.minQty ?? 1);
  const [variantId, setVariantId] = useState(product?.variants?.[0]?.id);
  const [image, setImage] = useState<ImageKind>("produk");

  if (view === "loading") {
    return (
      <Container className="pt-6 md:pt-10">
        <LoadingRegion label="Memuat produk">
          <Skeleton className="h-4 w-48" />
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <Skeleton className="aspect-[4/5] w-full rounded-card lg:col-span-6" />
            <div className="space-y-4 lg:col-span-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </LoadingRegion>
      </Container>
    );
  }

  if (view === "empty" || !product) {
    return (
      <Container className="pt-10">
        <EmptyState icon={PackageSearch} title="Produk tidak ditemukan" description="Produk ini mungkin sudah tidak dijual atau tautannya salah." action={<ButtonLink href="/katalog" variant="secondary">Kembali ke katalog</ButtonLink>} />
      </Container>
    );
  }

  const skus = productSkus(state.skus, product);
  const sku = findSku(state.skus, skuId)!;
  const { price, source } = resolvePrice(sku, qty, ctx);
  const basePrice = resolvePrice(sku, sku.minQty, ctx).price;
  const packSku = skus.find((s) => s.uom === "pack");
  const soldOut = sku.stock < sku.minQty;
  const subtotal = Math.round(price * qty);
  const netGrams = sku.gramsPerUnit * qty;
  const { shipGrams } = shippingWeight(netGrams, sku.packagingGrams * Math.ceil(qty));
  const unitWord = sku.uom === "kg" ? "kg" : sku.uom;
  const category = categoryById(product.category)!;
  const related = PRODUCTS.filter((p) => p.id !== product.id).sort((a, b) => (a.category === product.category ? -1 : 0) - (b.category === product.category ? -1 : 0) || b.soldCount - a.soldCount).slice(0, 4);
  const tier = sku.tiers[0];
  const cartonSaving = sku.uom === "karton" && packSku ? 1 - sku.price / (packSku.price * (sku.packsPerUnit ?? 1)) : 0;
  const defaultPostal = viewer.addresses[0]?.postal ?? "";
  const waText = encodeURIComponent(`Halo ${STORE.brand}, saya mau tanya ${product.name} (${sku.label}). https://ufrost.id/produk/${product.slug}`);

  const onUomChange = (id: string) => {
    const next = findSku(state.skus, id)!;
    setSkuId(id);
    setQty(next.minQty);
  };

  const add = (goToCart = false) => {
    const r = addToCart(sku.id, qty, product.variants ? variantId : undefined);
    if (r.ok && goToCart) router.push("/keranjang");
    toast({
      title: r.ok ? `${formatNum(qty)} ${unitWord} ${product.name} ditambahkan` : "Tidak bisa ditambahkan",
      description: r.ok ? `Subtotal ${formatRp(subtotal)} · ${formatWeight(netGrams)}` : r.message,
      tone: r.ok ? "success" : "error",
    });
  };

  const gallery: { kind: ImageKind; alt: string }[] = [
    { kind: "produk", alt: `${product.name} beku dalam kemasan vakum` },
    { kind: "kemasan", alt: `Label kemasan ${product.name} dengan info suhu simpan -18°C` },
    { kind: "penyajian", alt: `Contoh penyajian ${product.name}` },
  ];

  return (
    <>
      <Container className="pt-6 md:pt-10">
        <Breadcrumbs items={[{ href: "/", label: "Beranda" }, { href: `/katalog/${category.id}`, label: category.name }, { label: product.name }]} />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Galeri */}
          <div className="lg:col-span-6">
            <div className="lg:sticky lg:top-32">
              <div className="relative overflow-hidden rounded-card">
                <ProductImage product={product} kind={image} alt={gallery.find((g) => g.kind === image)!.alt} className="aspect-[4/5] w-full sm:aspect-square" iconClassName="size-20" showCaption={image !== "produk"} />
                <div className="absolute left-4 top-4"><ColdChainBadge variant="solid" /></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3" role="group" aria-label="Galeri foto">
                {gallery.map((g) => (
                  <button key={g.kind} type="button" onClick={() => setImage(g.kind)} aria-pressed={image === g.kind} aria-label={`Tampilkan foto ${g.kind}`} className={cn("overflow-hidden rounded-[14px] ring-offset-2 transition", image === g.kind ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100")}>
                    <ProductImage product={product} kind={g.kind} alt="" className="aspect-square w-full" iconClassName="size-7" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info & beli */}
          <div className="lg:col-span-6">
            <p className="text-sm font-semibold text-primary">{category.name}</p>
            <h1 className="font-display mt-1 text-3xl font-semibold md:text-4xl">{product.name}</h1>
            <p className="mt-2 text-base text-muted">{product.tagline}</p>
            <CertChips className="mt-4" />

            <div className="mt-6 space-y-5 rounded-card border border-line bg-surface p-5">
              {/* Varian gramasi */}
              <div>
                <p className="text-sm font-semibold">Varian</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skus.map((s) => (
                    <span key={s.id} className={cn("inline-flex h-8 items-center rounded-full border px-3 text-sm", s.id === sku.id ? "border-primary bg-frost font-semibold text-primary" : "border-line text-muted")}>
                      {s.uom === "kg" ? "Timbang per kg" : s.label}
                    </span>
                  ))}
                </div>
              </div>

              {product.variants && (
                <fieldset>
                  <legend className="text-sm font-semibold">Potongan <span className="font-normal text-muted">(gratis)</span></legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <label key={v.id} className={cn("cursor-pointer rounded-[12px] border px-3 py-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary", variantId === v.id ? "border-primary bg-frost" : "border-line")}>
                        <input type="radio" name="potongan" className="sr-only" checked={variantId === v.id} onChange={() => setVariantId(v.id)} />
                        <span className="font-semibold">{v.label}</span>
                        <span className="block text-xs text-muted">{v.note}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <div>
                <p className="mb-2 text-sm font-semibold">Beli per</p>
                <UomSelector skus={skus} value={sku.id} onChange={onUomChange} />
              </div>

              {/* Harga */}
              <div aria-live="polite">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 tnum">
                  <span className="text-3xl font-bold">{formatRp(price)}</span>
                  <span className="text-base text-muted">/ {sku.uom === "kg" ? "kg" : sku.uom === "karton" ? `karton (${sku.packsPerUnit} pack · ${sku.gramsPerUnit / 1000} kg)` : `pack ${sku.label}`}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {sku.uom === "kg" ? (
                    <span className="inline-flex h-6 items-center rounded-full bg-frost px-2 text-xs font-semibold text-primary">Harga per kg · ditimbang saat packing</span>
                  ) : (
                    <PricePerKgChip sku={sku} price={price} />
                  )}
                  {source !== "retail" && <PriceSourceLabel source={source} />}
                  {cartonSaving > 0 && <span className="inline-flex h-6 items-center rounded-full bg-accent-soft px-2 text-xs font-bold text-accent-strong">Hemat {Math.round(cartonSaving * 100)}% vs per pack</span>}
                </div>
                {tier && source !== "reseller" && (
                  <p className={cn("mt-2 text-sm", qty >= tier.minQty ? "text-success" : "text-muted")}>
                    {qty >= tier.minQty ? "Harga tier aktif: " : "Beli "}
                    {qty >= tier.minQty ? `${formatRp(tier.price)}/${unitWord} untuk ${formatNum(qty)} ${unitWord}` : `≥ ${tier.minQty} ${unitWord}: ${formatRp(tier.price)}/${unitWord} (≈ ${formatRp(pricePerKg(sku, tier.price))}/kg)`}
                  </p>
                )}
                {source === "reseller" && <p className="mt-2 text-sm text-muted">Harga retail {formatRp(sku.price)}/{unitWord}. Kamu melihat harga reseller (akun {viewer.name}).</p>}
                {basePrice !== price && source === "tier" && <p className="sr-only">Harga turun dari {formatRp(basePrice)}</p>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <StockBadge sku={sku} />
                <span className="text-sm text-muted tnum">
                  {soldOut ? "Jadwal restok belum pasti" : `Tersedia ${formatNum(sku.stock)} ${unitWord}`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <QtyStepper value={qty} onChange={setQty} step={sku.step} min={sku.minQty} max={Math.max(sku.minQty, sku.stock)} unit={unitWord} disabled={soldOut} />
                <div className="text-sm tnum">
                  <p className="font-semibold">Subtotal {formatRp(subtotal)}</p>
                  <p className="text-muted">
                    {formatWeight(netGrams)} bersih{sku.uom === "kg" ? " (estimasi, timbang aktual)" : ""}
                  </p>
                </div>
              </div>

              {soldOut ? (
                <Notice tone="warning" title="Stok habis">
                  Produk ini tidak bisa ditambahkan ke keranjang sampai restok. Tanya ketersediaan atau alternatif lewat WhatsApp.
                </Notice>
              ) : null}

              <div className="hidden gap-3 md:flex">
                <Button variant="cta" size="lg" className="flex-1" disabled={soldOut} onClick={() => add(false)}>
                  {soldOut ? "Stok habis" : (<><ShoppingBag className="size-5" aria-hidden /> Tambah ke keranjang</>)}
                </Button>
                <a href={`https://wa.me/${STORE.whatsappIntl}?text=${waText}`} target="_blank" rel="noreferrer" className="inline-flex h-13 items-center gap-2 rounded-button border border-line px-4 text-sm font-semibold hover:bg-frost/40">
                  <MessageCircle className="size-5 text-primary" aria-hidden /> Tanya via WA
                </a>
              </div>
              <a href={`https://wa.me/${STORE.whatsappIntl}?text=${waText}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary md:hidden">
                <MessageCircle className="size-4" aria-hidden /> Tanya via WhatsApp
              </a>
            </div>

            {/* Ongkir */}
            <div className="mt-5 rounded-card border border-line bg-surface p-5">
              <ShippingEstimator netGrams={netGrams} packagingGrams={sku.packagingGrams * Math.ceil(qty)} defaultPostal={defaultPostal} />
            </div>

            {/* Detail */}
            <div className="mt-8 space-y-6">
              <p className="text-base leading-relaxed">{product.description}</p>
              <ul className="flex flex-wrap gap-2">
                {product.highlights.map((h) => <li key={h} className="rounded-full bg-frost px-3 py-1 text-sm font-medium text-primary">{h}</li>)}
              </ul>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Thermometer, t: "Penyimpanan", d: product.storage },
                  { icon: Clock, t: "Masa simpan", d: product.shelfLife },
                  { icon: Snowflake, t: "Cara thawing", d: product.thawing },
                  { icon: UtensilsCrossed, t: "Saran masak", d: product.cookingTip },
                ].map(({ icon: Icon, t, d }) => (
                  <div key={t} className="rounded-[16px] bg-surface p-4 ring-1 ring-line">
                    <dt className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-primary" aria-hidden /> {t}</dt>
                    <dd className="mt-1 text-sm text-muted">{d}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-[16px] bg-surface p-4 ring-1 ring-line">
                <p className="flex items-center gap-2 text-sm font-semibold"><Scale className="size-4 text-primary" aria-hidden /> Berat & kemasan</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                  <div><dt className="text-muted">Berat bersih</dt><dd className="font-semibold tnum">{sku.uom === "kg" ? "per kg (timbang)" : formatWeight(sku.gramsPerUnit)}</dd></div>
                  <div><dt className="text-muted">Kemasan</dt><dd className="font-semibold tnum">{formatWeight(sku.packagingGrams)}</dd></div>
                  <div><dt className="text-muted">Dimensi</dt><dd className="font-semibold">{sku.dimensions}</dd></div>
                  <div><dt className="text-muted">Berat kirim*</dt><dd className="font-semibold tnum">{formatWeight(shipGrams)}</dd></div>
                </dl>
                <p className="mt-3 text-xs text-muted">*Untuk {formatNum(qty)} {unitWord}: termasuk box insulated & ice gel {formatWeight(STORE.boxTareGrams)} per box, dibulatkan per 0,5 kg. Ini yang dipakai menghitung ongkir.</p>
              </div>
              <div className="rounded-[16px] bg-surface p-4 ring-1 ring-line text-sm">
                <p className="font-semibold">Sertifikasi & asal</p>
                <p className="mt-1 text-muted">{product.origin}. Nomor sertifikat Halal & izin edar BPOM tercetak di kemasan; salinan dokumen vendor bisa diminta lewat CS.</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-16 md:mt-24" aria-labelledby="related">
          <h2 id="related" className="font-display text-2xl font-semibold md:text-3xl">Sering dibeli bersama</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => <li key={p.id} className="flex"><ProductCard product={p} className="w-full" /></li>)}
          </ul>
        </section>
        <p className="mt-6 text-sm"><Link href="/katalog" className="font-semibold text-primary hover:underline">← Kembali ke katalog</Link></p>
      </Container>

      {/* Sticky add bar — mobile (satu-satunya CTA coral di layar mobile) */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 tnum">
            <p className="truncate text-sm font-bold">{formatRp(subtotal)}</p>
            <p className="truncate text-xs text-muted">{formatNum(qty)} {unitWord} · {formatWeight(netGrams)}</p>
          </div>
          <Button variant="cta" size="lg" disabled={soldOut} onClick={() => add(false)}>
            {soldOut ? "Stok habis" : (<><ShoppingBag className="size-5" aria-hidden /> Tambah</>)}
          </Button>
        </div>
      </div>
    </>
  );
}
