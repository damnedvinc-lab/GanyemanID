import { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogView } from "@/components/store/catalog-view";

export const metadata: Metadata = { title: "Katalog" };

export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogView />
    </Suspense>
  );
}
