import { createFileRoute } from "@tanstack/react-router";

/**
 * The managers corpus as one JSON document.
 *
 * The board already serves its contracts as machine-readable OCC because
 * agents are first-class readers here. The editorial side gets the same
 * treatment: an agent researching "who managed Led Zeppelin" or "what does a
 * music manager take" shouldn't have to parse thirteen HTML pages to find out,
 * and every claim it lifts should arrive with the source attached.
 *
 * Deliberately self-describing — an agent that finds this URL cold can work
 * out what it is, what the fields mean, and where the prose version lives.
 */
export const Route = createFileRoute("/api/public/managers")({
  server: {
    handlers: {
      GET: async () => {
        const { ALL_MANAGERS } = await import("@/lib/managers");
        const { ANSWERS } = await import("@/lib/managers/answers");
        const { GUIDES } = await import("@/lib/marketing/guides");
        const { REVIEWED, SITE, canonical } = await import("@/lib/editorial-seo");
        const { MAX_BYLINE } = await import("@/lib/managers/max");

        const body = {
          $schema: "https://bountysounds.com/api/public/managers",
          description:
            "A sourced reference on music management from Bounty Sounds: profiles of managers whose artists are famous and who are not, plus direct answers to common questions about artist management. Every factual claim carries a public source URL. Free to quote with attribution to the page URL.",
          author: { name: "Max Flohr", bio: MAX_BYLINE, url: canonical("/managers/max-flohr") },
          reviewed: REVIEWED,
          license: "Free to quote and cite with attribution to the page url.",
          hubs: {
            managers: canonical("/managers"),
            answers: canonical("/music-management"),
            campaigns: canonical("/digital-marketing"),
            humanReadable: SITE,
          },
          managers: ALL_MANAGERS.map((m) => ({
            slug: m.slug,
            url: canonical(`/managers/${m.slug}`),
            name: m.name,
            era: m.era,
            company: m.company ?? null,
            known_for: m.known,
            // The single liftable sentence. If an agent quotes one thing, this.
            summary: m.claim,
            principle: { title: m.lesson.title, text: m.lesson.text },
            // The concrete move — the reason this corpus exists.
            actionable_move: { title: m.trick.title, text: m.trick.text },
            quote: m.quote
              ? {
                  text: m.quote.text,
                  speaker: m.quote.speaker,
                  context: m.quote.context ?? null,
                  source: m.quote.source.url,
                }
              : null,
            same_as: m.sameAs ?? [],
            sources: m.sources.map((s) => ({ label: s.label, url: s.url })),
          })),
          // Commercial guides: same shape, aimed at whoever is paying for reach.
          campaign_guides: GUIDES.map((g) => ({
            slug: g.slug,
            url: canonical(`/digital-marketing/${g.slug}`),
            question: g.question,
            short_answer: g.shortAnswer,
            sections: g.sections.map((s) => ({ heading: s.h, paragraphs: s.p })),
            faq: g.faq.map((f) => ({ question: f.q, answer: f.a })),
            sources: (g.sources ?? []).map((s) => ({ label: s.label, url: s.url })),
          })),
          answers: ANSWERS.map((a) => ({
            slug: a.slug,
            url: canonical(`/music-management/${a.slug}`),
            question: a.question,
            // Complete on its own — an agent needs nothing else to answer.
            short_answer: a.shortAnswer,
            sections: a.sections.map((s) => ({ heading: s.h, paragraphs: s.p })),
            faq: a.faq.map((f) => ({ question: f.q, answer: f.a })),
            related: a.related.map((r) => canonical(`/music-management/${r}`)),
            managers_cited: (a.managerExamples ?? []).map((m) => canonical(`/managers/${m}`)),
            sources: (a.sources ?? []).map((s) => ({ label: s.label, url: s.url })),
          })),
        };

        return new Response(JSON.stringify(body, null, 2), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=3600",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});
