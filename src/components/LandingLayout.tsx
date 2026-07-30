import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { BsCard, BsDisplay, BsEyebrow } from "@/components/bs";
import { setReturnTo } from "@/lib/return-to";
import type { ReactNode } from "react";

export function LandingLayout({
  eyebrow,
  h1,
  intro,
  primaryCta,
  primaryHref,
  primaryReturnTo,
  secondaryCta,
  secondaryHref,
  children,
}: {
  eyebrow: string;
  h1: string;
  intro: string;
  primaryCta: string;
  primaryHref: string;
  // Where sign-in should land when primaryHref is /auth.
  primaryReturnTo?: string;
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
            <Link
              to={primaryHref}
              className="bs-btn"
              onClick={primaryReturnTo ? () => setReturnTo(primaryReturnTo) : undefined}
            >
              {primaryCta}
            </Link>
            {secondaryCta && secondaryHref ? (
              <Link to={secondaryHref} className="bs-btn bs-btn-ghost">
                {secondaryCta}
              </Link>
            ) : null}
          </div>
        </section>
        <div className="mx-auto mt-12 max-w-4xl space-y-10">{children}</div>
        <footer className="mx-auto mt-16 max-w-4xl border-t border-[var(--color-bs-rule)] pt-6 text-center text-sm text-[var(--color-bs-ink-mute)]">
          <FooterNav />
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
        <BsCard key={it.q} variant="flat">
          <dt className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-bs-ink)]">
            {it.q}
          </dt>
          <dd className="mt-2 text-[var(--color-bs-ink-soft)]">{it.a}</dd>
        </BsCard>
      ))}
    </dl>
  );
}
