import { createFileRoute } from "@tanstack/react-router";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";

const CANONICAL = "https://bountysounds.com/tiktok-clipper";
const TITLE = "Become a Paid TikTok Clipper — Bounties Posted Daily";
const DESCRIPTION =
  "Become a paid TikTok clipper. Claim music bounties, post edits, and cash in per verified view. Independent, remote, and paid via PayPal, Stripe, or USDC.";

const FAQ = [
  {
    q: "What does a clipper do?",
    a: "Cuts songs, streams, keynotes, or gameplay into short TikToks — usually built around a specific sound.",
  },
  {
    q: "Do I need my own TikTok?",
    a: "Yes. Your handle goes on the claim so we can verify your posts. You can add several accounts.",
  },
  {
    q: "How much can I make?",
    a: "It scales with views: on a $5 per 100k contract, a 2M-view edit pays $100. Stack contracts and a good week adds up.",
  },
];

export const Route = createFileRoute("/tiktok-clipper")({
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
  component: TiktokClipperPage,
});

function TiktokClipperPage() {
  return (
    <LandingLayout
      eyebrow="paid tiktok clippers"
      h1="Get paid to clip — TikTok music bounties on Bounty Board"
      intro="If you already make TikTok edits, you're leaving money on the table. Claim a bounty, post your clip, cash in per verified view."
      primaryCta="sign in and claim a bounty"
      primaryHref="/auth"
      primaryReturnTo="/board"
      secondaryCta="browse open bounties"
      secondaryHref="/board"
    >
      <LandingSection title="Why clippers use Bounty Sounds">
        <ul className="list-disc space-y-3 pl-6">
          <li>Open bounties — first come, first served, no application</li>
          <li>Per-view payouts, so one viral edit is a real payday</li>
          <li>PayPal or USDC, your pick</li>
          <li>A public leaderboard for consistent clippers</li>
        </ul>
      </LandingSection>
      <LandingSection title="Start today">
        <ol className="list-decimal space-y-3 pl-6">
          <li>Sign in with Google.</li>
          <li>Take a contract that fits your style.</li>
          <li>Post your edit with the campaign's sound.</li>
          <li>Paste the link as proof. Approval, then payout.</li>
        </ol>
      </LandingSection>
      <LandingSection title="Questions">
        <FaqList items={FAQ} />
      </LandingSection>
      <LandingSection title="Related">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <a
              href="/for-editors"
              className="inline-flex min-h-[44px] items-center underline hover:text-bone md:min-h-0"
            >
              For editors — live campaigns
            </a>
          </li>
          <li>
            <a
              href="/clipping-campaigns"
              className="inline-flex min-h-[44px] items-center underline hover:text-bone md:min-h-0"
            >
              How campaigns work
            </a>
          </li>
        </ul>
      </LandingSection>
    </LandingLayout>
  );
}
