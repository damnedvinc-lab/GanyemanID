import { Bean, Beef, Box, Drumstick, Fish, Popcorn, Shrimp, Soup, Wheat } from "lucide-react";
import type { IconKey } from "@/lib/mock-data";

export const PRODUCT_ICONS: Record<IconKey, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  drumstick: Drumstick,
  beef: Beef,
  fish: Fish,
  shrimp: Shrimp,
  popcorn: Popcorn,
  wheat: Wheat,
  bean: Bean,
  soup: Soup,
  box: Box,
};
