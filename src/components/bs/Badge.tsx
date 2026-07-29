import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "solid" | "live";

const variantClass: Record<Variant, string> = {
  default: "bs-badge",
  solid: "bs-badge bs-badge-solid",
  live: "bs-badge bs-badge-live bs-badge-dot",
};

export function BsBadge({
  variant = "default",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <span className={cn(variantClass[variant], className)} {...rest}>
      {children}
    </span>
  );
}
