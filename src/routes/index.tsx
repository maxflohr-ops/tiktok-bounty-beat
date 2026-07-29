import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties } from "@/lib/bounties.functions";
import { SiteHeader } from "@/components/SiteHeader";

const HOME_TITLE = "Bounty Sounds — Every sound has a bounty.";
const HOME_DESC =
  "Artists fund a pot for their sound. You post the clip. Verified views pay out — via PayPal or Stripe. Funded pots, checked deliveries, real payouts.";
const HOME_URL = "https://bountysounds.com/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESC },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: HOME_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: HOME_TITLE },
      { name: "twitter:description", content: HOME_DESC },
    ],
    links: [{ rel: "canonical", href: HOME_URL }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const listFn = useServerFn(listPublicBounties);
  const { data: bounties = [] } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
    retry: false,
  });
  const openCount = bounties.filter(
    (b) => b.status !== "expired" && b.status !== "fulfilled" && b.status !== "closed",
  ).length;

  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="container-board pt-20 pb-24 text-center md:pt-28 md:pb-32">
        <p className="label-cap">Bounty Sounds</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl leading-[1.05] md:text-7xl">
          Every sound
          <br />
          has a bounty.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-xl text-bone-soft">
          Artists fund it. You post the clip.
          Verified views pay out.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/taste" className="silver-btn px-7">
            Find your bounty
          </Link>
          <Link to="/board" className="ink-btn px-7">
            {openCount > 0 ? `Browse all ${openCount}` : "Browse the board"}
          </Link>
        </div>
        <p className="mt-4 text-sm text-bone-soft">Three taps. No account needed.</p>
      </section>

      {/* Clippers — black band */}
      <section className="bg-[#000] py-24 text-center text-white md:py-32">
        <div className="container-board">
          <p className="label-cap text-[#86868b]">For clippers</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl leading-tight text-white md:text-6xl">
            Your edits.
            <br />
            Their marketing budget.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#a1a1a6]">
            Every contract states its rate, its pot, and its deadline before you touch it.
            Post from your own account, with the contract's sound. Views are verified.
            The pot pays out.
          </p>
          <div className="mx-auto mt-12 grid max-w-3xl gap-px overflow-hidden rounded-2xl bg-[#333] sm:grid-cols-3">
            <div className="bg-[#111] p-8">
              <p className="text-3xl font-semibold text-white">Claim</p>
              <p className="mt-2 text-sm text-[#a1a1a6]">a contract from the board.</p>
            </div>
            <div className="bg-[#111] p-8">
              <p className="text-3xl font-semibold text-white">Post</p>
              <p className="mt-2 text-sm text-[#a1a1a6]">a TikTok with the sound.</p>
            </div>
            <div className="bg-[#111] p-8">
              <p className="text-3xl font-semibold text-white">Get paid</p>
              <p className="mt-2 text-sm text-[#a1a1a6]">per clip or per 100k views.</p>
            </div>
          </div>
          <Link to="/for-editors" className="mt-10 inline-block text-sm text-white underline underline-offset-4">
            Learn more about clipping
          </Link>
        </div>
      </section>

      {/* Artists — white band */}
      <section className="container-board py-24 text-center md:py-32">
        <p className="label-cap">For artists</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-4xl leading-tight md:text-6xl">
          Pay for reach.
          <br />
          Not promises.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-bone-soft">
          List your sound. Set your rate. Fund the pot.
          Clippers compete to make edits that perform — and you approve every payout
          against verified views. Unspent pot stays yours.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/list-sound" className="silver-btn px-7">
            List your sound
          </Link>
          <Link to="/for-artists" className="ink-btn px-7">
            Learn more
          </Link>
        </div>
        <p className="mt-4 text-sm text-bone-soft">$200 listing. 30 days on the board.</p>
      </section>

      {/* Trust — gray band */}
      <section className="bg-[var(--wall-2)] py-24 md:py-28">
        <div className="container-board text-center">
          <h2 className="text-4xl md:text-5xl">Funded. Checked. Paid.</h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 text-left">
              <p className="text-lg font-semibold">Funded, not promised</p>
              <p className="mt-2 text-sm text-bone-soft">
                Every contract shows its pot before you claim it. An unfunded contract is just an ad — ours are labeled.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 text-left">
              <p className="text-lg font-semibold">Checked deliveries</p>
              <p className="mt-2 text-sm text-bone-soft">
                Deliveries are matched to your TikTok account and the contract's sound. No stolen clips. No wrong-sound posts.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 text-left">
              <p className="text-lg font-semibold">Real payouts</p>
              <p className="mt-2 text-sm text-bone-soft">
                Verified views settle from the pot via PayPal or Stripe. Every payout is reviewed before money moves.
              </p>
            </div>
          </div>
          <Link to="/board" className="silver-btn mt-12 px-8">
            Open the board
          </Link>
        </div>
      </section>

      {/* SEO hub */}
      <section className="container-board py-20">
        <nav aria-label="Explore Bounty Sounds">
          <h2 className="text-center text-3xl">Explore Bounty Sounds</h2>
          <ul className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
            <li className="rounded-2xl bg-[var(--wall-2)] p-6">
              <Link to="/for-artists" className="text-lg font-semibold hover:underline">
                TikTok music promotion for artists
              </Link>
              <p className="mt-1 text-sm text-bone-soft">List your song, set a per-view rate, only pay for verified views.</p>
            </li>
            <li className="rounded-2xl bg-[var(--wall-2)] p-6">
              <Link to="/for-editors" className="text-lg font-semibold hover:underline">
                UGC creator jobs for editors
              </Link>
              <p className="mt-1 text-sm text-bone-soft">Claim contracts, post TikToks, cash in via PayPal or Stripe.</p>
            </li>
            <li className="rounded-2xl bg-[var(--wall-2)] p-6">
              <Link to="/clipping-campaigns" className="text-lg font-semibold hover:underline">
                How clipping campaigns work
              </Link>
              <p className="mt-1 text-sm text-bone-soft">Pay-per-view clipping campaigns end to end.</p>
            </li>
            <li className="rounded-2xl bg-[var(--wall-2)] p-6">
              <Link to="/tiktok-clipper" className="text-lg font-semibold hover:underline">
                Become a TikTok clipper
              </Link>
              <p className="mt-1 text-sm text-bone-soft">Turn your edits into per-view income. No follower minimum.</p>
            </li>
          </ul>
        </nav>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="container-board flex flex-col items-center gap-3 py-10 text-center text-xs text-bone-soft">
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/board" className="hover:text-bone">Board</Link>
            <Link to="/for-artists" className="hover:text-bone">For artists</Link>
            <Link to="/for-editors" className="hover:text-bone">For editors</Link>
            <Link to="/clipping-campaigns" className="hover:text-bone">Clipping campaigns</Link>
            <Link to="/tiktok-clipper" className="hover:text-bone">TikTok clippers</Link>
            <Link to="/list-sound" className="hover:text-bone">List a sound</Link>
          </nav>
          <span>Every contract shows its pot, its rate, and its deadline before you claim it.</span>
          <span>© {new Date().getFullYear()} Bounty Sounds</span>
        </div>
      </footer>
    </div>
  );
}
