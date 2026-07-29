import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "ghost" | "accent";
type Size = "md" | "sm" | "lg";

const variantClass: Record<Variant, string> = {
  solid: "bs-btn",
  ghost: "bs-btn bs-btn-ghost",
  accent: "bs-btn bs-btn-accent",
};

const sizeClass: Record<Size, string> = {
  sm: "px-4 py-2 text-[0.7rem] min-h-[36px]",
  md: "",
  lg: "px-7 py-4 text-sm min-h-[52px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export const BsButton = forwardRef<HTMLButtonElement, CommonProps & ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ variant = "solid", size = "md", className, children, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(variantClass[variant], sizeClass[size], className)}
      {...rest}
    >
      {children}
    </button>
  ),
);
BsButton.displayName = "BsButton";

export const BsButtonLink = forwardRef<HTMLAnchorElement, CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ variant = "solid", size = "md", className, children, ...rest }, ref) => (
    <a
      ref={ref}
      className={cn(variantClass[variant], sizeClass[size], className)}
      {...rest}
    >
      {children}
    </a>
  ),
);
BsButtonLink.displayName = "BsButtonLink";
