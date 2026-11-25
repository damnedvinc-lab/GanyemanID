"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChartColumn,
  ClipboardList,
  FileSignature,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Store,
  Tag,
  Warehouse,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { Sheet } from "@/components/ui/dialog";
import { ROLE_LABEL, useApp } from "@/lib/store";
import { formatDayLong, formatTime } from "@/lib/format";
import { overdueInvoices, stockLevel } from "@/lib/commerce";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/order", label: "Order", icon: ClipboardList, badge: "order" as const },
  { href: "/admin/produk", label: "Produk & varian", icon: Package },
  { href: "/admin/stok", label: "Stok", icon: Warehouse, badge: "stok" as const },
  { href: "/admin/harga", label: "Harga", icon: Tag },
  { href: "/admin/kontrak", label: "Kontrak B2B", icon: FileSignature },
  { href: "/admin/invoice", label: "Invoice & piutang", icon: Receipt, badge: "invoice" as const },
  { href: "/admin/laporan", label: "Laporan", icon: ChartColumn },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { state, today, logout } = useApp();
  const router = useRouter();
  const badges = {
    order: state.orders.filter((o) => o.status === "menunggu_pembayaran" && o.payment === "menunggu_verifikasi").length + state.claims.filter((c) => c.status === "diajukan").length,
    stok: state.skus.filter((s) => stockLevel(s) !== "aman").length,
    invoice: [...new Set(state.invoices.map((i) => i.customerId))].reduce((n, c) => n + overdueInvoices(c, state.invoices, today).length, 0),
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5"><Logo href="/admin" /></div>
      <nav aria-label="Menu back-office" className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {NAV.map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            const count = n.badge ? badges[n.badge] : 0;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors duration-150",
                    active ? "bg-primary text-white" : "text-ink hover:bg-frost/70",
                  )}
                >
                  <n.icon className={cn("size-4.5", active ? "text-white" : "text-muted")} aria-hidden />
                  <span className="flex-1">{n.label}</span>
                  {count > 0 && (
                    <span className={cn("min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold leading-5 tnum", active ? "bg-white/20 text-white" : "bg-warning-soft text-ink")} aria-label={`${count} perlu perhatian`}>
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-0.5 border-t border-line p-3">
        <Link href="/" className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-ink hover:bg-frost/70">
          <Store className="size-4.5 text-muted" aria-hidden /> Lihat toko
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/admin/login");
          }}
          className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-ink hover:bg-frost/70"
        >
          <LogOut className="size-4.5 text-muted" aria-hidden /> Keluar
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { state, hydrated, now } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (hydrated && !state.admin.authed) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, state.admin.authed, router, pathname]);

  if (!hydrated || !state.admin.authed) {
    return (
      <div className="grid min-h-screen place-items-center" role="status">
        <span className="text-sm text-muted">Memeriksa sesi…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-surface lg:block">
        <SidebarNav />
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/95 px-4 backdrop-blur-sm sm:px-6">
          <button type="button" onClick={() => setMenu(true)} className="-ml-2 rounded-button p-2 lg:hidden" aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <p className="text-sm text-muted">
            <span className="hidden sm:inline">{formatDayLong(now)} · </span>
            <span className="tnum">{formatTime(now)} WIB</span>
          </p>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              <p className="font-semibold">Akun demo</p>
              <p className="text-xs text-muted">{ROLE_LABEL[state.admin.role]}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-frost text-sm font-bold text-primary">{ROLE_LABEL[state.admin.role].slice(0, 2).toUpperCase()}</span>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
      <Sheet open={menu} onOpenChange={setMenu} title="Menu back-office" side="right" className="max-w-[280px]">
        <div className="-mx-5 -my-4 h-full">
          <SidebarNav onNavigate={() => setMenu(false)} />
        </div>
      </Sheet>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
