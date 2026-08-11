import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";
import { BetaSignupForm } from "@/components/BetaSignupForm";

const CANONICAL = "https://bountysounds.com/app";
const TITLE = "Bounty Sounds iOS App — Join the TestFlight Beta";
const DESCRIPTION =
  "The bounty board in your pocket: swipe live TikTok clipping contracts, claim a slot, track verified views, and cash out. Join the iOS beta waitlist.";

const FAQ = [
  {
    q: "When does the beta open?",
    a: "No date promises — the build goes to the waitlist through TestFlight the moment it clears Apple's beta review, in signup order. Joining the list is the whole process: the invite arrives by email.",
  },
  {
    q: "What does the app actually do?",
    a: "Everything the board does, one-handed: swipe full-screen contracts, seize a claim, work the four-step checklist, lodge your clip, watch views accrue against the purse, and cash out when they clear. Artists get the other side — post a bounty, fund the purse, review submissions.",
  },
  {
    q: "Is it free?",
    a: "Yes. Clippers never pay anything — the purse is funded by the artist before a contract ever reaches the board.",
  },
  {
    q: "Do I need followers to join?",
    a: "No followers requirement to join the beta. Claiming contracts uses the same rules as the web board: views are what pay, and small accounts with viral edits out-earn big accounts posting filler.",
  },
  {
    q: "Android?",
    a: "Not yet — iPhone first. The web board works on every phone in the meantime, and Android is on the roadmap after launch.",
  },
];

export const Route = createFileRoute("/app")({
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
  component: AppPage,
});

function AppPage() {
  return (
    <LandingLayout
      eyebrow="iOS · TestFlight beta"
      h1="The bounty board, in your pocket"
      intro="Swipe live contracts, seize a claim, and watch verified views pay out — the whole board, rebuilt as a native iPhone app. Join the waitlist and the TestFlight invite comes to your inbox."
      primaryCta="See the live board"
      primaryHref="/board"
      secondaryCta="How it works"
      secondaryHref="/how-it-works"
    >
      <section className="text-center">
        <BetaSignupForm />
        <p className="mt-3 text-sm text-[var(--color-bs-ink-mute)]">
          Two emails, no spam: a welcome note now, the TestFlight invite when the build ships.
        </p>
      </section>

      <LandingSection title="What's in the app">
        <ul className="list-none space-y-3 pl-0">
          <li>
            <strong className="text-[var(--color-bs-ink)]">The board, full screen.</strong> One
            contract per swipe — purse, rate, deadline, and open slots before you commit, same as
            the <Link to="/board" className="underline">web board</Link>.
          </li>
          <li>
            <strong className="text-[var(--color-bs-ink)]">Claims on your desk.</strong> A
            four-step checklist per claim, a countdown on the window, and automatic checks the
            moment you lodge the clip.
          </li>
          <li>
            <strong className="text-[var(--color-bs-ink)]">The purse.</strong> Cleared, pending,
            and lifetime totals with a running ledger — and cash-out confirmed with Face ID.
          </li>
          <li>
            <strong className="text-[var(--color-bs-ink)]">The wire.</strong> A push when a purse
            lands on a sound you clip, when your money clears, and when a claim is about to lapse.
          </li>
          <li>
            <strong className="text-[var(--color-bs-ink)]">Artist mode.</strong> Post a bounty,
            fund the purse, and approve or dispute submissions from your phone.
          </li>
        </ul>
      </LandingSection>

      <LandingSection title="Beta terms, plainly">
        <p>
          Invites go out in signup order. The first twenty testers on the roster get first look at
          new purses for 24 hours before each contract opens to the full board. Beta bounties use
          the same rules as the live board: the purse is posted before you cut, and only verified
          views pay.
        </p>
      </LandingSection>

      <LandingSection title="Questions">
        <FaqList items={FAQ} />
      </LandingSection>
    </LandingLayout>
  );
}
