"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, Snowflake, User } from "lucide-react";
import { useApp } from "@/lib/store";
import { Logo } from "@/components/brand";
import { Sheet } from "@/components/ui/dialog";
import { CATEGORIES, STORE } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CutoffNotice } from "./order-ui";

const NAV = [
  { href: "/katalog", label: "Katalog" },
  { href: "/info/pengiriman", label: "Pengiriman & cold chain" },
  { href: "/info/retur", label: "Retur" },
];

function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/katalog?q=${encodeURIComponent(q.trim())}` : "/katalog");
      }}
    >
      <label htmlFor="site-search" className="sr-only">
        Cari produk
      </label>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        id="site-search"
        type="search"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari ayam fillet, udang, nugget…"
        className="h-11 w-full rounded-full border border-line bg-bg pl-9 pr-4 text-base sm:text-sm placeholder:text-muted/80 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
      />
    </form>
  );
}

export function StoreHeader() {
  const { state, cartBump, hydrated } = useApp();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [bump, setBump] = useState(false);
  const count = state.cart.length;

  useEffect(() => {
    if (cartBump === 0) return;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 260);
    return () => window.clearTimeout(t);
  }, [cartBump]);

  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-sm">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-button focus:bg-surface focus:px-4 focus:py-2">
        Lewati ke konten
      </a>
      <div className="bg-primary text-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 sm:text-sm">
          <span className="flex items-center gap-1.5">
            <Snowflake aria-hidden className="size-3.5 text-frost" />
            <span className="hidden sm:inline">Box insulated + ice gel, dikirim -18°C ke Jabodetabek, Jawa, Bali & Sumsel</span>
            <span className="sm:hidden">Dikirim -18°C · box insulated + ice gel</span>
          </span>
          {hydrated && <CutoffNotice tone="dark" className="hidden text-xs lg:flex" />}
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:gap-8">
        <button type="button" onClick={() => setMenu(true)} className="-ml-2 rounded-button p-2 lg:hidden" aria-label="Buka menu">
          <Menu className="size-5" />
        </button>
        <Logo />
        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-6 text-sm font-medium">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={pathname.startsWith(n.href) ? "page" : undefined} className={cn("transition-colors hover:text-primary", pathname.startsWith(n.href) ? "text-primary" : "text-ink")}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <SearchBox className="ml-auto hidden max-w-sm flex-1 md:block" />
        </Suspense>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link href="/akun" className="hidden items-center gap-2 rounded-button px-3 py-2 text-sm font-medium hover:bg-frost/60 sm:inline-flex" aria-label="Akun saya">
            <User className="size-5" aria-hidden />
            <span className="hidden xl:inline">Akun</span>
          </Link>
          <Link href="/keranjang" className="relative inline-flex items-center gap-2 rounded-button px-3 py-2 text-sm font-medium hover:bg-frost/60" aria-label={`Keranjang, ${count} item`}>
            <ShoppingBag className="size-5" aria-hidden />
            <span className="hidden xl:inline">Keranjang</span>
            {count > 0 && (
              <span className={cn("absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-accent-strong px-1 text-[11px] font-bold leading-5 text-white tnum xl:static", bump && "animate-bump")}>
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <Suspense fallback={<div className="h-11" />}>
          <SearchBox />
        </Suspense>
      </div>

      <Sheet open={menu} onOpenChange={setMenu} title="Menu" side="bottom">
        <nav aria-label="Navigasi mobile" className="space-y-6 pb-4">
          <ul className="space-y-1">
            {[...NAV, { href: "/akun", label: "Akun & pesanan" }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="flex h-12 items-center rounded-button px-3 text-base font-medium hover:bg-frost/60">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted">Kategori</p>
            <ul className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link href={`/katalog/${c.id}`} className="flex h-11 items-center rounded-button border border-line px-3 text-sm font-medium">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="px-3 text-sm text-muted">Butuh bantuan? WhatsApp {STORE.whatsapp}</p>
        </nav>
      </Sheet>
    </header>
  );
}
