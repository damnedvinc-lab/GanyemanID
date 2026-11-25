"use client";

import * as T from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;

export function TabsList({ className, ...props }: T.TabsListProps) {
  return (
    <T.List
      className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-line", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: T.TabsTriggerProps) {
  return (
    <T.Trigger
      className={cn(
        "relative -mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-muted transition-colors duration-150 hover:text-ink data-[state=active]:border-primary data-[state=active]:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: T.TabsContentProps) {
  return <T.Content className={cn("pt-5 focus-visible:outline-none", className)} {...props} />;
}
