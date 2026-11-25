"use client";

import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import type { Sku } from "@/lib/mock-data";
import { categoryById, pricePerKg, productById, stockLevel } from "@/lib/commerce";
import { formatNum, formatRp, formatWeight, pct } from "@/lib/format";
import { useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { EmptyState, StatusPill } from "@/components/ui/feedback";

function conversionLabel(sku: Sku, packGrams?: number) {
  if (sku.uom === "kg") return "1 kg = 1.000 g (timbang)";
  if (sku.uom === "karton") return `1 karton = ${sku.packsPerUnit} pack = ${formatNum(sku.gramsPerUnit)} g`;
  return `1 pack = ${formatNum(packGrams ?? sku.gramsPerUnit)} g`;
}

export default function ProductsPage() {
  const { state } = useApp();
  const router = useRouter();
  const view = usePageState(state.skus.length === 0);
  const columns: Column<Sku>[] = [
    { key: "code", header: "Kode SKU", cell: (s) => <span className="font-mono text-xs">{s.code}</span> },
    { key: "name", header: "Produk · varian", cell: (s) => <span><span className="font-semibold">{productById(s.productId)?.name}</span> <span className="text-muted">{s.uom === "kg" ? "· per kg" : s.label}</span><span className="block text-xs text-muted">{categoryById(productById(s.productId)!.category)?.name}</span></span> },
    { key: "conv", header: "Konversi satuan", cell: (s) => <span className="whitespace-nowrap text-muted tnum">{conversionLabel(s)}</span>, hideBelow: "lg" },
    { key: "price", header: "Harga", align: "right", cell: (s) => <span className="whitespace-nowrap"><span className="font-semibold">{formatRp(s.price)}</span><span className="block text-xs text-muted">{s.uom === "kg" ? "/ kg" : `≈ ${formatRp(pricePerKg(s, s.price))}/kg`}</span></span> },
    { key: "hpp", header: "HPP", align: "right", cell: (s) => formatRp(s.hpp), hideBelow: "md" },
    { key: "margin", header: "Margin", align: "right", cell: (s) => <span className={s.price < s.hpp ? "font-semibold text-danger" : ""}>{pct((s.price - s.hpp) / s.price, 1)}</span>, hideBelow: "sm" },
    { key: "stock", header: "Stok", align: "right", cell: (s) => <span className="whitespace-nowrap">{formatNum(s.stock)} {s.uom}<span className="block text-xs text-muted">{formatWeight(s.stock * s.gramsPerUnit)}</span></span> },
    { key: "status", header: "Status", cell: (s) => { const l = stockLevel(s); return <StatusPill tone={l === "habis" ? "danger" : l === "menipis" ? "warning" : "success"}>{l === "habis" ? "Habis" : l === "menipis" ? "Menipis" : "Aktif"}</StatusPill>; } },
  ];
  return (
    <>
      <PageHeader title="Produk & varian" description={`${state.skus.length} SKU dari ${new Set(state.skus.map((s) => s.productId)).size} produk. Satuan dasar semua SKU: gram. Stok disimpan per satuan jual SKU.`} />
      <DataTable
        caption="Daftar SKU"
        columns={columns}
        rows={view === "empty" ? [] : state.skus}
        rowKey={(s) => s.id}
        onRowClick={(s) => router.push(`/admin/produk/${s.productId}`)}
        loading={view === "loading"}
        empty={<EmptyState compact className="m-4 border-0" icon={Package} title="Belum ada SKU" description="Tambahkan produk pertama untuk mulai menjual." />}
      />
    </>
  );
}
