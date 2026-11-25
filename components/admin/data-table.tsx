"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/feedback";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  hideBelow?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell", "2xl": "hidden 2xl:table-cell" };

/** Tabel padat back-office: header sticky, zebra halus, baris 40 px, angka rata kanan. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKey,
  caption,
  loading,
  empty,
  footer,
  maxHeight,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string;
  caption: string;
  loading?: boolean;
  empty?: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-card border border-line bg-surface", className)}>
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full border-separate border-spacing-0 text-sm [&_.tnum]:whitespace-nowrap">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "sticky top-0 z-10 h-10 whitespace-nowrap border-b border-line bg-bg px-3 text-xs font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4",
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                    c.hideBelow && HIDE[c.hideBelow],
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody aria-busy={loading || undefined}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} className={cn("h-10 border-b border-line px-3 first:pl-4 last:pr-4", c.hideBelow && HIDE[c.hideBelow])}>
                        <Skeleton className="h-3.5 w-full max-w-28" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((r) => {
                  const k = rowKey(r);
                  const selected = selectedKey === k;
                  return (
                    <tr
                      key={k}
                      onClick={onRowClick ? () => onRowClick(r) : undefined}
                      onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(r); } } : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      aria-selected={onRowClick ? selected : undefined}
                      className={cn(
                        "even:bg-bg/50",
                        onRowClick && "cursor-pointer hover:bg-frost/50 focus-visible:outline-offset-[-2px]",
                        selected && "!bg-frost",
                      )}
                    >
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            "h-10 border-b border-line px-3 py-1.5 first:pl-4 last:pr-4",
                            c.align === "right" && "whitespace-nowrap text-right tnum",
                            c.align === "center" && "text-center",
                            c.hideBelow && HIDE[c.hideBelow],
                            c.className,
                          )}
                        >
                          {c.cell(r)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
          {footer && !loading && rows.length > 0 && <tfoot>{footer}</tfoot>}
        </table>
      </div>
      {!loading && rows.length === 0 && empty}
    </div>
  );
}
