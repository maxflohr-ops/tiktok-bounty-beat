import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { BsCard, BsDisplay, BsEyebrow } from "@/components/bs";
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
    <div className="bs-surface min-h-screen">
      <SiteHeader />
      <main className="container-board py-10 md:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <BsEyebrow>{eyebrow}</BsEyebrow>
          <BsDisplay as="h1" size="lg" className="mt-3">
            {h1}
          </BsDisplay>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-bs-ink-soft)]">
            {intro}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BsButtonLink asChild={false as never} href={primaryHref} {...({} as object)}>
              <Link to={primaryHref} className="bs-btn">{primaryCta}</Link>
            </BsButtonLink>
            {secondaryCta && secondaryHref ? (
              <Link to={secondaryHref} className="bs-btn bs-btn-ghost">
                {secondaryCta}
              </Link>
            ) : null}
          </div>
        </section>
        <div className="mx-auto mt-12 max-w-4xl space-y-10">{children}</div>
        <footer className="mx-auto mt-16 max-w-4xl border-t border-[var(--color-bs-rule)] pt-6 text-center text-sm text-[var(--color-bs-ink-mute)]">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/" className="hover:text-[var(--color-bs-ink)]">the board</Link>
            <Link to="/for-artists" className="hover:text-[var(--color-bs-ink)]">for artists</Link>
            <Link to="/for-editors" className="hover:text-[var(--color-bs-ink)]">for editors</Link>
            <Link to="/clipping-campaigns" className="hover:text-[var(--color-bs-ink)]">clipping campaigns</Link>
            <Link to="/tiktok-clipper" className="hover:text-[var(--color-bs-ink)]">tiktok clippers</Link>
            <Link to="/list-sound" className="hover:text-[var(--color-bs-ink)]">list a sound</Link>
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
      <BsDisplay as="h2" size="sm">{title}</BsDisplay>
      <div className="mt-4 space-y-4 text-[var(--color-bs-ink-soft)]">{children}</div>
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
        <BsCard key={it.q} variant="flat" as="div" {...({} as object)}>
          <dt className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-bs-ink)]">
            {it.q}
          </dt>
          <dd className="mt-2 text-[var(--color-bs-ink-soft)]">{it.a}</dd>
        </BsCard>
      ))}
    </dl>
  );
}
