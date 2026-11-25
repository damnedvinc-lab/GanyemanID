import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CATEGORIES, type CategoryId } from "@/lib/mock-data";
import { CatalogView } from "@/components/store/catalog-view";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ kategori: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ kategori: string }> }) {
  const { kategori } = await params;
  return { title: CATEGORIES.find((c) => c.id === kategori)?.name ?? "Katalog" };
}

export default async function CategoryPage({ params }: { params: Promise<{ kategori: string }> }) {
  const { kategori } = await params;
  if (!CATEGORIES.some((c) => c.id === kategori)) notFound();
  return (
    <Suspense>
      <CatalogView key={kategori} categoryId={kategori as CategoryId} />
    </Suspense>
  );
}
