import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { Link } from "@tanstack/react-router";

// The operating entity behind Bounty Sounds. Named in both legal documents;
// reviewers (TikTok, payment partners) check that a real operator is
// identified rather than an anonymous site.
export const OPERATOR = "Florra LLC";
export const PRIVACY_EMAIL = "privacy@bountysounds.com";
export const LEGAL_EMAIL = "legal@bountysounds.com";
export const EFFECTIVE_DATE = "August 15, 2026";

export type LegalSection = {
  id: string;
  heading: string;
  body: ReactNode;
};

/**
 * Long-document layout for the two legal pages. Plain, high-contrast, and
 * readable on a phone — a reviewer opening this on mobile has to be able to
 * read every clause. No decorative typography here on purpose.
 */
export function LegalDoc({
  eyebrow,
  title,
  summary,
  sections,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
}) {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <article className="container-board pt-14 pb-16 md:pt-20">
        <div className="mx-auto max-w-3xl">
          <p className="label-cap">{eyebrow}</p>
          <h1 className="mt-3 [font-family:var(--font-brand)] text-4xl font-semibold leading-tight text-bone md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-bone-soft">{summary}</p>
          <p className="mt-4 text-sm text-bone-soft">
            <strong className="text-bone">Effective {EFFECTIVE_DATE}.</strong> Bounty Sounds
            (bountysounds.com) is operated by {OPERATOR}.
          </p>

          <nav aria-label="Contents" className="mt-8 border-y border-[var(--color-bs-rule)] py-5">
            <p className="label-cap text-bone-soft">Contents</p>
            <ol className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {sections.map((s, i) => (
                <li key={s.id} className="text-sm">
                  <a
                    href={`#${s.id}`}
                    className="text-bone-soft underline underline-offset-2 hover:text-bone"
                  >
                    {i + 1}. {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="[font-family:var(--font-brand)] text-2xl font-semibold leading-snug text-bone">
                  {i + 1}. {s.heading}
                </h2>
                <div className="legal-prose mt-3 space-y-3 leading-relaxed text-bone-soft">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-14 border-t border-[var(--color-bs-rule)] pt-6 text-sm text-bone-soft">
            <p>
              Read alongside our{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-bone">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/terms" className="underline underline-offset-2 hover:text-bone">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </article>

      <footer className="border-t border-[var(--color-bs-rule)]">
        <div className="container-board flex flex-col items-center gap-2 py-8 text-center text-xs text-bone-soft">
          <FooterNav />
          <span>© {new Date().getFullYear()} Bounty Sounds · {OPERATOR}</span>
        </div>
      </footer>
    </div>
  );
}
