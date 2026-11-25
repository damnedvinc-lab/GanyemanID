"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList, Store, User } from "lucide-react";
import { claimWindow } from "@/lib/commerce";
import { formatDate, formatDuration, formatRp, formatWeight } from "@/lib/format";
import { useApp, usePageState } from "@/lib/store";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, LoadingRegion, Skeleton, StatusPill } from "@/components/ui/feedback";
import { OrderStatusPill } from "@/components/store/order-ui";
import { Container } from "@/components/store/section";

export default function AccountPage() {
  const { state, viewer, now } = useApp();
  const orders = state.orders.filter((o) => o.customerId === viewer.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const claims = state.claims.filter((c) => orders.some((o) => o.number === c.orderNumber));
  const view = usePageState(orders.length === 0);
  const spent = orders.filter((o) => !["dibatalkan", "menunggu_pembayaran"].includes(o.status)).reduce((s, o) => s + o.total, 0);

  return (
    <Container className="pt-6 md:pt-10">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-frost text-primary">{viewer.type === "reseller" ? <Store className="size-6" aria-hidden /> : <User className="size-6" aria-hidden />}</span>
        <div>
          <h1 className="font-display text-3xl font-semibold">Halo, {viewer.name.split(" ")[0] === "Toko" ? viewer.name : viewer.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted">
            {viewer.email} · {viewer.type === "reseller" ? <span className="font-semibold text-primary">Akun reseller disetujui</span> : "Akun retail"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section aria-labelledby="riwayat" className="min-w-0 lg:col-span-8">
          <div className="flex items-end justify-between gap-3">
            <h2 id="riwayat" className="font-display text-2xl font-semibold">Riwayat pesanan</h2>
            {view === "normal" && <p className="text-sm text-muted tnum">{orders.length} pesanan · {formatRp(spent)}</p>}
          </div>
          <div className="mt-4">
            {view === "loading" ? (
              <LoadingRegion label="Memuat riwayat pesanan"><div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div></LoadingRegion>
            ) : view === "empty" ? (
              <EmptyState icon={ClipboardList} title="Belum ada pesanan" description="Pesanan pertamamu akan muncul di sini lengkap dengan status, resi, dan tombol klaim." action={<ButtonLink href="/katalog">Mulai belanja</ButtonLink>} />
            ) : (
              <ul className="space-y-3">
                {orders.map((o) => {
                  const cw = claimWindow(o, now);
                  return (
                    <li key={o.number}>
                      <Link href={`/akun/pesanan/${o.number}`} className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 transition-shadow hover:shadow-lift sm:p-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold tnum">{o.number}</p>
                            <OrderStatusPill order={o} />
                            {cw.open && <StatusPill tone="info">Klaim dibuka · {formatDuration(cw.minutesLeft)}</StatusPill>}
                          </div>
                          <p className="mt-1 truncate text-sm text-muted">{o.lines.map((l) => l.productName).join(", ")}</p>
                          <p className="mt-0.5 text-xs text-muted tnum">{formatDate(o.createdAt)} · {formatWeight(o.netGrams)}</p>
                        </div>
                        <p className="font-bold tnum">{formatRp(o.total)}</p>
                        <ChevronRight className="size-5 text-muted" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-5 lg:col-span-4">
          <Card className="p-5">
            <h2 className="font-display text-xl font-semibold">Klaim retur</h2>
            {claims.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Belum ada klaim. Klaim bisa diajukan maksimal 6 jam setelah pesanan diterima, dari halaman detail pesanan.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {claims.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <Link href={`/akun/pesanan/${c.orderNumber}`} className="font-semibold hover:underline">{c.id}</Link>
                    <StatusPill tone={c.status === "diajukan" ? "warning" : c.status === "disetujui" ? "success" : "neutral"}>{c.status === "diajukan" ? "Ditinjau" : c.status === "disetujui" ? "Disetujui" : "Ditolak"}</StatusPill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="font-display text-xl font-semibold">Alamat tersimpan</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {viewer.addresses.map((a) => (
                <li key={a.id}><p className="font-semibold">{a.label}</p><p className="text-muted">{a.line}, {a.city} {a.postal}</p></li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
