"use client";

import { useState } from "react";
import { ChartColumn, Download } from "lucide-react";
import { AGING_BUCKETS, agingBucket, invoiceBalance, productById, type StockMove } from "@/lib/commerce";
import { formatDate, formatDayLong, formatNum, formatRp, formatWeight, pct } from "@/lib/format";
import { cashDays, downloadCsv, marginBySku, profitAndLoss } from "@/lib/reports";
import { customerById } from "@/lib/seed";
import { useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, Notice, StatusPill } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const PERIOD = "1–25 Nov 2026";

function ExportButton({ onClick }: { onClick: () => void }) {
  return <Button variant="secondary" size="sm" onClick={onClick}><Download className="size-4" aria-hidden /> Export CSV</Button>;
}

function Toolbar({ title, note, onExport }: { title: string; note?: string; onExport: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="font-semibold">{title}</h2>{note && <p className="text-sm text-muted">{note}</p>}</div>
      <ExportButton onClick={onExport} />
    </div>
  );
}

export default function ReportsPage() {
  const { state, today } = useApp();
  const view = usePageState(false);
  const empty = view === "empty";
  const loading = view === "loading";
  const days = cashDays(state.cash);
  const [day, setDay] = useState(days.at(-1)?.date ?? today);
  const d = days.find((x) => x.date === day) ?? days.at(-1);
  const pl = profitAndLoss();
  const margins = marginBySku();
  const open = state.invoices.filter((i) => invoiceBalance(i) > 0);
  const customers = [...new Set(open.map((i) => i.customerId))];
  const stock = state.skus.map((s) => ({ s, value: s.stock * s.hpp, last: state.ledger.filter((m) => m.skuId === s.id).sort((a, b) => b.at.localeCompare(a.at))[0] }));
  const stockTotal = stock.reduce((a, r) => a + r.value, 0);
  const adjustments = state.ledger.filter((m) => m.type === "opname" || m.type === "penyesuaian").sort((a, b) => b.at.localeCompare(a.at));
  const emptyState = <EmptyState compact className="m-4 border-0" icon={ChartColumn} title="Belum ada data di periode ini" />;

  return (
    <>
      <PageHeader title="Laporan" description="5 laporan inti PRD §14. Semua bisa diekspor ke CSV (dibuka di Excel)." />
      <Tabs defaultValue="kas">
        <TabsList>
          <TabsTrigger value="kas">Kas harian</TabsTrigger>
          <TabsTrigger value="lr">Laba rugi</TabsTrigger>
          <TabsTrigger value="margin">Margin per SKU</TabsTrigger>
          <TabsTrigger value="piutang">Piutang</TabsTrigger>
          <TabsTrigger value="stok">Stok</TabsTrigger>
        </TabsList>

        <TabsContent value="kas">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="w-64">
              <label htmlFor="kas-day" className="text-sm font-medium">Tanggal</label>
              <Select id="kas-day" value={d?.date} onChange={(e) => setDay(e.target.value)} className="mt-1.5">
                {days.map((x) => <option key={x.date} value={x.date}>{formatDayLong(x.date)}</option>)}
              </Select>
            </div>
            <ExportButton onClick={() => d && downloadCsv(`kas-${d.date}.csv`, ["Jam", "Keterangan", "Ref", "Masuk", "Keluar"], d.entries.map((e) => [e.time, e.description, e.ref, e.direction === "in" ? e.amount : 0, e.direction === "out" ? e.amount : 0]))} />
          </div>
          {d && !empty && !loading && (
            <dl className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[["Saldo awal", d.opening], ["Masuk", d.inflow], ["Keluar", -d.outflow], ["Saldo akhir", d.closing]].map(([l, v]) => (
                <Card key={l as string} className="p-4"><dt className="text-xs text-muted">{l}</dt><dd className={cn("mt-1 text-xl font-bold tnum", (v as number) < 0 && "text-danger")}>{formatRp(v as number)}</dd></Card>
              ))}
            </dl>
          )}
          <DataTable
            caption="Transaksi kas harian"
            rows={empty || !d ? [] : d.entries}
            rowKey={(e) => e.id}
            loading={loading}
            empty={emptyState}
            columns={[
              { key: "t", header: "Jam", cell: (e) => <span className="tnum">{e.time}</span> },
              { key: "k", header: "Keterangan", cell: (e) => <span>{e.description}<span className="block text-xs text-muted">{e.category}</span></span> },
              { key: "r", header: "Ref", cell: (e) => <span className="font-mono text-xs">{e.ref}</span>, hideBelow: "md" },
              { key: "i", header: "Masuk", align: "right", cell: (e) => (e.direction === "in" ? <span className="text-success">{formatRp(e.amount)}</span> : "") },
              { key: "o", header: "Keluar", align: "right", cell: (e) => (e.direction === "out" ? <span className="text-danger">{formatRp(e.amount)}</span> : "") },
            ]}
            footer={d && (
              <tr className="font-semibold"><td className="px-4 py-2.5" colSpan={2}>Saldo akhir</td><td className="hidden md:table-cell" /><td className="px-3 py-2.5 text-right tnum">{formatRp(d.inflow)}</td><td className="px-4 py-2.5 text-right tnum">{formatRp(d.closing)}</td></tr>
            )}
          />
        </TabsContent>

        <TabsContent value="lr">
          <Toolbar title={`Laba rugi sederhana · ${PERIOD}`} note="Omzet dari penjualan per kanal × harga kanal; HPP dari snapshot moving average." onExport={() => downloadCsv("laba-rugi-nov-2026.csv", ["Baris", "Nominal"], [["Omzet bruto", pl.gross], ["Diskon & voucher", -pl.discounts], ["Omzet neto", pl.net], ["HPP", -pl.cogs], ["Laba kotor", pl.grossProfit], ...pl.opexLines.map((o) => [o.label, -o.amount]), ["Laba bersih", pl.netProfit]])} />
          {empty || loading ? (loading ? <Card className="h-80 skeleton" /> : emptyState) : (
            <Card className="max-w-2xl overflow-hidden">
              <dl className="divide-y divide-line text-sm tnum">
                {[
                  { l: "Omzet bruto", v: pl.gross },
                  { l: "Diskon & voucher", v: -pl.discounts, sub: true },
                  { l: "Omzet neto", v: pl.net, strong: true },
                  { l: "HPP", v: -pl.cogs, sub: true },
                  { l: `Laba kotor · ${pct(pl.grossProfit / pl.net, 1)}`, v: pl.grossProfit, strong: true },
                  ...pl.opexLines.map((o) => ({ l: o.label, v: -o.amount, sub: true })),
                  { l: "Total biaya operasional", v: -pl.opex },
                ].map((r) => (
                  <div key={r.l} className={cn("flex justify-between gap-4 px-5 py-3", r.strong && "bg-bg font-semibold")}>
                    <dt className={cn(r.sub && "pl-4 text-muted")}>{r.l}</dt>
                    <dd className={cn(r.v < 0 && "text-muted")}>{formatRp(r.v)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 bg-primary px-5 py-4 text-base font-bold text-white">
                  <dt>Laba bersih · {pct(pl.netProfit / pl.net, 1)}</dt><dd>{formatRp(pl.netProfit)}</dd>
                </div>
              </dl>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="margin">
          <Toolbar title={`Margin per SKU · ${PERIOD}`} note="Harga jual rata-rata tertimbang (retail, reseller, kontrak). SKU margin negatif ditandai merah." onExport={() => downloadCsv("margin-sku-nov-2026.csv", ["SKU", "Produk", "Qty", "Omzet", "HPP", "Margin", "Margin %"], margins.map((m) => [m.sku.code, m.name, m.qty, m.revenue, m.cogs, m.margin, (m.marginPct * 100).toFixed(1)]))} />
          <DataTable
            caption="Margin per SKU"
            rows={empty ? [] : margins}
            rowKey={(m) => m.sku.id}
            loading={loading}
            empty={emptyState}
            columns={[
              { key: "n", header: "SKU", cell: (m) => <span><span className="font-semibold">{m.name}</span><span className="block font-mono text-xs text-muted">{m.sku.code}</span></span> },
              { key: "q", header: "Terjual", align: "right", cell: (m) => `${formatNum(m.qty)} ${m.sku.uom}` },
              { key: "a", header: "Harga rata²", align: "right", cell: (m) => formatRp(m.avgPrice), hideBelow: "lg" },
              { key: "r", header: "Omzet", align: "right", cell: (m) => formatRp(m.revenue), hideBelow: "sm" },
              { key: "c", header: "HPP", align: "right", cell: (m) => formatRp(m.cogs), hideBelow: "md" },
              { key: "m", header: "Kontribusi", align: "right", cell: (m) => <span className={cn("font-semibold", m.margin < 0 && "text-danger")}>{formatRp(m.margin)}</span> },
              { key: "p", header: "Margin %", align: "right", cell: (m) => (
                <span className="inline-flex items-center justify-end gap-2">
                  <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-line sm:block" aria-hidden><span className="block h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, m.marginPct * 400))}%` }} /></span>
                  {pct(m.marginPct, 1)}
                </span>
              ) },
            ]}
            footer={<tr className="font-semibold"><td className="px-4 py-2.5">Total</td><td /><td className="hidden lg:table-cell" /><td className="hidden px-3 text-right tnum sm:table-cell">{formatRp(margins.reduce((s, m) => s + m.revenue, 0))}</td><td className="hidden px-3 text-right tnum md:table-cell">{formatRp(margins.reduce((s, m) => s + m.cogs, 0))}</td><td className="px-3 text-right tnum">{formatRp(margins.reduce((s, m) => s + m.margin, 0))}</td><td /></tr>}
          />
          {!empty && margins.every((m) => m.margin >= 0) && <Notice tone="success" className="mt-4">Tidak ada SKU dengan margin negatif di periode ini.</Notice>}
        </TabsContent>

        <TabsContent value="piutang">
          <Toolbar title={`Piutang & aging per ${formatDate(today)}`} onExport={() => downloadCsv(`piutang-${today}.csv`, ["Pelanggan", ...AGING_BUCKETS.map((b) => b.label), "Total"], customers.map((c) => [customerById(c)?.name ?? c, ...AGING_BUCKETS.map((b) => open.filter((i) => i.customerId === c && agingBucket(i, today) === b.id).reduce((s, i) => s + invoiceBalance(i), 0)), open.filter((i) => i.customerId === c).reduce((s, i) => s + invoiceBalance(i), 0)]))} />
          <DataTable
            caption="Aging piutang per pelanggan"
            rows={empty ? [] : customers}
            rowKey={(c) => c}
            loading={loading}
            empty={<EmptyState compact className="m-4 border-0" icon={ChartColumn} title="Tidak ada piutang terbuka" />}
            columns={[
              { key: "c", header: "Pelanggan", cell: (c) => <span className="font-semibold">{customerById(c)?.name}</span> },
              ...AGING_BUCKETS.map((b) => ({
                key: b.id,
                header: b.label,
                align: "right" as const,
                hideBelow: b.id === "60+" || b.id === "15-30" ? ("lg" as const) : undefined,
                cell: (c: string) => { const v = open.filter((i) => i.customerId === c && agingBucket(i, today) === b.id).reduce((s, i) => s + invoiceBalance(i), 0); return <span className={cn(v > 0 && b.id !== "current" && "font-semibold text-danger", v === 0 && "text-muted")}>{v ? formatRp(v) : "—"}</span>; },
              })),
              { key: "t", header: "Total", align: "right", cell: (c) => <span className="font-bold">{formatRp(open.filter((i) => i.customerId === c).reduce((s, i) => s + invoiceBalance(i), 0))}</span> },
            ]}
          />
        </TabsContent>

        <TabsContent value="stok">
          <Toolbar title={`Stok & nilai persediaan per ${formatDate(today)}`} note={`Total nilai ${formatRp(stockTotal)} · metode moving average`} onExport={() => downloadCsv(`stok-${today}.csv`, ["SKU", "Produk", "Qty", "Satuan", "Berat (g)", "HPP", "Nilai"], stock.map(({ s, value }) => [s.code, productById(s.productId)?.name ?? "", s.stock, s.uom, s.stock * s.gramsPerUnit, s.hpp, value]))} />
          <DataTable
            caption="Nilai persediaan"
            rows={empty ? [] : stock}
            rowKey={(r) => r.s.id}
            loading={loading}
            empty={emptyState}
            columns={[
              { key: "n", header: "SKU", cell: ({ s }) => <span><span className="font-semibold">{productById(s.productId)?.name} {s.uom === "kg" ? "(kg)" : s.label}</span><span className="block font-mono text-xs text-muted">{s.code}</span></span> },
              { key: "q", header: "Qty", align: "right", cell: ({ s }) => `${formatNum(s.stock)} ${s.uom}` },
              { key: "g", header: "Satuan dasar", align: "right", cell: ({ s }) => formatWeight(s.stock * s.gramsPerUnit), hideBelow: "md" },
              { key: "h", header: "HPP", align: "right", cell: ({ s }) => formatRp(s.hpp), hideBelow: "sm" },
              { key: "v", header: "Nilai", align: "right", cell: ({ value }) => <span className="font-semibold">{formatRp(value)}</span> },
              { key: "l", header: "Gerak terakhir", cell: ({ last }) => (last ? <span className="text-xs text-muted tnum">{formatDate(last.at)}</span> : "—"), hideBelow: "lg" },
            ]}
            footer={<tr className="font-semibold"><td className="px-4 py-2.5">Total</td><td /><td className="hidden md:table-cell" /><td className="hidden sm:table-cell" /><td className="px-3 text-right tnum">{formatRp(stockTotal)}</td><td className="hidden lg:table-cell" /></tr>}
          />
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-semibold">Stok mati (&gt; 30 hari tanpa gerak)</h3>
              <p className="mt-2 text-sm text-muted">{empty ? "—" : stock.filter((r) => r.last && (new Date(`${today}T12:00:00+07:00`).getTime() - new Date(r.last.at).getTime()) / 86_400_000 > 30).length === 0 ? "Tidak ada. Semua SKU bergerak dalam 30 hari terakhir." : ""}</p>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold">Riwayat opname & write-off</h3>
              {adjustments.length === 0 || empty ? <p className="mt-2 text-sm text-muted">Belum ada penyesuaian.</p> : (
                <ul className="mt-3 space-y-2 text-sm">
                  {adjustments.slice(0, 6).map((m: StockMove) => {
                    const s = state.skus.find((x) => x.id === m.skuId)!;
                    return <li key={m.id} className="flex justify-between gap-3"><span><span className="font-medium">{m.ref}</span> · {s.code}<span className="block text-xs text-muted">{m.note}</span></span><StatusPill tone={m.qty < 0 ? "danger" : "success"}>{m.qty > 0 ? "+" : ""}{formatNum(m.qty)} {s.uom} · {formatRp(m.qty * s.hpp)}</StatusPill></li>;
                  })}
                </ul>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
