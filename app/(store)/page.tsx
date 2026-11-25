"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, PackageCheck, Plus, Snowflake, Thermometer, Truck } from "lucide-react";
import { BUNDLES, CATEGORIES, PRODUCTS, STORE, ZONES } from "@/lib/mock-data";
import { bundleRegularPrice, findSku, productById } from "@/lib/commerce";
import { formatDate, formatRp, formatWeight } from "@/lib/format";
import { useApp, usePageState } from "@/lib/store";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingRegion, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { ProductImage } from "@/components/store/product-image";
import { PRODUCT_ICONS } from "@/components/store/icons";
import { PricePerKgChip } from "@/components/store/price";
import { ColdChainBadge } from "@/components/store/trust";
import { Container, SectionHeading } from "@/components/store/section";
import { CutoffNotice } from "@/components/store/order-ui";

export default function HomePage() {
  const { state, viewer, addToCart } = useApp();
  const toast = useToast();
  const view = usePageState(false);
  const empty = view === "empty";

  const bestSellers = [...PRODUCTS].sort((a, b) => b.soldCount - a.soldCount).slice(0, 4);
  const pastOrders = state.orders
    .filter((o) => o.customerId === viewer.id && ["selesai", "klaim", "refund"].includes(o.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rebuy = Array.from(
    new Map(pastOrders.flatMap((o) => o.lines.map((l) => [l.skuId, { line: l, at: o.createdAt }] as const))).values(),
  ).slice(0, 4);

  const addBundle = (id: string) => {
    const b = BUNDLES.find((x) => x.id === id)!;
    const blocked = b.items.find((i) => (findSku(state.skus, i.skuId)?.stock ?? 0) < i.qty);
    if (blocked) {
      toast({ title: "Paket belum bisa ditambahkan", description: `${productById(findSku(state.skus, blocked.skuId)!.productId)?.name} stoknya tidak cukup.`, tone: "error" });
      return;
    }
    b.items.forEach((i) => addToCart(i.skuId, i.qty));
    toast({ title: `${b.name} ditambahkan`, description: viewer.type === "retail" ? "Potongan paket otomatis dihitung di keranjang." : "Potongan paket hanya berlaku untuk akun retail." });
  };

  return (
    <div className="space-y-14 pt-6 md:space-y-24 md:pt-8">
      {/* HERO */}
      <Container>
        <section aria-labelledby="hero-title" className="relative overflow-hidden rounded-hero bg-primary text-white">
          <div aria-hidden className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_25%,#fff_0_1.5px,transparent_2px),radial-gradient(circle_at_70%_60%,#fff_0_1px,transparent_1.5px)] [background-size:38px_38px,54px_54px]" />
          <Snowflake aria-hidden className="absolute -right-16 -top-16 size-80 text-white/[0.06]" strokeWidth={0.8} />
          <div className="relative grid grid-cols-1 gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:p-14">
            <div className="lg:col-span-7">
              <ColdChainBadge variant="onDark" />
              <h1 id="hero-title" className="font-display mt-5 text-4xl font-semibold leading-[1.02] md:text-5xl lg:text-[64px]">
                Beku dari -18°C, tetap beku sampai dapurmu.
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/80 md:text-lg">
                Ayam, daging, seafood, dan olahan beku dengan harga per pack <em className="not-italic text-white">dan</em> per kg yang jelas. Dikemas box insulated + ice gel, dikirim kurir berpendingin.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/katalog" variant="cta" size="lg">
                  Belanja sekarang <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
                <ButtonLink href="/info/pengiriman" size="lg" className="border border-white/30 bg-transparent hover:bg-white/10">
                  Cara kami menjaga suhu
                </ButtonLink>
              </div>
              <CutoffNotice tone="dark" className="mt-6" />
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-card bg-white p-4 text-ink sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">Promo minggu ini</p>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent-strong">
                    Hemat {formatRp(bundleRegularPrice(BUNDLES[0], state.skus) - BUNDLES[0].price)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {BUNDLES[0].items.map((i) => {
                    const p = productById(findSku(state.skus, i.skuId)!.productId)!;
                    return <ProductImage key={i.skuId} product={p} className="aspect-square rounded-[12px]" iconClassName="size-7" alt={p.name} />;
                  })}
                </div>
                <p className="font-display mt-4 text-xl font-semibold">{BUNDLES[0].name}</p>
                <p className="mt-1 text-sm text-muted">
                  {BUNDLES[0].items.map((i) => `${i.qty}× ${productById(findSku(state.skus, i.skuId)!.productId)!.name}`).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap items-baseline gap-2 tnum">
                  <span className="text-2xl font-bold text-accent-strong">{formatRp(BUNDLES[0].price)}</span>
                  <span className="text-sm text-muted">/ paket 3 kg</span>
                  <s className="text-sm text-muted">{formatRp(bundleRegularPrice(BUNDLES[0], state.skus))}</s>
                </div>
                <button
                  type="button"
                  onClick={() => addBundle(BUNDLES[0].id)}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-button bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  <Plus className="size-4" aria-hidden /> Tambah paket ke keranjang
                </button>
              </div>
            </div>
          </div>
        </section>
      </Container>

      {/* KATEGORI */}
      <Container>
        <SectionHeading title="Belanja per kategori" description="Semua produk disimpan di freezer -18°C dan dikemas ulang saat pesananmu diproses." />
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => {
            const Icon = PRODUCT_ICONS[c.icon];
            const count = PRODUCTS.filter((p) => p.category === c.id).length;
            return (
              <li key={c.id}>
                <Link href={`/katalog/${c.id}`} className="group flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-4 transition-shadow duration-200 hover:shadow-lift">
                  <span className="frost-pattern grid size-12 place-items-center rounded-full">
                    <Icon className="size-6 text-primary transition-transform duration-200 group-hover:scale-[1.06]" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold">{c.name}</span>
                    <span className="text-sm text-muted">{count > 0 ? `${count} produk · ${c.blurb.toLowerCase()}` : "Segera hadir"}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>

      {/* BELI LAGI */}
      {view === "loading" ? (
        <Container>
          <LoadingRegion label="Memuat riwayat belanja">
            <Skeleton className="h-8 w-40" />
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
            </div>
          </LoadingRegion>
        </Container>
      ) : (
        !empty && rebuy.length > 0 && (
          <Container>
            <SectionHeading
              title="Beli lagi"
              description={`Dari pesanan ${viewer.name.split(" ")[0]} sebelumnya. Harga mengikuti harga hari ini.`}
              action={<Link href="/akun" className="text-sm font-semibold text-primary hover:underline">Riwayat pesanan</Link>}
            />
            <ul className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {rebuy.map(({ line, at }) => {
                const sku = findSku(state.skus, line.skuId)!;
                const p = productById(sku.productId)!;
                const soldOut = sku.stock < sku.minQty;
                return (
                  <li key={line.skuId} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
                    <Link href={`/produk/${p.slug}`} className="shrink-0">
                      <ProductImage product={p} className="size-16 rounded-[14px]" iconClassName="size-6" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/produk/${p.slug}`} className="line-clamp-1 text-sm font-semibold hover:underline">
                        {p.name} <span className="font-normal text-muted">{sku.label}</span>
                      </Link>
                      <p className="text-xs text-muted">Terakhir {formatDate(at)}</p>
                      <p className="mt-0.5 text-sm font-bold tnum">
                        {formatRp(sku.price)} <span className="font-normal text-muted">/ {sku.uom === "kg" ? "kg" : sku.uom}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={soldOut}
                      onClick={() => {
                        const r = addToCart(sku.id, sku.minQty);
                        toast({ title: r.ok ? `${p.name} ditambahkan` : "Tidak bisa ditambahkan", description: r.ok ? undefined : r.message, tone: r.ok ? "success" : "error" });
                      }}
                      className="grid size-10 shrink-0 place-items-center rounded-button border border-line text-primary hover:bg-frost/60 disabled:cursor-not-allowed disabled:text-muted/50"
                      aria-label={soldOut ? `${p.name} stok habis` : `Beli lagi ${p.name}`}
                      title={soldOut ? "Stok habis" : "Tambah ke keranjang"}
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Container>
        )
      )}

      {/* TERLARIS */}
      <Container>
        <SectionHeading
          title="Paling sering dibeli"
          description="Harga per pack sudah termasuk kemasan vakum. Harga per kg kami tampilkan agar mudah dibandingkan."
          action={<Link href="/katalog?sort=terlaris" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Lihat semua <ArrowRight className="size-4" aria-hidden /></Link>}
        />
        <div className="mt-6">
          {view === "loading" ? (
            <LoadingRegion label="Memuat produk terlaris">
              <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}
              </div>
            </LoadingRegion>
          ) : empty ? (
            <EmptyState icon={Snowflake} title="Belum ada produk aktif" description="Katalog sedang diperbarui. Coba lagi beberapa saat lagi, atau tanya stok via WhatsApp." action={<ButtonLink href="/info/pengiriman" variant="secondary">Lihat info pengiriman</ButtonLink>} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </Container>

      {/* BUNDLING */}
      <Container>
        <SectionHeading title="Bundling hemat" description="Potongan paket otomatis dihitung di keranjang untuk akun retail." />
        {view === "loading" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
        ) : empty ? (
          <EmptyState compact className="mt-6" icon={PackageCheck} title="Belum ada paket aktif" description="Paket bundling baru diumumkan setiap Senin." />
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {BUNDLES.map((b) => {
              const regular = bundleRegularPrice(b, state.skus);
              const grams = b.items.reduce((s, i) => s + findSku(state.skus, i.skuId)!.gramsPerUnit * i.qty, 0);
              const available = b.items.every((i) => (findSku(state.skus, i.skuId)?.stock ?? 0) >= i.qty);
              return (
                <li key={b.id} className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 sm:flex-row">
                  <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-44">
                    {b.items.slice(0, 4).map((i) => {
                      const p = productById(findSku(state.skus, i.skuId)!.productId)!;
                      return <ProductImage key={i.skuId} product={p} className="aspect-square rounded-[12px]" iconClassName="size-6" alt={p.name} />;
                    })}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="font-display text-xl font-semibold">{b.name}</h3>
                    <p className="mt-1 text-sm text-muted">{b.blurb}</p>
                    <ul className="mt-3 space-y-1 text-sm">
                      {b.items.map((i) => {
                        const sku = findSku(state.skus, i.skuId)!;
                        return (
                          <li key={i.skuId} className="flex justify-between gap-2">
                            <span>{i.qty}× {productById(sku.productId)!.name} {sku.label}</span>
                            <span className="text-muted tnum">{formatRp(sku.price * i.qty)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                      <div className="tnum">
                        <span className="text-lg font-bold">{formatRp(b.price)}</span>
                        <span className="text-sm text-muted"> / paket {formatWeight(grams)}</span>
                        <span className="ml-2 text-sm text-muted"><s>{formatRp(regular)}</s></span>
                        <div className="mt-1"><PricePerKgChip sku={{ gramsPerUnit: grams, uom: "pack" }} price={b.price} /></div>
                      </div>
                      <button
                        type="button"
                        disabled={!available}
                        onClick={() => addBundle(b.id)}
                        className="inline-flex h-10 items-center gap-1.5 rounded-button border border-line px-4 text-sm font-semibold text-ink hover:border-primary/40 hover:bg-frost/40 disabled:cursor-not-allowed disabled:text-muted"
                      >
                        {available ? (<><Plus className="size-4" aria-hidden /> Tambah paket</>) : "Stok paket habis"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Container>

      {/* KEPERCAYAAN */}
      <Container>
        <section aria-label="Kenapa belanja di U-Frost ID" className="rounded-hero bg-frost/70 p-6 sm:p-10 lg:p-14">
          <SectionHeading as="h2" eyebrow="Pertanyaan yang paling sering kami terima" title="Belanja beku tanpa was-was" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Thermometer,
                q: "Sampai tujuan masih beku?",
                a: "Produk keluar dari freezer -18°C, dikemas box insulated + ice gel (1 box per 10 kg) dan dikirim kurir berpendingin. Transit kami batasi maksimal 2 hari.",
              },
              {
                icon: Truck,
                q: "Berapa ongkirnya?",
                a: `Tarif per zona, mulai ${formatRp(ZONES[0].baseFee)} untuk 3 kg pertama di Jabodetabek. Dihitung dari berat kirim (produk + box & ice gel) — terlihat sebelum bayar.`,
              },
              {
                icon: Camera,
                q: "Kalau rusak bagaimana?",
                a: `Ajukan klaim maksimal ${STORE.claimWindowHours} jam setelah diterima dengan foto produk & kemasan. Pilih refund atau ganti barang.`,
              },
              {
                icon: BadgeCheck,
                q: "Halal & aman?",
                a: "Semua produk dari vendor bersertifikat Halal dan terdaftar BPOM. Nomor sertifikat tercetak di kemasan.",
              },
            ].map(({ icon: Icon, q, a }) => (
              <div key={q} className="rounded-card bg-surface p-5">
                <Icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-4 font-semibold">{q}</h3>
                <p className="mt-1.5 text-sm text-muted">{a}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <Link href="/info/pengiriman" className="text-primary hover:underline">Detail pengiriman & zona</Link>
            <Link href="/info/retur" className="text-primary hover:underline">Kebijakan retur & klaim</Link>
          </div>
        </section>
      </Container>
    </div>
  );
}
