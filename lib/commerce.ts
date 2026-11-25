/**
 * Aturan bisnis murni (tanpa React): harga, satuan, ongkir, cut-off, piutang.
 * Rujukan ID aturan mengikuti PRD §9.
 */
import {
  BUNDLES,
  CATEGORIES,
  PRODUCTS,
  STORE,
  ZONES,
  type Address,
  type ClaimReason,
  type ClaimResolution,
  type ClaimStatus,
  type Contract,
  type CustomerType,
  type OrderStatus,
  type PaymentStatus,
  type Product,
  type ShippingZone,
  type Sku,
  type Uom,
} from "./mock-data";
import { wibParts } from "./format";

/* ------------------------------------------------------------------ */
/* Tipe runtime                                                        */
/* ------------------------------------------------------------------ */
export type PriceSource = "kontrak" | "reseller" | "tier" | "retail";

export const PRICE_SOURCE: Record<PriceSource, { label: string; rank: number; description: string }> = {
  kontrak: { label: "Harga Kontrak", rank: 1, description: "Harga terkunci per pelanggan B2B selama periode kontrak" },
  reseller: { label: "Harga Reseller", rank: 2, description: "Untuk akun reseller yang sudah disetujui" },
  tier: { label: "Harga Tier Qty", rank: 3, description: "Potongan bertingkat per baris item" },
  retail: { label: "Harga Retail", rank: 4, description: "Harga dasar storefront" },
};

export interface OrderLine {
  skuId: string;
  productId: string;
  productName: string;
  skuLabel: string;
  uom: Uom;
  qty: number;
  gramsPerUnit: number;
  unitPrice: number;
  priceSource: PriceSource;
  hppUnit: number;
  variantLabel?: string;
}

export interface OrderAddress extends Address {
  zoneId: ShippingZone["id"] | "ARMADA";
}

export interface Order {
  number: string;
  token: string;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  channel: "web" | "manual";
  contractId?: string;
  status: OrderStatus;
  payment: PaymentStatus;
  proofName?: string;
  createdAt: string;
  shipDate: string;
  deliveredAt?: string;
  awb?: string;
  courier: string;
  address: OrderAddress;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  netGrams: number;
  shipGrams: number;
  boxes: number;
  history: { status: OrderStatus; at: string; note?: string }[];
  note?: string;
}

export interface Invoice {
  number: string;
  orderNumber: string;
  customerId: string;
  contractId?: string;
  issuedAt: string;
  dueAt: string;
  total: number;
  payments: { at: string; amount: number; method: "transfer" | "tunai" }[];
}

export interface Claim {
  id: string;
  orderNumber: string;
  createdAt: string;
  reason: ClaimReason;
  items: { skuId: string; qty: number }[];
  photos: string[];
  preferred: ClaimResolution;
  note: string;
  status: ClaimStatus;
  resolution?: ClaimResolution;
  resolvedAt?: string;
  adminNote?: string;
}

export type StockMoveType = "saldo_awal" | "masuk" | "keluar" | "opname" | "penyesuaian";

export interface StockMove {
  id: string;
  skuId: string;
  at: string;
  type: StockMoveType;
  qty: number;
  ref: string;
  note?: string;
  unitCost?: number;
}

/* ------------------------------------------------------------------ */
/* Lookup                                                              */
/* ------------------------------------------------------------------ */
export const productById = (id: string): Product | undefined => PRODUCTS.find((p) => p.id === id);
export const productBySlug = (slug: string): Product | undefined => PRODUCTS.find((p) => p.slug === slug);
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
export const findSku = (skus: Sku[], id: string) => skus.find((s) => s.id === id);

export function productSkus(skus: Sku[], product: Product): Sku[] {
  return product.skuIds.map((id) => findSku(skus, id)).filter((s): s is Sku => Boolean(s));
}

export function productStockGrams(skus: Sku[], product: Product): number {
  return productSkus(skus, product).reduce((sum, s) => sum + s.stock * s.gramsPerUnit, 0);
}

export function productInStock(skus: Sku[], product: Product): boolean {
  return productSkus(skus, product).some((s) => s.stock >= s.minQty);
}

/* ------------------------------------------------------------------ */
/* Satuan & harga                                                      */
/* ------------------------------------------------------------------ */
/** BR-UOM-04: harga per kg diturunkan dari harga per satuan jual */
export function pricePerKg(sku: Pick<Sku, "gramsPerUnit">, price: number): number {
  return Math.round(price / (sku.gramsPerUnit / 1000));
}

export function unitNoun(sku: Pick<Sku, "uom">): string {
  return sku.uom === "kg" ? "kg" : sku.uom;
}

/** "per 500 g" | "per kg" | "per karton (12 pack · 6 kg)" */
export function perUnitLabel(sku: Sku): string {
  if (sku.uom === "kg") return "per kg";
  if (sku.uom === "karton") return `per karton (${sku.packsPerUnit} pack · ${sku.gramsPerUnit / 1000} kg)`;
  return `per pack ${sku.label}`;
}

export interface PriceContext {
  customerType: CustomerType;
  contract?: Contract;
}

export interface ResolvedPrice {
  price: number;
  source: PriceSource;
}

/** BR-PRC-01: kontrak aktif > reseller > tier qty > retail */
export function resolvePrice(sku: Sku, qty: number, ctx: PriceContext): ResolvedPrice {
  const contractItem =
    ctx.contract && ctx.contract.status === "aktif"
      ? ctx.contract.items.find((i) => i.skuId === sku.id)
      : undefined;
  if (contractItem) return { price: contractItem.price, source: "kontrak" };
  if (ctx.customerType === "reseller") return { price: sku.resellerPrice, source: "reseller" };
  // BR-PRC-02/06: tier per baris, pilih yang paling murah untuk pelanggan
  const tier = sku.tiers
    .filter((t) => qty >= t.minQty)
    .sort((a, b) => a.price - b.price)[0];
  if (tier && tier.price < sku.price) return { price: tier.price, source: "tier" };
  return { price: sku.price, source: "retail" };
}

/** BR-UOM-05: pembulatan qty */
export function normalizeQty(sku: Pick<Sku, "step" | "minQty">, qty: number): number {
  const stepped = Math.round(qty / sku.step) * sku.step;
  return Math.max(sku.minQty, Number(stepped.toFixed(2)));
}

/* ------------------------------------------------------------------ */
/* Waktu, cut-off & slot kirim                                         */
/* ------------------------------------------------------------------ */
export type ClockMode = "real" | "pagi" | "sore";

/** Tanggal demo tetap (25 Nov 2026), jam mengikuti WIB asli atau simulasi. */
export function getNow(mode: ClockMode): Date {
  if (mode === "pagi") return new Date(`${STORE.demoDate}T10:00:00+07:00`);
  if (mode === "sore") return new Date(`${STORE.demoDate}T15:30:00+07:00`);
  const p = wibParts(new Date());
  const hh = String(p.h).padStart(2, "0");
  const mm = String(p.min).padStart(2, "0");
  return new Date(`${STORE.demoDate}T${hh}:${mm}:00+07:00`);
}

export function dateKey(d: Date): string {
  const p = wibParts(d);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return dateKey(d);
}

export function weekday(key: string): number {
  return new Date(`${key}T12:00:00+07:00`).getUTCDay();
}

export function daysBetween(fromKey: string, toKey: string): number {
  const a = new Date(`${fromKey}T12:00:00+07:00`).getTime();
  const b = new Date(`${toKey}T12:00:00+07:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** menit tersisa ke cut-off 14.00 (negatif jika sudah lewat) */
export function minutesToCutoff(now: Date): number {
  const p = wibParts(now);
  return STORE.cutoffHour * 60 - (p.h * 60 + p.min);
}

export interface ShipSlot {
  date: string;
  arriveFrom: string;
  arriveTo: string;
  isToday: boolean;
}

/** Tambah hari kerja transit (kurir tidak mengantar hari Minggu) */
function addTransitDays(key: string, n: number): string {
  let d = key;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    if (weekday(d) !== 0) left -= 1;
  }
  return d;
}

/** BR-ORD-01: order setelah cut-off dikirim hari kirim berikutnya. */
export function shipSlots(now: Date, zone: ShippingZone, count = 3): ShipSlot[] {
  const today = dateKey(now);
  let cursor = minutesToCutoff(now) > 0 ? today : addDays(today, 1);
  const slots: ShipSlot[] = [];
  let guard = 0;
  while (slots.length < count && guard < 21) {
    if (zone.shipDays.includes(weekday(cursor))) {
      slots.push({
        date: cursor,
        arriveFrom: addTransitDays(cursor, zone.transitMin),
        arriveTo: addTransitDays(cursor, zone.transitMax),
        isToday: cursor === today,
      });
    }
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return slots;
}

/* ------------------------------------------------------------------ */
/* Ongkir & berat                                                      */
/* ------------------------------------------------------------------ */
export function zoneForPostal(postal: string): ShippingZone | undefined {
  const clean = postal.replace(/\D/g, "");
  if (clean.length !== 5) return undefined;
  return ZONES.find((z) => z.postalPrefixes.includes(clean.slice(0, 2)));
}

export const zoneById = (id: string) => ZONES.find((z) => z.id === id);

/** BR-ORD-04: berat kirim = bersih + kemasan + box & ice gel, dibulatkan ke atas per 0,5 kg */
export function shippingWeight(netGrams: number, packagingGrams = 0) {
  if (netGrams <= 0) return { boxes: 0, shipGrams: 0 };
  const boxes = Math.max(1, Math.ceil(netGrams / STORE.boxCapacityGrams));
  const raw = netGrams + packagingGrams + boxes * STORE.boxTareGrams;
  const shipGrams = Math.ceil(raw / 500) * 500;
  return { boxes, shipGrams };
}

export function shippingFee(shipGrams: number, zone: ShippingZone): number {
  if (shipGrams <= 0) return 0;
  const kg = shipGrams / 1000;
  return zone.baseFee + Math.max(0, Math.ceil(kg - zone.baseKg)) * zone.perKg;
}

/* ------------------------------------------------------------------ */
/* Keranjang                                                           */
/* ------------------------------------------------------------------ */
export interface CartLine {
  key: string;
  skuId: string;
  qty: number;
  variantId?: string;
}

export interface CartRow {
  line: CartLine;
  sku: Sku;
  product: Product;
  unitPrice: number;
  source: PriceSource;
  subtotal: number;
  netGrams: number;
  packagingGrams: number;
  overStock: boolean;
  variantLabel?: string;
}

export function cartRows(lines: CartLine[], skus: Sku[], ctx: PriceContext): CartRow[] {
  return lines
    .map((line): CartRow | null => {
      const sku = findSku(skus, line.skuId);
      const product = sku ? productById(sku.productId) : undefined;
      if (!sku || !product) return null;
      const { price, source } = resolvePrice(sku, line.qty, ctx);
      const variantLabel = product.variants?.find((v) => v.id === line.variantId)?.label;
      return {
        line,
        sku,
        product,
        unitPrice: price,
        source,
        subtotal: Math.round(price * line.qty),
        netGrams: sku.gramsPerUnit * line.qty,
        packagingGrams: sku.packagingGrams * Math.ceil(line.qty),
        overStock: line.qty > sku.stock,
        variantLabel,
      };
    })
    .filter((r): r is CartRow => r !== null);
}

export function cartTotals(rows: CartRow[]) {
  const subtotal = rows.reduce((s, r) => s + r.subtotal, 0);
  const netGrams = rows.reduce((s, r) => s + r.netGrams, 0);
  const packagingGrams = rows.reduce((s, r) => s + r.packagingGrams, 0);
  const { boxes, shipGrams } = shippingWeight(netGrams, packagingGrams);
  const units = rows.reduce((s, r) => s + (r.sku.uom === "kg" ? 1 : r.line.qty), 0);
  return { subtotal, netGrams, packagingGrams, boxes, shipGrams, units };
}

/** BR-ORD-02: minimum Rp 100.000 ATAU berat bersih 2 kg */
export function minOrderStatus(subtotal: number, netGrams: number) {
  const valueRemaining = Math.max(0, STORE.minOrderValue - subtotal);
  const gramsRemaining = Math.max(0, STORE.minOrderGrams - netGrams);
  const ok = valueRemaining === 0 || gramsRemaining === 0;
  const progress = Math.min(1, Math.max(subtotal / STORE.minOrderValue, netGrams / STORE.minOrderGrams));
  return { ok, valueRemaining, gramsRemaining, progress };
}

/* ------------------------------------------------------------------ */
/* Order status                                                        */
/* ------------------------------------------------------------------ */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  dibayar: "Dibayar",
  diproses: "Diproses",
  siap_kirim: "Siap Kirim",
  dikirim: "Dikirim",
  selesai: "Selesai",
  klaim: "Klaim Diajukan",
  refund: "Refund",
  dibatalkan: "Dibatalkan",
};

/** §10.3 — transisi yang diizinkan dari back-office */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  menunggu_pembayaran: ["dibayar", "dibatalkan"],
  dibayar: ["diproses", "dibatalkan"],
  diproses: ["siap_kirim"],
  siap_kirim: ["dikirim"],
  dikirim: ["selesai"],
};

export const TIMELINE_STEPS: OrderStatus[] = [
  "menunggu_pembayaran",
  "dibayar",
  "diproses",
  "siap_kirim",
  "dikirim",
  "selesai",
];

export function paymentDeadline(order: Pick<Order, "createdAt">): Date {
  return new Date(new Date(order.createdAt).getTime() + STORE.paymentWindowHours * 3_600_000);
}

/** BR-RTR-01: klaim maksimal 6 jam setelah diterima */
export function claimWindow(order: Pick<Order, "status" | "deliveredAt">, now: Date) {
  if (order.status !== "selesai" || !order.deliveredAt) return { open: false, minutesLeft: 0 };
  const end = new Date(order.deliveredAt).getTime() + STORE.claimWindowHours * 3_600_000;
  const minutesLeft = Math.floor((end - now.getTime()) / 60_000);
  return { open: minutesLeft > 0, minutesLeft };
}

/* ------------------------------------------------------------------ */
/* Piutang                                                             */
/* ------------------------------------------------------------------ */
export function invoicePaid(inv: Invoice): number {
  return inv.payments.reduce((s, p) => s + p.amount, 0);
}

export function invoiceBalance(inv: Invoice): number {
  return Math.max(0, inv.total - invoicePaid(inv));
}

export function invoiceStatus(inv: Invoice, today: string): "lunas" | "jatuh_tempo" | "sebagian" | "belum_bayar" {
  const balance = invoiceBalance(inv);
  if (balance === 0) return "lunas";
  if (daysBetween(inv.dueAt, today) > 0) return "jatuh_tempo";
  return invoicePaid(inv) > 0 ? "sebagian" : "belum_bayar";
}

export const AGING_BUCKETS = [
  { id: "current", label: "Belum jatuh tempo" },
  { id: "1-7", label: "1–7 hari" },
  { id: "8-14", label: "8–14 hari" },
  { id: "15-30", label: "15–30 hari" },
  { id: "31-60", label: "31–60 hari" },
  { id: "60+", label: "> 60 hari" },
] as const;

export type AgingBucket = (typeof AGING_BUCKETS)[number]["id"];

export function agingBucket(inv: Invoice, today: string): AgingBucket {
  const late = daysBetween(inv.dueAt, today);
  if (late <= 0) return "current";
  if (late <= 7) return "1-7";
  if (late <= 14) return "8-14";
  if (late <= 30) return "15-30";
  if (late <= 60) return "31-60";
  return "60+";
}

/** BR-B2B-06: eksposur = sisa invoice + call-off yang belum ditagihkan */
export function creditExposure(customerId: string, invoices: Invoice[], orders: Order[]) {
  const invoiced = invoices
    .filter((i) => i.customerId === customerId)
    .reduce((s, i) => s + invoiceBalance(i), 0);
  const invoicedOrders = new Set(invoices.map((i) => i.orderNumber));
  const open = orders
    .filter(
      (o) =>
        o.customerId === customerId &&
        o.payment === "tempo" &&
        !invoicedOrders.has(o.number) &&
        !["dibatalkan", "refund"].includes(o.status),
    )
    .reduce((s, o) => s + o.total, 0);
  return { invoiced, open, total: invoiced + open };
}

export function overdueInvoices(customerId: string, invoices: Invoice[], today: string) {
  return invoices.filter(
    (i) => i.customerId === customerId && invoiceBalance(i) > 0 && daysBetween(i.dueAt, today) > 0,
  );
}

export function quotaLeftGrams(item: { quotaGrams: number; usedGrams: number }) {
  return Math.max(0, item.quotaGrams - item.usedGrams);
}

/* ------------------------------------------------------------------ */
/* Stok                                                                */
/* ------------------------------------------------------------------ */
export function movingAverage(oldQty: number, oldCost: number, inQty: number, inUnitCost: number, freight: number) {
  const totalQty = oldQty + inQty;
  if (totalQty <= 0) return oldCost;
  return Math.round((oldQty * oldCost + inQty * inUnitCost + freight) / totalQty);
}

export type StockLevel = "habis" | "menipis" | "aman";

export function stockLevel(sku: Pick<Sku, "stock" | "minStock" | "minQty">): StockLevel {
  if (sku.stock < sku.minQty) return "habis";
  if (sku.stock <= sku.minStock) return "menipis";
  return "aman";
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/* Bundling                                                            */
/* ------------------------------------------------------------------ */

export function bundleRegularPrice(bundle: (typeof BUNDLES)[number], skus: Sku[]) {
  return bundle.items.reduce((s, i) => s + (findSku(skus, i.skuId)?.price ?? 0) * i.qty, 0);
}

/** Potongan paket untuk pelanggan retail: per set lengkap di keranjang */
export function bundleDiscount(lines: CartLine[], skus: Sku[], customerType: CustomerType) {
  if (customerType !== "retail") return { discount: 0, applied: [] as { id: string; name: string; sets: number; saving: number }[] };
  const qtyOf = (skuId: string) => lines.filter((l) => l.skuId === skuId).reduce((a, l) => a + l.qty, 0);
  const used: Record<string, number> = {};
  const applied: { id: string; name: string; sets: number; saving: number }[] = [];
  for (const b of BUNDLES) {
    const sets = Math.min(...b.items.map((i) => Math.floor((qtyOf(i.skuId) - (used[i.skuId] ?? 0)) / i.qty)));
    if (sets > 0) {
      b.items.forEach((i) => (used[i.skuId] = (used[i.skuId] ?? 0) + i.qty * sets));
      const saving = (bundleRegularPrice(b, skus) - b.price) * sets;
      if (saving > 0) applied.push({ id: b.id, name: b.name, sets, saving });
    }
  }
  return { discount: applied.reduce((s, a) => s + a.saving, 0), applied };
}
