import { createFileRoute } from "@tanstack/react-router";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";
import { partnerGoHref } from "@/lib/partners";

const CANONICAL = "https://bountysounds.com/clipping-teams";
const TITLE = "Join Our Clipping Teams — Discord + Partner Crews · Bounty Sounds";
const DESCRIPTION =
  "Join the Bounty Sounds clipping crew: an open Discord with live bounty pings, plus our teams on partner platforms for more paid campaigns. Free to join.";

// The crew roster. Adding a team = one entry here (plus its PARTNERS row if
// the link should be tracked through /api/go).
const TEAMS = [
  {
    id: "discord",
    name: "Bounty Clips and Sounds — Discord",
    blurb:
      "The crew's harbor. New bounties ping the moment they post, payouts land as receipts in #payout-log, and clippers trade cuts in the HQ. Open to everyone — no invite gate.",
    cta: "join the discord",
  },
  {
    id: "clipping",
    name: "Our team on Clipping.net",
    blurb:
      "More paid campaigns beyond this board. Ride under our flag on clipping.net and pick up work there when the board is quiet — campaigns pay on their platform, per their rates.",
    cta: "join the clipping.net team",
  },
] as const;

const FAQ = [
  {
    q: "Does joining cost anything?",
    a: "No. The Discord is open and free, and partner teams are free to join. Claiming bounties on the board never requires either.",
  },
  {
    q: "Who pays me?",
    a: "Whoever hosts the campaign. Board contracts pay from the posted purse after review. Campaigns on partner platforms pay on that platform, at that platform's rates.",
  },
  {
    q: "Why join through your links?",
    a: "Team links are referrals — recruits cut for the board's purse at no cost to you. It's how the harbor keeps the lights on.",
  },
] as const;

export const Route = createFileRoute("/clipping-teams")({
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
  component: ClippingTeams,
});

function ClippingTeams() {
  return (
    <LandingLayout
      eyebrow="the crew"
      h1="Join our clipping teams"
      intro="One board, many crews. Get bounty pings the second contracts post, swap cuts with other clippers, and ride with our teams on partner platforms when you want more work than the board holds."
      primaryCta="join the discord"
      primaryHref={partnerGoHref("discord")}
      secondaryCta="browse live bounties"
      secondaryHref="/board"
    >
      <LandingSection title="The teams">
        <ul className="space-y-6">
          {TEAMS.map((t) => (
            <li key={t.id} className="border border-[var(--border)] p-4">
              <h3 className="font-display text-xl text-bone">{t.name}</h3>
              <p className="mt-2 text-bone-soft">{t.blurb}</p>
              <a
                href={partnerGoHref(t.id)}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="silver-btn mt-4 inline-flex"
              >
                {t.cta}
              </a>
            </li>
          ))}
        </ul>
        <p className="pt-2 text-xs text-[var(--color-bs-ink-mute)]">
          Team links are referrals — joining through them supports the board at no cost to you.
        </p>
      </LandingSection>
      <LandingSection title="Questions">
        <FaqList items={[...FAQ]} />
      </LandingSection>
      <LandingSection title="Related">
        <ul className="list-disc space-y-2 pl-6">
          <li><a href="/for-editors" className="underline hover:text-bone">Get paid to edit TikToks</a></li>
          <li><a href="/tiktok-clipper" className="underline hover:text-bone">Become a TikTok clipper</a></li>
          <li><a href="/board" className="underline hover:text-bone">The Bounty Board</a></li>
        </ul>
      </LandingSection>
    </LandingLayout>
  );
}
