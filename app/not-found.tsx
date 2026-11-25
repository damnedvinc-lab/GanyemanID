import { Snowflake } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md text-center">
        <span className="frost-pattern mx-auto grid size-16 place-items-center rounded-full"><Snowflake className="size-7 text-primary" aria-hidden /></span>
        <h1 className="font-display mt-5 text-3xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-muted">Tautan mungkin salah atau halaman sudah dipindah.</p>
        <ButtonLink href="/" className="mt-6">Kembali ke beranda</ButtonLink>
      </div>
    </main>
  );
}
