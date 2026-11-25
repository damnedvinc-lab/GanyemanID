import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Satu bahasa tombol untuk seluruh aplikasi.
 * - cta: coral (accent-strong) — MAKSIMAL 1 per layar
 * - primary: teal
 * - secondary: outline
 * - ghost / destructive / link
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold rounded-button transition-colors duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        cta: "bg-accent-strong text-white hover:bg-[#a93c1a] shadow-soft",
        primary: "bg-primary text-white hover:bg-primary-hover",
        secondary: "border border-line bg-surface text-ink hover:border-primary/40 hover:bg-frost/40",
        ghost: "text-ink hover:bg-frost/60",
        destructive: "border border-danger/30 bg-surface text-danger hover:bg-danger-soft",
        link: "text-primary underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
});

type ButtonLinkProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

export function ButtonLink({ className, variant, size, block, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}
