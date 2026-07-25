import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import type { ReactNode } from "react";

export function LandingLayout({
  eyebrow,
  h1,
  intro,
  primaryCta,
  primaryHref,
  secondaryCta,
  secondaryHref,
  children,
}: {
  eyebrow: string;
  h1: string;
  intro: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--tar)] text-bone">
      <SiteHeader />
      <main className="container-board py-10 md:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <span className="label-cap text-silver-glow">{eyebrow}</span>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-wide text-bone md:text-6xl">
            {h1}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-bone-soft">{intro}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={primaryHref} className="silver-btn">
              {primaryCta}
            </Link>
            {secondaryCta && secondaryHref ? (
              <Link
                to={secondaryHref}
                className="label-cap border border-[var(--iron)] px-5 py-3 text-bone hover:text-silver-glow"
              >
                {secondaryCta}
              </Link>
            ) : null}
          </div>
        </section>
        <div className="mx-auto mt-12 max-w-4xl space-y-10">{children}</div>
        <footer className="mx-auto mt-16 max-w-4xl border-t border-[var(--iron)] pt-6 text-center text-sm text-bone-soft">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/" className="hover:text-bone">the board</Link>
            <Link to="/for-artists" className="hover:text-bone">for artists</Link>
            <Link to="/for-editors" className="hover:text-bone">for editors</Link>
            <Link to="/clipping-campaigns" className="hover:text-bone">clipping campaigns</Link>
            <Link to="/tiktok-clipper" className="hover:text-bone">tiktok clippers</Link>
            <Link to="/list-sound" className="hover:text-bone">list a sound</Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}

export function LandingSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl tracking-wide text-bone md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-bone-soft">{children}</div>
    </section>
  );
}

export function FaqList({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  return (
    <dl className="space-y-4">
      {items.map((it) => (
        <div key={it.q} className="border border-[var(--iron)] bg-black/30 p-4">
          <dt className="font-display text-lg text-bone">{it.q}</dt>
          <dd className="mt-2 text-bone-soft">{it.a}</dd>
        </div>
      ))}
    </dl>
  );
}
