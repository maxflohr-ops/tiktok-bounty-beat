import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { BsCard, BsDisplay, BsEyebrow } from "@/components/bs";
import { answerBySlug, ANSWERS } from "@/lib/managers/answers";
import { findManager } from "@/lib/managers";
import {
  AuthorBox,
  FaqBlock,
  KeyAnswer,
  Paragraphs,
  SourceList,
} from "@/components/managers/Prose";
import { articleJsonLd, breadcrumbs, faqJsonLd, headFor } from "@/lib/editorial-seo";

export const Route = createFileRoute("/music-management/$slug")({
  loader: ({ params }) => {
    const answer = answerBySlug(params.slug);
    if (!answer) throw notFound();
    return { answer };
  },
  head: ({ params }) => {
    const a = answerBySlug(params.slug);
    if (!a) return {};
    const path = `/music-management/${a.slug}`;
    return headFor({
      title: a.seo.title,
      description: a.seo.description,
      path,
      jsonLd: [
        breadcrumbs([
          { name: "Bounty Sounds", path: "/" },
          { name: "Music managers", path: "/managers" },
          { name: a.navLabel, path },
        ]),
        articleJsonLd({
          headline: a.question,
          description: a.shortAnswer,
          path,
          citations: a.sources,
        }),
        faqJsonLd([{ q: a.question, a: a.shortAnswer }, ...a.faq]),
      ],
    });
  },
  component: AnswerPage,
});

function AnswerPage() {
  const { answer: a } = Route.useLoaderData();
  const related = a.related
    .map((slug) => ANSWERS.find((x) => x.slug === slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const managers = (a.managerExamples ?? [])
    .map(findManager)
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

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
            <span className="text-[var(--color-bs-ink-soft)]">{a.navLabel}</span>
          </nav>

          <header className="mt-6">
            <BsEyebrow>music management</BsEyebrow>
            <BsDisplay as="h1" size="md" className="mt-2">
              {a.question}
            </BsDisplay>
          </header>

          {/* The short answer sits above everything, because it is the thing
              a person skimming — or a model summarising — should come away
              with even if they read nothing else. */}
          <div className="mt-7">
            <KeyAnswer>{a.shortAnswer}</KeyAnswer>
          </div>

          <div className="mt-10 space-y-9">
            {a.sections.map((s) => (
              <section key={s.h}>
                <h2 className="bs-display text-2xl md:text-3xl">{s.h}</h2>
                <div className="mt-3">
                  <Paragraphs items={s.p} />
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12">
            <FaqBlock items={a.faq} />
          </div>

          {managers.length ? (
            <section className="mt-12">
              <h2 className="bs-display text-2xl">The managers behind this</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {managers.map((m) => (
                  <li key={m.slug}>
                    <Link to="/managers/$slug" params={{ slug: m.slug }} className="block h-full">
                      <BsCard className="h-full p-4">
                        <span className="font-medium text-[var(--color-bs-ink)]">{m.name}</span>
                        <p className="mt-1 text-sm text-[var(--color-bs-ink-mute)]">
                          {m.known.slice(0, 2).join(" · ")}
                        </p>
                        <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-bs-ink-soft)]">
                          {m.trick.title}
                        </p>
                      </BsCard>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {a.sources?.length ? (
            <div className="mt-12">
              <SourceList sources={a.sources} />
            </div>
          ) : null}

          <div className="mt-10">
            <AuthorBox />
          </div>

          {related.length ? (
            <section className="mt-12">
              <h2 className="bs-display text-2xl">Read next</h2>
              <ul className="mt-4 space-y-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link to="/music-management/$slug" params={{ slug: r.slug }}>
                      <BsCard className="p-4">
                        <span className="font-medium text-[var(--color-bs-ink)]">{r.question}</span>
                      </BsCard>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>

        <footer className="mx-auto mt-16 max-w-4xl border-t border-[var(--color-bs-rule)] pt-6 text-center text-sm text-[var(--color-bs-ink-mute)]">
          <FooterNav />
        </footer>
      </main>
    </div>
  );
}
