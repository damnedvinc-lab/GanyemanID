"use client";

import { useMemo, useState } from "react";
import { ClipboardList, PackagePlus, Warehouse } from "lucide-react";
import { SUPPLIERS, type Sku } from "@/lib/mock-data";
import { movingAverage, productById, stockLevel, type StockMove } from "@/lib/commerce";
import { formatDateTime, formatNum, formatRp, formatWeight } from "@/lib/format";
import { useApp, usePageState } from "@/lib/store";
import { PageHeader } from "@/components/admin/shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatTile } from "@/components/admin/meters";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { EmptyState, Notice, StatusPill } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const skuName = (s: Sku) => `${productById(s.productId)?.name} ${s.uom === "kg" ? "(kg)" : s.label}`;
const MOVE_LABEL: Record<StockMove["type"], string> = { saldo_awal: "Saldo awal", masuk: "Masuk", keluar: "Keluar", opname: "Opname", penyesuaian: "Penyesuaian" };
const REASONS = ["Susut kemasan / drip loss", "Rusak saat penyimpanan", "Salah hitung sebelumnya", "Kadaluarsa (write-off)", "Lainnya"];

function ReceiveModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, receiveStock } = useApp();
  const toast = useToast();
  const [supplier, setSupplier] = useState(SUPPLIERS[0].id);
  const sup = SUPPLIERS.find((s) => s.id === supplier)!;
  const [skuId, setSkuId] = useState(sup.skus[0]);
  const sku = state.skus.find((s) => s.id === skuId)!;
  const [qty, setQty] = useState("24");
  const [cost, setCost] = useState(String(sku?.hpp ?? 0));
  const [freight, setFreight] = useState("0");
  const q = Number(qty.replace(",", ".")) || 0;
  const c = Number(cost.replace(/\D/g, "")) || 0;
  const f = Number(freight.replace(/\D/g, "")) || 0;
  const newHpp = sku ? movingAverage(sku.stock, sku.hpp, q, c, f) : 0;
  const valid = q > 0 && c > 0;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Penerimaan barang"
      description="Stok bertambah dan HPP diperbarui dengan moving average (BR-STK-05)."
      footer={<><Button variant="secondary" onClick={() => onOpenChange(false)}>Batal</Button><Button disabled={!valid} onClick={() => { receiveStock({ skuId, qty: q, unitCost: c, freight: f, supplier: sup.name }); toast({ title: `${formatNum(q)} ${sku.uom} ${skuName(sku)} diterima`, description: `HPP baru ${formatRp(newHpp)}` }); onOpenChange(false); }}>Simpan penerimaan</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier">{(p) => <Select {...p} value={supplier} onChange={(e) => { setSupplier(e.target.value); const ns = SUPPLIERS.find((s) => s.id === e.target.value)!; setSkuId(ns.skus[0]); setCost(String(state.skus.find((s) => s.id === ns.skus[0])?.hpp ?? 0)); }}>{SUPPLIERS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
        <Field label="SKU">{(p) => <Select {...p} value={skuId} onChange={(e) => { setSkuId(e.target.value); setCost(String(state.skus.find((s) => s.id === e.target.value)?.hpp ?? 0)); }}>{sup.skus.map((id) => { const s = state.skus.find((x) => x.id === id)!; return <option key={id} value={id}>{skuName(s)}</option>; })}</Select>}</Field>
        <Field label={`Qty diterima (${sku.uom})`}>{(p) => <Input {...p} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />}</Field>
        <Field label={`Harga beli per ${sku.uom}`}>{(p) => <Input {...p} inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} />}</Field>
        <Field label="Biaya kirim dari supplier" hint="Dialokasikan ke HPP (landed cost)">{(p) => <Input {...p} inputMode="numeric" value={freight} onChange={(e) => setFreight(e.target.value)} />}</Field>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 rounded-[14px] bg-frost/60 p-4 text-sm tnum">
        <div><dt className="text-xs text-muted">Stok</dt><dd className="font-semibold">{formatNum(sku.stock)} → {formatNum(sku.stock + q)}</dd></div>
        <div><dt className="text-xs text-muted">HPP saat ini</dt><dd className="font-semibold">{formatRp(sku.hpp)}</dd></div>
        <div><dt className="text-xs text-muted">HPP baru</dt><dd className={cn("font-semibold", newHpp > sku.hpp ? "text-danger" : "text-success")}>{formatRp(newHpp)}</dd></div>
      </dl>
      {newHpp >= sku.price && <Notice tone="warning" className="mt-3">HPP baru ≥ harga jual retail ({formatRp(sku.price)}). Tinjau harga di menu Harga.</Notice>}
    </Modal>
  );
}

function OpnameModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, saveOpname } = useApp();
  const toast = useToast();
  const [physical, setPhysical] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [tried, setTried] = useState(false);
  const rows = state.skus.map((s) => {
    const raw = physical[s.id];
    const phys = raw === undefined || raw === "" ? undefined : Number(raw.replace(",", "."));
    const diff = phys === undefined || Number.isNaN(phys) ? 0 : Number((phys - s.stock).toFixed(2));
    return { s, phys, diff, value: diff * s.hpp };
  });
  const changed = rows.filter((r) => r.diff !== 0);
  const missingReason = changed.filter((r) => !reasons[r.s.id]);
  const totalValue = changed.reduce((a, r) => a + r.value, 0);
  return (
    <Modal
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) { setPhysical({}); setReasons({}); setTried(false); } }}
      size="xl"
      title="Stok opname"
      description="Isi qty fisik hasil hitung. Selisih dihitung otomatis; alasan wajib untuk setiap selisih (BR-STK-07)."
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-sm tnum">{changed.length} SKU berselisih · nilai <strong className={totalValue < 0 ? "text-danger" : "text-success"}>{formatRp(totalValue)}</strong></p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button disabled={changed.length === 0} onClick={() => {
              setTried(true);
              if (missingReason.length) return toast({ title: "Alasan selisih wajib diisi", description: missingReason.map((r) => r.s.code).join(", "), tone: "error" });
              const ref = saveOpname(changed.map((r) => ({ skuId: r.s.id, physical: r.phys!, reason: reasons[r.s.id] })));
              toast({ title: `Opname ${ref} disimpan`, description: `${changed.length} penyesuaian tercatat di kartu stok.` });
              onOpenChange(false); setPhysical({}); setReasons({}); setTried(false);
            }}>Simpan opname</Button>
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">Input opname</caption>
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-line"><th className="h-10 pr-3">SKU</th><th className="pr-3 text-right">Sistem</th><th className="pr-3">Fisik</th><th className="pr-3 text-right">Selisih</th><th className="pr-3 text-right">Nilai</th><th>Alasan</th></tr>
          </thead>
          <tbody>
            {rows.map(({ s, diff, value }) => (
              <tr key={s.id} className="border-b border-line even:bg-bg/50">
                <td className="h-12 pr-3"><span className="font-medium">{skuName(s)}</span><span className="block font-mono text-xs text-muted">{s.code}</span></td>
                <td className="pr-3 text-right tnum">{formatNum(s.stock)} {s.uom}</td>
                <td className="pr-3"><Input aria-label={`Qty fisik ${s.code}`} inputMode="decimal" placeholder={formatNum(s.stock)} className="h-9 w-24 tnum" value={physical[s.id] ?? ""} onChange={(e) => setPhysical({ ...physical, [s.id]: e.target.value })} /></td>
                <td className={cn("pr-3 text-right font-semibold tnum", diff < 0 && "text-danger", diff > 0 && "text-success")}>{diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${formatNum(diff)}`}</td>
                <td className={cn("pr-3 text-right tnum", value < 0 && "text-danger")}>{diff === 0 ? "—" : formatRp(value)}</td>
                <td>
                  {diff !== 0 && (
                    <Select aria-label={`Alasan selisih ${s.code}`} aria-invalid={tried && !reasons[s.id] ? true : undefined} className="h-9" value={reasons[s.id] ?? ""} onChange={(e) => setReasons({ ...reasons, [s.id]: e.target.value })}>
                      <option value="">Pilih alasan…</option>
                      {REASONS.map((r) => <option key={r}>{r}</option>)}
                    </Select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Write-off karena rusak/kadaluarsa memerlukan approval Owner (BR-STK-06). Riwayat lama tidak ditimpa — opname membuat dokumen penyesuaian baru.</p>
    </Modal>
  );
}

export default function StockPage() {
  const { state } = useApp();
  const view = usePageState(false);
  const [receive, setReceive] = useState(false);
  const [opname, setOpname] = useState(false);
  const [cardSku, setCardSku] = useState(state.skus[0]?.id ?? "");
  const empty = view === "empty";
  const totalValue = state.skus.reduce((s, x) => s + x.stock * x.hpp, 0);
  const totalKg = state.skus.reduce((s, x) => s + x.stock * x.gramsPerUnit, 0);
  const lastMove = (id: string) => state.ledger.filter((m) => m.skuId === id).sort((a, b) => b.at.localeCompare(a.at))[0];

  const card = useMemo(() => {
    let bal = 0;
    return state.ledger
      .filter((m) => m.skuId === cardSku)
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((m) => ({ ...m, balance: (bal = Number((bal + m.qty).toFixed(2))) }))
      .reverse();
  }, [state.ledger, cardSku]);
  const sku = state.skus.find((s) => s.id === cardSku)!;

  const columns: Column<Sku>[] = [
    { key: "sku", header: "SKU", cell: (s) => <span><span className="font-semibold">{skuName(s)}</span><span className="block font-mono text-xs text-muted">{s.code}</span></span> },
    { key: "qty", header: "Stok", align: "right", cell: (s) => <span className="font-semibold">{formatNum(s.stock)} {s.uom}</span> },
    { key: "kg", header: "Setara", align: "right", cell: (s) => formatWeight(s.stock * s.gramsPerUnit), hideBelow: "md" },
    { key: "min", header: "Min.", align: "right", cell: (s) => formatNum(s.minStock), hideBelow: "lg" },
    { key: "hpp", header: "HPP rata-rata", align: "right", cell: (s) => formatRp(s.hpp), hideBelow: "md" },
    { key: "nilai", header: "Nilai persediaan", align: "right", cell: (s) => formatRp(s.stock * s.hpp) },
    { key: "last", header: "Gerak terakhir", cell: (s) => { const m = lastMove(s.id); return m ? <span className="whitespace-nowrap text-xs text-muted">{MOVE_LABEL[m.type]} · {formatDateTime(m.at)}</span> : "—"; }, hideBelow: "xl" },
    { key: "lvl", header: "Status", cell: (s) => { const l = stockLevel(s); return <StatusPill tone={l === "habis" ? "danger" : l === "menipis" ? "warning" : "success"}>{l === "habis" ? "Habis" : l === "menipis" ? "Di bawah min." : "Aman"}</StatusPill>; } },
  ];

  return (
    <>
      <PageHeader
        title="Stok"
        description="1 lokasi · tanpa batch. Stok tersedia = fisik − reservasi order dibayar."
        actions={<><Button variant="secondary" onClick={() => setReceive(true)}><PackagePlus className="size-4" aria-hidden /> Penerimaan</Button><Button onClick={() => setOpname(true)}><ClipboardList className="size-4" aria-hidden /> Opname</Button></>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Nilai persediaan" value={<span className="text-2xl">{formatRp(empty ? 0 : totalValue)}</span>} hint="qty × HPP moving average" icon={Warehouse} />
        <StatTile label="Total berat" value={<span className="text-2xl">{formatWeight(empty ? 0 : totalKg)}</span>} hint={`${state.skus.length} SKU`} icon={Warehouse} />
        <StatTile label="Di bawah minimum" value={empty ? 0 : state.skus.filter((s) => stockLevel(s) === "menipis").length} icon={Warehouse} tone="warning" />
        <StatTile label="Habis" value={empty ? 0 : state.skus.filter((s) => stockLevel(s) === "habis").length} icon={Warehouse} tone="danger" />
      </div>
      <Tabs defaultValue="ringkasan">
        <TabsList>
          <TabsTrigger value="ringkasan">Ringkasan stok</TabsTrigger>
          <TabsTrigger value="kartu">Kartu stok</TabsTrigger>
        </TabsList>
        <TabsContent value="ringkasan">
          <DataTable caption="Ringkasan stok per SKU" columns={columns} rows={empty ? [] : state.skus} rowKey={(s) => s.id} loading={view === "loading"} empty={<EmptyState compact className="m-4 border-0" icon={Warehouse} title="Belum ada stok" description="Catat penerimaan barang pertama untuk mulai." />} />
        </TabsContent>
        <TabsContent value="kartu">
          <div className="mb-4 max-w-sm">
            <Field label="Pilih SKU">{(p) => <Select {...p} value={cardSku} onChange={(e) => setCardSku(e.target.value)}>{state.skus.map((s) => <option key={s.id} value={s.id}>{skuName(s)}</option>)}</Select>}</Field>
          </div>
          <DataTable
            caption={`Kartu stok ${sku?.code}`}
            rows={empty ? [] : card}
            rowKey={(m) => m.id}
            loading={view === "loading"}
            empty={<EmptyState compact className="m-4 border-0" icon={ClipboardList} title="Belum ada pergerakan" />}
            columns={[
              { key: "at", header: "Waktu", cell: (m) => <span className="whitespace-nowrap tnum">{formatDateTime(m.at)}</span> },
              { key: "type", header: "Jenis", cell: (m) => <StatusPill tone={m.type === "masuk" ? "success" : m.type === "keluar" ? "info" : m.type === "opname" ? "warning" : "neutral"}>{MOVE_LABEL[m.type]}</StatusPill> },
              { key: "ref", header: "Referensi", cell: (m) => <span><span className="font-medium tnum">{m.ref}</span>{m.note && <span className="block text-xs text-muted">{m.note}</span>}</span> },
              { key: "in", header: "Masuk", align: "right", cell: (m) => (m.qty > 0 ? formatNum(m.qty) : "") },
              { key: "out", header: "Keluar", align: "right", cell: (m) => (m.qty < 0 ? formatNum(-m.qty) : "") },
              { key: "bal", header: `Saldo (${sku?.uom})`, align: "right", cell: (m) => <span className="font-semibold">{formatNum(m.balance)}</span> },
            ]}
          />
        </TabsContent>
      </Tabs>
      <ReceiveModal open={receive} onOpenChange={setReceive} />
      <OpnameModal open={opname} onOpenChange={setOpname} />
    </>
  );
}
