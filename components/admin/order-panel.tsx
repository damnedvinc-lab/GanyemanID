"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, CircleCheck, FileText, Printer, RefreshCcw, Snowflake, Wallet, X } from "lucide-react";
import { CLAIM_REASONS, CONTRACTS, STORE } from "@/lib/mock-data";
import { NEXT_STATUS, PRICE_SOURCE, STATUS_LABEL, productById, zoneById, type Order } from "@/lib/commerce";
import { formatDate, formatDateTime, formatDayLong, formatNum, formatRp, formatWeight } from "@/lib/format";
import { ROLE_LABEL, useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Notice, StatusPill } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { OrderStatusPill } from "@/components/store/order-ui";
import { PriceSourceLabel } from "@/components/store/price";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SuratJalan({ order }: { order: Order }) {
  return (
    <div className="print-area space-y-5 text-sm">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <Logo href="#" />
          <p className="mt-2 text-xs text-muted">{STORE.address} · WA {STORE.whatsapp}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-semibold">Surat Jalan</p>
          <p className="tnum">SJ-{order.number.slice(3)}</p>
          <p className="text-xs text-muted">Kirim {formatDayLong(order.shipDate)}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Penerima</p>
          <p className="mt-1 font-semibold">{order.address.recipient} · {order.address.phone}</p>
          <p>{order.customerName}</p>
          <p className="text-muted">{order.address.line}, {order.address.city} {order.address.postal}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Pengiriman</p>
          <p className="mt-1">{order.courier}{order.awb ? ` · AWB ${order.awb}` : ""}</p>
          <p>{order.boxes} box insulated · berat kirim {formatWeight(order.shipGrams)}</p>
          <p className="text-muted">Ref. order {order.number}</p>
        </div>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink text-left text-xs uppercase">
            <th className="py-2">Kode</th><th className="py-2">Produk</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Berat bersih</th><th className="py-2 text-center">Cek</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((l) => (
            <tr key={l.skuId + (l.variantLabel ?? "")} className="border-b border-line">
              <td className="py-2 tnum">UF-{l.skuId}</td>
              <td className="py-2">{l.productName} {l.uom === "kg" ? "(timbang)" : l.skuLabel}{l.variantLabel ? ` · ${l.variantLabel}` : ""}</td>
              <td className="py-2 text-right tnum">{formatNum(l.qty)} {l.uom}</td>
              <td className="py-2 text-right tnum">{formatWeight(l.gramsPerUnit * l.qty)}</td>
              <td className="py-2 text-center">☐</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={3} className="py-2 text-right font-semibold">Total berat bersih</td><td className="py-2 text-right font-semibold tnum">{formatWeight(order.netGrams)}</td><td /></tr>
        </tfoot>
      </table>
      <div className="flex gap-3 rounded-[12px] border-2 border-primary p-3">
        <Snowflake className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <p><strong>PRODUK BEKU — SIMPAN -18°C.</strong> Jangan diletakkan di bawah sinar matahari atau dekat mesin. Serahkan langsung ke penerima, foto saat serah terima. Penerima: periksa dan masukkan freezer dalam 30 menit; klaim maks {STORE.claimWindowHours} jam.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
        {["Packer", "Kurir", "Penerima"].map((r) => (
          <div key={r}><div className="h-16 border-b border-ink" /><p className="mt-1.5">{r}</p></div>
        ))}
      </div>
    </div>
  );
}

export function OrderPanel({ order, onClose }: { order: Order; onClose?: () => void }) {
  const { state, verifyPayment, setOrderStatus, resolveClaim } = useApp();
  const toast = useToast();
  const [checks, setChecks] = useState({ nominal: false, tanggal: false, nama: false });
  const [awb, setAwb] = useState(order.awb ?? "");
  const [sjOpen, setSjOpen] = useState(false);
  const [claimNote, setClaimNote] = useState("");
  const contract = order.contractId ? CONTRACTS.find((c) => c.id === order.contractId) : undefined;
  const claim = state.claims.find((c) => c.orderNumber === order.number && c.status === "diajukan");
  const sources = [...new Set(order.lines.map((l) => l.priceSource))].sort((a, b) => PRICE_SOURCE[a].rank - PRICE_SOURCE[b].rank);
  const next = (NEXT_STATUS[order.status] ?? []).filter((s) => s !== "dibayar" && s !== "dibatalkan");
  const canCancel = (NEXT_STATUS[order.status] ?? []).includes("dibatalkan");
  const allChecked = checks.nominal && checks.tanggal && checks.nama;
  const zone = zoneById(order.address.zoneId);
  const claimValue = claim ? claim.items.reduce((s, it) => s + (order.lines.find((l) => l.skuId === it.skuId)?.unitPrice ?? 0) * it.qty, 0) : 0;

  const move = (to: typeof next[number]) => {
    const r = setOrderStatus(order.number, to, { awb: to === "dikirim" ? awb.trim() || undefined : undefined });
    toast({ title: r.ok ? `${order.number}: ${STATUS_LABEL[to]}` : "Status tidak berubah", description: r.ok ? undefined : r.message, tone: r.ok ? "success" : "error" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs text-muted">{order.channel === "manual" ? "Input manual · admin" : "Web storefront"} · {formatDateTime(order.createdAt)}</p>
          <h2 className="font-display mt-0.5 text-2xl font-semibold tnum">{order.number}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OrderStatusPill order={order} />
            {sources.map((s) => <PriceSourceLabel key={s} source={s} />)}
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="-mr-2 rounded-button p-2 text-muted hover:bg-frost/60" aria-label="Tutup panel">
            <X className="size-5" />
          </button>
        )}
      </div>

      <Section title="Pelanggan">
        <p className="text-sm font-semibold">{order.customerName} <span className="font-normal text-muted">· {order.customerType === "b2b" ? "B2B kontrak" : order.customerType === "reseller" ? "Reseller" : "Retail"}</span></p>
        <p className="text-sm text-muted">{order.address.recipient} · {order.address.phone}</p>
        <p className="text-sm text-muted">{order.address.line}, {order.address.city} {order.address.postal}</p>
        {contract && (
          <p className="mt-2 text-sm">Asal harga: <strong>Harga Kontrak</strong> <Link href={`/admin/kontrak/${contract.id}`} className="font-semibold text-primary hover:underline">{contract.number}</Link> · termin {contract.termDays} hari</p>
        )}
      </Section>

      <Section title={`Item · ${formatWeight(order.netGrams)} bersih`}>
        <ul className="space-y-2.5 text-sm">
          {order.lines.map((l) => (
            <li key={l.skuId + (l.variantLabel ?? "")} className="flex gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{l.productName} <span className="text-muted">{l.uom === "kg" ? "· timbang" : l.skuLabel}{l.variantLabel ? ` · ${l.variantLabel}` : ""}</span></p>
                <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted tnum">
                  {formatNum(l.qty)} {l.uom} × {formatRp(l.unitPrice)}
                  <PriceSourceLabel source={l.priceSource} className="h-5 text-[11px]" />
                  <span>HPP {formatRp(l.hppUnit)}</span>
                </p>
              </div>
              <p className="font-semibold tnum">{formatRp(l.unitPrice * l.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm tnum">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatRp(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Potongan paket</dt><dd>−{formatRp(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Ongkir · {zone?.name ?? order.courier} · {formatWeight(order.shipGrams)}</dt><dd>{formatRp(order.shipping)}</dd></div>
          <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatRp(order.total)}</dd></div>
          <div className="flex justify-between text-xs text-muted"><dt>Margin kotor (snapshot HPP)</dt><dd>{formatRp(order.subtotal - order.discount - order.lines.reduce((s, l) => s + l.hppUnit * l.qty, 0))}</dd></div>
        </dl>
      </Section>

      {order.status === "menunggu_pembayaran" && (
        <Section title="Verifikasi pembayaran">
          {order.payment === "menunggu_verifikasi" ? (
            <>
              <div className="flex items-center gap-3 rounded-[12px] bg-bg p-3 text-sm">
                <FileText className="size-5 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{order.proofName}</span>
                <span className="text-xs text-muted">bukti dari pelanggan</span>
              </div>
              <div className="mt-3 space-y-2">
                <Checkbox checked={checks.nominal} onChange={(e) => setChecks({ ...checks, nominal: e.target.checked })} label={<>Nominal masuk tepat <strong className="tnum">{formatRp(order.total)}</strong></>} />
                <Checkbox checked={checks.tanggal} onChange={(e) => setChecks({ ...checks, tanggal: e.target.checked })} label={`Tanggal transfer ≥ ${formatDate(order.createdAt)}`} />
                <Checkbox checked={checks.nama} onChange={(e) => setChecks({ ...checks, nama: e.target.checked })} label={`Nama pengirim sesuai: ${order.customerName}`} />
              </div>
              <Button className="mt-3" block disabled={!allChecked} onClick={() => { verifyPayment(order.number); toast({ title: "Pembayaran terverifikasi", description: "Stok direservasi. Order siap diproses." }); }}>
                <CircleCheck className="size-4" aria-hidden /> Verifikasi pembayaran
              </Button>
              {!allChecked && <p className="mt-2 text-xs text-muted">Centang ketiga pemeriksaan (BR-PAY-02) untuk mengaktifkan tombol.</p>}
            </>
          ) : (
            <p className="text-sm text-muted">Belum ada bukti transfer. Order batal otomatis {STORE.paymentWindowHours} jam setelah dibuat.</p>
          )}
        </Section>
      )}

      {claim && (
        <Section title={`Klaim ${claim.id}`}>
          <div className="space-y-2 text-sm">
            <p><strong>{CLAIM_REASONS.find((r) => r.id === claim.reason)?.label}</strong> · diajukan {formatDateTime(claim.createdAt)}</p>
            <p className="text-muted">“{claim.note}”</p>
            <ul className="text-sm">
              {claim.items.map((it) => {
                const l = order.lines.find((x) => x.skuId === it.skuId);
                return <li key={it.skuId}>• {formatNum(it.qty)} {l?.uom} {l?.productName} · {formatRp((l?.unitPrice ?? 0) * it.qty)}</li>;
              })}
            </ul>
            <div className="flex flex-wrap gap-2">
              {claim.photos.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-bg px-2.5 py-1 text-xs ring-1 ring-line"><Camera className="size-3.5 text-primary" aria-hidden /> {p}</span>
              ))}
            </div>
            <p>Pilihan pelanggan: <StatusPill tone="info">{claim.preferred === "refund" ? "Refund" : "Ganti barang"}</StatusPill></p>
          </div>
          <Field className="mt-3" label="Catatan keputusan" optional>
            {(p) => <Textarea {...p} rows={2} value={claimNote} onChange={(e) => setClaimNote(e.target.value)} />}
          </Field>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => { resolveClaim(claim.id, "refund", claimNote); toast({ title: `Refund ${formatRp(claimValue)} disetujui`, description: "Tercatat sebagai kas keluar." }); }}>
              <Wallet className="size-4" aria-hidden /> Refund {formatRp(claimValue)}
            </Button>
            <Button variant="secondary" onClick={() => { resolveClaim(claim.id, "ganti", claimNote); toast({ title: "Ganti barang disetujui", description: "Order pengganti nilai Rp 0 dibuat & stok dikurangi." }); }}>
              <RefreshCcw className="size-4" aria-hidden /> Ganti barang
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="mt-2 text-danger" onClick={() => { resolveClaim(claim.id, "tolak", claimNote); toast({ title: "Klaim ditolak", tone: "info" }); }}>Tolak klaim</Button>
        </Section>
      )}

      {(next.length > 0 || canCancel) && (
        <Section title="Ubah status">
          {next.includes("dikirim") && order.courier !== "Armada U-Frost" && (
            <Field label="Nomor resi (AWB)" className="mb-3" hint="Wajib sebelum ditandai Dikirim">
              {(p) => <Input {...p} value={awb} onChange={(e) => setAwb(e.target.value.toUpperCase())} placeholder="UFX…" />}
            </Field>
          )}
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <Button key={s} onClick={() => move(s)} disabled={s === "dikirim" && order.courier !== "Armada U-Frost" && !awb.trim()}>
                Tandai {STATUS_LABEL[s]}
              </Button>
            ))}
            {canCancel && (
              <Button variant="destructive" onClick={() => { const r = setOrderStatus(order.number, "dibatalkan", { note: "Dibatalkan admin" }); toast({ title: r.ok ? "Order dibatalkan" : r.message, tone: r.ok ? "info" : "error" }); }}>
                Batalkan
              </Button>
            )}
          </div>
          {order.status === "diproses" && <p className="mt-2 text-xs text-muted">Setelah Diproses, order tidak bisa diedit — perubahan lewat retur (BR-ORD-06).</p>}
        </Section>
      )}

      <Section title="Dokumen" action={<Button size="sm" variant="secondary" onClick={() => setSjOpen(true)} disabled={["menunggu_pembayaran", "dibatalkan"].includes(order.status)}><Printer className="size-4" aria-hidden /> Surat jalan</Button>}>
        <p className="text-sm text-muted">
          {order.awb ? <>Resi <strong className="text-ink tnum">{order.awb}</strong> · </> : null}
          {state.invoices.find((i) => i.orderNumber === order.number)?.number ? <>Invoice <Link className="font-semibold text-primary hover:underline" href="/admin/invoice">{state.invoices.find((i) => i.orderNumber === order.number)?.number}</Link></> : order.payment === "tempo" ? "Invoice terbit otomatis saat Dikirim." : "Transfer di muka — tanpa invoice tempo."}
        </p>
      </Section>

      <Section title="Riwayat status">
        <ol className="space-y-2 text-sm">
          {order.history.slice().reverse().map((h, i) => (
            <li key={i} className={cn("flex gap-3", i > 0 && "text-muted")}>
              <span className="w-32 shrink-0 text-xs tnum">{formatDateTime(h.at)}</span>
              <span><span className="font-medium text-ink">{STATUS_LABEL[h.status]}</span>{h.note ? ` — ${h.note}` : ""}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">Aksi tercatat atas nama {ROLE_LABEL[state.admin.role]} (audit log).</p>
      </Section>

      <Modal open={sjOpen} onOpenChange={setSjOpen} title="Surat jalan" size="lg" footer={<><Button variant="secondary" onClick={() => setSjOpen(false)}>Tutup</Button><Button onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Cetak</Button></>}>
        <SuratJalan order={order} />
      </Modal>
      {order.status === "klaim" && !claim && <Notice tone="info" className="m-5">Klaim sudah diputuskan.</Notice>}
    </div>
  );
}
