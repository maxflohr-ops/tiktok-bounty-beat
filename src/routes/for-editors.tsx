import { createFileRoute } from "@tanstack/react-router";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";

const CANONICAL = "https://bountysounds.com/for-editors";
const TITLE = "UGC Creator Jobs & TikTok Editing Bounties — Get Paid Per View";
const DESCRIPTION =
  "Real UGC creator jobs for TikTok editors. Claim a music bounty, post an edit using the artist's sound, and get paid per verified view via PayPal, Stripe, or USDC.";

const FAQ = [
  {
    q: "What kind of UGC creator jobs are these?",
    a: "TikTok edits, movie mashups, sound-driven lifestyle clips, and any short-form video that uses the campaign's official TikTok sound. If you already make edits for fun, you can get paid for them here.",
  },
  {
    q: "How do I get paid?",
    a: "Add your TikTok handle and PayPal email when you claim a contract. Once your video hits view thresholds and the payout is approved, funds go to your PayPal or Stripe payout method — or as USDC to a wallet you connect on your dashboard.",
  },
  {
    q: "Is there a minimum follower count?",
    a: "No. What matters is whether your edit gets views. Small accounts with viral edits often out-earn large accounts posting filler.",
  },
  {
    q: "How fast do payouts go out?",
    a: "Every payout is manually reviewed to prevent fraud, usually within a few days of you delivering proof. You'll get an email at each status change.",
  },
];

export const Route = createFileRoute("/for-editors")({
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
  component: ForEditors,
});

function ForEditors() {
  return (
    <LandingLayout
      eyebrow="for tiktok editors & UGC creators"
      h1="UGC creator jobs — get paid per view for TikTok edits"
      intro="Claim a music bounty, post a TikTok using the artist's official sound, and cash in per verified view. No brand outreach, no cold pitching — the contracts are already on the Bounty Board."
      primaryCta="create an account & claim a contract"
      primaryHref="/auth"
      secondaryCta="browse open contracts"
      secondaryHref="/"
    >
      <LandingSection title="What clipping and UGC editors earn here">
        <p>
          Most contracts pay a per-100k-view rate on top of small flat rewards. A single viral edit can pay more than a
          week of freelance UGC gigs — and every claim is first-come-first-served, so early birds on new sounds win big.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Per-view payouts, usually $1 per 100,000 TikTok views</li>
          <li>Flat rewards on some bounties for guaranteed baseline pay</li>
          <li>Dispute flow if the view count on your TikTok doesn't match what the Bounty Board shows</li>
          <li>Payouts via PayPal, Stripe, or USDC to your wallet — you pick</li>
        </ul>
      </LandingSection>
      <LandingSection title="How the workflow goes">
        <ol className="list-decimal space-y-2 pl-6">
          <li>Sign in and browse open contracts on Bounty Board.</li>
          <li>Take a contract — enter your TikTok handle and PayPal email.</li>
          <li>Make and post your edit using the artist's official TikTok sound.</li>
          <li>Paste the TikTok URL as proof. We verify view counts and approve your payout.</li>
        </ol>
      </LandingSection>
      <LandingSection title="Frequently asked questions">
        <FaqList items={FAQ} />
      </LandingSection>
      <LandingSection title="Related">
        <ul className="list-disc space-y-1 pl-6">
          <li><a href="/tiktok-clipper" className="underline hover:text-bone">Become a paid TikTok clipper</a></li>
          <li><a href="/clipping-campaigns" className="underline hover:text-bone">How clipping campaigns work</a></li>
          <li><a href="/for-artists" className="underline hover:text-bone">For music artists & labels</a></li>
        </ul>
      </LandingSection>
    </LandingLayout>
  );
}
