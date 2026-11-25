"use client";

import { use } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { useApp, usePageState } from "@/lib/store";
import { EmptyState, LoadingRegion, Skeleton } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/store/section";
import { CustomerOrderDetail } from "@/components/store/order-detail";

export default function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, viewer } = useApp();
  const order = state.orders.find((o) => o.number === id && o.customerId === viewer.id);
  const view = usePageState(!order);
  return (
    <Container className="pt-6 md:pt-10">
      <Link href="/akun" className="text-sm font-semibold text-primary hover:underline">← Riwayat pesanan</Link>
      <div className="mt-4">
        {view === "loading" ? (
          <LoadingRegion label="Memuat pesanan"><Skeleton className="h-10 w-64" /><Skeleton className="mt-6 h-96" /></LoadingRegion>
        ) : view === "empty" || !order ? (
          <EmptyState icon={PackageSearch} title="Pesanan tidak ditemukan" description="Pesanan ini tidak ada di akunmu." action={<ButtonLink href="/akun" variant="secondary">Kembali</ButtonLink>} />
        ) : (
          <CustomerOrderDetail order={order} />
        )}
      </div>
    </Container>
  );
}
