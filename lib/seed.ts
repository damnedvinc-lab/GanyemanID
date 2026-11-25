/** Menurunkan state awal (order, invoice, kartu stok) dari data mock. */
import {
  CONTRACTS,
  CUSTOMERS,
  LAST_OPNAME_DATE,
  NOV_SALES,
  OPNAME_DIFF,
  SEED_CASH,
  SEED_CLAIMS,
  SEED_INVOICES,
  SEED_ORDERS,
  SKUS,
  type Contract,
  type CashEntry,
  type Sku,
} from "./mock-data";
import {
  addDays,
  findSku,
  productById,
  resolvePrice,
  shippingFee,
  shippingWeight,
  zoneForPostal,
  type Claim,
  type Invoice,
  type Order,
  type OrderLine,
  type StockMove,
} from "./commerce";

export const customerById = (id: string) => CUSTOMERS.find((c) => c.id === id);

function tokenFor(number: string) {
  // token publik deterministik untuk halaman status tanpa login
  let h = 0;
  for (const ch of number) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${number.toLowerCase()}-${h.toString(36).slice(0, 5)}`;
}

export function buildLines(
  items: { skuId: string; qty: number; variantId?: string }[],
  skus: Sku[],
  customerType: "retail" | "reseller" | "b2b",
  contract?: Contract,
): OrderLine[] {
  return items.map((it) => {
    const sku = findSku(skus, it.skuId)!;
    const product = productById(sku.productId)!;
    const { price, source } = resolvePrice(sku, it.qty, { customerType, contract });
    return {
      skuId: sku.id,
      productId: product.id,
      productName: product.name,
      skuLabel: sku.label,
      uom: sku.uom,
      qty: it.qty,
      gramsPerUnit: sku.gramsPerUnit,
      unitPrice: price,
      priceSource: source,
      hppUnit: sku.hpp,
      variantLabel: product.variants?.find((v) => v.id === it.variantId)?.label,
    };
  });
}

export function linesTotals(lines: OrderLine[], skus: Sku[]) {
  const subtotal = lines.reduce((s, l) => s + Math.round(l.unitPrice * l.qty), 0);
  const netGrams = lines.reduce((s, l) => s + l.gramsPerUnit * l.qty, 0);
  const packagingGrams = lines.reduce(
    (s, l) => s + (findSku(skus, l.skuId)?.packagingGrams ?? 0) * Math.ceil(l.qty),
    0,
  );
  return { subtotal, netGrams, ...shippingWeight(netGrams, packagingGrams) };
}

export function buildSeedOrders(now: Date): Order[] {
  return SEED_ORDERS.map((s) => {
    const customer = customerById(s.customerId)!;
    const address = customer.addresses.find((a) => a.id === s.addressId)!;
    const contract = s.contractId ? CONTRACTS.find((c) => c.id === s.contractId) : undefined;
    const lines = buildLines(s.items, SKUS, customer.type, contract);
    const t = linesTotals(lines, SKUS);
    const zone = zoneForPostal(address.postal);
    const ownFleet = Boolean(contract && contract.delivery.startsWith("Armada"));
    const shipping = ownFleet || !zone ? 0 : shippingFee(t.shipGrams, zone);
    const deliveredAt =
      s.deliveredHoursAgo !== undefined
        ? new Date(now.getTime() - s.deliveredHoursAgo * 3_600_000).toISOString()
        : s.deliveredAt;
    const history = [...s.history];
    if (s.deliveredHoursAgo !== undefined && deliveredAt) {
      history.push({ status: "selesai", at: deliveredAt, note: "Diterima — kurir mengunggah foto serah terima" });
    }
    return {
      number: s.number,
      token: tokenFor(s.number),
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.type,
      channel: s.channel,
      contractId: s.contractId,
      status: s.status,
      payment: s.payment,
      proofName: s.proofName,
      createdAt: s.createdAt,
      shipDate: s.shipDate,
      deliveredAt,
      awb: s.awb,
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
      history,
    } satisfies Order;
  });
}

export function buildSeedInvoices(orders: Order[]): Invoice[] {
  return SEED_INVOICES.map((inv) => {
    const order = orders.find((o) => o.number === inv.orderNumber)!;
    const contract = CONTRACTS.find((c) => c.id === order.contractId);
    return {
      number: inv.number,
      orderNumber: inv.orderNumber,
      customerId: order.customerId,
      contractId: order.contractId,
      issuedAt: inv.issuedAt,
      dueAt: addDays(inv.issuedAt, contract?.termDays ?? 14),
      total: order.total,
      payments: inv.payments,
    };
  });
}

export function buildSeedClaims(): Claim[] {
  return SEED_CLAIMS.map((c) => ({ ...c }));
}

/** Kartu stok agregat per SKU yang saldo akhirnya = stok dataset */
export function buildSeedLedger(): StockMove[] {
  const moves: StockMove[] = [];
  for (const sku of SKUS) {
    const sales = NOV_SALES.find((s) => s.skuId === sku.id);
    const sold = sales ? sales.retail + sales.reseller + sales.kontrak : 0;
    const diff = OPNAME_DIFF[sku.id] ?? 0;
    const round = (n: number) => (sku.step < 1 ? Math.round(n * 4) / 4 : Math.round(n));
    const opening = round(sold * 0.25 + sku.minStock);
    const in1 = round(sold * 0.45);
    const in2 = round(sku.stock - opening - in1 + sold - diff);
    const poBase = sku.productId.includes("ayam") ? "PO-2026-0" : "PO-2026-1";
    moves.push(
      { id: `${sku.id}-0`, skuId: sku.id, at: "2026-11-01T07:00:00+07:00", type: "saldo_awal", qty: opening, ref: "Saldo awal Nov", unitCost: sku.hpp },
      { id: `${sku.id}-1`, skuId: sku.id, at: "2026-11-06T10:00:00+07:00", type: "masuk", qty: in1, ref: `${poBase}24`, note: "Penerimaan PO", unitCost: sku.hpp },
      { id: `${sku.id}-2`, skuId: sku.id, at: "2026-11-18T10:00:00+07:00", type: "masuk", qty: in2, ref: `${poBase}29`, note: "Penerimaan PO", unitCost: sku.hpp },
      { id: `${sku.id}-3`, skuId: sku.id, at: "2026-11-24T21:00:00+07:00", type: "keluar", qty: -sold, ref: "Penjualan 1–24 Nov", note: "Agregat order web & call-off" },
    );
    if (diff !== 0) {
      moves.push({
        id: `${sku.id}-4`, skuId: sku.id, at: `${LAST_OPNAME_DATE}T17:00:00+07:00`, type: "opname", qty: diff,
        ref: "OPN-2026-022", note: "Opname mingguan — selisih susut kemasan",
      });
    }
  }
  return moves.sort((a, b) => a.at.localeCompare(b.at));
}

export function buildSeedCash(orders: Order[]): CashEntry[] {
  // nominal transfer diambil dari total order agar konsisten antar layar
  return SEED_CASH.map((c) => {
    const o = orders.find((x) => x.number === c.ref);
    return o ? { ...c, amount: o.total } : { ...c };
  }).filter((c) => c.amount > 0);
}
