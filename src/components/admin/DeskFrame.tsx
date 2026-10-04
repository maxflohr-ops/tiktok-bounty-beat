import type { ReactNode } from "react";

// The desk's bracketed panel, shared by the Engine and Recruiting tabs.
export function DeskFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`board-frame relative p-5 ${className}`}>
      <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
      <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
      <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
      <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
      {children}
    </section>
  );
}

export function Pill({
  tone,
  children,
}: {
  tone: "good" | "warn" | "bad" | "quiet";
  children: ReactNode;
}) {
  const cls = {
    good: "border-emerald-600/40 text-emerald-700",
    warn: "border-amber-500/50 text-amber-700",
    bad: "border-red-600/40 text-red-700",
    quiet: "border-[var(--border)] text-bone-soft",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {children}
    </span>
  );
}
