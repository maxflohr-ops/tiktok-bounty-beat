import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { BsCard, BsDisplay, BsEyebrow } from "@/components/bs";
import { GUIDES } from "@/lib/marketing/guides";
import { AuthorBox } from "@/components/managers/Prose";
import { MAX_PERSON } from "@/lib/managers/max";
import { SITE, breadcrumbs, canonical, headFor } from "@/lib/editorial-seo";

const TITLE = "Digital Marketing for Sounds, Streams and Keynotes";
const DESCRIPTION =
  "What TikTok promotion costs, pay-per-view vs flat rate, sound seeding, briefing and measuring a clipping campaign. Sourced benchmarks, no invented ones.";

export const Route = createFileRoute("/digital-marketing/")({
  head: () =>
    headFor({
      title: TITLE,
      description: DESCRIPTION,
      path: "/digital-marketing",
      jsonLd: [
        breadcrumbs([
          { name: "Bounty Sounds", path: "/" },
          { name: "Digital marketing", path: "/digital-marketing" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESCRIPTION,
          url: canonical("/digital-marketing"),
          author: MAX_PERSON,
          publisher: { "@type": "Organization", name: "Bounty Sounds", url: SITE },
          hasPart: GUIDES.map((g) => ({
            "@type": "Article",
            headline: g.question,
            description: g.shortAnswer,
            url: canonical(`/digital-marketing/${g.slug}`),
          })),
        },
      ],
    }),
  component: MarketingHub,
});

function MarketingHub() {
  return (
    <div className="bs-surface min-h-screen">
      <SiteHeader />
      <main className="container-board py-10 md:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <BsEyebrow>for the person paying</BsEyebrow>
          <BsDisplay as="h1" size="lg" className="mt-3">
            Digital marketing for sounds, streams and keynotes
          </BsDisplay>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--color-bs-ink-soft)]">
            What it costs, which pricing model to use, how to write a brief editors will actually
            take, and how to tell afterwards whether it worked. Third-party benchmarks are cited.
            Where a number would describe our own results, there isn't one — the board hasn't run
            long enough for an average to mean anything, and the live rates are public anyway.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/list-sound" className="bs-btn">
              post a bounty
            </Link>
            <Link to="/board" className="bs-btn bs-btn-ghost">
              see live rates
            </Link>
          </div>
        </section>

        <div className="mx-auto mt-12 max-w-3xl space-y-10">
          <ul className="space-y-3">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link to="/digital-marketing/$slug" params={{ slug: g.slug }}>
                  <BsCard className="p-5">
                    <h2 className="text-lg font-semibold text-[var(--color-bs-ink)]">
                      {g.question}
                    </h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-bs-ink-soft)]">
                      {g.shortAnswer}
                    </p>
                  </BsCard>
                </Link>
              </li>
            ))}
          </ul>

          <section className="text-center">
            <p className="text-[var(--color-bs-ink-soft)]">
              For the craft behind all of this, the reference on artist management is at{" "}
              <Link
                to="/managers"
                className="underline decoration-[var(--color-bs-rule-strong)] underline-offset-4 hover:text-[var(--color-bs-ink)]"
              >
                the greatest music managers nobody knows
              </Link>
              .
            </p>
          </section>

          <AuthorBox />
        </div>

        <footer className="mx-auto mt-16 max-w-4xl border-t border-[var(--color-bs-rule)] pt-6 text-center text-sm text-[var(--color-bs-ink-mute)]">
          <FooterNav />
        </footer>
      </main>
    </div>
  );
}
