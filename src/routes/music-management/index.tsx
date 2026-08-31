import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { BsCard, BsDisplay, BsEyebrow } from "@/components/bs";
import { ANSWERS } from "@/lib/managers/answers";
import { AuthorBox } from "@/components/managers/Prose";
import { MANAGERS_COLLECTION_ID, SITE, breadcrumbs, canonical, headFor } from "@/lib/editorial-seo";
import { MAX_PERSON } from "@/lib/managers/max";

const TITLE = "Music Management: Straight Answers";
const DESCRIPTION =
  "What a music manager does, what they take, when you need one, and what to refuse in a contract. Sourced answers to the questions artists actually ask.";

export const Route = createFileRoute("/music-management/")({
  head: () =>
    headFor({
      title: TITLE,
      description: DESCRIPTION,
      path: "/music-management",
      jsonLd: [
        breadcrumbs([
          { name: "Bounty Sounds", path: "/" },
          { name: "Music management", path: "/music-management" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESCRIPTION,
          url: canonical("/music-management"),
          author: MAX_PERSON,
          isPartOf: { "@id": MANAGERS_COLLECTION_ID },
          publisher: { "@type": "Organization", name: "Bounty Sounds", url: SITE },
          hasPart: ANSWERS.map((a) => ({
            "@type": "Article",
            headline: a.question,
            description: a.shortAnswer,
            url: canonical(`/music-management/${a.slug}`),
          })),
        },
      ],
    }),
  component: MusicManagementIndex,
});

function MusicManagementIndex() {
  return (
    <div className="bs-surface min-h-screen">
      <SiteHeader />
      <main className="container-board py-10 md:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <BsEyebrow>music management</BsEyebrow>
          <BsDisplay as="h1" size="lg" className="mt-3">
            Straight answers about music management
          </BsDisplay>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--color-bs-ink-soft)]">
            Every answer here leads with the answer, including when it's "no," "not yet," or "walk
            away." Numbers are sourced. Nothing is here to sell you a course.
          </p>
        </section>

        <div className="mx-auto mt-12 max-w-3xl space-y-10">
          <ul className="space-y-3">
            {ANSWERS.map((a) => (
              <li key={a.slug}>
                <Link to="/music-management/$slug" params={{ slug: a.slug }}>
                  <BsCard className="p-5">
                    <h2 className="text-lg font-semibold text-[var(--color-bs-ink)]">
                      {a.question}
                    </h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-bs-ink-soft)]">
                      {a.shortAnswer}
                    </p>
                  </BsCard>
                </Link>
              </li>
            ))}
          </ul>

          <section className="text-center">
            <p className="text-[var(--color-bs-ink-soft)]">
              The people who worked all this out first are on the roster:{" "}
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
