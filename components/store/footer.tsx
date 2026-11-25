import Link from "next/link";
import { Logo } from "@/components/brand";
import { CATEGORIES, STORE } from "@/lib/mock-data";

export function StoreFooter() {
  return (
    <footer className="mt-14 border-t border-line bg-surface md:mt-24">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">{STORE.tagline}.</p>
          <p className="mt-4 text-sm text-muted">{STORE.address}</p>
          <p className="mt-1 text-sm text-muted">WhatsApp {STORE.whatsapp} · Senin–Sabtu 08.00–17.00</p>
        </div>
        <nav aria-label="Kategori" className="md:col-span-2">
          <h2 className="text-sm font-semibold">Belanja</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link className="hover:text-ink" href={`/katalog/${c.id}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Bantuan" className="md:col-span-3">
          <h2 className="text-sm font-semibold">Bantuan</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href="/info/pengiriman">Pengiriman & cold chain</Link></li>
            <li><Link className="hover:text-ink" href="/info/retur">Kebijakan retur & klaim</Link></li>
            <li><Link className="hover:text-ink" href="/akun">Lacak pesanan</Link></li>
          </ul>
        </nav>
        <div className="md:col-span-3">
          <h2 className="text-sm font-semibold">Pembayaran</h2>
          <p className="mt-3 text-sm text-muted">Transfer manual ke {STORE.bank.name}, diverifikasi tim kami di jam kerja. Pelanggan B2B dengan kontrak dapat tempo.</p>
          <Link href="/admin/login" className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Masuk back-office
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1280px] px-4 py-5 text-xs text-muted sm:px-6">© 2026 {STORE.brand}. Prototype — data contoh, bukan transaksi sungguhan.</p>
      </div>
    </footer>
  );
}
