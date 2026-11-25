"use client";

import Link from "next/link";
import { Camera, CircleCheck, Landmark, MapPin, Truck, Upload } from "lucide-react";
import { STORE, ZONES } from "@/lib/mock-data";
import { claimWindow, paymentDeadline, shipSlots, zoneById, type Order } from "@/lib/commerce";
import { formatDateTime, formatDayShort, formatDuration, formatNum, formatRp, formatWeight } from "@/lib/format";
import { useApp } from "@/lib/store";
import { ButtonLink } from "@/components/ui/button";
import { Card, Notice, StatusPill } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { CopyButton } from "./copy-button";
import { OrderStatusPill, OrderTimeline } from "./order-ui";
import { PriceSourceLabel } from "./price";
import { ProductImage } from "./product-image";
import { productById } from "@/lib/commerce";

/** Detail pesanan untuk pelanggan — dipakai di /pesanan/[token] dan /akun/pesanan/[id] */
export function CustomerOrderDetail({ order, justCreated }: { order: Order; justCreated?: boolean }) {
  const { state, now, uploadProof } = useApp();
  const toast = useToast();
  const deadline = paymentDeadline(order);
  const minsLeft = Math.floor((deadline.getTime() - now.getTime()) / 60_000);
  const zone = zoneById(order.address.zoneId);
  const claim = state.claims.find((c) => c.orderNumber === order.number);
  const cw = claimWindow(order, now);
  const arrive = zone ? shipSlots(new Date(`${order.shipDate}T08:00:00+07:00`), zone, 1)[0] : undefined;

  return (
    <div className="space-y-5">
      {justCreated && (
        <Notice tone="success" title={`Pesanan ${order.number} berhasil dibuat`}>
          Simpan tautan halaman ini untuk memantau status tanpa login. Kami juga mengirim ringkasannya ke WhatsApp {order.address.phone}.
        </Notice>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Pesanan · dibuat {formatDateTime(order.createdAt)}</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tnum md:text-4xl">{order.number}</h1>
        </div>
        <OrderStatusPill order={order} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          {order.status === "menunggu_pembayaran" && (
            <Card className="p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Landmark className="size-5 text-primary" aria-hidden /> Instruksi transfer</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-frost/60 p-4">
                  <dt className="text-muted">Transfer tepat</dt>
                  <dd className="flex items-center gap-2"><span className="text-2xl font-bold tnum">{formatRp(order.total)}</span><CopyButton value={String(order.total)} label="Nominal" /></dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-muted">{STORE.bank.name} a.n. {STORE.bank.holder}</dt>
                  <dd className="flex items-center gap-2"><span className="font-semibold tnum">{STORE.bank.account}</span><CopyButton value={STORE.bank.account.replace(/\s/g, "")} label="Nomor rekening" /></dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-muted">Batas bayar</dt>
                  <dd className="font-semibold">{formatDateTime(deadline)} <span className="font-normal text-muted">({minsLeft > 0 ? `${formatDuration(minsLeft)} lagi` : "lewat"})</span></dd>
                </div>
              </dl>
              {order.payment === "menunggu_verifikasi" ? (
                <Notice tone="info" className="mt-4" title="Bukti transfer diterima">
                  {order.proofName} sedang dicocokkan admin (nominal, tanggal & nama pengirim). Biasanya kurang dari 1 jam di jam kerja.
                </Notice>
              ) : (
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-[14px] border border-dashed border-line p-4 hover:bg-frost/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 5 * 1024 * 1024) return toast({ title: "File terlalu besar", description: "Maksimal 5 MB", tone: "error" });
                      uploadProof(order.number, f.name);
                      toast({ title: "Bukti transfer terkirim", description: "Admin akan memverifikasi di jam kerja." });
                    }}
                  />
                  <span className="grid size-11 place-items-center rounded-[10px] bg-frost"><Upload className="size-5 text-primary" aria-hidden /></span>
                  <span className="text-sm"><span className="block font-semibold">Unggah bukti transfer</span><span className="text-muted">JPG, PNG, atau PDF · maks 5 MB</span></span>
                </label>
              )}
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">Status pesanan</h2>
            <div className="mt-5"><OrderTimeline order={order} /></div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">Isi pesanan</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.lines.map((l) => {
                const p = productById(l.productId)!;
                return (
                  <li key={l.skuId + (l.variantLabel ?? "")} className="flex gap-3 py-3 text-sm">
                    <ProductImage product={p} className="size-14 shrink-0 rounded-[12px]" iconClassName="size-6" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/produk/${p.slug}`} className="font-semibold hover:underline">{l.productName}</Link>
                      <p className="text-muted">{l.uom === "kg" ? "Timbang per kg" : l.skuLabel}{l.variantLabel ? ` · ${l.variantLabel}` : ""}</p>
                      <p className="text-muted tnum">{formatNum(l.qty)} {l.uom} × {formatRp(l.unitPrice)} · {formatWeight(l.gramsPerUnit * l.qty)}</p>
                      {l.priceSource !== "retail" && <PriceSourceLabel source={l.priceSource} className="mt-1" />}
                    </div>
                    <p className="font-semibold tnum">{formatRp(l.unitPrice * l.qty)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm tnum">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatRp(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Potongan paket</dt><dd className="text-accent-strong">−{formatRp(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Ongkir ({formatWeight(order.shipGrams)}, {order.boxes} box)</dt><dd>{order.shipping === 0 && order.courier === "Armada U-Frost" ? "Termasuk kontrak" : formatRp(order.shipping)}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-semibold">Total</dt><dd className="font-bold">{formatRp(order.total)}</dd></div>
            </dl>
          </Card>
        </div>

        <div className="space-y-5 lg:col-span-5">
          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Truck className="size-5 text-primary" aria-hidden /> Pengiriman</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-muted">Kurir</dt><dd className="font-medium">{order.courier}</dd></div>
              <div>
                <dt className="text-muted">Jadwal</dt>
                <dd className="font-medium">
                  Kirim {formatDayShort(order.shipDate)}
                  {arrive && ` · estimasi tiba ${arrive.arriveFrom === arrive.arriveTo ? formatDayShort(arrive.arriveFrom) : `${formatDayShort(arrive.arriveFrom)} – ${formatDayShort(arrive.arriveTo)}`}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Nomor resi (AWB)</dt>
                <dd className="flex items-center gap-2 font-semibold tnum">{order.awb ? (<>{order.awb}<CopyButton value={order.awb} label="Nomor resi" /></>) : <span className="font-normal text-muted">Muncul setelah paket diserahkan ke kurir</span>}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-muted"><MapPin className="size-3.5" aria-hidden /> Alamat</dt>
                <dd>{order.address.recipient} · {order.address.phone}<br /><span className="text-muted">{order.address.line}, {order.address.city} {order.address.postal}</span></dd>
              </div>
              {zone && <div><dt className="text-muted">Zona</dt><dd>{zone.name}</dd></div>}
            </dl>
          </Card>

          {claim ? (
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-xl font-semibold">Klaim {claim.id}</h2>
              <div className="mt-3 flex items-center gap-2">
                <StatusPill tone={claim.status === "diajukan" ? "warning" : claim.status === "disetujui" ? "success" : "neutral"}>
                  {claim.status === "diajukan" ? "Sedang ditinjau" : claim.status === "disetujui" ? `Disetujui · ${claim.resolution === "refund" ? "Refund" : "Ganti barang"}` : "Ditolak"}
                </StatusPill>
              </div>
              <p className="mt-3 text-sm text-muted">Diajukan {formatDateTime(claim.createdAt)} · {claim.photos.length} foto. Kami meninjau klaim maksimal 1×24 jam.</p>
            </Card>
          ) : cw.open ? (
            <Card className="border-primary/30 bg-frost/40 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Camera className="size-5 text-primary" aria-hidden /> Ada masalah dengan barang?</h2>
              <p className="mt-2 text-sm">Ajukan klaim dengan foto produk & kemasan. Sisa waktu klaim <strong className="tnum">{formatDuration(cw.minutesLeft)}</strong>.</p>
              <ButtonLink href={`/akun/klaim/baru?order=${order.number}`} variant="primary" className="mt-4">Ajukan klaim retur</ButtonLink>
            </Card>
          ) : order.status === "selesai" ? (
            <Card className="p-5 text-sm sm:p-6">
              <p className="flex items-center gap-2 font-semibold"><CircleCheck className="size-4 text-success" aria-hidden /> Pesanan selesai</p>
              <p className="mt-1 text-muted">Batas klaim {STORE.claimWindowHours} jam setelah diterima sudah lewat. Ada kendala? Hubungi CS di {STORE.whatsapp}.</p>
            </Card>
          ) : null}

          <p className="px-1 text-xs text-muted">Pertanyaan soal pesanan ini? WhatsApp {STORE.whatsapp} dan sebutkan nomor {order.number}. Zona layanan: {ZONES.map((z) => z.name.split("·")[1].trim()).join(", ")}.</p>
        </div>
      </div>
    </div>
  );
}
