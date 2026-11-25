import { PRODUCTS } from "@/lib/mock-data";
import { PdpView } from "@/components/store/pdp-view";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PRODUCTS.find((x) => x.slug === slug);
  return { title: p ? p.name : "Produk tidak ditemukan", description: p?.tagline };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PdpView slug={slug} />;
}
