"use client";

import { useState } from "react";
import { Receipt, Wallet } from "lucide-react";
import { AGING_BUCKETS, agingBucket, creditExposure, daysBetween, invoiceBalance, invoicePaid, invoiceStatus, type Invoice } from "@/lib/commerce";
import { formatDate, formatRp } from "@/lib/format";
import { customerById } from "@/lib/seed";
import { useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { CreditLimitMeter } from "@/components/admin/meters";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Card, EmptyState, LoadingRegion, Notice, Skeleton, StatusPill } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

function PaymentModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { recordInvoicePayment } = useApp();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"transfer" | "tunai">("transfer");
  if (!invoice) return null;
  const balance = invoiceBalance(invoice);
  const n = Number(amount.replace(/\D/g, "")) || 0;
  const error = n > balance ? `Melebihi sisa tagihan ${formatRp(balance)}. Lebih bayar dicatat sebagai saldo pelanggan oleh Finance.` : "";
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Catat pembayaran ${invoice.number}`}
      description={`${customerById(invoice.customerId)?.name} · sisa ${formatRp(balance)}`}
      footer={<><Button variant="secondary" onClick={onClose}>Batal</Button><Button disabled={n <= 0 || Boolean(error)} onClick={() => { recordInvoicePayment(invoice.number, n, method); toast({ title: `Pembayaran ${formatRp(n)} dicatat`, description: n === balance ? "Invoice lunas." : `Sisa ${formatRp(balance - n)}` }); onClose(); }}>Simpan pembayaran</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nominal diterima" error={error || undefined}>{(p) => <Input {...p} inputMode="numeric" placeholder={String(balance)} value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
        <Field label="Metode">{(p) => <Select {...p} value={method} onChange={(e) => setMethod(e.target.value as "transfer" | "tunai")}><option value="transfer">Transfer bank</option><option value="tunai">Tunai</option></Select>}</Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setAmount(String(balance))}>Lunasi {formatRp(balance)}</Button>
        <Button size="sm" variant="secondary" onClick={() => setAmount(String(Math.round(balance / 2)))}>Setengah</Button>
      </div>
    </Modal>
  );
}

export default function InvoicePage() {
  const { state, today } = useApp();
  const view = usePageState(state.invoices.length === 0);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<"terbuka" | "semua">("terbuka");
  const empty = view === "empty";
  const open = state.invoices.filter((i) => invoiceBalance(i) > 0);
  const rows = (filter === "terbuka" ? open : state.invoices).slice().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const buckets = AGING_BUCKETS.map((b) => ({ ...b, amount: open.filter((i) => agingBucket(i, today) === b.id).reduce((s, i) => s + invoiceBalance(i), 0) }));
  const totalAr = buckets.reduce((s, b) => s + b.amount, 0);
  const b2b = state.contracts.filter((c) => c.status === "aktif");

  return (
    <>
      <PageHeader title="Invoice & piutang" description="Invoice terbit otomatis saat call-off B2B Dikirim. Aging dihitung dari tanggal jatuh tempo." />
      {view === "loading" ? (
        <LoadingRegion label="Memuat piutang"><Skeleton className="h-28" /><div className="mt-6 grid gap-4 md:grid-cols-2"><Skeleton className="h-36" /><Skeleton className="h-36" /></div><Skeleton className="mt-6 h-72" /></LoadingRegion>
      ) : empty ? (
        <EmptyState icon={Receipt} title="Belum ada invoice" description="Invoice muncul setelah call-off kontrak B2B ditandai Dikirim." />
      ) : (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">Aging piutang</h2>
              <p className="text-sm text-muted tnum">Total piutang <strong className="text-lg text-ink">{formatRp(totalAr)}</strong></p>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-line" aria-hidden>
              {buckets.filter((b) => b.amount > 0).map((b) => (
                <div key={b.id} className={cn(b.id === "current" ? "bg-success" : b.id === "1-7" ? "bg-warning" : b.id === "8-14" ? "bg-danger/70" : "bg-danger")} style={{ width: `${(b.amount / totalAr) * 100}%` }} />
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {buckets.map((b) => (
                <div key={b.id} className={cn("rounded-[14px] p-3", b.amount > 0 && b.id !== "current" ? "bg-danger-soft" : "bg-bg")}>
                  <dt className="text-xs text-muted">{b.label}</dt>
                  <dd className="mt-1 font-semibold tnum">{formatRp(b.amount)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {b2b.map((c) => {
              const exp = creditExposure(c.customerId, state.invoices, state.orders);
              const overdue = open.filter((i) => i.customerId === c.customerId && daysBetween(i.dueAt, today) > 0);
              return (
                <Card key={c.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{customerById(c.customerId)?.name}</h3>
                      <p className="text-xs text-muted">{c.number} · termin {c.termDays} hari</p>
                    </div>
                    {overdue.length > 0 ? <StatusPill tone="danger">Order baru diblokir</StatusPill> : <StatusPill tone="success">Lancar</StatusPill>}
                  </div>
                  <CreditLimitMeter className="mt-4" used={exp.total} limit={c.creditLimit} />
                  <p className="mt-2 text-xs text-muted tnum">Invoice terbuka {formatRp(exp.invoiced)} · call-off belum ditagih {formatRp(exp.open)}</p>
                  {overdue.length > 0 && <Notice tone="danger" className="mt-3">{overdue.length} invoice lewat jatuh tempo — call-off baru diblokir otomatis (BR-B2B-05).</Notice>}
                </Card>
              );
            })}
          </div>

          <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Daftar invoice</h2>
            <Select aria-label="Filter invoice" value={filter} onChange={(e) => setFilter(e.target.value as "terbuka" | "semua")} className="w-48">
              <option value="terbuka">Belum lunas ({open.length})</option>
              <option value="semua">Semua ({state.invoices.length})</option>
            </Select>
          </div>
          <DataTable
            caption="Daftar invoice"
            rows={rows}
            rowKey={(i) => i.number}
            empty={<EmptyState compact className="m-4 border-0" icon={Receipt} title="Semua invoice lunas" />}
            columns={[
              { key: "n", header: "Invoice", cell: (i) => <span><span className="font-semibold tnum">{i.number}</span><span className="block text-xs text-muted tnum">{i.orderNumber}</span></span> },
              { key: "c", header: "Pelanggan", cell: (i) => customerById(i.customerId)?.name, hideBelow: "md" },
              { key: "d", header: "Terbit", cell: (i) => <span className="tnum">{formatDate(i.issuedAt)}</span>, hideBelow: "xl" },
              { key: "due", header: "Jatuh tempo", cell: (i) => { const late = daysBetween(i.dueAt, today); return <span className="whitespace-nowrap tnum">{formatDate(i.dueAt)}{invoiceBalance(i) > 0 && <span className={cn("block text-xs", late > 0 ? "font-semibold text-danger" : "text-muted")}>{late > 0 ? `lewat ${late} hari` : late === 0 ? "hari ini" : `${-late} hari lagi`}</span>}</span>; } },
              { key: "t", header: "Total", align: "right", cell: (i) => formatRp(i.total), hideBelow: "sm" },
              { key: "p", header: "Terbayar", align: "right", cell: (i) => formatRp(invoicePaid(i)), hideBelow: "2xl" },
              { key: "b", header: "Sisa", align: "right", cell: (i) => <span className="font-semibold">{formatRp(invoiceBalance(i))}</span> },
              { key: "s", header: "Status", cell: (i) => { const st = invoiceStatus(i, today); return <StatusPill tone={st === "lunas" ? "success" : st === "jatuh_tempo" ? "danger" : st === "sebagian" ? "warning" : "neutral"}>{st === "lunas" ? "Lunas" : st === "jatuh_tempo" ? `Lewat tempo · ${AGING_BUCKETS.find((b) => b.id === agingBucket(i, today))?.label}` : st === "sebagian" ? "Sebagian" : "Belum bayar"}</StatusPill>; } },
              { key: "a", header: "", align: "right", cell: (i) => invoiceBalance(i) > 0 ? <Button size="sm" variant="secondary" className="h-8" onClick={() => setPaying(i)}><Wallet className="size-3.5" aria-hidden /> Catat bayar</Button> : null },
            ]}
          />
        </>
      )}
      <PaymentModal key={paying?.number} invoice={paying} onClose={() => setPaying(null)} />
    </>
  );
}
