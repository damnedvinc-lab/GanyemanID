import type { Uom } from "./mock-data";

const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** "Rp 47.500" */
export function formatRp(value: number): string {
  const sign = value < 0 ? "−" : "";
  return `${sign}Rp ${rupiah.format(Math.round(Math.abs(value)))}`;
}

/** "1.234" atau "2,5" */
export function formatNum(value: number): string {
  return decimal.format(value);
}

/** gram → "500 g" | "6 kg" | "2,5 kg" */
export function formatWeight(grams: number): string {
  if (Math.abs(grams) < 1000) return `${decimal.format(grams)} g`;
  return `${decimal.format(grams / 1000)} kg`;
}

export function formatKg(grams: number): string {
  return `${decimal.format(grams / 1000)} kg`;
}

export const UOM_LABEL: Record<Uom, string> = {
  pack: "pack",
  kg: "kg",
  karton: "karton",
};

/** "2 pack" | "1,5 kg" | "1 karton" */
export function formatQty(qty: number, uom: Uom): string {
  return `${decimal.format(qty)} ${UOM_LABEL[uom]}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAYS_LONG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const wibParts = (d: Date) => {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    h: Number(get("hour")) % 24,
    min: Number(get("minute")),
    wd,
  };
};

export { wibParts };

/** Terima ISO datetime ("2026-11-25T09:12:00+07:00") atau tanggal ("2026-11-25"). */
function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00+07:00`);
  return new Date(value);
}

/** "25 Nov 2026" */
export function formatDate(value: string | Date): string {
  const p = wibParts(toDate(value));
  return `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** "Kam, 26 Nov" */
export function formatDayShort(value: string | Date): string {
  const p = wibParts(toDate(value));
  return `${DAYS[p.wd]}, ${p.d} ${MONTHS[p.m - 1]}`;
}

/** "Kamis, 26 Nov 2026" */
export function formatDayLong(value: string | Date): string {
  const p = wibParts(toDate(value));
  return `${DAYS_LONG[p.wd]}, ${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** "09.12" */
export function formatTime(value: string | Date): string {
  const p = wibParts(toDate(value));
  return `${String(p.h).padStart(2, "0")}.${String(p.min).padStart(2, "0")}`;
}

/** "25 Nov 2026, 09.12" */
export function formatDateTime(value: string | Date): string {
  return `${formatDate(value)}, ${formatTime(value)}`;
}

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} mnt`;
  return r === 0 ? `${h} jam` : `${h} j ${r} mnt`;
}

export function pct(value: number, digits = 0): string {
  return `${decimal.format(Number((value * 100).toFixed(digits)))}%`;
}
