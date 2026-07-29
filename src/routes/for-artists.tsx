import { createFileRoute } from "@tanstack/react-router";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";

const CANONICAL = "https://bountysounds.com/for-artists";
const TITLE = "TikTok Music Promotion for Artists — Pay Per View | Bounty Sounds";
const DESCRIPTION =
  "Promote your song on TikTok with a pay-per-view bounty. List your sound, set the payout, and watch UGC editors and clippers push real views — you only pay for results.";

const FAQ = [
  {
    q: "What does it cost?",
    a: "$200 lists your sound for 30 days. You fund the per-view pot separately, so spend scales with results, not promises.",
  },
  {
    q: "Who are the editors?",
    a: "Independent clippers who already make edits around trending sounds. Every payout is reviewed before money moves.",
  },
  {
    q: "How is this different from a distributor?",
    a: "Distributors get your song into TikTok's library. We recruit creators to actually use it — at a per-view rate you set.",
  },
];

export const Route = createFileRoute("/for-artists")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: ForArtists,
});

function ForArtists() {
  return (
    <LandingLayout
      eyebrow="for music artists & labels"
      h1="Promote your song on TikTok — pay per view, not per promise"
      intro="List your sound, set a rate, and let editors post edits with your track. Every payout is approved against verified views."
      primaryCta="list your sound — $200 / 30 days"
      primaryHref="/list-sound"
      secondaryCta="see live contracts"
      secondaryHref="/board"
    >
      <LandingSection title="How it works">
        <ol className="list-decimal space-y-3 pl-6">
          <li>Submit your artist name, song, and TikTok sound link — $200 opens a 30-day campaign.</li>
          <li>Your contract goes on the board with the per-view rate you set.</li>
          <li>Editors claim it, post TikToks with your sound, and deliver the links.</li>
          <li>We verify views; you pay for results only.</li>
        </ol>
      </LandingSection>
      <LandingSection title="Why per-view beats flat-fee">
        <p>
          Flat-fee promo buys posts nobody watches. A bounty pays editors to make the edit that
          actually pops — their money scales with your views.
        </p>
        <ul className="list-disc space-y-3 pl-6">
          <li>You set the per-100k rate</li>
          <li>Every payout approved by a person</li>
          <li>Dispute flow when numbers don't match</li>
        </ul>
      </LandingSection>
      <LandingSection title="Questions">
        <FaqList items={FAQ} />
      </LandingSection>
      <LandingSection title="Related">
        <ul className="list-disc space-y-2 pl-6">
          <li><a href="/clipping-campaigns" className="underline hover:text-bone">How campaigns work</a></li>
          <li><a href="/for-editors" className="underline hover:text-bone">For editors</a></li>
        </ul>
      </LandingSection>
    </LandingLayout>
  );
}
