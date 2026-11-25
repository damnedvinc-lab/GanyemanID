"use client";

import { useState } from "react";
import { Lock, Tag, TriangleAlert } from "lucide-react";
import { type Sku } from "@/lib/mock-data";
import { PRICE_SOURCE, pricePerKg, productById, type PriceSource } from "@/lib/commerce";
import { formatDate, formatDateTime, formatRp, pct } from "@/lib/format";
import { customerById } from "@/lib/seed";
import { ROLE_LABEL, useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, Notice } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { PriceSourceLabel } from "@/components/store/price";
import { cn } from "@/lib/utils";

const skuName = (s: Sku) => `${productById(s.productId)?.name} ${s.uom === "kg" ? "(per kg)" : s.label}`;

function PriceCell({ sku, field }: { sku: Sku; field: "price" | "resellerPrice" }) {
  const { state, updatePrice } = useApp();
  const toast = useToast();
  const [v, setV] = useState(String(sku[field]));
  const n = Number(v.replace(/\D/g, "")) || 0;
  const belowHpp = n > 0 && n < sku.hpp;
  const isOwner = state.admin.role === "owner";
  const dirty = n !== sku[field];
  const blocked = belowHpp && !isOwner;
  return (
    <div className="flex items-center justify-end gap-2">
      <Input
        aria-label={`${field === "price" ? "Harga retail" : "Harga reseller"} ${sku.code}`}
        inputMode="numeric"
        value={v}
        onChange={(e) => setV(e.target.value)}
        aria-invalid={belowHpp || undefined}
        className={cn("h-8 w-28 text-right tnum", belowHpp && "border-danger")}
      />
      <Button
        size="sm"
        variant={dirty ? "primary" : "ghost"}
        className="h-8 w-20"
        disabled={!dirty || n <= 0 || blocked}
        title={blocked ? "Harga di bawah HPP hanya bisa disetujui Owner" : undefined}
        onClick={() => {
          let reason: string | undefined;
          if (belowHpp) {
            reason = window.prompt("Harga di bawah HPP. Alasan wajib (BR-PRC-04):") ?? "";
            if (!reason.trim()) return toast({ title: "Perubahan dibatalkan", description: "Alasan wajib untuk harga di bawah HPP.", tone: "error" });
          }
          updatePrice(sku.id, field, n, reason);
          toast({ title: `${sku.code} diperbarui`, description: `${formatRp(sku[field])} → ${formatRp(n)} · tercatat di riwayat harga` });
        }}
      >
        {blocked ? <Lock className="size-3.5" aria-hidden /> : dirty ? "Simpan" : "—"}
      </Button>
    </div>
  );
}

export default function PricingPage() {
  const { state } = useApp();
  const view = usePageState(false);
  const empty = view === "empty";
  const loading = view === "loading";
  const isOwner = state.admin.role === "owner";

  const marginCell = (price: number, hpp: number) => (
    <span className={cn(price < hpp && "font-semibold text-danger")}>{price < hpp && <TriangleAlert className="mr-1 inline size-3.5" aria-label="Di bawah HPP" />}{pct((price - hpp) / price, 1)}</span>
  );

  const base: Column<Sku>[] = [
    { key: "sku", header: "SKU", cell: (s) => <span><span className="font-semibold">{skuName(s)}</span><span className="block font-mono text-xs text-muted">{s.code}</span></span> },
    { key: "hpp", header: "HPP", align: "right", cell: (s) => formatRp(s.hpp), hideBelow: "sm" },
  ];

  const tierRows = state.skus.flatMap((s) => s.tiers.map((t) => ({ s, t })));
  const contractRows = state.contracts.filter((c) => c.status === "aktif").flatMap((c) => c.items.map((i) => ({ c, i, s: state.skus.find((x) => x.id === i.skuId)! })));

  return (
    <>
      <PageHeader title="Harga" description="4 lapis harga. Satu order = satu harga final yang bisa dijelaskan asalnya (snapshot saat order dibuat)." />
      <Card className="mb-6 p-4">
        <p className="text-sm font-semibold">Urutan prioritas (BR-PRC-01)</p>
        <ol className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {(Object.keys(PRICE_SOURCE) as PriceSource[]).sort((a, b) => PRICE_SOURCE[a].rank - PRICE_SOURCE[b].rank).map((k, i, arr) => (
            <li key={k} className="flex items-center gap-2">
              <PriceSourceLabel source={k} />
              <span className="hidden text-xs text-muted md:inline">{PRICE_SOURCE[k].description}</span>
              {i < arr.length - 1 && <span aria-hidden className="text-muted">›</span>}
            </li>
          ))}
        </ol>
      </Card>
      {!isOwner && <Notice tone="warning" className="mb-4" title={`Masuk sebagai ${ROLE_LABEL[state.admin.role]}`}>Harga di bawah HPP diblokir. Hanya Owner yang dapat menyetujui dengan alasan.</Notice>}

      <Tabs defaultValue="retail">
        <TabsList>
          <TabsTrigger value="retail">Retail</TabsTrigger>
          <TabsTrigger value="reseller">Reseller</TabsTrigger>
          <TabsTrigger value="tier">Tier qty</TabsTrigger>
          <TabsTrigger value="kontrak">Kontrak</TabsTrigger>
        </TabsList>
        <TabsContent value="retail">
          <DataTable
            caption="Harga retail"
            rows={empty ? [] : state.skus}
            rowKey={(s) => s.id}
            loading={loading}
            empty={<EmptyState compact className="m-4 border-0" icon={Tag} title="Belum ada harga retail" />}
            columns={[
              ...base,
              { key: "price", header: "Harga retail / satuan", align: "right", cell: (s) => <PriceCell key={s.price} sku={s} field="price" /> },
              { key: "kg", header: "Per kg", align: "right", cell: (s) => (s.uom === "kg" ? "—" : formatRp(pricePerKg(s, s.price))), hideBelow: "md" },
              { key: "m", header: "Margin", align: "right", cell: (s) => marginCell(s.price, s.hpp) },
            ]}
          />
        </TabsContent>
        <TabsContent value="reseller">
          <DataTable
            caption="Harga reseller"
            rows={empty ? [] : state.skus}
            rowKey={(s) => s.id}
            loading={loading}
            empty={<EmptyState compact className="m-4 border-0" icon={Tag} title="Belum ada harga reseller" />}
            columns={[
              ...base,
              { key: "retail", header: "Retail", align: "right", cell: (s) => <span className="text-muted">{formatRp(s.price)}</span>, hideBelow: "md" },
              { key: "price", header: "Harga reseller", align: "right", cell: (s) => <PriceCell key={s.resellerPrice} sku={s} field="resellerPrice" /> },
              { key: "disc", header: "vs retail", align: "right", cell: (s) => `−${pct(1 - s.resellerPrice / s.price, 1)}`, hideBelow: "lg" },
              { key: "m", header: "Margin", align: "right", cell: (s) => marginCell(s.resellerPrice, s.hpp) },
            ]}
          />
          <p className="mt-2 text-xs text-muted">Hanya berlaku untuk akun reseller yang sudah disetujui (mis. Toko Frozen Sejahtera).</p>
        </TabsContent>
        <TabsContent value="tier">
          <DataTable
            caption="Aturan tier qty"
            rows={empty ? [] : tierRows}
            rowKey={({ s, t }) => s.id + t.minQty}
            loading={loading}
            empty={<EmptyState compact className="m-4 border-0" icon={Tag} title="Belum ada aturan tier" />}
            columns={[
              { key: "sku", header: "SKU", cell: ({ s }) => <span className="font-semibold">{skuName(s)}</span> },
              { key: "scope", header: "Cakupan", cell: () => "Per SKU · per baris item" },
              { key: "min", header: "Min. qty", align: "right", cell: ({ s, t }) => `≥ ${t.minQty} ${s.uom}` },
              { key: "retail", header: "Retail", align: "right", cell: ({ s }) => <span className="text-muted">{formatRp(s.price)}</span>, hideBelow: "sm" },
              { key: "price", header: "Harga tier", align: "right", cell: ({ t }) => <span className="font-semibold">{formatRp(t.price)}</span> },
              { key: "m", header: "Margin", align: "right", cell: ({ s, t }) => marginCell(t.price, s.hpp) },
            ]}
          />
        </TabsContent>
        <TabsContent value="kontrak">
          <DataTable
            caption="Harga kontrak"
            rows={empty ? [] : contractRows}
            rowKey={({ c, i }) => c.id + i.skuId}
            loading={loading}
            empty={<EmptyState compact className="m-4 border-0" icon={Tag} title="Belum ada kontrak aktif" />}
            columns={[
              { key: "cust", header: "Pelanggan", cell: ({ c }) => <span><span className="font-semibold">{customerById(c.customerId)?.name}</span><span className="block text-xs text-muted">{c.number}</span></span> },
              { key: "sku", header: "SKU", cell: ({ s }) => skuName(s) },
              { key: "period", header: "Berlaku", cell: ({ c }) => <span className="whitespace-nowrap text-muted tnum">{formatDate(c.start)} – {formatDate(c.end)}</span>, hideBelow: "lg" },
              { key: "retail", header: "Retail", align: "right", cell: ({ s }) => <span className="text-muted">{formatRp(s.price)}</span>, hideBelow: "md" },
              { key: "price", header: "Harga kontrak", align: "right", cell: ({ i }) => <span className="font-semibold">{formatRp(i.price)}</span> },
              { key: "m", header: "Margin", align: "right", cell: ({ i, s }) => marginCell(i.price, s.hpp) },
              { key: "label", header: "Prioritas", cell: () => <PriceSourceLabel source="kontrak" /> },
            ]}
          />
          <p className="mt-2 text-xs text-muted">Harga kontrak terkunci selama periode. Perubahan lewat addendum kontrak (FR-B2B-007).</p>
        </TabsContent>
      </Tabs>

      <section className="mt-8" aria-labelledby="log">
        <h2 id="log" className="mb-3 font-semibold">Riwayat perubahan harga</h2>
        <DataTable
          caption="Riwayat perubahan harga"
          rows={empty ? [] : state.priceLog}
          rowKey={(l) => l.at + l.skuId + l.field}
          loading={loading}
          empty={<p className="px-4 py-6 text-sm text-muted">Belum ada perubahan.</p>}
          columns={[
            { key: "at", header: "Waktu", cell: (l) => <span className="whitespace-nowrap tnum">{formatDateTime(l.at)}</span> },
            { key: "sku", header: "SKU", cell: (l) => <span className="font-mono text-xs">UF-{l.skuId}</span> },
            { key: "f", header: "Lapisan", cell: (l) => (l.field === "price" ? "Retail" : "Reseller") },
            { key: "ch", header: "Perubahan", align: "right", cell: (l) => <span className="whitespace-nowrap">{formatRp(l.from)} → <strong>{formatRp(l.to)}</strong></span> },
            { key: "by", header: "Oleh", cell: (l) => l.by, hideBelow: "sm" },
            { key: "r", header: "Alasan", cell: (l) => <span className="text-muted">{l.reason ?? "—"}</span>, hideBelow: "md" },
          ]}
        />
      </section>
    </>
  );
}
