"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Search } from "lucide-react";
import type { OrderStatus } from "@/lib/mock-data";
import { type Order } from "@/lib/commerce";
import { formatDate, formatRp, formatTime, formatWeight } from "@/lib/format";
import { useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { OrderPanel } from "@/components/admin/order-panel";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Sheet } from "@/components/ui/dialog";
import { Card } from "@/components/ui/feedback";
import { OrderStatusPill } from "@/components/store/order-ui";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media";

const FILTERS: { id: string; label: string; test: (o: Order) => boolean }[] = [
  { id: "semua", label: "Semua", test: () => true },
  { id: "verifikasi", label: "Perlu verifikasi", test: (o) => o.status === "menunggu_pembayaran" && o.payment === "menunggu_verifikasi" },
  { id: "bayar", label: "Menunggu bayar", test: (o) => o.status === "menunggu_pembayaran" && o.payment !== "menunggu_verifikasi" },
  { id: "proses", label: "Dibayar & diproses", test: (o) => ["dibayar", "diproses"].includes(o.status) },
  { id: "siap_kirim", label: "Siap kirim", test: (o) => o.status === "siap_kirim" },
  { id: "dikirim", label: "Dikirim", test: (o) => o.status === "dikirim" },
  { id: "klaim", label: "Klaim", test: (o) => o.status === "klaim" },
  { id: "selesai", label: "Selesai / batal", test: (o) => (["selesai", "refund", "dibatalkan"] as OrderStatus[]).includes(o.status) },
];

function OrdersView() {
  const { state } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filter, setFilter] = useState(params.get("f") ?? "semua");
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("semua");
  const selected = params.get("o") ?? "";
  const select = (n: string) => router.replace(n ? `${pathname}?o=${n}` : pathname, { scroll: false });

  const rows = useMemo(
    () =>
      state.orders
        .filter((o) => FILTERS.find((f) => f.id === filter)!.test(o))
        .filter((o) => channel === "semua" || o.channel === channel)
        .filter((o) => !q || `${o.number} ${o.customerName}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.orders, filter, channel, q],
  );
  const view = usePageState(false);
  const shown = view === "empty" ? [] : rows;
  const order = state.orders.find((o) => o.number === selected);
  const isXl = useMediaQuery("(min-width: 1280px)");

  const columns: Column<Order>[] = [
    { key: "no", header: "No. order", cell: (o) => <span className="whitespace-nowrap font-semibold tnum">{o.number}</span> },
    { key: "tgl", header: "Dibuat", cell: (o) => <span className="whitespace-nowrap text-muted tnum">{formatDate(o.createdAt)} {formatTime(o.createdAt)}</span>, hideBelow: "md" },
    { key: "cust", header: "Pelanggan", cell: (o) => <span className="block max-w-48 truncate">{o.customerName}<span className="block text-xs text-muted">{o.customerType === "b2b" ? "B2B · manual" : o.customerType === "reseller" ? "Reseller · web" : "Retail · web"}</span></span> },
    { key: "berat", header: "Berat", align: "right", cell: (o) => formatWeight(o.netGrams), hideBelow: "lg" },
    { key: "kirim", header: "Kirim", cell: (o) => <span className="whitespace-nowrap tnum">{formatDate(o.shipDate)}</span>, hideBelow: "xl" },
    { key: "total", header: "Total", align: "right", cell: (o) => <span className="whitespace-nowrap font-semibold">{formatRp(o.total)}</span> },
    { key: "status", header: "Status", cell: (o) => <OrderStatusPill order={o} /> },
  ];

  return (
    <>
      <PageHeader title="Order" description="Order web & input manual (call-off kontrak). Klik baris untuk membuka panel detail." />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter status">
        {FILTERS.map((f) => {
          const count = state.orders.filter(f.test).length;
          return (
            <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 transition-colors", filter === f.id ? "bg-primary text-white ring-primary" : "bg-surface text-ink ring-line hover:bg-frost/50")}>
              {f.label} <span className={cn("text-xs tnum", filter === f.id ? "text-white/75" : "text-muted")}>{view === "empty" ? 0 : count}</span>
            </button>
          );
        })}
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Cari nomor order atau pelanggan" placeholder="Cari nomor order / pelanggan" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select aria-label="Kanal" value={channel} onChange={(e) => setChannel(e.target.value)} className="w-44">
          <option value="semua">Semua kanal</option>
          <option value="web">Web</option>
          <option value="manual">Manual / B2B</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={cn("min-w-0", order ? "xl:col-span-7" : "xl:col-span-12")}>
          <DataTable
            caption="Daftar order"
            columns={order && isXl ? columns.filter((c) => ["no", "cust", "total", "status"].includes(c.key)) : columns}
            rows={shown}
            rowKey={(o) => o.number}
            onRowClick={(o) => select(o.number)}
            selectedKey={selected}
            loading={view === "loading"}
            maxHeight="calc(100vh - 260px)"
            empty={<EmptyState compact className="m-4 border-0" icon={ClipboardList} title="Tidak ada order" description={q ? "Tidak ada yang cocok dengan pencarian." : "Belum ada order di status ini."} />}
          />
        </div>
        {order && (
          <aside className="hidden xl:col-span-5 xl:block" aria-label="Panel detail order">
            <Card className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <OrderPanel key={order.number} order={order} onClose={() => select("")} />
            </Card>
          </aside>
        )}
      </div>

      <div>
        <Sheet open={Boolean(order) && !isXl} onOpenChange={(o) => !o && select("")} title={order?.number ?? "Order"} side="right">
          <div className="-mx-5 -mt-4">{order && <OrderPanel key={order.number} order={order} />}</div>
        </Sheet>
      </div>
    </>
  );
}

export default function OrdersPage() {
  return <Suspense><OrdersView /></Suspense>;
}
