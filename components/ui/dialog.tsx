"use client";

import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const DialogRoot = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

/** Modal terpusat */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-[toast-in_150ms_ease-out]" />
        <D.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,820px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-card bg-surface shadow-lift focus:outline-none",
            size === "md" && "max-w-lg",
            size === "lg" && "max-w-2xl",
            size === "xl" && "max-w-4xl",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div>
              <D.Title className="font-display text-xl font-semibold">{title}</D.Title>
              {description ? (
                <D.Description className="mt-1 text-sm text-muted">{description}</D.Description>
              ) : (
                <D.Description className="sr-only">{title}</D.Description>
              )}
            </div>
            <D.Close className="-mr-2 rounded-button p-2 text-muted hover:bg-frost/60 hover:text-ink" aria-label="Tutup">
              <X className="size-5" />
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** Sheet dari bawah (mobile) atau kanan (panel detail) */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "bottom",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "bottom" | "right";
  className?: string;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <D.Content
          className={cn(
            "fixed z-50 flex flex-col bg-surface shadow-lift focus:outline-none",
            side === "bottom" && "inset-x-0 bottom-0 max-h-[88vh] rounded-t-card",
            side === "right" && "inset-y-0 right-0 w-full max-w-xl",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <D.Title className="font-display text-xl font-semibold">{title}</D.Title>
              <D.Description className={description ? "mt-0.5 text-sm text-muted" : "sr-only"}>
                {description ?? title}
              </D.Description>
            </div>
            <D.Close className="-mr-2 rounded-button p-2 text-muted hover:bg-frost/60 hover:text-ink" aria-label="Tutup">
              <X className="size-5" />
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
