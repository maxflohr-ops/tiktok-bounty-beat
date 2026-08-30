import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties } from "@/lib/bounties.functions";
import { formatPerViewRate } from "@/lib/rate";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { LedgerCard } from "@/components/LedgerCard";
import { NotifyForm } from "@/components/NotifyForm";
import { useSession } from "@/lib/session";
import { Reveal } from "@/components/Reveal";
import { BsBadge, BsDisplay, BsEyebrow, BsMarker, BsMono, BsWell } from "@/components/bs";
import { GuillocheRosette, InkCardinal, InkDogwood, InkSeal, MicroRule } from "@/components/ArtMarks";

const HOME_TITLE = "Bounty Sounds — Clip it. Claim it. Cash it.";
const HOME_DESC =
  "A public clipping bounty board for sounds, streams, and keynotes. Someone posts a purse, you post the clip, verified views pay out.";
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
    return formatPerViewRate(b.reward_cash_cents, b.currency, true);
  if (b.reward_cash_cents > 0) return `${money(b.reward_cash_cents, b.currency)} / delivery`;
  if (b.reward_points > 0) return `${b.reward_points} pts / clip`;
  return "reward on delivery";
}

function pad(n: number) {
  return n.toString().padStart(3, "0");
}

function LandingPage() {
  const { user } = useSession();
  const listFn = useServerFn(listPublicBounties);
  const { data: bounties = [] } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
    retry: false,
  });
  const live = bounties.filter(
    (b) => b.status !== "expired" && b.status !== "fulfilled" && b.status !== "closed",
  );
  const featured = (b: Bounty) =>
    Boolean(
      ((b as any).featured_until && new Date((b as any).featured_until).getTime() > Date.now()) ||
      (b as any).featured_plus,
    );
  const presentedBy = live.find((b) => (b as any).featured_plus);
  const open = [...live.filter(featured), ...live.filter((b) => !featured(b))].slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--wall)] text-bone">
      <SiteHeader />

      <section className="bs-surface relative overflow-hidden py-16 md:py-24">
        <SprayMark className="absolute -top-6 -left-10 rotate-[-14deg] text-[var(--color-bs-accent)]/70" />
        <SprayMark className="absolute -bottom-8 -right-8 rotate-[12deg] text-[var(--color-bs-ink)]/40" />
        <InkDogwood className="absolute -bottom-12 -left-6 w-56 rotate-[-4deg] opacity-[0.09] md:w-72" />
        <GuillocheRosette className="absolute -right-24 top-1/3 w-80 opacity-[0.05] md:w-[26rem]" />

        <div className="container-board relative">
          <BsWell className="mx-auto max-w-4xl">
            <div className="bs-hero-in text-center" style={{ "--i": 0 } as React.CSSProperties}>
              <BsMono>— Bounty Board —</BsMono>
            </div>

            <div className="relative mt-6 text-center">
              <span
                aria-hidden
                className="bs-hero-mark pointer-events-none absolute inset-x-6 bottom-2 h-4 bg-[var(--color-bs-accent-soft)] md:bottom-4 md:h-6"
              />
              <BsDisplay as="h1" size="xl" className="relative">
                <span className="bs-hero-in block" style={{ "--i": 1 } as React.CSSProperties}>Clip it.</span>
                <span className="bs-hero-in block" style={{ "--i": 2 } as React.CSSProperties}>Claim it.</span>
                <span className="bs-hero-in block" style={{ "--i": 3 } as React.CSSProperties}>Cash it.</span>
              </BsDisplay>
            </div>

            <p
              className="bs-hero-in mx-auto mt-6 max-w-md text-center text-base text-[var(--color-bs-ink-soft)] md:text-lg"
              style={{ "--i": 5 } as React.CSSProperties}
            >
              Sounds, streams, keynotes, podcasts. Post the clip — verified views pay out.
            </p>

            <p
              className="bs-hero-in mx-auto mt-3 max-w-md text-center text-sm text-[var(--color-bs-ink-mute)]"
              style={{ "--i": 6 } as React.CSSProperties}
            >
              The purse is posted before you cut. Verified views pay out.
            </p>

            <div className="bs-hero-in mt-8 flex justify-center" style={{ "--i": 7 } as React.CSSProperties}>
              <Link
                to="/board"
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-bs-ink)] px-7 py-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-bs-paper)] shadow-[0_4px_0_rgba(13,13,13,0.3)] ring-2 ring-[var(--color-bs-ink)] transition hover:-translate-y-0.5"
              >
                Open the board
              </Link>
            </div>

            <LedgerCard />

            <div className="bs-rule mt-10 pt-6">
              {presentedBy ? (
                <p className="mb-3 text-center">
                  <Link
                    to="/bounty/$id"
                    params={{ id: presentedBy.id }}
                    className="bs-mono uppercase tracking-[0.16em] text-[var(--color-bs-ink-mute)] underline underline-offset-2 hover:text-[var(--color-bs-ink)]"
                  >
                    this issue presented by {presentedBy.title} →
                  </Link>
                </p>
              ) : null}
              <div className="mb-3 flex items-center justify-between">
                <BsBadge variant="live">Live · {open.length} open</BsBadge>
                <Link to="/board" className="bs-mono inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-[var(--color-bs-ink)] md:min-h-0">
                  see all →
                </Link>
              </div>

              {open.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="italic text-[var(--color-bs-ink-mute)]">
                    No bounties on the board right now.
                  </p>
                  <NotifyForm accountEmail={user?.email ?? null} />
                </div>
              ) : (
                <ul className="divide-y divide-[var(--color-bs-rule)]">
                  {open.map((b) => (
                    <li key={b.id}>
                      <Link
                        to="/bounty/$id"
                        params={{ id: b.id }}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3 transition hover:bg-[var(--color-bs-ink)]/[0.04]"
                      >
                        <BsMono className="text-[var(--color-bs-ink-mute)]">#{pad(b.contract_no)}</BsMono>
                        <span className="min-w-0 truncate [font-family:var(--font-brand)] text-base font-semibold text-[var(--color-bs-ink)] md:text-lg">
                          {b.title}
                        </span>
                        <BsMono className="font-semibold text-[var(--color-bs-accent)]">
                          {rewardLabel(b)}
                        </BsMono>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </BsWell>

          <p className="mx-auto mt-3 flex max-w-4xl items-end justify-end gap-2 pr-2 text-right">
            <BsMarker>no invites · no gated discord</BsMarker>
            <InkCardinal accent className="w-20 opacity-80 md:w-24" />
          </p>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center">
            {[
              { n: "01", l: "Claim" },
              { n: "02", l: "Post" },
              { n: "03", l: "Get paid" },
            ].map((s) => (
              <div key={s.n}>
                <BsMono className="text-[var(--color-bs-ink-mute)]">{s.n}</BsMono>
                <p className="mt-1 font-[var(--font-display)] text-lg font-semibold text-[var(--color-bs-ink)] md:text-xl">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center">
            <Link
              to="/how-it-works"
              className="bs-mono inline-flex min-h-[44px] items-center underline underline-offset-2 text-[var(--color-bs-ink-mute)] hover:text-[var(--color-bs-ink)] md:min-h-0"
            >
              the full flow →
            </Link>
          </p>
        </div>
      </section>

      <section className="container-board py-14">
        <Reveal from="left">
        <nav aria-label="Explore Bounty Sounds" className="mx-auto max-w-3xl">
          <BsEyebrow className="block text-center">Explore</BsEyebrow>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { to: "/how-it-works", label: "How it works" },
              { to: "/payouts", label: "Payouts" },
              { to: "/for-artists", label: "For artists" },
              { to: "/for-editors", label: "For editors" },
              { to: "/clipping-campaigns", label: "Clipping campaigns" },
              { to: "/tiktok-clipper", label: "TikTok clippers" },
              { to: "/keynotes", label: "Keynotes" },
              { to: "/board", label: "The Bounty Board" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex min-h-[44px] items-center justify-between border-b border-[var(--iron)] py-2 text-bone hover:text-bone-soft"
                >
                  <span className="font-display text-base">{l.label}</span>
                  <span className="font-mono text-xs text-bone-soft">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        </Reveal>
      </section>

      <footer className="border-t border-[var(--border)]">
        <MicroRule className="mx-auto max-w-3xl pt-2 text-center" />
        <div className="container-board flex flex-col items-center gap-2 py-8 text-center text-xs text-bone-soft">
          <InkSeal className="mb-1 w-24 opacity-70" />
          <FooterNav />
          <span>Good to the bearer for verified views, payable from the posted purse.</span>
          <span>
            © {new Date().getFullYear()} Bounty Sounds ·{" "}
            <Link to="/admin" className="tap-inline opacity-60 hover:opacity-100">admin desk</Link>
          </span>
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
