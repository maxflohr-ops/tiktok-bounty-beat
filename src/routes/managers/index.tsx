import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { BsCard, BsDisplay, BsEyebrow } from "@/components/bs";
import { ROSTER } from "@/lib/managers";
import { ANSWERS } from "@/lib/managers/answers";
import { AuthorBox, Portrait, QuoteCard } from "@/components/managers/Prose";
import { MANAGERS_COLLECTION_ID, SITE, breadcrumbs, canonical, headFor } from "@/lib/editorial-seo";
import { MAX_PERSON } from "@/lib/managers/max";

const TITLE = "The Greatest Music Managers Nobody Knows";
const DESCRIPTION =
  "The managers behind Led Zeppelin, U2, Metallica, Adele and Billie Eilish — what each of them repriced, and what it teaches anyone managing an artist today.";

export const Route = createFileRoute("/managers/")({
  head: () =>
    headFor({
      title: TITLE,
      description: DESCRIPTION,
      path: "/managers",
      jsonLd: [
        breadcrumbs([
          { name: "Bounty Sounds", path: "/" },
          { name: "Music managers", path: "/managers" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": MANAGERS_COLLECTION_ID,
          name: TITLE,
          description: DESCRIPTION,
          url: canonical("/managers"),
          author: MAX_PERSON,
          publisher: { "@type": "Organization", name: "Bounty Sounds", url: SITE },
          hasPart: ROSTER.map((m) => ({
            "@type": "Person",
            name: m.name,
            description: m.claim,
            url: canonical(`/managers/${m.slug}`),
          })),
        },
      ],
    }),
  component: ManagersHub,
});

// Max last, so his line reads as the present-tense answer to twelve
// historical ones rather than as the top of the list.
const QUOTED = [
  ...ROSTER.filter((m) => m.quote && m.slug !== "max-flohr"),
  ...ROSTER.filter((m) => m.quote && m.slug === "max-flohr"),
];

function ManagersHub() {
  return (
    <div className="bs-surface min-h-screen">
      <SiteHeader />
      <main className="container-board py-10 md:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <BsEyebrow>a reference on artist management</BsEyebrow>
          <BsDisplay as="h1" size="lg" className="mt-3">
            The greatest music managers nobody knows
          </BsDisplay>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--color-bs-ink-soft)]">
            Everyone can name the bands. Almost nobody can name the person who decided the band
            wouldn't do television, or who took equity instead of a royalty cheque, or who told a
            rock star to fire his entire band. Those decisions are the job, and the mechanics of
            them are kept deliberately vague by the people who benefit from that. Every profile here
            ends with the specific move — the one you can run this week, with no budget and no
            relationships. Written for underground acts and small brands, because they're the ones
            nobody explains this to.
          </p>
        </section>

        <div className="mx-auto mt-14 max-w-4xl space-y-14">
          <section>
            <h2 className="bs-display text-2xl md:text-3xl">The roster</h2>
            <p className="mt-2 text-[var(--color-bs-ink-soft)]">
              {ROSTER.length} managers, every claim sourced on the page.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {ROSTER.map((m) => (
                <li key={m.slug}>
                  <Link to="/managers/$slug" params={{ slug: m.slug }} className="block h-full">
                    <BsCard className="flex h-full flex-col p-5">
                      <div className="flex items-start gap-3">
                        <Portrait name={m.name} portrait={m.portrait} />
                        <div>
                          <span className="bs-eyebrow">{m.era}</span>
                          <h3 className="mt-1.5 text-xl font-semibold text-[var(--color-bs-ink)]">
                            {m.name}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-bs-ink-mute)]">
                        {m.known.slice(0, 3).join(" · ")}
                      </p>
                      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-bs-ink-soft)]">
                        {m.trick.title}
                      </p>
                    </BsCard>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* The wall. Every line is a real, sourced quotation — several of
              them said about a manager by the artist who hired them, which is
              why the speaker is printed rather than assumed. Max's slot fills
              itself the moment MAX_QUOTE is set. */}
          <section>
            <h2 className="bs-display text-2xl md:text-3xl">In their own words</h2>
            <p className="mt-2 text-[var(--color-bs-ink-soft)]">
              What the people who actually did this job say the job is.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {QUOTED.map((m) => (
                <QuoteCard
                  key={m.slug}
                  quote={m.quote!}
                  attributionHref={`/managers/${m.slug}`}
                  attributionLabel={m.name}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="bs-display text-2xl md:text-3xl">
              Straight answers about music management
            </h2>
            <p className="mt-2 text-[var(--color-bs-ink-soft)]">
              The questions artists actually ask, answered in full — including when the answer is
              "no" or "not yet."
            </p>
            <ul className="mt-6 space-y-3">
              {ANSWERS.map((a) => (
                <li key={a.slug}>
                  <Link to="/music-management/$slug" params={{ slug: a.slug }} className="block">
                    <BsCard className="p-5">
                      <h3 className="text-lg font-semibold text-[var(--color-bs-ink)]">
                        {a.question}
                      </h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-bs-ink-soft)]">
                        {a.shortAnswer}
                      </p>
                    </BsCard>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <AuthorBox />

          <section className="bs-card-flat p-6 text-center">
            <h2 className="bs-display text-2xl">Managing an artist right now?</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-bs-ink-soft)]">
              The asset that's underpriced today is short-form attention. Bounty Sounds is a public
              clipping board — post a purse on a sound, editors post clips, verified views pay out,
              and every rate is on the contract before anyone commits.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/list-sound" className="bs-btn">
                post a bounty
              </Link>
              <Link to="/board" className="bs-btn bs-btn-ghost">
                see the live board
              </Link>
            </div>
          </section>
        </div>

        <footer className="mx-auto mt-16 max-w-4xl border-t border-[var(--color-bs-rule)] pt-6 text-center text-sm text-[var(--color-bs-ink-mute)]">
          <FooterNav />
        </footer>
      </main>
    </div>
  );
}
