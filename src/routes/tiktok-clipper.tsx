import { createFileRoute } from "@tanstack/react-router";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";

const CANONICAL = "https://bountysounds.com/tiktok-clipper";
const TITLE = "Become a Paid TikTok Clipper — Bounties Posted Daily";
const DESCRIPTION =
  "Become a paid TikTok clipper. Claim music bounties, post edits, and cash in per verified view. Independent, remote, and paid via PayPal or Stripe.";

const FAQ = [
  {
    q: "What does a TikTok clipper do?",
    a: "A clipper takes existing content — songs, movie scenes, podcast moments, gameplay — and edits it into short-form TikTok videos, usually built around a specific trending sound.",
  },
  {
    q: "Do I need my own TikTok account?",
    a: "Yes. You'll enter your TikTok handle when you claim a contract so we can verify your posts and view counts.",
  },
  {
    q: "How much can I make as a TikTok clipper?",
    a: "It scales with views. On a $1 per 100k views contract, a clip with 500k views pays $5; a viral edit at 5M views pays $50. Stack multiple contracts and one good week of edits can pay serious money.",
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
      h1="Get paid to clip — TikTok music bounties on The Board"
      intro="If you already make TikTok edits, you're leaving money on the table. Claim music bounties, post your clip, and cash in per verified view."
      primaryCta="sign in and claim a bounty"
      primaryHref="/auth"
      secondaryCta="browse open bounties"
      secondaryHref="/"
    >
      <LandingSection title="Why clippers use Bounty Sounds">
        <ul className="list-disc space-y-2 pl-6">
          <li>Bounties are open — first-come-first-served, no application form</li>
          <li>Per-view payouts, so a single viral edit is a serious payday</li>
          <li>Payouts via PayPal or Stripe, on your schedule</li>
          <li>Dispute flow if the TikTok view count doesn't match the board</li>
          <li>Leaderboard so consistent clippers build a public track record</li>
        </ul>
      </LandingSection>
      <LandingSection title="How to start clipping today">
        <ol className="list-decimal space-y-2 pl-6">
          <li>Sign in with Google — takes ten seconds.</li>
          <li>Browse open contracts and take one that fits your style.</li>
          <li>Add your TikTok handle and PayPal email.</li>
          <li>Post your edit using the campaign's official TikTok sound.</li>
          <li>Paste the TikTok URL as proof and wait for approval.</li>
        </ol>
      </LandingSection>
      <LandingSection title="Frequently asked questions">
        <FaqList items={FAQ} />
      </LandingSection>
      <LandingSection title="Related">
        <ul className="list-disc space-y-1 pl-6">
          <li><a href="/for-editors" className="underline hover:text-bone">UGC creator jobs for editors</a></li>
          <li><a href="/clipping-campaigns" className="underline hover:text-bone">How clipping campaigns work</a></li>
          <li><a href="/for-artists" className="underline hover:text-bone">For music artists & labels</a></li>
        </ul>
      </LandingSection>
    </LandingLayout>
  );
}
