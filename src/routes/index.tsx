import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties } from "@/lib/bounties.functions";
import { SiteHeader } from "@/components/SiteHeader";

const HOME_TITLE = "Bounty Sounds — Clip it. Claim it. Cash it.";
const HOME_DESC =
  "A public clipping and sound bounty board. Artists fund a pot for their sound. You post the clip. Verified views pay out.";
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

type Bounty = Awaited<ReturnType<typeof listPublicBounties>>[number];

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function rewardLabel(b: Bounty) {
  if (b.payout_type === "per_1k_views" && b.reward_cash_cents > 0)
    return `${money(b.reward_cash_cents, b.currency)} / 100k views`;
  if (b.reward_cash_cents > 0) return `${money(b.reward_cash_cents, b.currency)} / clip`;
  if (b.reward_points > 0) return `${b.reward_points} pts / clip`;
  return "reward on delivery";
}

function pad(n: number) {
  return n.toString().padStart(3, "0");
}

function LandingPage() {
  const listFn = useServerFn(listPublicBounties);
  const { data: bounties = [] } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
    retry: false,
  });
  const open = bounties
    .filter((b) => b.status !== "expired" && b.status !== "fulfilled" && b.status !== "closed")
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--tar)] text-bone">
      <SiteHeader />

      {/* Light band — concentric focus well */}
      <section className="relative overflow-hidden bg-[#f5f3ee] py-16 md:py-24">
        {/* Street-art flair: hand-sprayed diagonal marks in the corners */}
        <SprayMark className="absolute -top-6 -left-10 rotate-[-14deg] text-[#e94f2e]/70" />
        <SprayMark className="absolute -bottom-8 -right-8 rotate-[12deg] text-[#0d0d0d]/40" />

        <div className="container-board relative">
          {/* Ring 1 — outermost frame */}
          <div className="mx-auto max-w-4xl border border-[#0d0d0d]/15 p-4 md:p-8">
            {/* Ring 2 — middle frame */}
            <div className="border border-[#0d0d0d]/30 p-4 md:p-10">
              {/* Ring 3 — the well */}
              <div className="border-2 border-[#0d0d0d] bg-[#faf9f5] p-6 md:p-12">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/60">
                  <span>Issue No. {pad(open.length + 42)}</span>
                  <span className="hidden sm:inline">— The Board —</span>
                  <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</span>
                </div>

                <div className="relative mt-6 text-center">
                  {/* Marker underline behind headline */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-6 bottom-2 h-4 -rotate-1 bg-[#e94f2e]/25 md:bottom-4 md:h-6"
                  />
                  <h1
                    className="relative font-[Space_Grotesk] text-[2.6rem] font-bold leading-[0.95] tracking-tight text-[#0d0d0d] md:text-[5rem]"
                  >
                    Clip it.<br />
                    <span className="italic">Claim it.</span><br />
                    Cash it.
                  </h1>
                </div>

                <p className="mx-auto mt-6 max-w-md text-center font-[DM_Sans] text-base text-[#2d2d2d] md:text-lg">
                  Public bounty board for TikTok clippers.
                  Post the clip — verified views pay out.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/board"
                    className="inline-flex items-center justify-center bg-[#0d0d0d] px-6 py-3 font-[Space_Grotesk] text-sm font-semibold uppercase tracking-wider text-[#f5f3ee] transition hover:bg-[#e94f2e]"
                  >
                    Open the board
                  </Link>
                  <Link
                    to="/list-sound"
                    className="inline-flex items-center justify-center border border-[#0d0d0d] px-6 py-3 font-[Space_Grotesk] text-sm font-semibold uppercase tracking-wider text-[#0d0d0d] transition hover:bg-[#0d0d0d] hover:text-[#f5f3ee]"
                  >
                    List a sound
                  </Link>
                </div>

                {/* Live ledger — the center of the well */}
                <div className="mt-10 border-t border-[#0d0d0d]/20 pt-6">
                  <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[#0d0d0d]/60">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#e94f2e]" />
                      Live · {open.length} open
                    </span>
                    <Link to="/board" className="underline underline-offset-2 hover:text-[#0d0d0d]">
                      see all →
                    </Link>
                  </div>

                  {open.length === 0 ? (
                    <p className="py-6 text-center font-[DM_Sans] italic text-[#2d2d2d]/70">
                      No contracts posted right now. Check the board.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#0d0d0d]/15">
                      {open.map((b) => (
                        <li key={b.id}>
                          <Link
                            to="/bounty/$id"
                            params={{ id: b.id }}
                            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3 transition hover:bg-[#0d0d0d]/[0.04]"
                          >
                            <span className="font-mono text-xs text-[#0d0d0d]/50">#{pad(b.contract_no)}</span>
                            <span className="min-w-0 truncate font-[Space_Grotesk] text-base font-medium text-[#0d0d0d] md:text-lg">
                              {b.title}
                            </span>
                            <span className="font-mono text-xs font-semibold text-[#e94f2e] md:text-sm">
                              {rewardLabel(b)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* stenciled corner tag */}
              <p className="mt-3 text-right font-[Permanent_Marker] text-sm text-[#e94f2e]">
                no invites · no gated discord
              </p>
            </div>
          </div>

          {/* Three-word how-it-works, under the well */}
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center font-[Space_Grotesk] text-[#0d0d0d]">
            <div>
              <p className="font-mono text-xs text-[#0d0d0d]/50">01</p>
              <p className="mt-1 text-lg font-semibold md:text-xl">Claim</p>
            </div>
            <div>
              <p className="font-mono text-xs text-[#0d0d0d]/50">02</p>
              <p className="mt-1 text-lg font-semibold md:text-xl">Post</p>
            </div>
            <div>
              <p className="font-mono text-xs text-[#0d0d0d]/50">03</p>
              <p className="mt-1 text-lg font-semibold md:text-xl">Get paid</p>
            </div>
          </div>
        </div>
      </section>

      {/* Small explore rail — deliberately quiet */}
      <section className="container-board py-14">
        <nav aria-label="Explore Bounty Sounds" className="mx-auto max-w-3xl">
          <p className="label-cap text-center">Explore</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { to: "/for-artists", label: "For artists" },
              { to: "/for-editors", label: "For editors" },
              { to: "/clipping-campaigns", label: "Clipping campaigns" },
              { to: "/tiktok-clipper", label: "TikTok clippers" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex items-center justify-between border-b border-[var(--iron)] py-2 text-bone hover:text-bone-soft"
                >
                  <span className="font-[Space_Grotesk] text-base">{l.label}</span>
                  <span className="font-mono text-xs text-bone-soft">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="container-board flex flex-col items-center gap-2 py-8 text-center text-xs text-bone-soft">
          <span>Every contract shows its pot, rate, and deadline before you claim.</span>
          <span>© {new Date().getFullYear()} Bounty Sounds</span>
        </div>
      </footer>
    </div>
  );
}

function SprayMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 120"
      className={`h-32 w-56 md:h-40 md:w-72 ${className}`}
      fill="none"
    >
      <path
        d="M10 90 Q 70 20, 140 60 T 210 40"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M20 105 Q 90 55, 170 85"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* speckles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <circle
          key={i}
          cx={15 + i * 12 + (i % 3) * 5}
          cy={70 + ((i * 37) % 40)}
          r={((i * 7) % 3) + 1}
          fill="currentColor"
          opacity="0.35"
        />
      ))}
    </svg>
  );
}
