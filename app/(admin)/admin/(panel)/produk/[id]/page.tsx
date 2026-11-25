"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowRight, PackageSearch, Save } from "lucide-react";
import { CATEGORIES, type Sku } from "@/lib/mock-data";
import { pricePerKg, productById, productSkus, shippingWeight } from "@/lib/commerce";
import { formatNum, formatRp, formatWeight } from "@/lib/format";
import { useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, LoadingRegion, Notice, Skeleton } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { ProductImage } from "@/components/store/product-image";

type Draft = Pick<Sku, "minStock" | "packagingGrams" | "dimensions" | "gramsPerUnit" | "packsPerUnit">;

function SkuEditor({ sku, packGrams }: { sku: Sku; packGrams?: number }) {
  const { updateSku } = useApp();
  const toast = useToast();
  const [d, setD] = useState<Draft>({ minStock: sku.minStock, packagingGrams: sku.packagingGrams, dimensions: sku.dimensions, gramsPerUnit: sku.gramsPerUnit, packsPerUnit: sku.packsPerUnit });
  const grams = sku.uom === "karton" && packGrams ? (d.packsPerUnit ?? 1) * packGrams : d.gramsPerUnit;
  const changed = JSON.stringify({ ...d, gramsPerUnit: grams }) !== JSON.stringify({ minStock: sku.minStock, packagingGrams: sku.packagingGrams, dimensions: sku.dimensions, gramsPerUnit: sku.gramsPerUnit, packsPerUnit: sku.packsPerUnit });
  const perKg = pricePerKg({ gramsPerUnit: grams }, sku.price);
  const ship = shippingWeight(grams, d.packagingGrams);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted">{sku.code}</p>
          <h3 className="text-lg font-semibold">Satuan jual: {sku.uom === "kg" ? "Kg (timbang)" : sku.uom === "karton" ? "Karton" : "Pack"}</h3>
        </div>
        <p className="text-right text-sm tnum"><span className="font-semibold">{formatRp(sku.price)}</span> / {sku.uom}<span className="block text-xs text-muted">{sku.uom === "kg" ? "harga per kg" : `≈ ${formatRp(perKg)}/kg`}</span></p>
      </div>

      <div className="mt-5 rounded-[14px] bg-frost/50 p-4">
        <p className="text-sm font-semibold">Konversi ke satuan dasar (gram)</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {sku.uom === "kg" && <span className="tnum">1 kg = <strong>1.000 g</strong> · qty kelipatan {formatNum(sku.step)} kg</span>}
          {sku.uom === "pack" && (
            <>
              <span>1 pack =</span>
              <Input aria-label="Gram per pack" inputMode="numeric" className="h-9 w-24 tnum" value={d.gramsPerUnit} onChange={(e) => setD({ ...d, gramsPerUnit: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
              <span>g</span>
            </>
          )}
          {sku.uom === "karton" && (
            <>
              <span>1 karton =</span>
              <Input aria-label="Pack per karton" inputMode="numeric" className="h-9 w-20 tnum" value={d.packsPerUnit ?? 0} onChange={(e) => setD({ ...d, packsPerUnit: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
              <span>pack × {formatNum(packGrams ?? 0)} g =</span>
              <strong className="tnum">{formatNum(grams)} g</strong>
            </>
          )}
        </div>
        {sku.uom === "karton" && grams !== sku.gramsPerUnit && <p className="mt-2 text-xs text-ink">Harga karton tetap {formatRp(sku.price)} → harga per kg berubah menjadi {formatRp(perKg)}. Sesuaikan harga di menu Harga.</p>}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Berat kemasan (g)" hint="Vakum/plastik per satuan">{(p) => <Input {...p} inputMode="numeric" value={d.packagingGrams} onChange={(e) => setD({ ...d, packagingGrams: Number(e.target.value.replace(/\D/g, "")) || 0 })} />}</Field>
        <Field label="Dimensi">{(p) => <Input {...p} value={d.dimensions} onChange={(e) => setD({ ...d, dimensions: e.target.value })} />}</Field>
        <Field label={`Stok minimum (${sku.uom})`} hint="Memicu alert stok">{(p) => <Input {...p} inputMode="numeric" value={d.minStock} onChange={(e) => setD({ ...d, minStock: Number(e.target.value.replace(/\D/g, "")) || 0 })} />}</Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-muted tnum">Berat kirim 1 {sku.uom}: {formatWeight(grams)} + {formatWeight(d.packagingGrams)} kemasan + box & ice gel → {formatWeight(ship.shipGrams)}</p>
        <Button size="sm" disabled={!changed || grams <= 0} onClick={() => { updateSku(sku.id, { ...d, gramsPerUnit: grams }); toast({ title: `${sku.code} disimpan`, description: "Konversi & berat dipakai di storefront dan ongkir." }); }}>
          <Save className="size-4" aria-hidden /> Simpan SKU
        </Button>
      </div>
    </Card>
  );
}

export default function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state } = useApp();
  const product = productById(id);
  const view = usePageState(!product);
  if (view === "loading") return <LoadingRegion label="Memuat produk"><Skeleton className="h-10 w-72" /><Skeleton className="mt-6 h-80" /></LoadingRegion>;
  if (view === "empty" || !product) return <EmptyState icon={PackageSearch} title="Produk tidak ditemukan" action={<Link href="/admin/produk" className="font-semibold text-primary">Kembali ke daftar</Link>} />;
  const skus = productSkus(state.skus, product);
  const packSku = skus.find((s) => s.uom === "pack");

  return (
    <>
      <Link href="/admin/produk" className="text-sm font-semibold text-primary hover:underline">← Produk & varian</Link>
      <div className="mt-3"><PageHeader title={product.name} description={`${skus.length} SKU · satuan dasar gram`} actions={<Link href={`/produk/${product.slug}`} className="inline-flex h-9 items-center gap-1.5 rounded-button border border-line px-3 text-sm font-semibold hover:bg-frost/40">Lihat di toko <ArrowRight className="size-4" aria-hidden /></Link>} /></div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="space-y-4 p-5 xl:col-span-4">
          <ProductImage product={product} className="aspect-[4/3] w-full rounded-[14px]" />
          <Field label="Nama produk">{(p) => <Input {...p} defaultValue={product.name} />}</Field>
          <Field label="Kategori">{(p) => <Select {...p} defaultValue={product.category}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}</Field>
          <Field label="Status">{(p) => <Select {...p} defaultValue="aktif"><option value="draft">Draft</option><option value="aktif">Aktif</option><option value="arsip">Arsip</option></Select>}</Field>
          <Field label="Deskripsi">{(p) => <Textarea {...p} rows={4} defaultValue={product.description} />}</Field>
          <Notice tone="info">Prototype: perubahan nama/deskripsi tidak disimpan. Konversi, berat & stok minimum per SKU (kanan) tersimpan dan langsung dipakai storefront.</Notice>
        </Card>
        <div className="space-y-4 xl:col-span-8">
          {skus.map((s) => <SkuEditor key={s.id} sku={s} packGrams={packSku?.gramsPerUnit} />)}
          {product.variants && (
            <Card className="p-5">
              <h3 className="font-semibold">Pilihan potongan (tanpa beda harga)</h3>
              <ul className="mt-3 flex flex-wrap gap-2">{product.variants.map((v) => <li key={v.id} className="rounded-full bg-frost px-3 py-1 text-sm text-primary">{v.label} · {v.note}</li>)}</ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
