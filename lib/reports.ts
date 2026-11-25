/** Perhitungan laporan (PRD §14) — murni, tanpa React. */
import { CONTRACTS, NOV_DISCOUNTS, NOV_OPEX, NOV_SALES, OPENING_CASH, SKUS, type CashEntry } from "./mock-data";
import { productById } from "./commerce";

export function marginBySku() {
  return NOV_SALES.map((s) => {
    const sku = SKUS.find((x) => x.id === s.skuId)!;
    const contractPrice = CONTRACTS.filter((c) => c.status === "aktif").flatMap((c) => c.items).find((i) => i.skuId === s.skuId)?.price ?? sku.price;
    const qty = s.retail + s.reseller + s.kontrak;
    const revenue = s.retail * sku.price + s.reseller * sku.resellerPrice + s.kontrak * contractPrice;
    const cogs = qty * sku.hpp;
    const margin = revenue - cogs;
    return {
      sku,
      name: `${productById(sku.productId)?.name} ${sku.uom === "kg" ? "(kg)" : sku.label}`,
      qty,
      revenue,
      cogs,
      margin,
      marginPct: revenue ? margin / revenue : 0,
      avgPrice: qty ? revenue / qty : 0,
      unitMargin: qty ? margin / qty : 0,
    };
  }).sort((a, b) => b.margin - a.margin);
}

export function profitAndLoss() {
  const rows = marginBySku();
  const gross = rows.reduce((s, r) => s + r.revenue, 0);
  const cogs = rows.reduce((s, r) => s + r.cogs, 0);
  const net = gross - NOV_DISCOUNTS;
  const grossProfit = net - cogs;
  const opex = NOV_OPEX.reduce((s, o) => s + o.amount, 0);
  return { gross, discounts: NOV_DISCOUNTS, net, cogs, grossProfit, opex, opexLines: NOV_OPEX, netProfit: grossProfit - opex };
}

export function cashDays(cash: CashEntry[]) {
  const dates = [...new Set(cash.map((c) => c.date))].sort();
  let opening = OPENING_CASH[dates[0]] ?? 0;
  return dates.map((date) => {
    const entries = cash.filter((c) => c.date === date).sort((a, b) => a.time.localeCompare(b.time));
    const inflow = entries.filter((e) => e.direction === "in").reduce((s, e) => s + e.amount, 0);
    const outflow = entries.filter((e) => e.direction === "out").reduce((s, e) => s + e.amount, 0);
    const day = { date, opening, entries, inflow, outflow, closing: opening + inflow - outflow };
    opening = day.closing;
    return day;
  });
}

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
