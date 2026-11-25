"use client";

import Link from "next/link";
import { FileSignature } from "lucide-react";
import { creditExposure, overdueInvoices } from "@/lib/commerce";
import { formatDate, formatRp } from "@/lib/format";
import { customerById } from "@/lib/seed";
import { useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { CreditLimitMeter, QuotaBar } from "@/components/admin/meters";
import { EmptyState, LoadingRegion, Skeleton, StatusPill } from "@/components/ui/feedback";

export default function ContractsPage() {
  const { state, today } = useApp();
  const contracts = [...state.contracts].sort((a, b) => (a.status === "aktif" ? -1 : 1) - (b.status === "aktif" ? -1 : 1));
  const view = usePageState(contracts.length === 0);
  return (
    <>
      <PageHeader title="Kontrak B2B" description="Harga terkunci, kuota tahunan, termin & credit limit per pelanggan HoReKa. Order kontrak diinput admin sebagai call-off." />
      {view === "loading" ? (
        <LoadingRegion label="Memuat kontrak"><div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72" />)}</div></LoadingRegion>
      ) : view === "empty" ? (
        <EmptyState icon={FileSignature} title="Belum ada kontrak" description="Buat kontrak pertama untuk pelanggan B2B dengan harga terkunci dan kuota." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {contracts.map((c) => {
            const cust = customerById(c.customerId)!;
            const used = c.items.reduce((s, i) => s + i.usedGrams, 0);
            const quota = c.items.reduce((s, i) => s + i.quotaGrams, 0);
            const exp = creditExposure(c.customerId, state.invoices, state.orders);
            const overdue = overdueInvoices(c.customerId, state.invoices, today);
            return (
              <li key={c.id}>
                <Link href={`/admin/kontrak/${c.id}`} className="block h-full rounded-card border border-line bg-surface p-5 transition-shadow hover:shadow-lift">
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-muted">{c.number}</p>
                        <h2 className="mt-0.5 text-lg font-semibold">{cust.name}</h2>
                        <p className="text-sm text-muted tnum">{formatDate(c.start)} – {formatDate(c.end)} · termin {c.termDays} hari</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {overdue.length > 0 && c.status === "aktif" && <StatusPill tone="danger">Ada invoice lewat tempo</StatusPill>}
                        <StatusPill tone={c.status === "aktif" ? "success" : c.status === "draft" ? "warning" : "neutral"}>{c.status === "aktif" ? "Aktif" : c.status === "draft" ? "Draft" : "Selesai"}</StatusPill>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kuota total</p>
                      <QuotaBar usedGrams={used} quotaGrams={quota} label={`Kuota total ${c.number}`} />
                      <ul className="space-y-1 text-xs text-muted">
                        {c.items.map((i) => {
                          const sku = state.skus.find((s) => s.id === i.skuId);
                          return <li key={i.skuId} className="flex justify-between gap-2 tnum"><span>{sku?.code} · {formatRp(i.price)}/{sku?.uom}</span><span>{Math.round(i.usedGrams / 1000)}/{Math.round(i.quotaGrams / 1000)} kg</span></li>;
                        })}
                      </ul>
                    </div>
                    {c.status === "aktif" && (
                      <div className="mt-5 border-t border-line pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Credit limit</p>
                        <CreditLimitMeter used={exp.total} limit={c.creditLimit} compact />
                      </div>
                    )}
                  </>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
