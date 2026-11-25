"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Landmark, Lock, MapPin, ShoppingBag, Upload } from "lucide-react";
import { STORE } from "@/lib/mock-data";
import {
  bundleDiscount,
  cartRows,
  cartTotals,
  minOrderStatus,
  shipSlots,
  shippingFee,
  zoneForPostal,
  type OrderAddress,
} from "@/lib/commerce";
import { formatDayShort, formatNum, formatRp, formatWeight } from "@/lib/format";
import { useApp, usePageState, usePriceContext } from "@/lib/store";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingRegion, Notice, Skeleton } from "@/components/ui/feedback";
import { Checkbox, Field, Input, RadioCard, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { ProductImage } from "@/components/store/product-image";
import { ColdChainBadge } from "@/components/store/trust";
import { CutoffNotice, MinOrderMeter } from "@/components/store/order-ui";
import { Container } from "@/components/store/section";
import { cn } from "@/lib/utils";

const NEW = "baru";
const MAX_FILE = 5 * 1024 * 1024;

function Step({ n, title, icon: Icon, children }: { n: number; title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`} className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <h2 id={`step-${n}`} className="flex items-center gap-3 font-display text-xl font-semibold">
        <span className="grid size-8 place-items-center rounded-full bg-frost font-sans text-sm font-bold text-primary">{n}</span>
        {title}
        <Icon className="ml-auto size-5 text-muted" aria-hidden />
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function CheckoutPage() {
  const { state, viewer, now, placeOrder } = useApp();
  const ctx = usePriceContext();
  const toast = useToast();
  const router = useRouter();
  const rows = cartRows(state.cart, state.skus, ctx);
  const view = usePageState(rows.length === 0);
  const t = cartTotals(rows);
  const bundle = bundleDiscount(state.cart, state.skus, viewer.type);
  const min = minOrderStatus(t.subtotal, t.netGrams);

  const [addressId, setAddressId] = useState(viewer.addresses[0]?.id ?? NEW);
  const [draft, setDraft] = useState({ recipient: viewer.name, phone: viewer.phone, line: "", city: "", postal: "" });
  const [slot, setSlot] = useState<string>("");
  const [proof, setProof] = useState<{ name: string; size: number; url?: string } | null>(null);
  const [proofError, setProofError] = useState("");
  const [note, setNote] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const address: OrderAddress | undefined = useMemo(() => {
    if (addressId !== NEW) {
      const a = viewer.addresses.find((x) => x.id === addressId);
      const z = a ? zoneForPostal(a.postal) : undefined;
      return a ? { ...a, zoneId: z?.id ?? "Z1" } : undefined;
    }
    const z = zoneForPostal(draft.postal);
    return { id: "a-new", label: "Alamat baru", ...draft, zoneId: z?.id ?? "Z1" };
  }, [addressId, draft, viewer.addresses]);

  const zone = address ? zoneForPostal(address.postal) : undefined;
  const slots = zone ? shipSlots(now, zone, 3) : [];
  const chosen = slots.find((s) => s.date === slot) ?? slots[0];
  const fee = zone ? shippingFee(t.shipGrams, zone) : 0;
  const total = t.subtotal - bundle.discount + fee;
  const overStock = rows.some((r) => r.overStock);

  const draftErrors = addressId === NEW ? {
    recipient: draft.recipient.trim().length < 3 ? "Isi nama penerima" : "",
    phone: !/^0\d{8,13}$/.test(draft.phone.replace(/[-\s]/g, "")) ? "Nomor HP diawali 0, 9–14 digit" : "",
    line: draft.line.trim().length < 10 ? "Isi alamat lengkap (jalan, nomor, kelurahan)" : "",
    city: draft.city.trim().length < 3 ? "Isi kota/kabupaten" : "",
    postal: draft.postal.length !== 5 ? "Kode pos 5 digit" : !zone ? "Di luar zona pengiriman beku" : "",
  } : {};
  const addressValid = Boolean(address) && Object.values(draftErrors).every((e) => !e) && Boolean(zone);

  const blockers = [
    !min.ok && `Minimum order ${formatRp(STORE.minOrderValue)} atau ${formatWeight(STORE.minOrderGrams)} belum terpenuhi`,
    overStock && "Ada item melebihi stok",
    !addressValid && (address && address.postal.length === 5 && !zone ? "Alamat di luar zona pengiriman" : "Lengkapi alamat pengiriman"),
    !(agreeTerms && agreeData) && "Setujui S&K dan pemrosesan data",
  ].filter(Boolean) as string[];

  const onFile = (file?: File) => {
    setProofError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) return setProofError("Format harus JPG, PNG, atau PDF.");
    if (file.size > MAX_FILE) return setProofError("Ukuran maksimal 5 MB.");
    setProof({ name: file.name, size: file.size, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined });
  };

  const submit = () => {
    setSubmitted(true);
    if (blockers.length > 0 || !address || !chosen) {
      toast({ title: "Pesanan belum bisa dibuat", description: blockers[0], tone: "error" });
      return;
    }
    const order = placeOrder({ address, shipDate: chosen.date, proofName: proof?.name, note: note.trim() || undefined });
    router.push(`/pesanan/${order.token}?baru=1`);
  };

  if (view === "loading") {
    return (
      <Container className="pt-6 md:pt-10">
        <LoadingRegion label="Memuat checkout">
          <Skeleton className="h-10 w-48" />
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-52" />)}</div>
            <Skeleton className="h-[480px] lg:col-span-5" />
          </div>
        </LoadingRegion>
      </Container>
    );
  }
  if (view === "empty") {
    return (
      <Container className="pt-10">
        <EmptyState icon={ShoppingBag} title="Belum ada yang bisa di-checkout" description="Keranjangmu kosong. Tambahkan produk dulu, lalu kembali ke sini." action={<ButtonLink href="/katalog">Lihat katalog</ButtonLink>} />
      </Container>
    );
  }

  return (
    <Container className="pt-6 md:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Checkout</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted"><Lock className="size-4" aria-hidden /> Pembayaran transfer manual, tanpa simpan data kartu</p>
      </div>

      {!min.ok && (
        <Notice tone="warning" className="mt-5" title="Checkout diblokir: minimum order belum terpenuhi" action={<ButtonLink href="/keranjang" variant="secondary" size="sm">Kembali ke keranjang</ButtonLink>}>
          Belanjaanmu {formatRp(t.subtotal)} · {formatWeight(t.netGrams)}. Tambah {formatRp(min.valueRemaining)} lagi atau berat bersih {formatWeight(min.gramsRemaining)}.
        </Notice>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <Step n={1} title="Alamat pengiriman" icon={MapPin}>
            <div className="grid gap-3">
              {viewer.addresses.map((a) => {
                const z = zoneForPostal(a.postal);
                return (
                  <RadioCard key={a.id} name="alamat" value={a.id} checked={addressId === a.id} onChange={setAddressId}>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{a.label} <span className="rounded-full bg-frost px-2 py-0.5 text-xs text-primary">{z?.name ?? "Di luar zona"}</span></p>
                    <p className="mt-1 text-sm">{a.recipient} · {a.phone}</p>
                    <p className="text-sm text-muted">{a.line}, {a.city} {a.postal}</p>
                  </RadioCard>
                );
              })}
              <RadioCard name="alamat" value={NEW} checked={addressId === NEW} onChange={setAddressId}>
                <p className="text-sm font-semibold">Kirim ke alamat lain</p>
                <p className="text-sm text-muted">Kami cek apakah kode pos masuk zona pengiriman beku.</p>
              </RadioCard>
            </div>
            {addressId === NEW && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Nama penerima" error={submitted ? draftErrors.recipient : undefined}>
                  {(p) => <Input {...p} autoComplete="name" value={draft.recipient} onChange={(e) => setDraft({ ...draft, recipient: e.target.value })} />}
                </Field>
                <Field label="Nomor HP (WhatsApp)" hint="Kurir menghubungi nomor ini saat tiba" error={submitted ? draftErrors.phone : undefined}>
                  {(p) => <Input {...p} inputMode="tel" autoComplete="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />}
                </Field>
                <Field className="sm:col-span-2" label="Alamat lengkap" error={submitted ? draftErrors.line : undefined}>
                  {(p) => <Textarea {...p} autoComplete="street-address" rows={2} placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan" value={draft.line} onChange={(e) => setDraft({ ...draft, line: e.target.value })} />}
                </Field>
                <Field label="Kota / kabupaten" error={submitted ? draftErrors.city : undefined}>
                  {(p) => <Input {...p} autoComplete="address-level2" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />}
                </Field>
                <Field label="Kode pos" hint={zone ? `${zone.name} · ${zone.coverage}` : "Zona dicek otomatis"} error={draft.postal.length === 5 && !zone ? "Kode pos ini belum terjangkau pengiriman beku. Hubungi CS untuk opsi lain." : submitted ? draftErrors.postal : undefined}>
                  {(p) => <Input {...p} inputMode="numeric" autoComplete="postal-code" maxLength={5} value={draft.postal} onChange={(e) => setDraft({ ...draft, postal: e.target.value.replace(/\D/g, "") })} />}
                </Field>
              </div>
            )}
          </Step>

          <Step n={2} title="Jadwal kirim" icon={CalendarClock}>
            <CutoffNotice className="mb-4" />
            {!zone ? (
              <p className="text-sm text-muted">Pilih atau lengkapi alamat untuk melihat jadwal kirim yang tersedia.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  {slots.map((s) => (
                    <RadioCard key={s.date} name="slot" value={s.date} checked={(chosen?.date ?? "") === s.date} onChange={setSlot}>
                      <p className="text-sm font-semibold">Kirim {s.isToday ? "hari ini" : formatDayShort(s.date)}</p>
                      <p className="mt-0.5 text-xs text-muted">{s.isToday ? formatDayShort(s.date) : " "}</p>
                      <p className="mt-2 text-sm">Tiba {s.arriveFrom === s.arriveTo ? formatDayShort(s.arriveFrom) : `${formatDayShort(s.arriveFrom)} – ${formatDayShort(s.arriveTo)}`}</p>
                    </RadioCard>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">{zone.name}: kirim {zone.shipDays.length === 6 ? "Senin–Sabtu" : zone.shipDays.length === 5 ? "Senin–Jumat" : "Senin–Kamis"}, transit {zone.transitMin === zone.transitMax ? zone.transitMin : `${zone.transitMin}–${zone.transitMax}`} hari. Estimasi, bukan janji — cuaca & antrean kurir bisa memundurkan 1 hari.</p>
              </>
            )}
          </Step>

          <Step n={3} title="Pembayaran" icon={Landmark}>
            <div className="rounded-[14px] border border-primary p-4 ring-1 ring-primary">
              <p className="text-sm font-semibold">Transfer bank manual</p>
              <p className="mt-1 text-sm text-muted">Transfer ke {STORE.bank.name} <span className="font-semibold text-ink tnum">{STORE.bank.account}</span> a.n. {STORE.bank.holder}. Tim kami mencocokkan nominal, tanggal & nama pengirim di jam kerja (08.00–17.00).</p>
              <p className="mt-2 text-xs text-muted">Batas bayar {STORE.paymentWindowHours} jam setelah pesanan dibuat; lewat dari itu pesanan otomatis batal.</p>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium" id="proof-label">Bukti transfer <span className="font-normal text-muted">(opsional sekarang)</span></p>
              <label className={cn("mt-2 flex cursor-pointer items-center gap-4 rounded-[14px] border border-dashed p-4 transition-colors hover:bg-frost/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary", proofError ? "border-danger" : "border-line")}>
                <input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" aria-labelledby="proof-label" aria-describedby="proof-hint" onChange={(e) => onFile(e.target.files?.[0])} />
                {proof?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proof.url} alt="Pratinjau bukti transfer" className="size-14 rounded-[10px] object-cover" />
                ) : (
                  <span className="grid size-14 place-items-center rounded-[10px] bg-frost"><Upload className="size-5 text-primary" aria-hidden /></span>
                )}
                <span className="min-w-0 text-sm">
                  <span className="block truncate font-semibold">{proof ? proof.name : "Pilih file bukti transfer"}</span>
                  <span id="proof-hint" className="text-muted">{proof ? `${formatNum(proof.size / 1024)} KB · klik untuk ganti` : "JPG, PNG, atau PDF · maks 5 MB. Bisa diunggah nanti dari halaman pesanan."}</span>
                </span>
              </label>
              {proofError && <p className="mt-1.5 text-xs font-medium text-danger" role="alert">{proofError}</p>}
            </div>
          </Step>

          <Step n={4} title="Catatan & persetujuan" icon={Lock}>
            <Field label="Catatan untuk tim packing" optional hint="Misal: titip satpam, tanpa sendok plastik">
              {(p) => <Textarea {...p} rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />}
            </Field>
            <div className="mt-5 space-y-3">
              <Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} label={<>Saya setuju dengan <Link href="/info/retur" className="font-semibold text-primary underline">Syarat & Ketentuan serta kebijakan retur</Link> (klaim maksimal {STORE.claimWindowHours} jam setelah diterima).</>} />
              <Checkbox checked={agreeData} onChange={(e) => setAgreeData(e.target.checked)} label="Saya mengizinkan U-Frost ID memproses nama, nomor HP, dan alamat untuk pengiriman pesanan ini." description="Sesuai UU Pelindungan Data Pribadi. Data tidak dibagikan selain ke kurir pengiriman." />
              {submitted && !(agreeTerms && agreeData) && <p className="text-xs font-medium text-danger">Kedua persetujuan wajib dicentang.</p>}
            </div>
          </Step>
        </div>

        <aside aria-label="Ringkasan pesanan" className="lg:col-span-5">
          <div className="space-y-5 rounded-card border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-32">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">Ringkasan</h2>
              <ColdChainBadge />
            </div>
            <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {rows.map((r) => (
                <li key={r.line.key} className="flex gap-3 text-sm">
                  <ProductImage product={r.product} className="size-12 shrink-0 rounded-[10px]" iconClassName="size-5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.product.name}{r.variantLabel ? ` · ${r.variantLabel}` : ""}</p>
                    <p className="text-xs text-muted tnum">{formatNum(r.line.qty)} {r.sku.uom === "kg" ? "kg" : r.sku.uom} × {formatRp(r.unitPrice)} · {formatWeight(r.netGrams)}</p>
                  </div>
                  <p className="font-semibold tnum">{formatRp(r.subtotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2.5 border-t border-line pt-4 text-sm tnum">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatRp(t.subtotal)}</dd></div>
              {bundle.applied.map((b) => <div key={b.id} className="flex justify-between gap-3"><dt className="text-muted">Potongan {b.name}</dt><dd className="text-accent-strong">−{formatRp(b.saving)}</dd></div>)}
              <div className="flex justify-between gap-3"><dt className="text-muted">Ongkir {zone ? `(${formatWeight(t.shipGrams)}, ${t.boxes} box)` : ""}</dt><dd>{zone ? formatRp(fee) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Biaya lain</dt><dd>Rp 0</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-semibold">Total bayar</dt><dd className="text-xl font-bold">{formatRp(total)}</dd></div>
            </dl>
            {chosen && (
              <p className="rounded-[12px] bg-frost/60 p-3 text-sm">
                Dikirim <strong>{formatDayShort(chosen.date)}</strong>, estimasi tiba <strong>{chosen.arriveFrom === chosen.arriveTo ? formatDayShort(chosen.arriveFrom) : `${formatDayShort(chosen.arriveFrom)} – ${formatDayShort(chosen.arriveTo)}`}</strong> — selama pembayaran terverifikasi sebelum {STORE.cutoffHour}.00 di hari kirim.
              </p>
            )}
            <MinOrderMeter subtotal={t.subtotal} netGrams={t.netGrams} />
            {submitted && blockers.length > 0 && (
              <Notice tone="danger" title="Belum bisa membuat pesanan">
                <ul className="list-disc pl-4">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
              </Notice>
            )}
            <Button variant="cta" size="lg" block onClick={submit} disabled={!min.ok} aria-describedby="checkout-hint">
              Buat pesanan · {formatRp(total)}
            </Button>
            <p id="checkout-hint" className="text-center text-xs text-muted">Kamu akan melihat instruksi transfer setelah pesanan dibuat.</p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
