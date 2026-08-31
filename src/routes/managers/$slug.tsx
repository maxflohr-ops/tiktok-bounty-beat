import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { BsCard, BsDisplay, BsEyebrow } from "@/components/bs";
import { findManager, ROSTER } from "@/lib/managers";
import { MAX_CREDENTIALS } from "@/lib/managers/max";
import { ANSWERS } from "@/lib/managers/answers";
import {
  AuthorBox,
  KeyAnswer,
  Paragraphs,
  Portrait,
  PortraitCredit,
  QuoteCard,
  SourceList,
} from "@/components/managers/Prose";
import { MANAGERS_COLLECTION_ID, breadcrumbs, canonical, headFor } from "@/lib/managers/seo";

export const Route = createFileRoute("/managers/$slug")({
  loader: ({ params }) => {
    const manager = findManager(params.slug);
    if (!manager) throw notFound();
    return { manager };
  },
  head: ({ params }) => {
    const m = findManager(params.slug);
    if (!m) return {};
    const path = `/managers/${m.slug}`;
    return headFor({
      title: m.seo.title,
      description: m.seo.description,
      path,
      jsonLd: [
        breadcrumbs([
          { name: "Bounty Sounds", path: "/" },
          { name: "Music managers", path: "/managers" },
          { name: m.name, path },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: canonical(path),
          isPartOf: { "@id": MANAGERS_COLLECTION_ID },
          mainEntity: {
            "@type": "Person",
            name: m.name,
            jobTitle: "Music Manager",
            description: m.claim,
            url: canonical(path),
            ...(m.company ? { worksFor: { "@type": "Organization", name: m.company } } : {}),
            ...(m.sameAs?.length ? { sameAs: m.sameAs } : {}),
            ...(m.portrait
              ? {
                  image: {
                    "@type": "ImageObject",
                    url: `https://bountysounds.com${m.portrait.src}`,
                    creditText: m.portrait.author,
                    license: m.portrait.licenceUrl,
                    acquireLicensePage: m.portrait.sourceUrl,
                  },
                }
              : {}),
          },
          citation: m.sources.map((s) => ({ "@type": "CreativeWork", name: s.label, url: s.url })),
          ...(m.quote
            ? {
                subjectOf: {
                  "@type": "Quotation",
                  text: m.quote.text,
                  creator: { "@type": "Person", name: m.quote.speaker },
                  citation: m.quote.source.url,
                },
              }
            : {}),
        },
      ],
    });
  },
  component: ManagerProfile,
});

function ManagerProfile() {
  const { manager: m } = Route.useLoaderData();
  const others = ROSTER.filter((x) => x.slug !== m.slug).slice(0, 4);
  // Answer pages that cite this manager — the section's internal linking runs
  // off the same data the pages themselves are built from, so it can't drift.
  const citedBy = ANSWERS.filter((a) => a.managerExamples?.includes(m.slug)).slice(0, 3);

  return (
    <div className="bs-surface min-h-screen">
      <SiteHeader />
      <main className="container-board py-10 md:py-14">
        <article className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-[var(--color-bs-ink-mute)]">
            <Link to="/managers" className="hover:text-[var(--color-bs-ink)]">
              Music managers
            </Link>
            <span aria-hidden> / </span>
            <span className="text-[var(--color-bs-ink-soft)]">{m.name}</span>
          </nav>

          <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div>
              <Portrait name={m.name} portrait={m.portrait} size="lg" />
              <PortraitCredit portrait={m.portrait} />
            </div>
            <div>
              <BsEyebrow>
                {m.era}
                {m.company ? ` · ${m.company}` : ""}
              </BsEyebrow>
              <BsDisplay as="h1" size="md" className="mt-2">
                {m.name}
              </BsDisplay>
              <p className="mt-3 text-[var(--color-bs-ink-mute)]">{m.known.join(" · ")}</p>
            </div>
          </header>

          <div className="mt-7">
            <KeyAnswer>{m.claim}</KeyAnswer>
          </div>

          {m.quote ? (
            <div className="mt-6">
              <QuoteCard quote={m.quote} />
            </div>
          ) : null}

          <div className="mt-8">
            <Paragraphs items={m.body} />
          </div>

          {/* Credits render from MAX_CREDENTIALS, so adding a line there is
              the only edit needed to put a new act on the page. Current and
              past are separate headings, never one merged list. */}
          {m.slug === "max-flohr"
            ? (["current", "past"] as const).map((status) => {
                const acts = MAX_CREDENTIALS.roster.filter((r) => r.status === status);
                if (!acts.length) return null;
                return (
                  <section key={status} className="mt-10">
                    <h2 className="bs-display text-2xl">
                      {status === "current" ? "Currently manages" : "Previously"}
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {acts.map((r) => (
                        <li key={r.name} className="bs-card-flat p-5">
                          {r.image ? (
                            <>
                              <img
                                src={r.image.src}
                                alt={r.image.alt}
                                loading="lazy"
                                decoding="async"
                                className="mb-3 w-full border border-[var(--color-bs-rule-strong)] object-cover"
                              />
                              <PortraitCredit portrait={r.image} />
                            </>
                          ) : null}
                          <h3 className="text-lg font-semibold text-[var(--color-bs-ink)]">
                            {r.url ? (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-[var(--color-bs-rule-strong)] underline-offset-4"
                              >
                                {r.name}
                              </a>
                            ) : (
                              r.name
                            )}
                          </h3>
                          <p className="mt-2 leading-relaxed text-[var(--color-bs-ink-soft)]">
                            {r.note}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })
            : null}

          {/* The inside-baseball block: the mechanic, not the principle.
              Sits above the lesson because it's the reason most readers are
              on the page. */}
          <section className="mt-10 border-2 border-[var(--color-bs-ink)] bg-black/[0.03] p-6">
            <BsEyebrow>The move you can steal</BsEyebrow>
            <h2 className="mt-1.5 text-xl font-semibold text-[var(--color-bs-ink)]">
              {m.trick.title}
            </h2>
            <p className="mt-2 leading-relaxed text-[var(--color-bs-ink-soft)]">{m.trick.text}</p>
          </section>

          <section className="mt-10 border-2 border-[var(--color-bs-ink)] p-6">
            <BsEyebrow>What it teaches</BsEyebrow>
            <h2 className="mt-1.5 text-xl font-semibold text-[var(--color-bs-ink)]">
              {m.lesson.title}
            </h2>
            <p className="mt-2 leading-relaxed text-[var(--color-bs-ink-soft)]">{m.lesson.text}</p>
          </section>

          <div className="mt-10">
            <SourceList sources={m.sources} />
          </div>

          {citedBy.length ? (
            <section className="mt-10">
              <h2 className="bs-display text-2xl">Where this comes up</h2>
              <ul className="mt-4 space-y-3">
                {citedBy.map((a) => (
                  <li key={a.slug}>
                    <Link to="/music-management/$slug" params={{ slug: a.slug }}>
                      <BsCard className="p-4">
                        <span className="font-medium text-[var(--color-bs-ink)]">{a.question}</span>
                      </BsCard>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-10">
            <h2 className="bs-display text-2xl">More from the roster</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link to="/managers/$slug" params={{ slug: o.slug }} className="block h-full">
                    <BsCard className="h-full p-4">
                      <span className="font-medium text-[var(--color-bs-ink)]">{o.name}</span>
                      <p className="mt-1 text-sm text-[var(--color-bs-ink-mute)]">
                        {o.known.slice(0, 2).join(" · ")}
                      </p>
                    </BsCard>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <Link to="/managers" className="bs-btn bs-btn-ghost">
                the full roster
              </Link>
            </div>
          </section>

          <div className="mt-10">
            <AuthorBox />
          </div>
        </article>

        <footer className="mx-auto mt-16 max-w-4xl border-t border-[var(--color-bs-rule)] pt-6 text-center text-sm text-[var(--color-bs-ink-mute)]">
          <FooterNav />
        </footer>
      </main>
    </div>
  );
}
