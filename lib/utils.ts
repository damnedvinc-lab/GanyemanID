import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const merge = twMerge;

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
