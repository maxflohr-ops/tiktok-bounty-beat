import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "hover" | "flat";

export function BsCard({
  variant = "hover",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <div className={cn(variant === "hover" ? "bs-card" : "bs-card-flat", className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * BsWell — three nested frames pulling focus to the center.
 * Reuse for hero/CTA moments that should feel like the homepage.
 */
export function BsWell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("bs-well-outer", className)}>
      <div className="bs-well-frame">
        <div className="bs-well">{children}</div>
      </div>
    </div>
  );
}
