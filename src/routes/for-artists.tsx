import { createFileRoute } from "@tanstack/react-router";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";

const CANONICAL = "https://bountysounds.com/for-artists";
const TITLE = "TikTok Music Promotion for Artists — Pay Per View | Bounty Sounds";
const DESCRIPTION =
  "Promote your song on TikTok with a pay-per-view bounty. List your sound, set the payout, and watch UGC editors and clippers push real views — you only pay for results.";

const FAQ = [
  {
    q: "How does music promotion on TikTok work here?",
    a: "You list your sound for a flat 30-day campaign fee. Vetted TikTok editors claim the contract, post edits using your song, and submit the TikTok URL. You approve payouts based on verified view counts.",
  },
  {
    q: "What does it cost to promote a song?",
    a: "The listing fee is $200 for a 30-day campaign slot on the board. You separately fund the per-view bounty pot — usually $1 per 100,000 TikTok views — so total spend scales with results, not promises.",
  },
  {
    q: "Who are the editors?",
    a: "Independent UGC creators and TikTok clippers who make edits, movie mashups, and lifestyle content around trending sounds. Every payout is manually approved before money moves.",
  },
  {
    q: "How is this different from a distributor like SoundOn?",
    a: "Distributors get your song onto TikTok's sound library. Bounty Sounds recruits creators to actually use it — with a transparent pay-per-view rate and admin approval on every payout.",
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
      intro="List your sound on The Board and let vetted UGC creators post edits using your track. You approve every payout, so every crown goes to real, verified views."
      primaryCta="list your sound — $200 / 30 days"
      primaryHref="/list-sound"
      secondaryCta="see live contracts"
      secondaryHref="/"
    >
      <LandingSection title="How TikTok music promotion works on Bounty Sounds">
        <ol className="list-decimal space-y-2 pl-6">
          <li>Submit your artist name, song title, and TikTok sound link. Pay the $200 listing fee to open a 30-day campaign.</li>
          <li>We post your contract on The Board with your per-view payout rate (e.g. $1 per 100k views).</li>
          <li>Editors claim the contract, publish TikToks using your sound, and paste their video URL as proof.</li>
          <li>We verify view counts, approve payouts, and disburse via PayPal or Stripe.</li>
        </ol>
      </LandingSection>
      <LandingSection title="Why pay-per-view beats flat-fee song promotion">
        <p>
          Most TikTok music promotion services charge a lump sum for a fixed number of posts — with no guarantee anyone
          watches them. A bounty flips that model: creators are motivated to make edits that <em>actually pop</em> because
          their payout scales with real views.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Transparent per-100k-view pricing you set</li>
          <li>Manual approval on every payout — no autopilot spending</li>
          <li>Dispute workflow when views don't match evidence</li>
          <li>Every submission logged to your team's Sheets and Airtable</li>
        </ul>
      </LandingSection>
      <LandingSection title="Frequently asked questions">
        <FaqList items={FAQ} />
      </LandingSection>
      <LandingSection title="Related">
        <ul className="list-disc space-y-1 pl-6">
          <li><a href="/clipping-campaigns" className="underline hover:text-bone">How clipping campaigns work</a></li>
          <li><a href="/for-editors" className="underline hover:text-bone">For TikTok editors & UGC creators</a></li>
          <li><a href="/list-sound" className="underline hover:text-bone">List your sound — $200 / 30 days</a></li>
        </ul>
      </LandingSection>
    </LandingLayout>
  );
}
