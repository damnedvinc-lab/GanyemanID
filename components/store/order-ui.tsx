"use client";

import { Check, Clock, MapPin, Snowflake, Truck } from "lucide-react";
import { useState } from "react";
import type { OrderStatus } from "@/lib/mock-data";
import {
  STATUS_LABEL,
  TIMELINE_STEPS,
  minOrderStatus,
  minutesToCutoff,
  shipSlots,
  shippingFee,
  shippingWeight,
  zoneForPostal,
  type Order,
} from "@/lib/commerce";
import { formatDateTime, formatDayShort, formatDuration, formatRp, formatWeight } from "@/lib/format";
import { STORE } from "@/lib/mock-data";
import { useApp } from "@/lib/store";
import { StatusPill, type Tone } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export const STATUS_TONE: Record<OrderStatus, Tone> = {
  menunggu_pembayaran: "warning",
  dibayar: "info",
  diproses: "info",
  siap_kirim: "info",
  dikirim: "info",
  selesai: "success",
  klaim: "danger",
  refund: "neutral",
  dibatalkan: "neutral",
};

export function OrderStatusPill({ order }: { order: Pick<Order, "status" | "payment"> }) {
  if (order.status === "menunggu_pembayaran" && order.payment === "menunggu_verifikasi") {
    return <StatusPill tone="warning">Perlu verifikasi</StatusPill>;
  }
  return <StatusPill tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</StatusPill>;
}

const STEP_COPY: Partial<Record<OrderStatus, string>> = {
  menunggu_pembayaran: "Transfer & unggah bukti",
  dibayar: "Pembayaran terverifikasi",
  diproses: "Dipetik dari freezer -18°C",
  siap_kirim: "Dikemas box insulated + ice gel",
  dikirim: "Dalam perjalanan",
  selesai: "Diterima",
};

export function OrderTimeline({ order, compact }: { order: Order; compact?: boolean }) {
  const steps = order.payment === "tempo" ? TIMELINE_STEPS.filter((s) => s !== "menunggu_pembayaran" && s !== "dibayar") : TIMELINE_STEPS;
  const terminal = order.status === "dibatalkan" || order.status === "refund";
  const reached = (s: OrderStatus) => order.history.some((h) => h.status === s) || (order.status === "klaim" && s === "selesai");
  const currentIdx = steps.findIndex((s) => s === order.status);

  return (
    <ol className={cn("relative", compact ? "space-y-3" : "space-y-5")}>
      {steps.map((s, i) => {
        const h = [...order.history].reverse().find((x) => x.status === s);
        const current = s === order.status && order.status !== "selesai";
        const done = (reached(s) || i < currentIdx) && !current;
        return (
          <li key={s} className="relative flex gap-3">
            {i < steps.length - 1 && (
              <span aria-hidden className={cn("absolute left-[13px] top-7 h-[calc(100%-4px)] w-0.5", done && !current ? "bg-primary" : "bg-line")} />
            )}
            <span
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                done && !current && "border-primary bg-primary text-white",
                current && "border-primary bg-frost text-primary",
                !done && !current && "border-line bg-surface text-muted",
              )}
            >
              {done && !current ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <div className="min-w-0 pb-0.5">
              <p className={cn("text-sm font-semibold", !done && !current && "text-muted")}>
                {STATUS_LABEL[s]}
                {current && <span className="sr-only"> (status saat ini)</span>}
              </p>
              <p className="text-xs text-muted">
                {h ? formatDateTime(h.at) : STEP_COPY[s]}
                {h?.note && !compact ? ` · ${h.note}` : ""}
              </p>
            </div>
          </li>
        );
      })}
      {(terminal || order.status === "klaim") && (
        <li className="flex gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-danger bg-danger-soft text-xs font-bold text-danger">!</span>
          <div>
            <p className="text-sm font-semibold">{STATUS_LABEL[order.status]}</p>
            <p className="text-xs text-muted">{order.history.at(-1)?.note}</p>
          </div>
        </li>
      )}
    </ol>
  );
}

/** Pesan cut-off 14.00 yang menjawab "kapan dikirim?" */
export function CutoffNotice({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const { now } = useApp();
  const mins = minutesToCutoff(now);
  const before = mins > 0;
  return (
    <p className={cn("flex items-center gap-2 text-sm", tone === "dark" ? "text-white/85" : "text-ink", className)}>
      <Clock aria-hidden className={cn("size-4 shrink-0", tone === "dark" ? "text-frost" : "text-primary")} />
      {before ? (
        <span>
          Pesan & bayar <strong className="tnum">{formatDuration(mins)}</strong> lagi (sebelum {STORE.cutoffHour}.00 WIB), dikirim <strong>hari ini</strong>.
        </span>
      ) : (
        <span>
          Lewat cut-off {STORE.cutoffHour}.00 WIB — pesanan baru dikirim <strong>hari kirim berikutnya</strong>.
        </span>
      )}
    </p>
  );
}

export function MinOrderMeter({ subtotal, netGrams, className }: { subtotal: number; netGrams: number; className?: string }) {
  const m = minOrderStatus(subtotal, netGrams);
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{m.ok ? "Minimum order terpenuhi" : "Minimum order belum terpenuhi"}</span>
        <span className="text-xs text-muted tnum">min. {formatRp(STORE.minOrderValue)} atau {formatWeight(STORE.minOrderGrams)}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Progres minimum order"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(m.progress * 100)}
      >
        <div className={cn("h-full rounded-full transition-[width] duration-250 ease-out", m.ok ? "bg-success" : "bg-primary")} style={{ width: `${m.progress * 100}%` }} />
      </div>
      {!m.ok && (
        <p className="text-xs text-muted">
          Tambah <strong className="text-ink tnum">{formatRp(m.valueRemaining)}</strong> lagi, atau berat bersih{" "}
          <strong className="text-ink tnum">{formatWeight(m.gramsRemaining)}</strong>. Box dingin & ice gel kami hitung per paket, jadi pesanan terlalu kecil tidak efisien.
        </p>
      )}
    </div>
  );
}

/** Estimasi ongkir per zona berdasarkan kode pos */
export function ShippingEstimator({ netGrams, packagingGrams = 0, defaultPostal = "", className }: { netGrams: number; packagingGrams?: number; defaultPostal?: string; className?: string }) {
  const { now } = useApp();
  const [postal, setPostal] = useState(defaultPostal);
  const clean = postal.replace(/\D/g, "");
  const zone = zoneForPostal(clean);
  const { shipGrams, boxes } = shippingWeight(netGrams, packagingGrams);
  const fee = zone ? shippingFee(shipGrams, zone) : 0;
  const slot = zone ? shipSlots(now, zone, 1)[0] : undefined;
  return (
    <div className={cn("space-y-3", className)}>
      <label htmlFor="ongkir-postal" className="flex items-center gap-2 text-sm font-medium">
        <MapPin aria-hidden className="size-4 text-primary" /> Estimasi ongkir ke kode pos
      </label>
      <Input
        id="ongkir-postal"
        inputMode="numeric"
        maxLength={5}
        placeholder="Contoh: 12730"
        value={postal}
        onChange={(e) => setPostal(e.target.value.replace(/\D/g, ""))}
        aria-describedby="ongkir-result"
      />
      <div id="ongkir-result" aria-live="polite" className="text-sm">
        {clean.length < 5 ? (
          <p className="text-muted">Masukkan 5 digit kode pos untuk melihat zona, ongkir, dan estimasi tiba.</p>
        ) : !zone ? (
          <p className="text-danger">
            Kode pos ini belum terjangkau pengiriman beku kami. Hubungi CS di WhatsApp {STORE.whatsapp} untuk opsi lain.
          </p>
        ) : (
          <div className="space-y-1.5 rounded-[12px] bg-frost/60 p-3">
            <p className="flex justify-between gap-2">
              <span className="font-semibold">{zone.name}</span>
              <span className="font-bold tnum">{netGrams > 0 ? formatRp(fee) : `mulai ${formatRp(zone.baseFee)}`}</span>
            </p>
            {netGrams > 0 && (
              <p className="text-xs text-muted tnum">
                Berat kirim {formatWeight(shipGrams)} ({formatWeight(netGrams)} produk + {boxes} box & ice gel)
              </p>
            )}
            {slot && (
              <p className="flex items-center gap-1.5 text-xs text-ink">
                <Truck aria-hidden className="size-3.5 text-primary" /> Dikirim {formatDayShort(slot.date)} · estimasi tiba{" "}
                {slot.arriveFrom === slot.arriveTo ? formatDayShort(slot.arriveFrom) : `${formatDayShort(slot.arriveFrom)} – ${formatDayShort(slot.arriveTo)}`}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Snowflake aria-hidden className="size-3.5 text-primary" /> {zone.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
