import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { BsCard, BsWell } from "./Card";
import { BsEyebrow, BsMono } from "./Typography";
import { cn } from "@/lib/utils";

/**
 * BsLoading — consistent loading placeholder.
 * variant="well" for hero-level moments, "card" for inline sections.
 */
export function BsLoading({
  label = "loading contracts",
  variant = "card",
  className,
}: {
  label?: string;
  variant?: "card" | "well" | "inline";
  className?: string;
}) {
  const inner = (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--color-bs-ink)]" aria-hidden />
      <BsMono className="uppercase text-[var(--color-bs-ink-mute)]">{label}…</BsMono>
    </div>
  );
  if (variant === "inline") {
    return (
      <div
        className={cn("flex items-center justify-center gap-2 py-6", className)}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin text-[var(--color-bs-ink-mute)]" aria-hidden />
        <BsMono className="uppercase text-[var(--color-bs-ink-mute)]">{label}…</BsMono>
      </div>
    );
  }
  if (variant === "well") {
    return (
      <BsWell className={className}>
        <div role="status" aria-live="polite">
          {inner}
        </div>
      </BsWell>
    );
  }
  return (
    <BsCard variant="flat" className={className}>
      <div role="status" aria-live="polite">
        {inner}
      </div>
    </BsCard>
  );
}

/**
 * BsEmpty — consistent empty state.
 * Optional eyebrow, headline, body, and action slot.
 */
export function BsEmpty({
  eyebrow = "empty",
  title,
  body,
  action,
  variant = "card",
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  variant?: "card" | "well";
  className?: string;
}) {
  const inner = (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <BsEyebrow>{eyebrow}</BsEyebrow>
      <p className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-bs-ink)] md:text-2xl">
        {title}
      </p>
      {body ? <div className="max-w-md text-sm text-[var(--color-bs-ink-soft)]">{body}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
  if (variant === "well") {
    return <BsWell className={className}>{inner}</BsWell>;
  }
  return (
    <BsCard variant="flat" className={className}>
      {inner}
    </BsCard>
  );
}
