import type { HTMLAttributes, ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const displaySize: Record<Size, string> = {
  sm: "text-2xl md:text-3xl",
  md: "text-3xl md:text-5xl",
  lg: "text-4xl md:text-6xl",
  xl: "text-[2.6rem] md:text-[5rem]",
};

export function BsDisplay({
  as: As = "h2",
  size = "md",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { as?: ElementType; size?: Size; children: ReactNode }) {
  return (
    <As className={cn("bs-display", displaySize[size], className)} {...rest}>
      {children}
    </As>
  );
}

export function BsEyebrow({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span className={cn("bs-eyebrow", className)} {...rest}>
      {children}
    </span>
  );
}

export function BsMarker({
  as: As = "span",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: ElementType; children: ReactNode }) {
  return (
    <As className={cn("bs-marker", className)} {...rest}>
      {children}
    </As>
  );
}

export function BsMono({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span className={cn("bs-mono", className)} {...rest}>
      {children}
    </span>
  );
}
