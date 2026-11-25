"use client";

import Link from "next/link";
import { Camera, CircleX, Clock, RefreshCcw, Search, Wallet } from "lucide-react";
import { CLAIM_REASONS, STORE } from "@/lib/mock-data";
import { InfoShell } from "@/components/store/info-shell";

export default function ReturnPolicyPage() {
  return (
    <InfoShell
      crumb="Kebijakan retur"
      title="Kalau rusak, bagaimana?"
      lead={`Produk beku yang tiba lembek, salah, atau kurang bisa diklaim maksimal ${STORE.claimWindowHours} jam setelah diterima. Kamu pilih refund atau ganti barang — kami putuskan dalam 1×24 jam.`}
    >
      <section aria-labelledby="alur">
        <h2 id="alur" className="font-display text-2xl font-semibold md:text-3xl">Alur klaim</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { icon: Clock, t: `Maks ${STORE.claimWindowHours} jam`, d: "Dihitung dari waktu paket diterima (foto serah terima kurir). Produk beku cepat berubah, jadi batasnya singkat." },
            { icon: Camera, t: "Foto wajib", d: "Foto produk, foto box/kemasan, dan label tanggal terima. Minimal 2 foto." },
            { icon: Search, t: "Ditinjau 1×24 jam", d: "Admin mengecek foto & catatan suhu packing. Simpan produk di freezer selama ditinjau." },
            { icon: RefreshCcw, t: "Refund atau ganti", d: "Dipilih per kasus. Kamu menyampaikan pilihanmu di formulir klaim." },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="rounded-card border border-line bg-surface p-5">
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="opsi" className="grid gap-4 md:grid-cols-2">
        <h2 id="opsi" className="sr-only">Pilihan penyelesaian</h2>
        <div className="rounded-card bg-frost/60 p-6">
          <Wallet className="size-6 text-primary" aria-hidden />
          <h3 className="font-display mt-4 text-xl font-semibold">Refund</h3>
          <p className="mt-2 text-sm text-ink/85">Senilai harga item yang diklaim (sesuai harga di pesanan), ditransfer ke rekening atas nama pemesan maksimal 2 hari kerja setelah disetujui. Ongkir ikut dikembalikan jika seluruh pesanan rusak.</p>
        </div>
        <div className="rounded-card bg-frost/60 p-6">
          <RefreshCcw className="size-6 text-primary" aria-hidden />
          <h3 className="font-display mt-4 text-xl font-semibold">Ganti barang</h3>
          <p className="mt-2 text-sm text-ink/85">Item yang sama dikirim ulang tanpa biaya di jadwal kirim berikutnya, dengan packing ice gel ekstra. Jika stok habis, otomatis kami tawarkan refund.</p>
        </div>
      </section>

      <section aria-labelledby="alasan" className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 id="alasan" className="font-display text-2xl font-semibold md:text-3xl">Alasan yang kami terima</h2>
          <ul className="mt-5 space-y-3">
            {CLAIM_REASONS.map((r) => (
              <li key={r.id} className="rounded-[16px] bg-surface p-4 ring-1 ring-line"><p className="font-semibold">{r.label}</p><p className="mt-0.5 text-sm text-muted">{r.hint}</p></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Yang tidak ditanggung</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              `Klaim yang diajukan lebih dari ${STORE.claimWindowHours} jam setelah diterima.`,
              "Paket gagal kirim atau terlambat karena alamat/nomor HP yang salah dari pemesan.",
              "Produk yang sudah dicairkan lalu dibekukan ulang di tempat pelanggan.",
              "Perbedaan berat timbang ≤ 50 g pada produk per kg (selisih > 50 g kami kembalikan sebagai saldo).",
            ].map((t) => (
              <li key={t} className="flex gap-3"><CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden /><span>{t}</span></li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            Ajukan klaim dari <Link href="/akun" className="font-semibold text-primary underline">Akun → Riwayat pesanan</Link>. Butuh bantuan? WhatsApp {STORE.whatsapp}.
          </p>
        </div>
      </section>
    </InfoShell>
  );
}
