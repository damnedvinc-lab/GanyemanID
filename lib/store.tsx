"use client";

/**
 * State aplikasi prototype (client-only, disimpan di localStorage).
 * Semua layar membaca harga/stok dari sini → konsisten antar storefront & admin.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  CONTRACTS,
  SKUS,
  STORE,
  type CashEntry,
  type ClaimReason,
  type ClaimResolution,
  type Contract,
  type OrderStatus,
  type Sku,
} from "./mock-data";
import {
  NEXT_STATUS,
  addDays,
  bundleDiscount,
  creditExposure,
  dateKey,
  findSku,
  getNow,
  movingAverage,
  overdueInvoices,
  quotaLeftGrams,
  shippingFee,
  uid,
  zoneForPostal,
  type CartLine,
  type Claim,
  type ClockMode,
  type Invoice,
  type Order,
  type OrderAddress,
  type StockMove,
} from "./commerce";
import {
  buildLines,
  buildSeedCash,
  buildSeedClaims,
  buildSeedInvoices,
  buildSeedLedger,
  buildSeedOrders,
  customerById,
  linesTotals,
} from "./seed";

export type AdminRole = "owner" | "admin_order" | "admin_gudang" | "finance";
export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Owner",
  admin_order: "Admin Order/CS",
  admin_gudang: "Admin Gudang",
  finance: "Finance",
};

export type DemoView = "normal" | "empty" | "loading";
export type ViewerId = "c-rani" | "c-sejahtera";

export interface PriceLogEntry {
  at: string;
  skuId: string;
  field: "price" | "resellerPrice";
  from: number;
  to: number;
  by: string;
  reason?: string;
}

interface AppState {
  version: number;
  skus: Sku[];
  contracts: Contract[];
  orders: Order[];
  invoices: Invoice[];
  claims: Claim[];
  ledger: StockMove[];
  cash: CashEntry[];
  priceLog: PriceLogEntry[];
  cart: CartLine[];
  admin: { authed: boolean; role: AdminRole };
  demo: { view: DemoView; clock: ClockMode; viewer: ViewerId };
}

const STORAGE_KEY = "ufrost:v1";
const VERSION = 3;

function initialState(): AppState {
  const now = getNow("real");
  const orders = buildSeedOrders(now);
  return {
    version: VERSION,
    skus: SKUS.map((s) => ({ ...s, tiers: [...s.tiers] })),
    contracts: CONTRACTS.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) })),
    orders,
    invoices: buildSeedInvoices(orders),
    claims: buildSeedClaims(),
    ledger: buildSeedLedger(),
    cash: buildSeedCash(orders),
    priceLog: [
      { at: "2026-11-10T09:00:00+07:00", skuId: "UDK-500", field: "price", from: 72_000, to: 75_000, by: "Owner", reason: "Harga beli vendor naik" },
      { at: "2026-11-02T10:30:00+07:00", skuId: "NGA-500", field: "resellerPrice", from: 29_500, to: 29_000, by: "Owner", reason: "Promo reseller Q4" },
    ],
    cart: [],
    admin: { authed: false, role: "owner" },
    demo: { view: "normal", clock: "real", viewer: "c-rani" },
  };
}

export interface CallOffInput {
  contractId: string;
  shipDate: string;
  items: { skuId: string; qty: number }[];
}

export interface CallOffCheck {
  ok: boolean;
  errors: string[];
  total: number;
  lines: { skuId: string; qty: number; grams: number; leftGrams: number; overQuota: boolean; overStock: boolean; price: number }[];
  exposure: number;
  limit: number;
}

export function checkCallOff(state: Pick<AppState, "contracts" | "skus" | "invoices" | "orders">, input: CallOffInput, today: string): CallOffCheck {
  const contract = state.contracts.find((c) => c.id === input.contractId);
  const errors: string[] = [];
  if (!contract) return { ok: false, errors: ["Kontrak tidak ditemukan"], total: 0, lines: [], exposure: 0, limit: 0 };
  if (contract.status !== "aktif") errors.push("Kontrak tidak aktif — call-off hanya untuk kontrak berstatus Aktif.");
  const lines = input.items
    .filter((i) => i.qty > 0)
    .map((i) => {
      const sku = findSku(state.skus, i.skuId)!;
      const item = contract.items.find((x) => x.skuId === i.skuId)!;
      const grams = i.qty * sku.gramsPerUnit;
      const leftGrams = quotaLeftGrams(item);
      return {
        skuId: i.skuId,
        qty: i.qty,
        grams,
        leftGrams,
        overQuota: grams > leftGrams,
        overStock: i.qty > sku.stock,
        price: item.price,
      };
    });
  if (lines.length === 0) errors.push("Isi qty minimal satu item.");
  for (const l of lines) {
    const sku = findSku(state.skus, l.skuId)!;
    if (l.overQuota)
      errors.push(`Kuota ${sku.code} tidak cukup: diminta ${l.grams / 1000} kg, sisa ${l.leftGrams / 1000} kg. Buat addendum kontrak untuk menambah kuota.`);
    if (l.overStock) errors.push(`Stok ${sku.code} tidak cukup: diminta ${l.qty}, tersedia ${sku.stock}.`);
  }
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const exposure = creditExposure(contract.customerId, state.invoices, state.orders).total;
  if (exposure + total > contract.creditLimit && total > 0)
    errors.push("Credit limit terlampaui — perlu approval Owner sebelum call-off dibuat.");
  const overdue = overdueInvoices(contract.customerId, state.invoices, today);
  if (overdue.length > 0)
    errors.push(`Ada ${overdue.length} invoice lewat jatuh tempo (${overdue.map((i) => i.number).join(", ")}). Order baru diblokir sampai dilunasi.`);
  return { ok: errors.length === 0, errors, total, lines, exposure, limit: contract.creditLimit };
}

interface Actions {
  addToCart: (skuId: string, qty: number, variantId?: string) => { ok: boolean; message: string };
  setCartQty: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  placeOrder: (input: { address: OrderAddress; shipDate: string; proofName?: string; note?: string }) => Order;
  uploadProof: (number: string, fileName: string) => void;
  verifyPayment: (number: string) => void;
  setOrderStatus: (number: string, to: OrderStatus, opts?: { awb?: string; note?: string }) => { ok: boolean; message: string };
  createCallOff: (input: CallOffInput) => { ok: boolean; errors: string[]; order?: Order };
  submitClaim: (input: { orderNumber: string; items: { skuId: string; qty: number }[]; reason: ClaimReason; photos: string[]; preferred: ClaimResolution; note: string }) => Claim;
  resolveClaim: (id: string, decision: ClaimResolution | "tolak", note?: string) => void;
  receiveStock: (input: { skuId: string; qty: number; unitCost: number; freight: number; supplier: string }) => void;
  saveOpname: (entries: { skuId: string; physical: number; reason: string }[]) => string;
  updatePrice: (skuId: string, field: "price" | "resellerPrice", value: number, reason?: string) => void;
  updateSku: (skuId: string, patch: Partial<Pick<Sku, "minStock" | "packagingGrams" | "dimensions" | "gramsPerUnit" | "packsPerUnit">>) => void;
  recordInvoicePayment: (number: string, amount: number, method: "transfer" | "tunai") => void;
  login: (role: AdminRole) => void;
  logout: () => void;
  setDemo: (patch: Partial<AppState["demo"]>) => void;
  resetAll: () => void;
}

interface AppContextValue extends Actions {
  state: AppState;
  hydrated: boolean;
  now: Date;
  today: string;
  cartBump: number;
  viewer: NonNullable<ReturnType<typeof customerById>>;
}

const AppContext = createContext<AppContextValue | null>(null);

function nextNumber(existing: string[], prefix: string, pad = 3) {
  const max = existing
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length).replace(/\D/g, "")) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}

function tokenFor(number: string) {
  let h = 0;
  for (const ch of number) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${number.toLowerCase()}-${h.toString(36).slice(0, 5)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [cartBump, setCartBump] = useState(0);
  const [now, setNow] = useState<Date>(() => getNow("real"));
  const stateRef = useRef(state);
  stateRef.current = state;

  // Muat dari localStorage (gagal → tetap pakai seed)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed.version === VERSION) setState(parsed);
      }
    } catch {
      /* storage tidak tersedia */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* abaikan */
    }
  }, [state, hydrated]);

  // Jam demo
  useEffect(() => {
    setNow(getNow(state.demo.clock));
    if (state.demo.clock !== "real") return;
    const id = window.setInterval(() => setNow(getNow("real")), 30_000);
    return () => window.clearInterval(id);
  }, [state.demo.clock]);

  const today = dateKey(now);
  const viewer = customerById(state.demo.viewer)!;

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const actions = useMemo<Actions>(() => {
    const stamp = () => getNow(stateRef.current.demo.clock).toISOString();

    const api: Actions = {
      addToCart(skuId, qty, variantId) {
        const s = stateRef.current;
        const sku = findSku(s.skus, skuId);
        if (!sku) return { ok: false, message: "Produk tidak ditemukan" };
        if (sku.stock < sku.minQty) return { ok: false, message: "Stok habis" };
        const key = variantId ? `${skuId}:${variantId}` : skuId;
        const inCart = s.cart.filter((l) => l.skuId === skuId).reduce((a, l) => a + l.qty, 0);
        if (inCart + qty > sku.stock) {
          return { ok: false, message: `Stok tersisa ${sku.stock} ${sku.uom}, ${inCart} sudah di keranjang` };
        }
        update((st) => {
          const existing = st.cart.find((l) => l.key === key);
          const cart = existing
            ? st.cart.map((l) => (l.key === key ? { ...l, qty: Number((l.qty + qty).toFixed(2)) } : l))
            : [...st.cart, { key, skuId, qty, variantId }];
          return { ...st, cart };
        });
        setCartBump((n) => n + 1);
        return { ok: true, message: "Ditambahkan ke keranjang" };
      },
      setCartQty(key, qty) {
        update((st) => ({ ...st, cart: st.cart.map((l) => (l.key === key ? { ...l, qty } : l)) }));
      },
      removeFromCart(key) {
        update((st) => ({ ...st, cart: st.cart.filter((l) => l.key !== key) }));
      },
      clearCart() {
        update((st) => ({ ...st, cart: [] }));
      },
      placeOrder({ address, shipDate, proofName, note }) {
        const s = stateRef.current;
        const customer = customerById(s.demo.viewer)!;
        const lines = buildLines(s.cart, s.skus, customer.type);
        const t = linesTotals(lines, s.skus);
        const zone = zoneForPostal(address.postal);
        const shipping = zone ? shippingFee(t.shipGrams, zone) : 0;
        const { discount } = bundleDiscount(s.cart, s.skus, customer.type);
        const at = stamp();
        const prefix = `UF-${today.slice(2).replace(/-/g, "")}-`;
        const number = nextNumber(s.orders.map((o) => o.number), prefix);
        const order: Order = {
          number,
          token: tokenFor(number),
          customerId: customer.id,
          customerName: customer.name,
          customerType: customer.type,
          channel: "web",
          status: "menunggu_pembayaran",
          payment: proofName ? "menunggu_verifikasi" : "belum",
          proofName,
          createdAt: at,
          shipDate,
          courier: "Kurir berpendingin rekanan",
          address,
          lines,
          subtotal: t.subtotal,
          discount,
          shipping,
          total: t.subtotal - discount + shipping,
          netGrams: t.netGrams,
          shipGrams: t.shipGrams,
          boxes: t.boxes,
          note,
          history: [
            {
              status: "menunggu_pembayaran",
              at,
              note: proofName ? "Bukti transfer diunggah saat checkout" : "Menunggu transfer",
            },
          ],
        };
        update((st) => ({ ...st, orders: [order, ...st.orders], cart: [] }));
        return order;
      },
      uploadProof(number, fileName) {
        const at = stamp();
        update((st) => ({
          ...st,
          orders: st.orders.map((o) =>
            o.number === number
              ? {
                  ...o,
                  proofName: fileName,
                  payment: "menunggu_verifikasi",
                  history: [...o.history, { status: o.status, at, note: `Bukti transfer diunggah (${fileName})` }],
                }
              : o,
          ),
        }));
      },
      verifyPayment(number) {
        const at = stamp();
        update((st) => {
          const order = st.orders.find((o) => o.number === number);
          if (!order || order.status !== "menunggu_pembayaran") return st;
          // BR-STK-02: reservasi stok saat pembayaran terverifikasi
          const skus = st.skus.map((sku) => {
            const qty = order.lines.filter((l) => l.skuId === sku.id).reduce((a, l) => a + l.qty, 0);
            return qty ? { ...sku, stock: Number((sku.stock - qty).toFixed(2)) } : sku;
          });
          const moves: StockMove[] = order.lines.map((l) => ({
            id: uid("mv"), skuId: l.skuId, at, type: "keluar", qty: -l.qty, ref: order.number, note: "Reservasi saat dibayar",
          }));
          const cash: CashEntry = {
            id: uid("cs"), date: dateKey(new Date(at)), time: at.slice(11, 16), direction: "in", category: "transfer",
            description: `Transfer ${order.customerName}`, ref: order.number, amount: order.total,
          };
          return {
            ...st,
            skus,
            ledger: [...st.ledger, ...moves],
            cash: [...st.cash, cash],
            orders: st.orders.map((o) =>
              o.number === number
                ? {
                    ...o,
                    status: "dibayar",
                    payment: "terverifikasi",
                    history: [...o.history, { status: "dibayar", at, note: `Transfer ${STORE.bank.name} cocok: nominal, tanggal & nama pengirim` }],
                  }
                : o,
            ),
          };
        });
      },
      setOrderStatus(number, to, opts) {
        const s = stateRef.current;
        const order = s.orders.find((o) => o.number === number);
        if (!order) return { ok: false, message: "Order tidak ditemukan" };
        const allowed = NEXT_STATUS[order.status] ?? [];
        if (!allowed.includes(to)) return { ok: false, message: "Transisi status tidak diizinkan" };
        if (to === "dibayar") {
          api.verifyPayment(number);
          return { ok: true, message: "Pembayaran terverifikasi" };
        }
        if (to === "dikirim" && order.courier !== "Armada U-Frost" && !opts?.awb && !order.awb) {
          return { ok: false, message: "Isi nomor resi (AWB) sebelum menandai Dikirim" };
        }
        const at = stamp();
        update((st) => {
          let invoices = st.invoices;
          let note = opts?.note;
          let skus = st.skus;
          let ledger = st.ledger;
          if (to === "dikirim" && order.payment === "tempo" && !st.invoices.some((i) => i.orderNumber === number)) {
            const contract = st.contracts.find((c) => c.id === order.contractId);
            const invNumber = nextNumber(st.invoices.map((i) => i.number), "INV-2026-", 4);
            const issued = dateKey(new Date(at));
            invoices = [
              ...st.invoices,
              {
                number: invNumber,
                orderNumber: number,
                customerId: order.customerId,
                contractId: order.contractId,
                issuedAt: issued,
                dueAt: addDays(issued, contract?.termDays ?? 14),
                total: order.total,
                payments: [],
              },
            ];
            note = `Invoice ${invNumber} terbit`;
          }
          if (to === "dibatalkan" && order.status === "dibayar") {
            skus = st.skus.map((sku) => {
              const qty = order.lines.filter((l) => l.skuId === sku.id).reduce((a, l) => a + l.qty, 0);
              return qty ? { ...sku, stock: sku.stock + qty } : sku;
            });
            ledger = [
              ...st.ledger,
              ...order.lines.map((l) => ({ id: uid("mv"), skuId: l.skuId, at, type: "masuk" as const, qty: l.qty, ref: order.number, note: "Reservasi dilepas (order batal)" })),
            ];
          }
          return {
            ...st,
            skus,
            ledger,
            invoices,
            orders: st.orders.map((o) =>
              o.number === number
                ? {
                    ...o,
                    status: to,
                    awb: opts?.awb ?? o.awb,
                    deliveredAt: to === "selesai" ? at : o.deliveredAt,
                    history: [...o.history, { status: to, at, note }],
                  }
                : o,
            ),
          };
        });
        return { ok: true, message: "Status diperbarui" };
      },
      createCallOff(input) {
        const s = stateRef.current;
        const check = checkCallOff(s, input, dateKey(getNow(s.demo.clock)));
        if (!check.ok) return { ok: false, errors: check.errors };
        const contract = s.contracts.find((c) => c.id === input.contractId)!;
        const customer = customerById(contract.customerId)!;
        const items = input.items.filter((i) => i.qty > 0);
        const lines = buildLines(items, s.skus, "b2b", contract);
        const t = linesTotals(lines, s.skus);
        const address = customer.addresses[0];
        const zone = zoneForPostal(address.postal);
        const ownFleet = contract.delivery.startsWith("Armada");
        const shipping = ownFleet || !zone ? 0 : shippingFee(t.shipGrams, zone);
        const at = stamp();
        const prefix = `UF-${dateKey(new Date(at)).slice(2).replace(/-/g, "")}-`;
        const number = nextNumber(s.orders.map((o) => o.number), prefix);
        const order: Order = {
          number,
          token: tokenFor(number),
          customerId: customer.id,
          customerName: customer.name,
          customerType: "b2b",
          channel: "manual",
          contractId: contract.id,
          status: "diproses",
          payment: "tempo",
          createdAt: at,
          shipDate: input.shipDate,
          courier: ownFleet ? "Armada U-Frost" : "Kurir berpendingin rekanan",
          address: { ...address, zoneId: ownFleet ? "ARMADA" : (zone?.id ?? "Z1") },
          lines,
          subtotal: t.subtotal,
          discount: 0,
          shipping,
          total: t.subtotal + shipping,
          netGrams: t.netGrams,
          shipGrams: t.shipGrams,
          boxes: t.boxes,
          history: [{ status: "diproses", at, note: `Call-off ${contract.number} dibuat admin` }],
        };
        update((st) => ({
          ...st,
          orders: [order, ...st.orders],
          // BR-B2B-02: kuota berkurang saat call-off dibuat
          contracts: st.contracts.map((c) =>
            c.id === contract.id
              ? {
                  ...c,
                  items: c.items.map((ci) => {
                    const l = items.find((i) => i.skuId === ci.skuId);
                    const sku = findSku(st.skus, ci.skuId)!;
                    return l ? { ...ci, usedGrams: ci.usedGrams + l.qty * sku.gramsPerUnit } : ci;
                  }),
                }
              : c,
          ),
          skus: st.skus.map((sku) => {
            const l = items.find((i) => i.skuId === sku.id);
            return l ? { ...sku, stock: sku.stock - l.qty } : sku;
          }),
          ledger: [
            ...st.ledger,
            ...items.map((i) => ({ id: uid("mv"), skuId: i.skuId, at, type: "keluar" as const, qty: -i.qty, ref: number, note: `Call-off ${contract.number}` })),
          ],
        }));
        return { ok: true, errors: [], order };
      },
      submitClaim(input) {
        const s = stateRef.current;
        const at = stamp();
        const id = nextNumber(s.claims.map((c) => c.id), "KLM-2026-", 4);
        const claim: Claim = { id, createdAt: at, status: "diajukan", ...input };
        update((st) => ({
          ...st,
          claims: [claim, ...st.claims],
          orders: st.orders.map((o) =>
            o.number === input.orderNumber
              ? { ...o, status: "klaim", history: [...o.history, { status: "klaim", at, note: `Klaim ${id} diajukan` }] }
              : o,
          ),
        }));
        return claim;
      },
      resolveClaim(id, decision, note) {
        const at = stamp();
        update((st) => {
          const claim = st.claims.find((c) => c.id === id);
          if (!claim) return st;
          const order = st.orders.find((o) => o.number === claim.orderNumber)!;
          const value = claim.items.reduce((sum, it) => {
            const line = order.lines.find((l) => l.skuId === it.skuId);
            return sum + (line ? line.unitPrice * it.qty : 0);
          }, 0);
          let orders = st.orders;
          let cash = st.cash;
          let skus = st.skus;
          let ledger = st.ledger;
          if (decision === "refund") {
            orders = orders.map((o) =>
              o.number === order.number
                ? { ...o, status: "refund", history: [...o.history, { status: "refund", at, note: `Refund ${id} disetujui` }] }
                : o,
            );
            cash = [
              ...cash,
              { id: uid("cs"), date: dateKey(new Date(at)), time: at.slice(11, 16), direction: "out", category: "refund", description: `Refund klaim ${id} · ${order.customerName}`, ref: id, amount: value },
            ];
          } else if (decision === "ganti") {
            // FR-RTR-005: order pengganti nilai 0 + pengurangan stok
            const prefix = `UF-${dateKey(new Date(at)).slice(2).replace(/-/g, "")}-`;
            const number = nextNumber(st.orders.map((o) => o.number), prefix);
            const lines = order.lines
              .filter((l) => claim.items.some((i) => i.skuId === l.skuId))
              .map((l) => ({ ...l, qty: claim.items.find((i) => i.skuId === l.skuId)!.qty, unitPrice: 0 }));
            const replacement: Order = {
              ...order,
              number,
              token: tokenFor(number),
              status: "diproses",
              payment: "terverifikasi",
              createdAt: at,
              shipDate: dateKey(new Date(at)),
              deliveredAt: undefined,
              awb: undefined,
              lines,
              subtotal: 0,
              shipping: 0,
              total: 0,
              netGrams: lines.reduce((s2, l) => s2 + l.gramsPerUnit * l.qty, 0),
              note: `Pengganti klaim ${id} (nilai Rp 0)`,
              history: [{ status: "diproses", at, note: `Order pengganti untuk ${order.number}` }],
            };
            orders = [
              replacement,
              ...orders.map((o) =>
                o.number === order.number
                  ? { ...o, status: "selesai" as const, history: [...o.history, { status: "selesai" as const, at, note: `Klaim ${id}: ganti barang via ${number}` }] }
                  : o,
              ),
            ];
            skus = skus.map((sku) => {
              const it = claim.items.find((i) => i.skuId === sku.id);
              return it ? { ...sku, stock: Math.max(0, sku.stock - it.qty) } : sku;
            });
            ledger = [
              ...ledger,
              ...claim.items.map((i) => ({ id: uid("mv"), skuId: i.skuId, at, type: "keluar" as const, qty: -i.qty, ref: number, note: `Ganti barang ${id}` })),
            ];
          } else {
            orders = orders.map((o) =>
              o.number === order.number
                ? { ...o, status: "selesai", history: [...o.history, { status: "selesai", at, note: `Klaim ${id} ditolak` }] }
                : o,
            );
          }
          return {
            ...st,
            orders,
            cash,
            skus,
            ledger,
            claims: st.claims.map((c) =>
              c.id === id
                ? {
                    ...c,
                    status: decision === "tolak" ? "ditolak" : "disetujui",
                    resolution: decision === "tolak" ? undefined : decision,
                    resolvedAt: at,
                    adminNote: note,
                  }
                : c,
            ),
          };
        });
      },
      receiveStock({ skuId, qty, unitCost, freight, supplier }) {
        const at = stamp();
        update((st) => {
          const ref = nextNumber(st.ledger.filter((m) => m.ref.startsWith("GRN-")).map((m) => m.ref), "GRN-2026-", 3);
          return {
            ...st,
            skus: st.skus.map((s) =>
              s.id === skuId
                ? { ...s, stock: Number((s.stock + qty).toFixed(2)), hpp: movingAverage(s.stock, s.hpp, qty, unitCost, freight) }
                : s,
            ),
            ledger: [
              ...st.ledger,
              { id: uid("mv"), skuId, at, type: "masuk", qty, ref, note: `Penerimaan dari ${supplier}`, unitCost: Math.round(unitCost + freight / qty) },
            ],
          };
        });
      },
      saveOpname(entries) {
        const s = stateRef.current;
        const at = stamp();
        const ref = nextNumber(s.ledger.filter((m) => m.ref.startsWith("OPN-")).map((m) => m.ref), "OPN-2026-", 3);
        update((st) => {
          const moves: StockMove[] = [];
          const skus = st.skus.map((sku) => {
            const e = entries.find((x) => x.skuId === sku.id);
            if (!e) return sku;
            const diff = Number((e.physical - sku.stock).toFixed(2));
            if (diff === 0) return sku;
            moves.push({ id: uid("mv"), skuId: sku.id, at, type: "opname", qty: diff, ref, note: e.reason });
            return { ...sku, stock: e.physical };
          });
          return { ...st, skus, ledger: [...st.ledger, ...moves] };
        });
        return ref;
      },
      updatePrice(skuId, field, value, reason) {
        const at = stamp();
        update((st) => {
          const sku = findSku(st.skus, skuId);
          if (!sku || sku[field] === value) return st;
          return {
            ...st,
            skus: st.skus.map((s) => (s.id === skuId ? { ...s, [field]: value } : s)),
            priceLog: [{ at, skuId, field, from: sku[field], to: value, by: ROLE_LABEL[st.admin.role], reason }, ...st.priceLog],
          };
        });
      },
      updateSku(skuId, patch) {
        update((st) => ({ ...st, skus: st.skus.map((s) => (s.id === skuId ? { ...s, ...patch } : s)) }));
      },
      recordInvoicePayment(number, amount, method) {
        const at = stamp();
        update((st) => {
          const inv = st.invoices.find((i) => i.number === number);
          if (!inv) return st;
          const customer = customerById(inv.customerId);
          return {
            ...st,
            invoices: st.invoices.map((i) =>
              i.number === number ? { ...i, payments: [...i.payments, { at: dateKey(new Date(at)), amount, method }] } : i,
            ),
            cash: [
              ...st.cash,
              { id: uid("cs"), date: dateKey(new Date(at)), time: at.slice(11, 16), direction: "in", category: method, description: `Pembayaran ${number} · ${customer?.name ?? ""}`, ref: number, amount },
            ],
          };
        });
      },
      login(role) {
        update((st) => ({ ...st, admin: { authed: true, role } }));
      },
      logout() {
        update((st) => ({ ...st, admin: { ...st.admin, authed: false } }));
      },
      setDemo(patch) {
        update((st) => ({ ...st, demo: { ...st.demo, ...patch } }));
      },
      resetAll() {
        const fresh = initialState();
        setState({ ...fresh, demo: stateRef.current.demo, admin: stateRef.current.admin });
      },
    };
    return api;
  }, [update, today]);

  const value = useMemo<AppContextValue>(
    () => ({ state, hydrated, now, today, cartBump, viewer, ...actions }),
    [state, hydrated, now, today, cartBump, viewer, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp harus dipakai di dalam <AppProvider>");
  return ctx;
}

/** State halaman: loading (hidrasi / simulasi), empty (data kosong / simulasi), normal. */
export function usePageState(isEmpty: boolean): DemoView {
  const { hydrated, state } = useApp();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 350);
    return () => window.clearTimeout(t);
  }, []);
  if (!hydrated || !ready || state.demo.view === "loading") return "loading";
  if (state.demo.view === "empty" || isEmpty) return "empty";
  return "normal";
}

export function usePriceContext() {
  const { viewer } = useApp();
  return { customerType: viewer.type } as const;
}
