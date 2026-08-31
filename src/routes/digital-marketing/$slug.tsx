import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { BsCard, BsDisplay, BsEyebrow } from "@/components/bs";
import { GUIDES, guideBySlug } from "@/lib/marketing/guides";
import {
  AuthorBox,
  FaqBlock,
  KeyAnswer,
  Paragraphs,
  SourceList,
} from "@/components/managers/Prose";
import { articleJsonLd, breadcrumbs, faqJsonLd, headFor } from "@/lib/editorial-seo";

export const Route = createFileRoute("/digital-marketing/$slug")({
  loader: ({ params }) => {
    const guide = guideBySlug(params.slug);
    if (!guide) throw notFound();
    return { guide };
  },
  head: ({ params }) => {
    const g = guideBySlug(params.slug);
    if (!g) return {};
    const path = `/digital-marketing/${g.slug}`;
    return headFor({
      title: g.seo.title,
      description: g.seo.description,
      path,
      jsonLd: [
        breadcrumbs([
          { name: "Bounty Sounds", path: "/" },
          { name: "Digital marketing", path: "/digital-marketing" },
          { name: g.navLabel, path },
        ]),
        articleJsonLd({
          headline: g.question,
          description: g.shortAnswer,
          path,
          citations: g.sources,
        }),
        faqJsonLd([{ q: g.question, a: g.shortAnswer }, ...g.faq]),
      ],
    });
  },
  component: GuidePage,
});

function GuidePage() {
  const { guide: g } = Route.useLoaderData();
  const related = g.related
    .map((slug) => GUIDES.find((x) => x.slug === slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <div className="bs-surface min-h-screen">
      <SiteHeader />
      <main className="container-board py-10 md:py-14">
        <article className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-[var(--color-bs-ink-mute)]">
            <Link to="/digital-marketing" className="hover:text-[var(--color-bs-ink)]">
              Digital marketing
            </Link>
            <span aria-hidden> / </span>
            <span className="text-[var(--color-bs-ink-soft)]">{g.navLabel}</span>
          </nav>

          <header className="mt-6">
            <BsEyebrow>running a campaign</BsEyebrow>
            <BsDisplay as="h1" size="md" className="mt-2">
              {g.question}
            </BsDisplay>
          </header>

          <div className="mt-7">
            <KeyAnswer>{g.shortAnswer}</KeyAnswer>
          </div>

          <div className="mt-10 space-y-9">
            {g.sections.map((s) => (
              <section key={s.h}>
                <h2 className="bs-display text-2xl md:text-3xl">{s.h}</h2>
                <div className="mt-3">
                  <Paragraphs items={s.p} />
                </div>
              </section>
            ))}
          </div>

          {/* The commercial cluster earns a CTA the editorial cluster doesn't:
              a reader this far down is deciding how to spend a budget. */}
          <section className="mt-12 border-2 border-[var(--color-bs-ink)] p-6 text-center">
            <p className="mx-auto max-w-xl text-[var(--color-bs-ink-soft)]">{g.cta.line}</p>
            <div className="mt-5">
              <Link to={g.cta.href} className="bs-btn">
                {g.cta.label}
              </Link>
            </div>
          </section>

          <div className="mt-12">
            <FaqBlock items={g.faq} />
          </div>

          {g.sources?.length ? (
            <div className="mt-12">
              <SourceList sources={g.sources} />
            </div>
          ) : null}

          <div className="mt-10">
            <AuthorBox />
          </div>

          {related.length || g.readAlso?.length ? (
            <section className="mt-12">
              <h2 className="bs-display text-2xl">Read next</h2>
              <ul className="mt-4 space-y-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link to="/digital-marketing/$slug" params={{ slug: r.slug }}>
                      <BsCard className="p-4">
                        <span className="font-medium text-[var(--color-bs-ink)]">{r.question}</span>
                      </BsCard>
                    </Link>
                  </li>
                ))}
                {(g.readAlso ?? []).map((r) => (
                  <li key={r.to}>
                    <a href={r.to}>
                      <BsCard className="p-4">
                        <span className="font-medium text-[var(--color-bs-ink)]">{r.label}</span>
                      </BsCard>
                    </a>
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
