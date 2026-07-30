import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal } from "@/components/Reveal";
import { GuillocheBand, GuillocheRosette, InkDogwood, InkScrawl } from "@/components/ArtMarks";

const TITLE = "Payouts · Bounty Sounds";
const DESC =
  "Where the money comes from and how it reaches you: funded pots, per-100k-view rates, review, and payouts to PayPal or a USDC wallet.";
const URL = "https://bountysounds.com/payouts";

export const Route = createFileRoute("/payouts")({
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
  }),
  component: PayoutsPage,
});

function PayoutsPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <section className="container-board relative overflow-hidden pt-16 pb-14 text-center md:pt-24">
        <GuillocheRosette className="absolute -left-28 top-6 w-80 opacity-[0.05]" />
        <p className="label-cap">Payouts</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl leading-[1.05] md:text-6xl">
          The money is on
          <br />
          the contract.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-bone-soft">
          Every pot is funded before you claim. Every rate is printed before you post.
        </p>
        <InkScrawl className="mx-auto mt-6 w-56 opacity-70" />
      </section>

      <section className="container-board pb-16">
        <Reveal>
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            <div className="border border-[var(--color-bs-rule)] bg-white p-6">
              <h2 className="font-display text-2xl text-bone">The pot</h2>
              <p className="mt-2 text-sm leading-relaxed text-bone-soft">
                Whoever posts the contract funds it up front. The pot — and everything already
                paid from it — is public on the card.
              </p>
            </div>
            <div className="border border-[var(--color-bs-rule)] bg-white p-6">
              <h2 className="font-display text-2xl text-bone">The rate</h2>
              <p className="mt-2 text-sm leading-relaxed text-bone-soft">
                Most contracts pay per 100,000 verified views. Some pay flat per approved clip.
                Either way, the number is on the contract before you claim.
              </p>
            </div>
            <div className="border border-[var(--color-bs-rule)] bg-white p-6">
              <h2 className="font-display text-2xl text-bone">The payout</h2>
              <p className="mt-2 text-sm leading-relaxed text-bone-soft">
                Each clip's views count for a set window — usually 14 days. At the close
                they're verified and paid pro-rata to your PayPal or USDC wallet.
              </p>
            </div>
          </div>
        </Reveal>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/board" className="silver-btn px-7">See the live rates</Link>
          <Link to="/how-it-works" className="ink-btn px-7">The full flow</Link>
        </div>
      </section>

      <section className="bg-[var(--wall-2)] py-16">
        <div className="container-board text-center">
          <GuillocheBand className="mx-auto mb-8 max-w-2xl opacity-[0.12]" />
          <Reveal>
            <p className="label-cap">Out in the open</p>
            <h2 className="mx-auto mt-3 max-w-xl text-3xl md:text-4xl">
              Paid clippers make the leaderboard.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-bone-soft">
              The board shows who got paid this week and how much each campaign has paid out
              so far. If the numbers were embarrassing, we couldn't put them there.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-board relative overflow-hidden py-16 text-center">
        <InkDogwood className="absolute -bottom-8 right-0 w-44 rotate-[5deg] opacity-[0.08] md:w-56" />
        <h2 className="mx-auto max-w-xl text-3xl md:text-4xl">Getting paid in USDC</h2>
        <p className="mx-auto mt-4 max-w-md text-bone-soft">
          Connect a wallet on your dashboard — or paste an address — and approved payouts can
          settle in USDC instead of PayPal.
        </p>
        <Link to="/dashboard" className="silver-btn mt-7 inline-flex px-7">Add a wallet</Link>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="container-board flex flex-col items-center gap-3 py-10 text-center text-xs text-bone-soft">
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/board" className="hover:text-bone">Board</Link>
            <Link to="/how-it-works" className="hover:text-bone">How it works</Link>
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
