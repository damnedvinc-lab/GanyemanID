"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { ROLE_LABEL, useApp, type AdminRole } from "@/lib/store";

function LoginForm() {
  const { login } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("owner@ufrost.id");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState<AdminRole>("owner");
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Format email tidak valid.");
        if (password.length < 6) return setError("Kata sandi minimal 6 karakter.");
        login(role);
        router.push(params.get("next") || "/admin");
      }}
    >
      <Field label="Email kerja">{(p) => <Input {...p} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
      <Field label="Kata sandi">{(p) => <Input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}</Field>
      <Field label="Masuk sebagai (mock role)" hint="Di sistem nyata, role melekat pada akun. Owner bisa menyetujui harga di bawah HPP.">
        {(p) => (
          <Select {...p} value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
            {(Object.keys(ROLE_LABEL) as AdminRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
        )}
      </Field>
      {error && <Notice tone="danger">{error}</Notice>}
      <Button type="submit" size="lg" block>Masuk</Button>
      <p className="text-center text-xs text-muted">Sesi berakhir otomatis setelah 12 jam.</p>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 text-white lg:flex">
        <Logo tone="light" href="/" />
        <div>
          <p className="font-display text-4xl font-semibold leading-tight">Satu tempat untuk order, stok, harga, dan kontrak.</p>
          <p className="mt-4 max-w-md text-white/75">Back-office U-Frost ID — dari verifikasi transfer sampai aging piutang pelanggan HoReKa.</p>
        </div>
        <p className="text-xs text-white/60">Prototype · mock auth tanpa backend</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden"><Logo href="/" /></div>
          <h1 className="font-display mt-8 flex items-center gap-2 text-3xl font-semibold lg:mt-0"><Lock className="size-6 text-primary" aria-hidden /> Masuk back-office</h1>
          <p className="mt-2 text-sm text-muted">Data demo sudah terisi. Tekan Masuk untuk melanjutkan.</p>
          <div className="mt-8"><Suspense><LoginForm /></Suspense></div>
        </div>
      </div>
    </main>
  );
}
