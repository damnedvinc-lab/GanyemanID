"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, PRODUCTS, type CategoryId, type Product, type Uom } from "@/lib/mock-data";
import { categoryById, findSku, pricePerKg, productInStock, productSkus } from "@/lib/commerce";
import { useApp, usePageState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingRegion } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { Sheet } from "@/components/ui/dialog";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { Breadcrumbs, Container } from "./section";
import { cn } from "@/lib/utils";

type WeightBand = "kecil" | "sedang" | "grosir";
type PriceBand = "lt40" | "40to60" | "gt60";
type Sort = "terlaris" | "termurah" | "termahal" | "terbaru" | "perkg";

const UOMS: { id: Uom; label: string }[] = [
  { id: "pack", label: "Pack" },
  { id: "kg", label: "Kg (timbang)" },
  { id: "karton", label: "Karton / grosir" },
];
const WEIGHTS: { id: WeightBand; label: string; test: (g: number) => boolean }[] = [
  { id: "kecil", label: "≤ 500 g", test: (g) => g <= 500 },
  { id: "sedang", label: "1 kg", test: (g) => g > 500 && g <= 1000 },
  { id: "grosir", label: "≥ 5 kg (karton)", test: (g) => g >= 5000 },
];
const PRICES: { id: PriceBand; label: string; test: (p: number) => boolean }[] = [
  { id: "lt40", label: "< Rp 40.000", test: (p) => p < 40_000 },
  { id: "40to60", label: "Rp 40.000 – 60.000", test: (p) => p >= 40_000 && p <= 60_000 },
  { id: "gt60", label: "> Rp 60.000", test: (p) => p > 60_000 },
];
const SORTS: { id: Sort; label: string }[] = [
  { id: "terlaris", label: "Terlaris" },
  { id: "termurah", label: "Harga terendah" },
  { id: "termahal", label: "Harga tertinggi" },
  { id: "perkg", label: "Harga per kg terendah" },
  { id: "terbaru", label: "Terbaru" },
];

interface Filters {
  categories: CategoryId[];
  uoms: Uom[];
  weights: WeightBand[];
  prices: PriceBand[];
  inStockOnly: boolean;
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function FilterGroup<T extends string>({ legend, options, value, onChange, counts }: { legend: string; options: { id: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; counts?: Record<string, number> }) {
  return (
    <fieldset className="border-b border-line pb-5">
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      <ul className="space-y-2">
        {options.map((o) => (
          <li key={o.id}>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" className="size-4.5 rounded accent-primary" checked={value.includes(o.id)} onChange={() => onChange(toggle(value, o.id))} />
              <span className="flex-1">{o.label}</span>
              {counts && <span className="text-xs text-muted tnum">{counts[o.id] ?? 0}</span>}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export function CatalogView({ categoryId }: { categoryId?: CategoryId }) {
  const { state } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [sort, setSort] = useState<Sort>((params.get("sort") as Sort) || "terlaris");
  const [sheet, setSheet] = useState(false);
  const empty: Filters = { categories: categoryId ? [categoryId] : [], uoms: [], weights: [], prices: [], inStockOnly: false };
  const [f, setF] = useState<Filters>(empty);
  const category = categoryId ? categoryById(categoryId) : undefined;

  const matches = (p: Product, filters: Filters) => {
    const skus = productSkus(state.skus, p);
    const def = findSku(state.skus, p.defaultSkuId)!;
    if (q && ![p.name, p.tagline, categoryById(p.category)?.name ?? "", ...p.keywords].join(" ").toLowerCase().includes(q)) return false;
    if (filters.categories.length && !filters.categories.includes(p.category)) return false;
    if (filters.uoms.length && !skus.some((s) => filters.uoms.includes(s.uom))) return false;
    if (filters.weights.length && !skus.some((s) => WEIGHTS.filter((w) => filters.weights.includes(w.id)).some((w) => w.test(s.gramsPerUnit)))) return false;
    if (filters.prices.length && !PRICES.filter((x) => filters.prices.includes(x.id)).some((x) => x.test(def.price))) return false;
    if (filters.inStockOnly && !productInStock(state.skus, p)) return false;
    return true;
  };

  const results = useMemo(() => {
    const list = PRODUCTS.filter((p) => matches(p, f));
    const def = (p: Product) => findSku(state.skus, p.defaultSkuId)!;
    return list.sort((a, b) => {
      // stok habis selalu di belakang
      const sa = productInStock(state.skus, a) ? 0 : 1;
      const sb = productInStock(state.skus, b) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      switch (sort) {
        case "termurah": return def(a).price - def(b).price;
        case "termahal": return def(b).price - def(a).price;
        case "perkg": return pricePerKg(def(a), def(a).price) - pricePerKg(def(b), def(b).price);
        case "terbaru": return b.addedAt.localeCompare(a.addedAt);
        default: return b.soldCount - a.soldCount;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, sort, q, state.skus]);

  const view = usePageState(results.length === 0);
  const activeCount = (categoryId ? 0 : f.categories.length) + f.uoms.length + f.weights.length + f.prices.length + (f.inStockOnly ? 1 : 0);
  const catCounts = Object.fromEntries(CATEGORIES.map((c) => [c.id, PRODUCTS.filter((p) => p.category === c.id && matches(p, { ...f, categories: [c.id] })).length]));

  const filterForm = (
    <div className="space-y-5">
      {!categoryId && (
        <FilterGroup legend="Kategori" options={CATEGORIES.map((c) => ({ id: c.id, label: c.name }))} value={f.categories} onChange={(v) => setF({ ...f, categories: v })} counts={catCounts} />
      )}
      <FilterGroup legend="Satuan jual" options={UOMS} value={f.uoms} onChange={(v) => setF({ ...f, uoms: v })} />
      <FilterGroup legend="Berat per satuan" options={WEIGHTS} value={f.weights} onChange={(v) => setF({ ...f, weights: v })} />
      <FilterGroup legend="Harga per satuan" options={PRICES} value={f.prices} onChange={(v) => setF({ ...f, prices: v })} />
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="size-4.5 accent-primary" checked={f.inStockOnly} onChange={(e) => setF({ ...f, inStockOnly: e.target.checked })} />
        Sembunyikan stok habis
      </label>
    </div>
  );

  const chips: { label: string; clear: () => void }[] = [
    ...(categoryId ? [] : f.categories.map((c) => ({ label: categoryById(c)!.name, clear: () => setF({ ...f, categories: f.categories.filter((x) => x !== c) }) }))),
    ...f.uoms.map((u) => ({ label: UOMS.find((x) => x.id === u)!.label, clear: () => setF({ ...f, uoms: f.uoms.filter((x) => x !== u) }) })),
    ...f.weights.map((w) => ({ label: WEIGHTS.find((x) => x.id === w)!.label, clear: () => setF({ ...f, weights: f.weights.filter((x) => x !== w) }) })),
    ...f.prices.map((p) => ({ label: PRICES.find((x) => x.id === p)!.label, clear: () => setF({ ...f, prices: f.prices.filter((x) => x !== p) }) })),
    ...(f.inStockOnly ? [{ label: "Hanya tersedia", clear: () => setF({ ...f, inStockOnly: false }) }] : []),
    ...(q ? [{ label: `"${q}"`, clear: () => router.push(categoryId ? `/katalog/${categoryId}` : "/katalog") }] : []),
  ];

  const title = category ? category.name : q ? `Hasil untuk "${params.get("q")}"` : "Semua produk beku";

  return (
    <Container className="pt-6 md:pt-10">
      <Breadcrumbs items={[{ href: "/", label: "Beranda" }, ...(category ? [{ href: "/katalog", label: "Katalog" }, { label: category.name }] : [{ label: "Katalog" }])]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">{title}</h1>
          <p className="mt-1.5 text-sm text-muted" aria-live="polite">
            {view === "loading" ? "Memuat produk…" : `${view === "empty" ? 0 : results.length} produk · harga per satuan & per kg`}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button variant="secondary" className="lg:hidden" onClick={() => setSheet(true)}>
            <SlidersHorizontal className="size-4" aria-hidden /> Filter{activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-white">{activeCount}</span>}
          </Button>
          <div className="flex flex-1 items-center gap-2 sm:flex-none">
            <label htmlFor="sort" className="hidden text-sm text-muted sm:block">Urutkan</label>
            <Select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="sm:w-56">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.label} type="button" onClick={c.clear} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-frost px-3 text-xs font-semibold text-primary hover:bg-frost/70" aria-label={`Hapus filter ${c.label}`}>
              {c.label} <X className="size-3.5" aria-hidden />
            </button>
          ))}
          <button type="button" className="text-xs font-semibold text-muted underline-offset-4 hover:underline" onClick={() => setF(empty)}>Reset filter</button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block" aria-label="Filter produk">
          <div className="sticky top-32 rounded-card border border-line bg-surface p-5">{filterForm}</div>
        </aside>
        <div className="lg:col-span-9">
          {view === "loading" ? (
            <LoadingRegion label="Memuat katalog">
              <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            </LoadingRegion>
          ) : view === "empty" ? (
            categoryId === "bumbu" && activeCount === 0 && !q ? (
              <EmptyState icon={SearchX} title="Bumbu segera hadir" description="Kami sedang menyiapkan bumbu beku siap masak dari vendor bersertifikat. Sementara itu, lihat kategori lain." action={<Button variant="secondary" onClick={() => router.push("/katalog")}>Lihat semua produk</Button>} />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Tidak ada produk yang cocok"
                description={q ? `Belum ada produk untuk "${params.get("q")}". Coba kata lain, misalnya "ayam fillet" atau "udang".` : "Coba kurangi filter satuan, berat, atau harga."}
                action={<Button variant="secondary" onClick={() => { setF(empty); if (q) router.push(categoryId ? `/katalog/${categoryId}` : "/katalog"); }}>Reset filter & pencarian</Button>}
              />
            )
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
              {results.map((p) => (
                <li key={p.id} className="flex"><ProductCard product={p} className="w-full" /></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        title="Filter"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setF(empty)}>Reset</Button>
            <Button block onClick={() => setSheet(false)} className={cn("flex-1")}>Tampilkan {results.length} produk</Button>
          </div>
        }
      >
        {filterForm}
      </Sheet>
    </Container>
  );
}
