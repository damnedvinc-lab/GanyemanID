# U-Frost ID — prototype e-commerce frozen food + back-office

Prototype high-fidelity yang bisa diklik untuk bisnis frozen food hybrid
(retail, reseller, B2B/HoReKa kontrak). Tanpa backend — semua data mock ada di
`lib/mock-data.ts` dan state disimpan di `localStorage` browser.

Fokus: **kejelasan satuan & harga**, **kepercayaan cold chain**, dan **alur kontrak B2B**.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

Build produksi:

```bash
npm run build && npm start
```

Butuh Node.js 20+. Font Fraunces & Inter diunduh oleh `next/font` saat build.

## Peta layar

| Storefront (`app/(store)`) | Back-office (`app/(admin)/admin`) |
|---|---|
| `/` Beranda | `/admin/login` Login (mock auth) |
| `/katalog`, `/katalog/[kategori]` | `/admin` Dashboard |
| `/produk/[slug]` PDP | `/admin/order` Order + panel detail |
| `/keranjang` | `/admin/produk`, `/admin/produk/[id]` editor SKU |
| `/checkout` | `/admin/stok` Kartu stok, penerimaan, opname |
| `/pesanan/[token]` Konfirmasi & status | `/admin/harga` Retail / Reseller / Tier / Kontrak |
| `/akun`, `/akun/pesanan/[id]` | `/admin/kontrak`, `/admin/kontrak/[id]` + call-off |
| `/akun/klaim/baru?order=` Klaim retur | `/admin/invoice` Aging & credit limit |
| `/info/pengiriman`, `/info/retur` | `/admin/laporan` 5 laporan + export CSV |

## Struktur file

```
app/
  layout.tsx              font (next/font), AppProvider, Toast, panel demo
  globals.css             design token (warna, tipografi, radius, motion, print)
  (store)/…               storefront
  (admin)/admin/login     login
  (admin)/admin/(panel)/… layar back-office (dilindungi AdminShell)
components/
  ui/                     Button, Input/Select/Field/Checkbox/RadioCard, Modal, Sheet,
                          Tabs, Toast, Skeleton, EmptyState, StatusPill, Notice, Card
  store/                  ProductCard, ProductImage (fallback frost), PricePerKgChip,
                          ColdChainBadge, CertChips, UomSelector, QtyStepper, StockBadge,
                          OrderTimeline, ShippingEstimator, MinOrderMeter, CutoffNotice,
                          StickyCartBar, FilterSheet (di catalog-view), header/footer
  admin/                  AdminShell (sidebar 240 px), DataTable, QuotaBar,
                          CreditLimitMeter, StatTile, OrderPanel + SuratJalan
  demo-panel.tsx          panel khusus prototype
lib/
  mock-data.ts            SATU sumber data bertipe (SKU, harga, HPP, stok, zona, kontrak, order…)
  commerce.ts             aturan bisnis PRD §9: prioritas harga, harga/kg, berat kirim,
                          ongkir zona, cut-off 14.00, minimum order, aging, credit exposure
  seed.ts                 menurunkan order/invoice/kartu stok awal dari data mock
  store.tsx               state & aksi (order, verifikasi, call-off, klaim, opname, harga)
  reports.ts              kas harian, laba rugi, margin per SKU, export CSV
  format.ts               "Rp 47.500", "25 Nov 2026", "500 g", WIB
```

## Panel demo

Tombol **Demo** (kanan bawah) — bukan fitur produk — untuk menguji:

- **State halaman**: Normal / Kosong / Memuat (skeleton) di semua layar.
- **Jam**: asli (WIB) / 10.00 (sebelum cut-off) / 15.30 (setelah cut-off). Tanggal demo tetap 25 Nov 2026.
- **Belanja sebagai**: Rani (retail) atau Toko Frozen Sejahtera (reseller → harga reseller).
- **Back-office**: masuk/keluar mock auth. **Reset data** mengembalikan seed.

## Skenario untuk dicoba

1. PDP Ayam Fillet → ganti **Pack ↔ Karton**: harga, qty, harga/kg & berat berubah. Qty 6 pack → harga tier aktif.
2. Bakso Sapi (stok 0) → tombol **Stok habis**, tidak bisa ditambahkan.
3. Keranjang di bawah Rp 100.000 / 2 kg → checkout **diblokir**. Jadwal kirim mengikuti cut-off 14.00 & hari kirim per zona.
4. Admin → Order `UF-261125-004` → centang 3 pemeriksaan → **Verifikasi pembayaran** (stok direservasi).
5. Admin → Order `UF-261125-002` → label **Harga Kontrak** di panel & tiap item.
6. Kontrak Bu Tini → call-off 120 pack ayam fillet → **diblokir** (sisa kuota 50 kg). 30 pack → berhasil, kuota jadi 965/1.000 kg.
7. Kontrak Katering Sehati → **diblokir** karena invoice lewat jatuh tempo.
8. Stok → **Opname** → isi qty fisik → selisih & nilai muncul sebelum simpan, alasan wajib.
9. Order `UF-261121-002` (klaim) → **Refund** atau **Ganti barang**. Akun Rani → `UF-261125-001` → ajukan klaim (jendela 6 jam).

## Asumsi (bisa diganti di `lib/mock-data.ts`)

- Harga, HPP & stok mengikuti dataset brief. Harga reseller = retail × 0,92 (dibulatkan ke bawah Rp 500).
- Tarif zona contoh (PRD Q5 belum final): Z1 Jabodetabek Rp 20.000/3 kg + Rp 5.000/kg, Z2 Jawa Rp 35.000 + Rp 9.000/kg, Z3 Bali & Sumsel Rp 55.000 + Rp 14.000/kg.
- Berat kirim = bersih + kemasan + 1,2 kg box & ice gel per 10 kg, dibulatkan ke atas per 0,5 kg.
- Karton Ayam Fillet = SKU terpisah (stok 7 karton) yang tampil sebagai satuan "Karton" di PDP yang sama.
- Bundling "Paket Stok Seminggu" Rp 179.000 & "Paket Seafood" Rp 162.000 — harga paket asumsi.
- Laporan laba rugi & margin memakai agregat penjualan 1–25 Nov 2026 per kanal.

## Keterbatasan yang perlu diketahui

- **Foto produk**: unsplash.com tidak dapat dijangkau dari lingkungan build, sehingga ID foto tidak bisa
  diverifikasi. Semua gambar memakai fallback frost + ikon (tidak ada gambar rusak). Isi `PHOTOS` di
  `lib/mock-data.ts` dengan URL `images.unsplash.com` yang sudah dicek untuk menampilkan foto asli.
- Upload bukti transfer / foto klaim hanya pratinjau lokal (tidak terkirim ke server).
- Komponen UI ditulis dengan pola shadcn/ui (Radix Dialog & Tabs + CVA) dan di-restyle ke token, tanpa CLI shadcn.
- Edit nama/deskripsi produk di admin tidak disimpan; konversi satuan, berat & stok minimum per SKU disimpan.
