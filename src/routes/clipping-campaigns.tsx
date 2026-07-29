import { createFileRoute } from "@tanstack/react-router";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";

const CANONICAL = "https://bountysounds.com/clipping-campaigns";
const TITLE = "Clipping Campaigns for Music Artists — Launch in Minutes";
const DESCRIPTION =
  "Run a TikTok clipping campaign with pay-per-view bounties. List your sound, recruit vetted clippers, and only pay for verified views. Approvals on every payout.";

const FAQ = [
  {
    q: "What is a clipping campaign?",
    a: "A clipping campaign hires short-form video editors ('clippers') to post edits, movie mashups, or reaction clips using a specific sound — usually paying per view rather than a flat rate per post.",
  },
  {
    q: "How much does a clipping campaign cost?",
    a: "$200 lists your campaign on the Bounty Board for 30 days. You separately fund the per-view pot at a rate you set. That way small campaigns stay affordable and big ones scale with performance.",
  },
  {
    q: "Can I run a clipping campaign for a movie, brand, or podcast — not music?",
    a: "Right now the Bounty Board is built around music sounds so we can verify usage via TikTok's official sound link. Non-music campaigns are on the roadmap.",
  },
];

export const Route = createFileRoute("/clipping-campaigns")({
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
  component: ClippingCampaigns,
});

function ClippingCampaigns() {
  return (
    <LandingLayout
      eyebrow="clipping campaigns"
      h1="Run a pay-per-view TikTok clipping campaign"
      intro="Post a bounty. Vetted clippers claim it, edit with your sound, and deliver TikToks. You approve every payout — no lump-sum agency fees, no ghost posts."
      primaryCta="launch a campaign — $200 / 30 days"
      primaryHref="/list-sound"
      secondaryCta="see live campaigns"
      secondaryHref="/"
    >
      <LandingSection title="Why clipping campaigns work">
        <p>
          Clippers already spend all day making edits. Give them a sound, a payout rate, and a clear brief and they'll
          produce more variety than any single agency ever could — and their income depends on the videos actually
          performing.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Per-view payouts you set (e.g. $1 per 100k views)</li>
          <li>Optional caps on total spend and number of claims</li>
          <li>Every submission logged to Airtable + Google Sheets</li>
          <li>Dispute workflow when view counts don't line up</li>
        </ul>
      </LandingSection>
      <LandingSection title="Everything you need on one board">
        <ul className="list-disc space-y-2 pl-6">
          <li>Live view tracking on submitted TikToks</li>
          <li>Manual payout approvals for every disbursement</li>
          <li>Editor leaderboard so top clippers earn a reputation</li>
          <li>Notifications on every claim, delivery, and dispute</li>
        </ul>
      </LandingSection>
      <LandingSection title="Frequently asked questions">
        <FaqList items={FAQ} />
      </LandingSection>
      <LandingSection title="Related">
        <ul className="list-disc space-y-1 pl-6">
          <li><a href="/for-artists" className="underline hover:text-bone">TikTok music promotion for artists</a></li>
          <li><a href="/for-editors" className="underline hover:text-bone">UGC creator jobs for editors</a></li>
          <li><a href="/list-sound" className="underline hover:text-bone">List your sound — $200 / 30 days</a></li>
        </ul>
      </LandingSection>
    </LandingLayout>
  );
}
