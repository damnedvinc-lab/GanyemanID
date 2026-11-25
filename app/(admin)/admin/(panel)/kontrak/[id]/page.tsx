"use client";

import { use, useState } from "react";
import Link from "next/link";
import { CircleCheck, FileSignature, Send } from "lucide-react";
import { addDays, creditExposure, invoiceBalance, invoiceStatus, productById, weekday } from "@/lib/commerce";
import { formatDate, formatDayShort, formatKg, formatNum, formatRp, formatWeight } from "@/lib/format";
import { customerById } from "@/lib/seed";
import { checkCallOff, useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { CreditLimitMeter, QuotaBar } from "@/components/admin/meters";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, LoadingRegion, Notice, Skeleton, StatusPill } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { OrderStatusPill } from "@/components/store/order-ui";
import { PriceSourceLabel } from "@/components/store/price";
import { cn } from "@/lib/utils";

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, today, createCallOff } = useApp();
  const toast = useToast();
  const contract = state.contracts.find((c) => c.id === id);
  const view = usePageState(!contract);
  const shipOptions = Array.from({ length: 10 }, (_, i) => addDays(today, i + 1)).filter((d) => weekday(d) !== 0).slice(0, 5);
  const [shipDate, setShipDate] = useState(shipOptions[0]);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<string | null>(null);

  if (view === "loading") return <LoadingRegion label="Memuat kontrak"><Skeleton className="h-10 w-80" /><div className="mt-6 grid gap-6 xl:grid-cols-12"><Skeleton className="h-96 xl:col-span-7" /><Skeleton className="h-96 xl:col-span-5" /></div></LoadingRegion>;
  if (view === "empty" || !contract) return <EmptyState icon={FileSignature} title="Kontrak tidak ditemukan" action={<Link className="font-semibold text-primary" href="/admin/kontrak">Kembali</Link>} />;

  const cust = customerById(contract.customerId)!;
  const items = contract.items.map((i) => ({ skuId: i.skuId, qty: Number((qty[i.skuId] ?? "").replace(/\D/g, "")) || 0 }));
  const check = checkCallOff(state, { contractId: contract.id, shipDate, items }, today);
  const exp = creditExposure(contract.customerId, state.invoices, state.orders);
  const invoices = state.invoices.filter((i) => i.contractId === contract.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const callOffs = state.orders.filter((o) => o.contractId === contract.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const hasQty = items.some((i) => i.qty > 0);

  return (
    <>
      <Link href="/admin/kontrak" className="text-sm font-semibold text-primary hover:underline">← Kontrak B2B</Link>
      <div className="mt-3">
        <PageHeader
          title={cust.name}
          description={<>{contract.number} · {formatDate(contract.start)} – {formatDate(contract.end)} · termin {contract.termDays} hari · {contract.delivery}</>}
          actions={<StatusPill tone={contract.status === "aktif" ? "success" : "neutral"}>{contract.status === "aktif" ? "Aktif" : "Selesai"}</StatusPill>}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-7">
          <Card className="p-5">
            <h2 className="font-semibold">Item kontrak & kuota</h2>
            <ul className="mt-4 space-y-5">
              {contract.items.map((i) => {
                const sku = state.skus.find((s) => s.id === i.skuId)!;
                const l = check.lines.find((x) => x.skuId === i.skuId);
                return (
                  <li key={i.skuId}>
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold">{productById(sku.productId)?.name} {sku.label}</span>
                      <span className="flex items-center gap-2 tnum"><PriceSourceLabel source="kontrak" /> {formatRp(i.price)}/{sku.uom} <span className="text-xs text-muted">(retail {formatRp(sku.price)})</span></span>
                    </div>
                    <QuotaBar usedGrams={i.usedGrams} quotaGrams={i.quotaGrams} pendingGrams={l?.grams ?? 0} label={`Kuota ${sku.code}`} />
                  </li>
                );
              })}
            </ul>
          </Card>

          <section aria-labelledby="calloffs">
            <h2 id="calloffs" className="mb-3 font-semibold">Riwayat call-off</h2>
            <DataTable
              caption="Riwayat call-off"
              rows={callOffs}
              rowKey={(o) => o.number}
              empty={<p className="px-4 py-6 text-sm text-muted">Belum ada call-off untuk kontrak ini.</p>}
              columns={[
                { key: "n", header: "Order", cell: (o) => <Link href={`/admin/order?o=${o.number}`} className="font-semibold text-primary hover:underline tnum">{o.number}</Link> },
                { key: "d", header: "Kirim", cell: (o) => <span className="tnum">{formatDate(o.shipDate)}</span> },
                { key: "w", header: "Berat", align: "right", cell: (o) => formatWeight(o.netGrams), hideBelow: "sm" },
                { key: "t", header: "Total", align: "right", cell: (o) => formatRp(o.total) },
                { key: "s", header: "Status", cell: (o) => <OrderStatusPill order={o} /> },
              ]}
            />
          </section>

          <section aria-labelledby="inv">
            <h2 id="inv" className="mb-3 font-semibold">Invoice</h2>
            <DataTable
              caption="Invoice kontrak"
              rows={invoices}
              rowKey={(i) => i.number}
              empty={<p className="px-4 py-6 text-sm text-muted">Belum ada invoice.</p>}
              columns={[
                { key: "n", header: "Invoice", cell: (i) => <span className="font-semibold tnum">{i.number}</span> },
                { key: "due", header: "Jatuh tempo", cell: (i) => <span className="tnum">{formatDate(i.dueAt)}</span> },
                { key: "t", header: "Total", align: "right", cell: (i) => formatRp(i.total), hideBelow: "sm" },
                { key: "b", header: "Sisa", align: "right", cell: (i) => <span className="font-semibold">{formatRp(invoiceBalance(i))}</span> },
                { key: "s", header: "Status", cell: (i) => { const st = invoiceStatus(i, today); return <StatusPill tone={st === "lunas" ? "success" : st === "jatuh_tempo" ? "danger" : st === "sebagian" ? "warning" : "neutral"}>{st === "lunas" ? "Lunas" : st === "jatuh_tempo" ? "Lewat tempo" : st === "sebagian" ? "Dibayar sebagian" : "Belum dibayar"}</StatusPill>; } },
              ]}
            />
          </section>
        </div>

        <aside className="xl:col-span-5">
          <Card className="space-y-5 p-5 xl:sticky xl:top-24">
            <div>
              <h2 className="font-display text-xl font-semibold">Buat call-off order</h2>
              <p className="mt-1 text-sm text-muted">Harga diambil dari kontrak. Kuota berkurang saat call-off dibuat (BR-B2B-02).</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Credit limit</p>
              <CreditLimitMeter used={exp.total} limit={contract.creditLimit} pending={check.total} />
              <p className="mt-1 text-xs text-muted tnum">Piutang invoice {formatRp(exp.invoiced)} + call-off belum ditagih {formatRp(exp.open)}</p>
            </div>
            {contract.status !== "aktif" ? (
              <Notice tone="info">Kontrak sudah selesai. Call-off hanya untuk kontrak aktif.</Notice>
            ) : (
              <>
                <Field label="Tanggal kirim">
                  {(p) => <Select {...p} value={shipDate} onChange={(e) => setShipDate(e.target.value)}>{shipOptions.map((d) => <option key={d} value={d}>{formatDayShort(d)}</option>)}</Select>}
                </Field>
                <div className="space-y-3">
                  {contract.items.map((i) => {
                    const sku = state.skus.find((s) => s.id === i.skuId)!;
                    const l = check.lines.find((x) => x.skuId === i.skuId);
                    const leftUnits = Math.floor((i.quotaGrams - i.usedGrams) / sku.gramsPerUnit);
                    return (
                      <div key={i.skuId} className={cn("rounded-[14px] border p-3", l && (l.overQuota || l.overStock) ? "border-danger bg-danger-soft/40" : "border-line")}>
                        <div className="flex items-center justify-between gap-3">
                          <label htmlFor={`co-${i.skuId}`} className="min-w-0 text-sm">
                            <span className="block font-semibold">{productById(sku.productId)?.name} {sku.label}</span>
                            <span className="text-xs text-muted tnum">Sisa kuota {formatKg(i.quotaGrams - i.usedGrams)} = {formatNum(leftUnits)} {sku.uom} · stok {formatNum(sku.stock)}</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <Input id={`co-${i.skuId}`} inputMode="numeric" placeholder="0" className="h-9 w-20 text-right tnum" value={qty[i.skuId] ?? ""} onChange={(e) => setQty({ ...qty, [i.skuId]: e.target.value })} aria-invalid={l && (l.overQuota || l.overStock) ? true : undefined} />
                            <span className="text-xs text-muted">{sku.uom}</span>
                          </div>
                        </div>
                        {l && <p className={cn("mt-2 text-xs tnum", l.overQuota ? "font-semibold text-danger" : "text-muted")}>{formatWeight(l.grams)} · {formatRp(l.qty * l.price)}{l.overQuota ? ` — melebihi sisa kuota ${formatKg(l.leftGrams)}` : ""}</p>}
                      </div>
                    );
                  })}
                </div>
                <dl className="space-y-1.5 border-t border-line pt-4 text-sm tnum">
                  <div className="flex justify-between"><dt className="text-muted">Total call-off</dt><dd className="font-bold">{formatRp(check.total)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Jatuh tempo invoice</dt><dd>{formatDate(addDays(shipDate, contract.termDays))}</dd></div>
                </dl>
                {hasQty && !check.ok && (
                  <Notice tone="danger" title="Call-off diblokir">
                    <ul className="list-disc space-y-1 pl-4">{check.errors.map((e) => <li key={e}>{e}</li>)}</ul>
                  </Notice>
                )}
                {!hasQty && check.errors.some((e) => e.includes("jatuh tempo")) && (
                  <Notice tone="danger" title="Pelanggan sedang diblokir">{check.errors.find((e) => e.includes("jatuh tempo"))}</Notice>
                )}
                {created && <Notice tone="success" title="Call-off dibuat">Order <Link className="font-semibold underline" href={`/admin/order?o=${created}`}>{created}</Link> berstatus Diproses.</Notice>}
                <Button block disabled={!hasQty || !check.ok} onClick={() => {
                  const r = createCallOff({ contractId: contract.id, shipDate, items });
                  if (r.ok && r.order) {
                    setCreated(r.order.number);
                    setQty({});
                    toast({ title: `Call-off ${r.order.number} dibuat`, description: `${formatRp(r.order.total)} · kuota & stok diperbarui` });
                  } else toast({ title: "Call-off diblokir", description: r.errors[0], tone: "error" });
                }}>
                  {check.ok || !hasQty ? <Send className="size-4" aria-hidden /> : <CircleCheck className="size-4" aria-hidden />} Buat call-off
                </Button>
              </>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
