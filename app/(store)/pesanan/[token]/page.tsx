"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { useApp, usePageState } from "@/lib/store";
import { EmptyState, LoadingRegion, Skeleton } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/store/section";
import { CustomerOrderDetail } from "@/components/store/order-detail";

function OrderStatusView({ token }: { token: string }) {
  const { state } = useApp();
  const params = useSearchParams();
  const order = state.orders.find((o) => o.token === token);
  const view = usePageState(!order);
  return (
    <Container className="pt-6 md:pt-10">
      {view === "loading" ? (
        <LoadingRegion label="Memuat status pesanan">
          <Skeleton className="h-10 w-64" />
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7"><Skeleton className="h-64" /><Skeleton className="h-72" /></div>
            <Skeleton className="h-72 lg:col-span-5" />
          </div>
        </LoadingRegion>
      ) : view === "empty" || !order ? (
        <EmptyState icon={PackageSearch} title="Pesanan tidak ditemukan" description="Tautan status mungkin salah atau sudah kedaluwarsa. Masuk ke akun untuk melihat semua pesananmu." action={<ButtonLink href="/akun" variant="secondary">Ke akun saya</ButtonLink>} />
      ) : (
        <CustomerOrderDetail order={order} justCreated={params.get("baru") === "1"} />
      )}
    </Container>
  );
}

export default function OrderStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return (
    <Suspense>
      <OrderStatusView token={token} />
    </Suspense>
  );
}
