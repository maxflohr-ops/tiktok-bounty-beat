import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal } from "@/components/Reveal";
import { InkCardinal, InkScrawl } from "@/components/ArtMarks";

const TITLE = "How It Works · Bounty Sounds";
const DESC =
  "Claim a contract, post the clip from your own TikTok, deliver the link, get paid for verified views. The whole flow, start to payout.";
const URL = "https://bountysounds.com/how-it-works";

const FAQ = [
  {
    q: "Can I clip from more than one TikTok account?",
    a: "Yes. Add every account you post from on your dashboard. Deliveries are checked against your accounts, and an account earns trusted status once a clip from it gets approved.",
  },
  {
    q: "What if TikTok remaps the audio on my clip?",
    a: "It happens. Put #bountysounds in your caption and deliver anyway — nothing gets auto-rejected. A sound mismatch just becomes a note for the reviewer.",
  },
  {
    q: "Do I need a follower minimum?",
    a: "No. The board is public — no invite, no gated Discord, no minimum. If your clip earns verified views, it earns the rate.",
  },
  {
    q: "When does the money actually move?",
    a: "After review. Views are verified against the contract's rate, the payout is approved, and it goes out to your PayPal or USDC wallet.",
  },
];

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
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
  component: HowItWorksPage,
});

const STEPS = [
  {
    n: "01",
    title: "Claim",
    body: "Pick a contract on the board. The rate, the pot, and the deadline are printed on it before you commit.",
  },
  {
    n: "02",
    title: "Post",
    body: "Make the clip and post it from your own TikTok, using the contract's sound or footage. The brief travels with the contract.",
  },
  {
    n: "03",
    title: "Prove",
    body: "Paste your video link on the contract page. We check it came from one of your accounts — that's the whole delivery.",
  },
  {
    n: "04",
    title: "Get paid",
    body: "Views get verified, the payout gets approved, and the money lands in your PayPal or USDC wallet.",
  },
];

function HowItWorksPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <section className="container-board pt-16 pb-14 text-center md:pt-24">
        <p className="label-cap">How it works</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl leading-[1.05] md:text-6xl">
          Four steps.
          <br />
          Then a payout.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-bone-soft">
          No invite, no gated Discord. Anyone can claim a contract.
        </p>
        <InkScrawl className="mx-auto mt-6 w-56 opacity-70" />
      </section>

      <section className="container-board pb-16">
        <Reveal>
          <ol className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.n} className="border border-[var(--color-bs-rule)] bg-white p-6">
                <span className="terminal text-xs text-[var(--gold)]">{s.n}</span>
                <h2 className="mt-2 font-display text-2xl text-bone">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-bone-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/board" className="silver-btn px-7">Open the Bounty Board</Link>
          <Link to="/payouts" className="ink-btn px-7">How payouts work</Link>
        </div>
      </section>

      {/* The checks — short and honest */}
      <section className="bg-[var(--wall-2)] py-16">
        <div className="container-board text-center">
          <Reveal>
            <p className="label-cap">What we check</p>
            <h2 className="mx-auto mt-3 max-w-xl text-3xl md:text-4xl">Three things. No tricks.</h2>
            <div className="mx-auto mt-8 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
              <div>
                <p className="font-display text-lg text-bone">Your account</p>
                <p className="mt-1 text-sm text-bone-soft">
                  The clip has to come from a TikTok on your profile. You can add as many accounts as you post from.
                </p>
              </div>
              <div>
                <p className="font-display text-lg text-bone">The sound</p>
                <p className="mt-1 text-sm text-bone-soft">
                  We look for the contract's sound on your video. TikTok sometimes remaps audio — that's a note, never a rejection.
                </p>
              </div>
              <div>
                <p className="font-display text-lg text-bone">The tag</p>
                <p className="mt-1 text-sm text-bone-soft">
                  #bountysounds in your caption backs you up when the sound match gets weird.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-board py-16">
        <h2 className="text-center text-3xl md:text-4xl">Common questions</h2>
        <dl className="mx-auto mt-8 max-w-2xl divide-y divide-[var(--border)]">
          {FAQ.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="font-display text-lg text-bone">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-bone-soft">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Funders pointer */}
      <section className="container-board pb-20 text-center">
        <InkCardinal accent className="mx-auto mb-4 w-28" />
        <p className="text-bone-soft">
          Funding a campaign instead of clipping one?
        </p>
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link to="/for-artists" className="underline underline-offset-4 hover:text-bone">For artists</Link>
          <Link to="/keynotes" className="underline underline-offset-4 hover:text-bone">Keynote campaigns</Link>
          <Link to="/clipping-campaigns" className="underline underline-offset-4 hover:text-bone">Campaigns end to end</Link>
        </nav>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="container-board flex flex-col items-center gap-3 py-10 text-center text-xs text-bone-soft">
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/board" className="hover:text-bone">Board</Link>
            <Link to="/payouts" className="hover:text-bone">Payouts</Link>
            <Link to="/for-artists" className="hover:text-bone">For artists</Link>
            <Link to="/for-editors" className="hover:text-bone">For editors</Link>
            <Link to="/keynotes" className="hover:text-bone">Keynotes</Link>
            <Link to="/list-sound" className="hover:text-bone">List a sound</Link>
          </nav>
          <span>© {new Date().getFullYear()} Bounty Sounds</span>
        </div>
      </footer>
    </div>
  );
}
