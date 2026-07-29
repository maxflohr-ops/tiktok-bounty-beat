import { createFileRoute } from "@tanstack/react-router";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";

const CANONICAL = "https://bountysounds.com/clipping-campaigns";
const TITLE = "Clipping Campaigns for Music Artists — Launch in Minutes";
const DESCRIPTION =
  "Run a TikTok clipping campaign with pay-per-view bounties. List your sound, recruit vetted clippers, and only pay for verified views. Approvals on every payout.";

const FAQ = [
  {
    q: "What is a clipping campaign?",
    a: "You pay short-form editors per view to post clips built on your sound, stream, or keynote — instead of a flat rate for posts nobody watches.",
  },
  {
    q: "What does it cost?",
    a: "$200 lists the campaign for 30 days. The per-view pot is funded separately at a rate you set.",
  },
  {
    q: "Does it have to be music?",
    a: "No. Streams and keynote speeches clip just as well — often better. Anything you own the footage for.",
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
      intro="Post a bounty. Clippers claim it, cut your footage, and deliver TikToks. You approve every payout — no agency fees, no ghost posts."
      primaryCta="launch a campaign — $200 / 30 days"
      primaryHref="/list-sound"
      secondaryCta="see live campaigns"
      secondaryHref="/board"
    >
      <LandingSection title="Why it works">
        <p>
          Clippers already spend all day making edits. Give them footage, a rate, and a brief, and
          you get more variety than any agency — from people paid only when the videos perform.
        </p>
        <ul className="list-disc space-y-3 pl-6">
          <li>Per-view rates you set</li>
          <li>Caps on total spend and claims</li>
          <li>A person approves every payout</li>
          <li>Dispute flow when counts don't line up</li>
        </ul>
      </LandingSection>
      <LandingSection title="Questions">
        <FaqList items={FAQ} />
      </LandingSection>
      <LandingSection title="Related">
        <ul className="list-disc space-y-2 pl-6">
          <li><a href="/keynotes" className="underline hover:text-bone">Keynote campaigns</a></li>
          <li><a href="/for-artists" className="underline hover:text-bone">For artists</a></li>
          <li><a href="/for-editors" className="underline hover:text-bone">For editors</a></li>
        </ul>
      </LandingSection>
    </LandingLayout>
  );
}
