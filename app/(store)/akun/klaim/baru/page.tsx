"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, PackageSearch, RefreshCcw, Wallet, X } from "lucide-react";
import { CLAIM_REASONS, STORE, type ClaimReason, type ClaimResolution } from "@/lib/mock-data";
import { claimWindow, productById } from "@/lib/commerce";
import { formatDuration, formatNum, formatRp } from "@/lib/format";
import { useApp, usePageState } from "@/lib/store";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, LoadingRegion, Notice, Skeleton } from "@/components/ui/feedback";
import { Field, RadioCard, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { ProductImage } from "@/components/store/product-image";
import { QtyStepper } from "@/components/store/uom";
import { Container } from "@/components/store/section";
import { cn } from "@/lib/utils";

function ClaimForm() {
  const params = useSearchParams();
  const number = params.get("order") ?? "";
  const { state, viewer, now, submitClaim } = useApp();
  const toast = useToast();
  const router = useRouter();
  const order = state.orders.find((o) => o.number === number && o.customerId === viewer.id);
  const view = usePageState(!order);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ClaimReason | "">("");
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([]);
  const [resolution, setResolution] = useState<ClaimResolution | "">("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (view === "loading") return <LoadingRegion label="Memuat formulir klaim"><Skeleton className="h-10 w-72" /><Skeleton className="mt-6 h-[520px]" /></LoadingRegion>;
  if (view === "empty" || !order) {
    return <EmptyState icon={PackageSearch} title="Pilih pesanan dulu" description="Klaim diajukan dari halaman detail pesanan yang sudah diterima." action={<ButtonLink href="/akun" variant="secondary">Ke riwayat pesanan</ButtonLink>} />;
  }

  const cw = claimWindow(order, now);
  const items = Object.entries(picked).filter(([, q]) => q > 0).map(([skuId, qty]) => ({ skuId, qty }));
  const value = items.reduce((s, i) => s + (order.lines.find((l) => l.skuId === i.skuId)?.unitPrice ?? 0) * i.qty, 0);
  const errors = {
    items: items.length === 0 ? "Pilih minimal satu item yang bermasalah" : "",
    reason: !reason ? "Pilih alasan klaim" : "",
    photos: photos.length < 2 ? "Unggah minimal 2 foto: produk & kemasan/label tanggal terima" : "",
    resolution: !resolution ? "Pilih penyelesaian yang kamu inginkan" : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  if (!cw.open) {
    return (
      <Notice tone="warning" title="Batas waktu klaim sudah lewat" action={<ButtonLink href={`/akun/pesanan/${order.number}`} variant="secondary" size="sm">Kembali ke pesanan</ButtonLink>}>
        Klaim untuk {order.number} hanya bisa diajukan maksimal {STORE.claimWindowHours} jam setelah diterima. Jika ada kendala khusus, hubungi CS di WhatsApp {STORE.whatsapp}.
      </Notice>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!valid) return toast({ title: "Lengkapi formulir klaim", description: Object.values(errors).find(Boolean), tone: "error" });
        const c = submitClaim({ orderNumber: order.number, items, reason: reason as ClaimReason, photos: photos.map((p) => p.name), preferred: resolution as ClaimResolution, note });
        toast({ title: `Klaim ${c.id} terkirim`, description: "Kami tinjau maksimal 1×24 jam dan kabari lewat WhatsApp." });
        router.push(`/akun/pesanan/${order.number}`);
      }}
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
    >
      <div className="space-y-5 lg:col-span-8">
        <Notice tone="info" title={`Sisa waktu klaim ${formatDuration(cw.minutesLeft)}`}>
          Simpan produk tetap di freezer selama klaim ditinjau. Jangan dibuang sebelum ada keputusan.
        </Notice>

        <Card className="p-5 sm:p-6">
          <fieldset>
            <legend className="font-display text-xl font-semibold">1. Item yang bermasalah</legend>
            <ul className="mt-4 divide-y divide-line">
              {order.lines.map((l) => {
                const p = productById(l.productId)!;
                const q = picked[l.skuId] ?? 0;
                return (
                  <li key={l.skuId} className="flex flex-wrap items-center gap-3 py-3">
                    <input id={`pick-${l.skuId}`} type="checkbox" className="size-5 accent-primary" checked={q > 0} onChange={(e) => setPicked({ ...picked, [l.skuId]: e.target.checked ? Math.min(1, l.qty) : 0 })} />
                    <ProductImage product={p} className="size-12 rounded-[10px]" iconClassName="size-5" />
                    <label htmlFor={`pick-${l.skuId}`} className="min-w-0 flex-1 cursor-pointer text-sm">
                      <span className="block font-semibold">{l.productName} {l.uom === "kg" ? "" : l.skuLabel}</span>
                      <span className="text-muted tnum">Dipesan {formatNum(l.qty)} {l.uom} · {formatRp(l.unitPrice)}/{l.uom}</span>
                    </label>
                    {q > 0 && <QtyStepper size="sm" value={q} min={l.uom === "kg" ? 0.25 : 1} step={l.uom === "kg" ? 0.25 : 1} max={l.qty} unit={l.uom} label={`Jumlah klaim ${l.productName}`} onChange={(v) => setPicked({ ...picked, [l.skuId]: v })} />}
                  </li>
                );
              })}
            </ul>
            {submitted && errors.items && <p className="mt-2 text-xs font-medium text-danger">{errors.items}</p>}
          </fieldset>
        </Card>

        <Card className="p-5 sm:p-6">
          <fieldset>
            <legend className="font-display text-xl font-semibold">2. Alasan</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CLAIM_REASONS.map((r) => (
                <RadioCard key={r.id} name="alasan" value={r.id} checked={reason === r.id} onChange={(v) => setReason(v as ClaimReason)}>
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{r.hint}</p>
                </RadioCard>
              ))}
            </div>
            {submitted && errors.reason && <p className="mt-2 text-xs font-medium text-danger">{errors.reason}</p>}
          </fieldset>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold" id="foto-label">3. Foto bukti</h2>
          <p className="mt-1 text-sm text-muted">Wajib: foto produk, foto kemasan/box, dan label tanggal terima. JPG/PNG, maks 5 MB per foto.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <div key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Foto bukti ${i + 1}: ${p.name}`} className="size-24 rounded-[12px] object-cover ring-1 ring-line" />
                <button type="button" onClick={() => setPhotos(photos.filter((x) => x !== p))} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-white" aria-label={`Hapus foto ${p.name}`}>
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className={cn("grid size-24 cursor-pointer place-items-center rounded-[12px] border border-dashed text-center text-xs font-medium text-muted hover:bg-frost/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary", submitted && errors.photos ? "border-danger" : "border-line")}>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="sr-only"
                  aria-labelledby="foto-label"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []).filter((f) => f.size <= 5 * 1024 * 1024).slice(0, 5 - photos.length);
                    setPhotos([...photos, ...files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))]);
                    e.target.value = "";
                  }}
                />
                <span><Camera className="mx-auto mb-1 size-5 text-primary" aria-hidden />Tambah foto</span>
              </label>
            )}
          </div>
          {submitted && errors.photos && <p className="mt-2 text-xs font-medium text-danger">{errors.photos}</p>}
        </Card>

        <Card className="p-5 sm:p-6">
          <fieldset>
            <legend className="font-display text-xl font-semibold">4. Penyelesaian yang kamu pilih</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <RadioCard name="resolusi" value="refund" checked={resolution === "refund"} onChange={(v) => setResolution(v as ClaimResolution)}>
                <p className="flex items-center gap-2 text-sm font-semibold"><Wallet className="size-4 text-primary" aria-hidden /> Refund</p>
                <p className="mt-1 text-xs text-muted">Dana {value > 0 ? formatRp(value) : "senilai item"} ditransfer ke rekening atas nama pemesan, maks 2 hari kerja setelah disetujui.</p>
              </RadioCard>
              <RadioCard name="resolusi" value="ganti" checked={resolution === "ganti"} onChange={(v) => setResolution(v as ClaimResolution)}>
                <p className="flex items-center gap-2 text-sm font-semibold"><RefreshCcw className="size-4 text-primary" aria-hidden /> Ganti barang</p>
                <p className="mt-1 text-xs text-muted">Item yang sama dikirim ulang tanpa biaya di jadwal kirim berikutnya, selama stok tersedia.</p>
              </RadioCard>
            </div>
            {submitted && errors.resolution && <p className="mt-2 text-xs font-medium text-danger">{errors.resolution}</p>}
          </fieldset>
          <Field className="mt-5" label="Ceritakan kondisinya" optional>
            {(p) => <Textarea {...p} rows={3} maxLength={300} placeholder="Misal: 2 pack paling atas sudah lembek, ice gel tinggal satu yang beku" value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        </Card>
      </div>

      <aside className="lg:col-span-4">
        <Card className="space-y-4 p-5 lg:sticky lg:top-32">
          <h2 className="font-display text-xl font-semibold">Ringkasan klaim</h2>
          <dl className="space-y-2 text-sm tnum">
            <div className="flex justify-between"><dt className="text-muted">Pesanan</dt><dd className="font-semibold">{order.number}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Item dipilih</dt><dd>{items.length}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Foto</dt><dd>{photos.length}</dd></div>
            <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">Nilai item</dt><dd className="font-bold">{formatRp(value)}</dd></div>
          </dl>
          <p className="text-xs text-muted">Keputusan akhir (refund atau ganti) ditetapkan admin setelah meninjau foto, dengan mempertimbangkan pilihanmu.</p>
          <Button type="submit" block size="lg">Kirim klaim</Button>
          <Link href={`/akun/pesanan/${order.number}`} className="block text-center text-sm font-semibold text-muted hover:text-ink">Batal</Link>
        </Card>
      </aside>
    </form>
  );
}

export default function NewClaimPage() {
  return (
    <Container className="pt-6 md:pt-10">
      <Link href="/akun" className="text-sm font-semibold text-primary hover:underline">← Akun</Link>
      <h1 className="font-display mt-3 text-3xl font-semibold md:text-4xl">Ajukan klaim retur</h1>
      <div className="mt-6">
        <Suspense><ClaimForm /></Suspense>
      </div>
    </Container>
  );
}
