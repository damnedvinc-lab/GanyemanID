"use client";

import { FileText } from "lucide-react";
import { usePageState } from "@/lib/store";
import { EmptyState, LoadingRegion, Skeleton } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs, Container } from "./section";

export function InfoShell({ title, lead, crumb, children }: { title: string; lead: string; crumb: string; children: React.ReactNode }) {
  const view = usePageState(false);
  return (
    <Container className="pt-6 md:pt-10">
      <Breadcrumbs items={[{ href: "/", label: "Beranda" }, { label: crumb }]} />
      {view === "loading" ? (
        <LoadingRegion label="Memuat halaman">
          <Skeleton className="mt-6 h-12 w-2/3" />
          <Skeleton className="mt-3 h-5 w-1/2" />
          <div className="mt-10 grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}</div>
          <Skeleton className="mt-8 h-64" />
        </LoadingRegion>
      ) : view === "empty" ? (
        <EmptyState className="mt-6" icon={FileText} title="Halaman sedang diperbarui" description="Kebijakan terbaru akan tayang sebentar lagi. Untuk pertanyaan mendesak, hubungi CS via WhatsApp." action={<ButtonLink href="/" variant="secondary">Ke beranda</ButtonLink>} />
      ) : (
        <>
          <header className="mt-4 max-w-3xl">
            <h1 className="font-display text-4xl font-semibold md:text-5xl">{title}</h1>
            <p className="mt-4 text-lg text-muted">{lead}</p>
          </header>
          <div className="mt-10 space-y-14 md:space-y-20">{children}</div>
        </>
      )}
    </Container>
  );
}
