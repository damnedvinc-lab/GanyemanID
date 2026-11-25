"use client";

import { Box, CircleAlert, Clock, PackageCheck, Snowflake, Thermometer, Truck, Warehouse } from "lucide-react";
import { STORE, ZONES } from "@/lib/mock-data";
import { shippingFee, shippingWeight } from "@/lib/commerce";
import { formatRp, formatWeight } from "@/lib/format";
import { InfoShell } from "@/components/store/info-shell";
import { CutoffNotice } from "@/components/store/order-ui";

const DAY = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const dayRange = (days: number[]) => `${DAY[days[0]]}–${DAY[days[days.length - 1]]}`;

export default function ShippingInfoPage() {
  const example = shippingWeight(2000, 40);
  return (
    <InfoShell
      crumb="Pengiriman & cold chain"
      title="Sampai tujuan masih beku?"
      lead="Ya — selama alamatmu ada di zona layanan kami. Di halaman ini kami jelaskan cara menjaga suhu, berapa ongkirnya, dan apa yang belum bisa kami janjikan."
    >
      <section aria-labelledby="rantai">
        <h2 id="rantai" className="font-display text-2xl font-semibold md:text-3xl">Rantai dingin, langkah demi langkah</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { icon: Warehouse, t: "Freezer -18°C", d: "Semua stok disimpan di freezer -18°C dengan pencatat suhu yang dicek 2× sehari." },
            { icon: PackageCheck, t: "Packing < 10 menit", d: "Produk dikeluarkan hanya saat pesananmu dikemas, lalu langsung masuk box." },
            { icon: Box, t: "Box insulated + ice gel", d: `1 box styrofoam tebal per ${formatWeight(STORE.boxCapacityGrams)} produk, berisi ice gel beku. Box + ice gel ±${formatWeight(STORE.boxTareGrams)}.` },
            { icon: Truck, t: "Kurir berpendingin", d: "Diserahkan ke kurir rekanan berpendingin di hari kirim. Transit maksimal 2 hari." },
          ].map(({ icon: Icon, t, d }, i) => (
            <li key={t} className="rounded-card border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <Icon className="size-6 text-primary" aria-hidden />
                <span className="text-sm font-semibold text-muted tnum">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="zona">
        <h2 id="zona" className="font-display text-2xl font-semibold md:text-3xl">Zona, tarif & estimasi tiba</h2>
        <p className="mt-2 max-w-2xl text-muted">Ongkir dihitung dari <strong className="text-ink">berat kirim</strong>: berat bersih produk + kemasan + box & ice gel, dibulatkan ke atas per 0,5 kg.</p>
        <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Tarif pengiriman per zona</caption>
            <thead className="bg-bg text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-5 py-3">Zona</th>
                <th scope="col" className="px-5 py-3 text-right">3 kg pertama</th>
                <th scope="col" className="px-5 py-3 text-right">Per kg berikutnya</th>
                <th scope="col" className="px-5 py-3">Hari kirim</th>
                <th scope="col" className="px-5 py-3">Estimasi tiba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ZONES.map((z) => (
                <tr key={z.id}>
                  <th scope="row" className="px-5 py-4 text-left align-top font-normal"><span className="font-semibold">{z.name}</span><span className="block text-xs text-muted">{z.coverage}</span></th>
                  <td className="px-5 py-4 text-right align-top font-semibold tnum">{formatRp(z.baseFee)}</td>
                  <td className="px-5 py-4 text-right align-top tnum">{formatRp(z.perKg)}</td>
                  <td className="px-5 py-4 align-top">{dayRange(z.shipDays)}</td>
                  <td className="px-5 py-4 align-top">H+{z.transitMin === z.transitMax ? z.transitMin : `${z.transitMin}–${z.transitMax}`} dari tanggal kirim<span className="block text-xs text-muted">{z.note}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-card bg-frost/60 p-5 text-sm">
            <p className="font-semibold">Contoh hitungan</p>
            <p className="mt-1.5 text-ink/85 tnum">
              4 pack ayam fillet 500 g = {formatWeight(2000)} produk + 40 g kemasan + 1 box & ice gel {formatWeight(STORE.boxTareGrams)} → dibulatkan <strong>{formatWeight(example.shipGrams)}</strong>. Ke Jakarta Selatan (Zona 1): <strong>{formatRp(shippingFee(example.shipGrams, ZONES[0]))}</strong>.
            </p>
          </div>
          <div className="rounded-card bg-surface p-5 text-sm ring-1 ring-line">
            <p className="flex items-center gap-2 font-semibold"><Clock className="size-4 text-primary" aria-hidden /> Cut-off {STORE.cutoffHour}.00 WIB</p>
            <p className="mt-1.5 text-muted">Pesanan yang <em>dibayar & terverifikasi</em> sebelum {STORE.cutoffHour}.00 dikirim di hari yang sama (jika hari kirim zona). Setelahnya, masuk hari kirim berikutnya.</p>
            <CutoffNotice className="mt-3" />
          </div>
        </div>
      </section>

      <section aria-labelledby="jujur" className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 id="jujur" className="font-display text-2xl font-semibold md:text-3xl">Yang belum bisa kami janjikan</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              "Pengiriman di luar zona 1–3. Checkout akan menolak kode pos di luar zona; hubungi CS untuk opsi ambil sendiri.",
              "Pengantaran hari Minggu dan tanggal merah — paket tidak kami kirim agar tidak menginap di gudang transit.",
              "Jam tiba yang pasti. Estimasi tiba adalah perkiraan; cuaca & antrean kurir bisa memundurkan hingga 1 hari.",
              "Same-day delivery. Belum tersedia di fase ini.",
            ].map((t) => (
              <li key={t} className="flex gap-3"><CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden /><span>{t}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-hero bg-primary p-6 text-white sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Saat paket tiba</h2>
          <ol className="mt-5 space-y-4 text-sm text-white/85">
            {[
              { icon: Thermometer, t: "Buka & cek dalam 30 menit", d: "Produk masih keras/beku = aman. Sedikit embun di permukaan itu normal." },
              { icon: Snowflake, t: "Langsung masukkan freezer", d: "Simpan di -18°C. Jangan bekukan ulang produk yang sudah cair." },
              { icon: CircleAlert, t: "Ada yang lembek atau rusak?", d: `Foto produk, box, dan label tanggal terima, lalu ajukan klaim maksimal ${STORE.claimWindowHours} jam.` },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-3"><Icon className="mt-0.5 size-5 shrink-0 text-frost" aria-hidden /><span><span className="block font-semibold text-white">{t}</span>{d}</span></li>
            ))}
          </ol>
        </div>
      </section>
    </InfoShell>
  );
}
