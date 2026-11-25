"use client";

import Link from "next/link";
import { CalendarClock, ClipboardList, PackageCheck, Receipt, ShieldCheck, TriangleAlert, Warehouse } from "lucide-react";
import { productById, daysBetween, invoiceBalance, stockLevel, STATUS_LABEL } from "@/lib/commerce";
import { formatDate, formatNum, formatRp, formatTime } from "@/lib/format";
import { customerById } from "@/lib/seed";
import { useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { StatTile } from "@/components/admin/meters";
import { Card, EmptyState, LoadingRegion, Skeleton, StatusPill } from "@/components/ui/feedback";
import { OrderStatusPill } from "@/components/store/order-ui";

export default function DashboardPage() {
  const { state, today, now } = useApp();
  const ordersToday = state.orders.filter((o) => o.createdAt.slice(0, 10) === today);
  const needVerify = state.orders.filter((o) => o.status === "menunggu_pembayaran" && o.payment === "menunggu_verifikasi");
  const toProcess = state.orders.filter((o) => ["dibayar", "diproses"].includes(o.status));
  const readyShip = state.orders.filter((o) => o.status === "siap_kirim");
  const dueInvoices = state.invoices.filter((i) => invoiceBalance(i) > 0 && daysBetween(today, i.dueAt) <= 3);
  const overdue = dueInvoices.filter((i) => daysBetween(i.dueAt, today) > 0);
  const lowStock = state.skus.filter((s) => stockLevel(s) !== "aman");
  const pendingClaims = state.claims.filter((c) => c.status === "diajukan");
  const view = usePageState(false);
  const empty = view === "empty";

  const actions = [
    ...needVerify.map((o) => ({ key: o.number, href: `/admin/order?o=${o.number}`, title: `Verifikasi transfer ${o.number}`, meta: `${o.customerName} · ${formatRp(o.total)} · bukti ${o.proofName}`, tone: "warning" as const, tag: "Perlu verifikasi" })),
    ...pendingClaims.map((c) => ({ key: c.id, href: `/admin/order?o=${c.orderNumber}`, title: `Tinjau klaim ${c.id}`, meta: `${c.orderNumber} · diajukan ${formatDate(c.createdAt)}${(now.getTime() - new Date(c.createdAt).getTime()) / 3_600_000 > 24 ? " · lewat 24 jam" : ""}`, tone: "danger" as const, tag: "Klaim" })),
    ...toProcess.map((o) => ({ key: o.number, href: `/admin/order?o=${o.number}`, title: `${STATUS_LABEL[o.status]}: ${o.number}`, meta: `${o.customerName} · kirim ${formatDate(o.shipDate)}`, tone: "info" as const, tag: o.channel === "manual" ? "Call-off" : "Web" })),
  ];

  return (
    <>
      <PageHeader title="Dashboard" description={`Ringkasan hari ini, ${formatDate(now)}. Cut-off kirim 14.00 WIB.`} />
      {view === "loading" ? (
        <LoadingRegion label="Memuat dashboard">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}</div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
        </LoadingRegion>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatTile label="Order baru" value={empty ? 0 : ordersToday.length} hint="Dibuat hari ini (web + manual)" icon={ClipboardList} href="/admin/order" />
            <StatTile label="Perlu verifikasi" value={empty ? 0 : needVerify.length} hint={empty || !needVerify.length ? "Tidak ada antrean" : formatRp(needVerify.reduce((s, o) => s + o.total, 0))} icon={ShieldCheck} tone={!empty && needVerify.length ? "warning" : "neutral"} href="/admin/order?f=verifikasi" />
            <StatTile label="Siap kirim" value={empty ? 0 : readyShip.length} hint={`${empty ? 0 : toProcess.length} lagi sedang diproses`} icon={PackageCheck} href="/admin/order?f=siap_kirim" />
            <StatTile label="Jatuh tempo ≤ 3 hari" value={empty ? 0 : dueInvoices.length} hint={empty ? "—" : `${overdue.length} sudah lewat · ${formatRp(dueInvoices.reduce((s, i) => s + invoiceBalance(i), 0))}`} icon={CalendarClock} tone={!empty && overdue.length ? "danger" : "neutral"} href="/admin/invoice" />
            <StatTile label="Alert stok" value={empty ? 0 : lowStock.length} hint={empty ? "—" : `${lowStock.filter((s) => stockLevel(s) === "habis").length} habis · ${lowStock.filter((s) => stockLevel(s) === "menipis").length} di bawah minimum`} icon={Warehouse} tone={!empty && lowStock.length ? "warning" : "neutral"} href="/admin/stok" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-semibold">Perlu tindakan</h2>
                <Link href="/admin/order" className="text-sm font-semibold text-primary hover:underline">Semua order</Link>
              </div>
              {empty || actions.length === 0 ? (
                <EmptyState compact className="m-5" icon={ClipboardList} title="Semua beres" description="Tidak ada order yang menunggu verifikasi, klaim, atau proses." />
              ) : (
                <ul className="divide-y divide-line">
                  {actions.slice(0, 8).map((a) => (
                    <li key={a.key}>
                      <Link href={a.href} className="flex items-center gap-3 px-5 py-3 hover:bg-frost/40">
                        <StatusPill tone={a.tone}>{a.tag}</StatusPill>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{a.title}</span>
                          <span className="block truncate text-xs text-muted">{a.meta}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Alert</h2></div>
              {empty || (lowStock.length === 0 && overdue.length === 0) ? (
                <p className="px-5 py-6 text-sm text-muted">Tidak ada alert stok atau piutang.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {lowStock.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <TriangleAlert className={stockLevel(s) === "habis" ? "size-4 text-danger" : "size-4 text-warning"} aria-hidden />
                      <span className="flex-1"><span className="font-semibold">{productById(s.productId)?.name} {s.label}</span><span className="block text-xs text-muted tnum">Stok {formatNum(s.stock)} {s.uom} · min {s.minStock}</span></span>
                      <Link href="/admin/stok" className="text-xs font-semibold text-primary hover:underline">Terima</Link>
                    </li>
                  ))}
                  {overdue.map((i) => (
                    <li key={i.number} className="flex items-center gap-3 px-5 py-3">
                      <Receipt className="size-4 text-danger" aria-hidden />
                      <span className="flex-1"><span className="font-semibold">{i.number} lewat {daysBetween(i.dueAt, today)} hari</span><span className="block text-xs text-muted tnum">{customerById(i.customerId)?.name} · sisa {formatRp(invoiceBalance(i))}</span></span>
                      <Link href="/admin/invoice" className="text-xs font-semibold text-primary hover:underline">Tagih</Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="mt-6">
            <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Order terbaru</h2></div>
            {empty ? (
              <p className="px-5 py-6 text-sm text-muted">Belum ada order.</p>
            ) : (
              <ul className="divide-y divide-line">
                {state.orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((o) => (
                  <li key={o.number}>
                    <Link href={`/admin/order?o=${o.number}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 text-sm hover:bg-frost/40 sm:grid-cols-[150px_1fr_120px_140px]">
                      <span className="font-semibold tnum">{o.number}</span>
                      <span className="order-3 col-span-2 truncate text-muted sm:order-none sm:col-span-1">{o.customerName} · {formatDate(o.createdAt)} {formatTime(o.createdAt)}</span>
                      <span className="text-right font-semibold tnum">{formatRp(o.total)}</span>
                      <span className="hidden justify-end sm:flex"><OrderStatusPill order={o} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  );
}
