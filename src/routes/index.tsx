import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties } from "@/lib/bounties.functions";
import { SiteHeader } from "@/components/SiteHeader";

const HOME_TITLE = "Bounty Sounds — Get Paid Per View to Clip Sounds on TikTok";
const HOME_DESC =
  "Artists fund a pot for their sound. Clippers post TikToks with it and get paid for verified views via PayPal or Stripe. Funded pots, checked deliveries, real payouts.";
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
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />

      <SiteHeader />

      {/* Hero — what this site is */}
      <section className="container-board relative z-10 pt-14 pb-10 text-center md:pt-20">
        <div className="mx-auto mb-5 flex justify-center">
          <div className="system-bar">
            <span className="status-dot" />
            funded pots · verified views · real payouts
          </div>
        </div>
        <h1 className="mx-auto max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          Get paid per view to clip sounds.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-bone-soft">
          Bounty Sounds is a marketplace between music artists and short-form editors.
          An artist funds a pot for their sound. You post a TikTok using it.
          Verified views pay out from the pot — via PayPal or Stripe.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/board" className="silver-btn px-8">
            {openCount > 0 ? `browse ${openCount} open contract${openCount === 1 ? "" : "s"}` : "browse the board"}
          </Link>
          <Link to="/list-sound" className="ink-btn px-8 text-bone">
            list your sound
          </Link>
        </div>
      </section>

      {/* How it works — both sides */}
      <section className="container-board relative z-10 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="contract contract-nail p-7">
            <span className="label-cap silver">For clippers</span>
            <h2 className="mt-2 font-display text-2xl text-ink">Turn edits into income</h2>
            <ol className="mt-4 space-y-3 text-ink-soft">
              <li className="flex gap-3">
                <span className="terminal mt-1 text-[var(--gold)]">01</span>
                Claim a contract from the board — the rate, pot, and deadline are stated up front.
              </li>
              <li className="flex gap-3">
                <span className="terminal mt-1 text-[var(--gold)]">02</span>
                Post a TikTok from your own account using the contract's sound.
              </li>
              <li className="flex gap-3">
                <span className="terminal mt-1 text-[var(--gold)]">03</span>
                Deliver the link. Views are verified, and the pot pays out per clip or per 100k views.
              </li>
            </ol>
            <Link to="/for-editors" className="mt-5 inline-block text-sm text-ink underline">
              more for editors →
            </Link>
          </div>

          <div className="contract contract-nail p-7">
            <span className="label-cap silver">For artists</span>
            <h2 className="mt-2 font-display text-2xl text-ink">Pay for reach, not promises</h2>
            <ol className="mt-4 space-y-3 text-ink-soft">
              <li className="flex gap-3">
                <span className="terminal mt-1 text-[var(--gold)]">01</span>
                List your sound, set your per-view rate, and fund the pot.
              </li>
              <li className="flex gap-3">
                <span className="terminal mt-1 text-[var(--gold)]">02</span>
                Clippers compete to make edits that perform — every delivery is checked.
              </li>
              <li className="flex gap-3">
                <span className="terminal mt-1 text-[var(--gold)]">03</span>
                You approve payouts against verified views. Unspent pot stays yours.
              </li>
            </ol>
            <Link to="/for-artists" className="mt-5 inline-block text-sm text-ink underline">
              more for artists →
            </Link>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="border border-[var(--iron)] bg-[var(--wall-2)] p-5" style={{ borderRadius: "var(--radius-lg)" }}>
            <span className="label-cap silver">Funded, not promised</span>
            <p className="mt-2 text-sm text-bone-soft">Every contract shows its pot before you claim it. An unfunded contract is just an ad — ours are labeled.</p>
          </div>
          <div className="border border-[var(--iron)] bg-[var(--wall-2)] p-5" style={{ borderRadius: "var(--radius-lg)" }}>
            <span className="label-cap silver">Checked deliveries</span>
            <p className="mt-2 text-sm text-bone-soft">Deliveries are matched to your TikTok account and the contract's sound. No stolen clips, no wrong-sound posts.</p>
          </div>
          <div className="border border-[var(--iron)] bg-[var(--wall-2)] p-5" style={{ borderRadius: "var(--radius-lg)" }}>
            <span className="label-cap silver">Real payouts</span>
            <p className="mt-2 text-sm text-bone-soft">Verified views settle from the pot via PayPal or Stripe. Every payout is reviewed before money moves.</p>
          </div>
        </div>

        {/* Second CTA */}
        <div className="mt-12 text-center">
          <Link to="/board" className="silver-btn px-10">
            open the board
          </Link>
          <p className="terminal mt-3 text-xs text-bone-soft">artists · $200 listing · 30 days on the board</p>
        </div>

        {/* SEO hub */}
        <nav aria-label="Explore Bounty Sounds" className="mt-16">
          <h2 className="text-center font-display text-2xl text-bone">Explore Bounty Sounds</h2>
          <ul className="mx-auto mt-6 grid max-w-4xl gap-4 sm:grid-cols-2">
            <li className="border border-[var(--iron)] bg-black/30 p-4" style={{ borderRadius: "var(--radius-md)" }}>
              <Link to="/for-artists" className="font-display text-lg text-bone hover:text-silver-glow">
                TikTok music promotion for artists →
              </Link>
              <p className="mt-1 text-sm text-bone-soft">List your song, set a per-view rate, only pay for verified views.</p>
            </li>
            <li className="border border-[var(--iron)] bg-black/30 p-4" style={{ borderRadius: "var(--radius-md)" }}>
              <Link to="/for-editors" className="font-display text-lg text-bone hover:text-silver-glow">
                UGC creator jobs for editors →
              </Link>
              <p className="mt-1 text-sm text-bone-soft">Claim contracts, post TikToks, cash in via PayPal or Stripe.</p>
            </li>
            <li className="border border-[var(--iron)] bg-black/30 p-4" style={{ borderRadius: "var(--radius-md)" }}>
              <Link to="/clipping-campaigns" className="font-display text-lg text-bone hover:text-silver-glow">
                How clipping campaigns work →
              </Link>
              <p className="mt-1 text-sm text-bone-soft">Pay-per-view clipping campaigns end to end.</p>
            </li>
            <li className="border border-[var(--iron)] bg-black/30 p-4" style={{ borderRadius: "var(--radius-md)" }}>
              <Link to="/tiktok-clipper" className="font-display text-lg text-bone hover:text-silver-glow">
                Become a TikTok clipper →
              </Link>
              <p className="mt-1 text-sm text-bone-soft">Turn your edits into per-view income. No follower minimum.</p>
            </li>
          </ul>
        </nav>
      </section>

      <footer className="relative z-10 border-t border-[var(--iron)]">
        <div className="container-board flex flex-col items-center gap-3 py-8 text-center text-xs text-bone-soft">
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/board" className="hover:text-bone">board</Link>
            <Link to="/for-artists" className="hover:text-bone">for artists</Link>
            <Link to="/for-editors" className="hover:text-bone">for editors</Link>
            <Link to="/clipping-campaigns" className="hover:text-bone">clipping campaigns</Link>
            <Link to="/tiktok-clipper" className="hover:text-bone">tiktok clippers</Link>
            <Link to="/list-sound" className="hover:text-bone">list a sound</Link>
          </nav>
          <span className="script-note text-sm">Every contract shows its pot, its rate, and its deadline before you claim it.</span>
          <span>© {new Date().getFullYear()} · Bounty Sounds</span>
        </div>
      </footer>
    </div>
  );
}
