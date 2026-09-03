import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { Reveal } from "@/components/Reveal";
import { GuillocheRosette, InkCardinal, InkScrawl } from "@/components/ArtMarks";

const TITLE = "How It Works · Bounty Sounds";
const DESC =
  "Claim a contract, post the clip from your own TikTok, deliver the link, get paid for verified views. The whole flow, start to payout.";
const URL = "https://bountysounds.com/how-it-works";

const FAQ = [
  {
    q: "Can I clip from more than one TikTok account?",
    a: "Yes — and you can claim up to 15 clip slots on one contract. An account earns trusted status once a clip gets approved.",
  },
  {
    q: "What if TikTok remaps my audio?",
    a: "Put #bountysounds in your caption and deliver anyway. A mismatch is a note for the reviewer, never an auto-reject.",
  },
  {
    q: "Do I need a follower minimum?",
    a: "No. If your clip earns verified views, it earns the rate.",
  },
  {
    q: "When are views counted?",
    a: "Each clip gets a counting window — usually 14 days from delivery. At the close, views are verified and the payout goes out pro-rata to your PayPal or USDC wallet.",
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
    body: "Pick a bounty. Rate, purse, and deadline are printed on it before you commit.",
  },
  {
    n: "02",
    title: "Post",
    body: "Cut the clip and post it from your own TikTok with the contract's sound or footage.",
  },
  {
    n: "03",
    title: "Prove",
    body: "Paste your video link on the contract page. That's the whole delivery.",
  },
  {
    n: "04",
    title: "Get paid",
    body: "Your clip's counting window closes, views are verified, and the payout lands pro-rata.",
  },
];

function HowItWorksPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <section className="container-board relative overflow-hidden pt-16 pb-14 text-center md:pt-24">
        <GuillocheRosette className="absolute -right-28 top-6 w-80 opacity-[0.05]" />
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
        <Reveal from="left">
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
          <Link to="/board" className="silver-btn px-7">
            Open the Bounty Board
          </Link>
          <Link to="/payouts" className="ink-btn px-7">
            How payouts work
          </Link>
        </div>
      </section>

      {/* The checks — short and honest */}
      <section className="bg-[var(--wall-2)] py-16">
        <div className="container-board text-center">
          <Reveal from="right">
            <p className="label-cap">What we check</p>
            <h2 className="mx-auto mt-3 max-w-xl text-3xl md:text-4xl">Three things. No tricks.</h2>
            <div className="mx-auto mt-8 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
              <div>
                <p className="font-display text-lg text-bone">Your account</p>
                <p className="mt-1 text-sm text-bone-soft">
                  The clip has to come from a TikTok on your profile. Add as many as you post from.
                </p>
              </div>
              <div>
                <p className="font-display text-lg text-bone">The sound</p>
                <p className="mt-1 text-sm text-bone-soft">
                  We look for the contract's sound. A remap is a note, never a rejection.
                </p>
              </div>
              <div>
                <p className="font-display text-lg text-bone">The tag</p>
                <p className="mt-1 text-sm text-bone-soft">
                  #bountysounds in your caption backs you up when the match gets weird.
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
        <p className="text-bone-soft">Posting a bounty instead of clipping one?</p>
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link
            to="/for-artists"
            className="inline-flex min-h-[44px] items-center underline underline-offset-4 hover:text-bone md:min-h-0"
          >
            For artists
          </Link>
          <Link
            to="/keynotes"
            className="inline-flex min-h-[44px] items-center underline underline-offset-4 hover:text-bone md:min-h-0"
          >
            Keynote campaigns
          </Link>
          <Link
            to="/clipping-campaigns"
            className="inline-flex min-h-[44px] items-center underline underline-offset-4 hover:text-bone md:min-h-0"
          >
            Campaigns end to end
          </Link>
        </nav>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="container-board flex flex-col items-center gap-3 py-10 text-center text-xs text-bone-soft">
          <FooterNav />
          <span>© {new Date().getFullYear()} Bounty Sounds</span>
        </div>
      </footer>
    </div>
  );
}
