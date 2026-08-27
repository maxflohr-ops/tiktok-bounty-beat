import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties, pastCaptures } from "@/lib/bounties.functions";
import { leaderboard, weeklyPayouts } from "@/lib/me.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { Money } from "@/components/Money";
import { useEffect, useMemo, useState } from "react";
import { loadTaste, scoreBounty, type TasteProfile } from "@/lib/taste";
import { formatPerViewRate } from "@/lib/rate";
import { BsEmpty, BsLoading } from "@/components/bs";
import { GuillocheBand, InkCardinal } from "@/components/ArtMarks";
import { useSession } from "@/lib/session";
import { NotifyForm } from "@/components/NotifyForm";
import { FLAGSHIP, isFlagship } from "@/lib/flagship";
import { LiveNowBadge, PlatformIcons } from "@/components/FlagshipCampaign";

const HOME_TITLE = "Bounty Board — Live TikTok Clipping Contracts · Bounty Sounds";
const HOME_DESC =
  "Every live bounty: the sound, the rate, the posted purse, and the deadline. Seize one, post your clip, get paid for verified views.";
const HOME_URL = "https://bountysounds.com/board";

export const Route = createFileRoute("/board")({
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
  component: BoardPage,
});

type Bounty = Awaited<ReturnType<typeof listPublicBounties>>[number];

function pad(n: number) {
  return n.toString().padStart(3, "0");
}
// Serial in the style of a note: district letter + 8 digits, star suffix on featured runs.
function serial(n: number, star = false) {
  return `B ${n.toString().padStart(8, "0")}${star ? " ★" : ""}`;
}
function money(cents: number, currency = "USD") {
  if (!cents) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}
function isExpired(b: Bounty) {
  if (b.status === "expired" || b.status === "fulfilled") return b.status;
  if (b.deadline && new Date(b.deadline).getTime() < Date.now()) return "expired";
  return null;
}
function isFeatured(b: Bounty) {
  const paid =
    ((b as any).featured_until && new Date((b as any).featured_until).getTime() > Date.now()) ||
    (b as any).featured_plus;
  return Boolean(paid && !isExpired(b));
}
function bottomLine(b: Bounty) {
  const overridden = isExpired(b);
  if (overridden === "expired") return { text: "expired", seal: false, variant: "magenta" as const };
  if (overridden === "fulfilled" || b.status === "fulfilled") return { text: "fulfilled", seal: true, variant: "cyan" as const };
  if (b.max_submissions && b.claims_count > 0)
    return { text: `claimed ${b.claims_count} of ${b.max_submissions}`, seal: false, variant: "amber" as const };
  if (b.claims_count > 0) return { text: `claimed ${b.claims_count}`, seal: false, variant: "amber" as const };
  return { text: "open", seal: false, variant: "cyan" as const };
}
// Explicit sort picks. "rate" keeps per-view rates ahead of flat rewards since
// the two aren't the same unit; ties fall back to newest (contract_no desc).
function compareBounties(sort: "rate" | "purse" | "ending", x: Bounty, y: Bounty): number {
  if (sort === "rate") {
    const xPerView = x.payout_type === "per_1k_views" ? 1 : 0;
    const yPerView = y.payout_type === "per_1k_views" ? 1 : 0;
    if (xPerView !== yPerView) return yPerView - xPerView;
    return (y.reward_cash_cents ?? 0) - (x.reward_cash_cents ?? 0) || y.contract_no - x.contract_no;
  }
  if (sort === "purse")
    return ((y as any).purse_cents ?? 0) - ((x as any).purse_cents ?? 0) || y.contract_no - x.contract_no;
  const xDue = x.deadline ? new Date(x.deadline).getTime() : Infinity;
  const yDue = y.deadline ? new Date(y.deadline).getTime() : Infinity;
  return xDue - yDue || y.contract_no - x.contract_no;
}

function BoardPage() {
  const listFn = useServerFn(listPublicBounties);
  const boardFn = useServerFn(leaderboard);
  const { data: bounties = [], isLoading } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
  });
  const { data: top = [] } = useQuery({ queryKey: ["leaderboard"], queryFn: () => boardFn() });
  const weeklyFn = useServerFn(weeklyPayouts);
  const { data: weekly = [] } = useQuery({ queryKey: ["weeklyPayouts"], queryFn: () => weeklyFn() });
  const capturesFn = useServerFn(pastCaptures);
  const { data: captures = [] } = useQuery({ queryKey: ["pastCaptures"], queryFn: () => capturesFn(), retry: false });

  const [taste, setTaste] = useState<TasteProfile | null>(null);
  useEffect(() => setTaste(loadTaste()), []);

  const [platform, setPlatform] = useState<"all" | "tiktok" | "shorts">("all");
  const [payout, setPayout] = useState<"all" | "flat" | "per_1k_views">("all");
  const [status, setStatus] = useState<"open" | "all">("open");
  const [sort, setSort] = useState<"board" | "rate" | "purse" | "ending">("board");

  const filtered = useMemo(() => {
    const base = bounties.filter((b) => {
      if (platform !== "all" && b.platform_target !== platform) return false;
      if (payout !== "all" && b.payout_type !== payout) return false;
      if (status === "open") {
        const done = isExpired(b);
        if (done === "expired") return false;
      }
      return true;
    });
    const scored = !taste
      ? base.map((b) => ({ b, score: 0 }))
      : base
          .map((b) => ({ b, score: scoreBounty(taste, b) }))
          .sort((x, y) => y.score - x.score || y.b.contract_no - x.b.contract_no);
    const ordered = sort === "board" ? scored : [...scored].sort((x, y) => compareBounties(sort, x.b, y.b));
    // The flagship LIVE campaign pins first, then paid featured slots, keeping
    // the chosen order within each group.
    return [
      ...ordered.filter(({ b }) => isFlagship(b)),
      ...ordered.filter(({ b }) => !isFlagship(b) && isFeatured(b)),
      ...ordered.filter(({ b }) => !isFlagship(b) && !isFeatured(b)),
    ];
  }, [bounties, platform, payout, status, taste, sort]);

  return (
    <div className="relative min-h-screen">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />

      <SiteHeader />

      <section className="container-board relative z-10 py-6">
        <div className="board-frame relative p-6 md:p-12">
          <GuillocheBand className="absolute inset-x-6 top-1 opacity-[0.08]" />
          {/* Corner brackets */}
          <div className="corner-bracket absolute top-3 left-3 border-t-2 border-l-2" />
          <div className="corner-bracket absolute top-3 right-3 border-t-2 border-r-2" />
          <div className="corner-bracket absolute bottom-3 left-3 border-b-2 border-l-2" />
          <div className="corner-bracket absolute bottom-3 right-3 border-b-2 border-r-2" />

          {/* Header */}
          <div className="mb-8 text-center md:mb-12">
            <div className="relative mb-4 flex flex-col items-center">
              <div className="system-bar">
                <span className="status-dot" />
                system status · connected
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent opacity-60" />
              <span className="label-cap text-bone-soft">Live contracts</span>
              <div className="h-px w-20 bg-gradient-to-l from-transparent via-[var(--neon-cyan)] to-transparent opacity-60" />
            </div>
            <h1 className="mt-4 font-display text-3xl leading-tight text-bone md:text-4xl">
              The Bounty Board
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-bone-soft">
              Rate, purse, and deadline — printed on every bounty before you seize it.
            </p>
            <p className="mt-3">
              <Link to="/how-it-works" className="terminal text-xs text-bone-soft underline hover:text-bone">
                new here? how it works
              </Link>
            </p>
          </div>


          {/* Taste banner */}
          <div className="mb-6 flex justify-center">
            {taste ? (
              <div className="digital-badge">
                <span className="status-dot" />
                ranked to your taste
                <Link to="/taste" className="ml-1 underline hover:text-bone">retune</Link>
              </div>
            ) : (
              <Link to="/taste" className="digital-badge hover:text-bone">
                ✦ 30 seconds to tune the board to your taste
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4 md:mb-10">
            <FilterGroup
              label="Platform"
              options={[
                { v: "all", l: "All" },
                { v: "tiktok", l: "TikTok" },
                { v: "shorts", l: "Shorts" },
              ]}
              value={platform}
              onChange={(v) => setPlatform(v as typeof platform)}
            />
            <FilterGroup
              label="Reward"
              options={[
                { v: "all", l: "Any" },
                { v: "flat", l: "Per clip" },
                { v: "per_1k_views", l: "Per 100k views" },
              ]}
              value={payout}
              onChange={(v) => setPayout(v as typeof payout)}
            />
            <FilterGroup
              label="Status"
              options={[
                { v: "open", l: "Open only" },
                { v: "all", l: "Show all" },
              ]}
              value={status}
              onChange={(v) => setStatus(v as typeof status)}
            />
            <FilterGroup
              label="Sort"
              options={[
                { v: "board", l: "Board order" },
                { v: "rate", l: "Highest rate" },
                { v: "purse", l: "Biggest purse" },
                { v: "ending", l: "Ending soon" },
              ]}
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
            />
          </div>

          {/* Board grid */}
          {isLoading ? (
            <DelayedLoading />
          ) : filtered.length === 0 ? (
            bounties.length > 0 ? (
              <BsEmpty
                eyebrow="the Bounty Board"
                title="Nothing matches those filters."
                body={<>There are contracts on the board — just none in this slice.</>}
                action={
                  <button
                    type="button"
                    className="bs-btn bs-btn-accent"
                    onClick={() => {
                      setPlatform("all");
                      setPayout("all");
                      setStatus("all");
                      setSort("board");
                    }}
                  >
                    show all contracts
                  </button>
                }
              />
            ) : (
              <EmptyBoard />
            )
          ) : (
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(({ b, score }) => {
                const bl = bottomLine(b);
                const dim = isExpired(b) === "expired";
                return (
                  <li key={b.id} className={dim ? "opacity-60 transition" : "transition"}>
                    <Link
                      to="/bounty/$id"
                      params={{ id: b.id }}
                      className="block focus:outline-none"
                    >
                      <ContractCard b={b} bl={bl} match={score >= 3} featured={isFeatured(b)} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Captured: clips that cashed their purse. Hidden until real payouts exist. */}
          {captures.length > 0 ? (
            <div className="mt-16">
              <div className="label-cap text-center text-silver">Captured</div>
              <p className="mx-auto mt-1 max-w-md text-center text-sm text-bone-soft">
                Posted in the window, verified, paid. The purse cashes whenever the views clear.
              </p>
              <ul className="mx-auto mt-5 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {captures.map((c) => (
                  <li key={c.id} className="border border-[var(--iron)] bg-[var(--wall-2)]/50 p-4">
                    <a
                      href={c.tiktok_video_url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="font-display text-base text-bone hover:text-silver-glow"
                    >
                      @{c.tiktok_handle} ↗
                    </a>
                    <p className="mt-1 truncate text-xs text-bone-soft">{c.bounty_title}</p>
                    <p className="mt-2 flex items-baseline justify-between text-sm">
                      <span className="tabular-nums text-bone">
                        {c.verified_view_count ? `${(c.verified_view_count / 1000).toFixed(0)}k views` : "verified"}
                      </span>
                      <span className="tabular-nums font-semibold text-gold">
                        <Money cents={c.paid_cash_cents} currency="USD" />
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Roster */}
          {top.length > 0 ? (
            <div className="mt-16">
              <div className="mx-auto max-w-md border border-[var(--iron)] bg-[var(--wall-2)]/50 p-6">
                <h3 className="text-center font-display text-xl text-bone">
                  {weekly.length > 0 ? "Paid this week" : "Top clippers"}
                </h3>
                <ol className="mt-4 divide-y divide-[var(--border)]">
                  {(weekly.length > 0 ? weekly : top).map((p: any, i: number) => (
                    <li key={i} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-3 text-bone">
                        <span className="w-4 tabular-nums text-gold">{pad(i + 1)}</span>
                        <span className="font-body italic">{p.display_name || "unnamed editor"}</span>
                        {p.tiktok_handle ? (
                          <span className="text-bone-soft">@{p.tiktok_handle}</span>
                        ) : null}
                      </span>
                      <span className="silver label-cap tabular-nums">
                        {p.paid_cents != null ? <Money cents={p.paid_cents} /> : `${p.points} pts`}
                      </span>
                    </li>
                  ))}
                </ol>
                {weekly.length > 0 ? (
                  <p className="mt-3 text-center text-xs text-bone-soft">
                    <Money cents={weekly.reduce((s: number, p: any) => s + p.paid_cents, 0)} /> paid out in the last 7 days
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Internal links / SEO hub */}
          <nav aria-label="Explore Bounty Sounds" className="mt-16">
            <h2 className="text-center font-display text-2xl text-bone">Explore Bounty Sounds</h2>
            <ul className="mx-auto mt-6 grid max-w-4xl gap-4 sm:grid-cols-2">
              <li className="border border-[var(--iron)] bg-black/30 p-4">
                <Link to="/for-artists" className="font-display text-lg text-bone hover:text-silver-glow">
                  TikTok music promotion for artists →
                </Link>
                <p className="mt-1 text-sm text-bone-soft">List your song, set a per-view rate, only pay for verified views.</p>
              </li>
              <li className="border border-[var(--iron)] bg-black/30 p-4">
                <Link to="/for-editors" className="font-display text-lg text-bone hover:text-silver-glow">
                  UGC creator jobs for editors →
                </Link>
                <p className="mt-1 text-sm text-bone-soft">Claim contracts, post TikToks, cash in via PayPal, Stripe, or USDC.</p>
              </li>
              <li className="border border-[var(--iron)] bg-black/30 p-4">
                <Link to="/clipping-campaigns" className="font-display text-lg text-bone hover:text-silver-glow">
                  Clipping campaigns →
                </Link>
                <p className="mt-1 text-sm text-bone-soft">How pay-per-view clipping campaigns work end to end.</p>
              </li>
              <li className="border border-[var(--iron)] bg-black/30 p-4">
                <Link to="/tiktok-clipper" className="font-display text-lg text-bone hover:text-silver-glow">
                  Become a TikTok clipper →
                </Link>
                <p className="mt-1 text-sm text-bone-soft">Turn your edits into per-view income. No follower minimum.</p>
              </li>
            </ul>
          </nav>

          {/* Footer branding */}
          <div className="mt-12 text-center opacity-60">
            <InkCardinal className="mx-auto w-32" />
            <div className="inline-block border-t border-[var(--iron)] p-4">
              <p className="text-xs tracking-wide text-bone-soft">Posted purses · verified views · real payouts</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[var(--iron)]">
        <div className="container-board flex flex-col items-center gap-3 py-8 text-center text-xs text-bone-soft">
          <FooterNav />
          <span>
            <Link to="/" className="hover:text-bone">home</Link>
            {" · "}
            <Link to="/admin" className="opacity-60 hover:text-bone hover:opacity-100">admin desk</Link>
          </span>
          <span className="script-note text-sm">Every bounty shows its purse, its rate, and its deadline before you seize it.</span>
          <span>© {new Date().getFullYear()} · Bounty Sounds</span>
        </div>
      </footer>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="terminal text-bone-soft">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className="filter-chip"
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

// Clipper-first empty state: explain why the board is empty, teach the
// structure with example cards — never ask a clipper to switch roles.
// Copy is persona-aware: a signed-in editor gets "you're first in line",
// an anonymous visitor gets the invitation; both get the alerts capture.
function EmptyBoard() {
  const { user } = useSession();
  return (
    <div>
      <div className="text-center">
        <p className="label-cap text-bone-soft">the Bounty Board</p>
        <h2 className="mt-2 font-display text-3xl text-bone">No live contracts yet.</h2>
        <p className="mx-auto mt-3 max-w-md text-bone-soft">
          {user
            ? "Nothing to seize right now — new bounties appear here the moment a purse is posted, and you're already first in line."
            : "Creators are loading their first bounties — new bounties appear here the moment a purse is posted. No invite needed."}
        </p>
        <NotifyForm accountEmail={user?.email ?? null} />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/how-it-works" className="bs-btn bs-btn-accent">how it works</Link>
          <Link to="/for-editors" className="bs-btn">how clippers earn</Link>
        </div>
      </div>
      <p className="mt-12 mb-4 text-center font-body italic text-bone-soft">What a contract looks like</p>
      <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">
        <li>
          <GhostCard
            no={1}
            title="Clip a Thursday Twitch stream"
            song="your favorite streamer"
            rate="$5 per 5,000 views"
            purse="Purse: $500"
            note="tiktok · counting window 14 days"
          />
        </li>
        <li>
          <GhostCard
            no={2}
            title="Hook challenge — new single"
            song="the next artist here"
            rate="$20 per approved clip"
            purse="Purse: $400"
            note="tiktok · up to 15 clip slots"
          />
        </li>
      </ul>
    </div>
  );
}

function GhostCard({
  no,
  title,
  song,
  rate,
  purse,
  note,
}: {
  no: number;
  title: string;
  song: string;
  rate: string;
  purse: string;
  note: string;
}) {
  return (
    <article aria-hidden className="contract relative select-none opacity-60 grayscale-[0.4]">
      <span className="wax-seal">example</span>
      <div className="mb-3 border-b border-[var(--paper-dark)] pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--wax-red)]">Contract</span>
          <span className="terminal text-[9px] tracking-[0.15em] text-[var(--color-bs-accent)]">{serial(no)}</span>
        </div>
        <span className="label-cap silver">{purse}</span>
      </div>
      <h3 className="font-display text-2xl leading-tight text-ink">{title}</h3>
      <p className="mt-1 font-body italic text-ink-soft">for “{song}”</p>
      <div className="mt-5 border-t border-[var(--paper-dark)] pt-3">
        <div className="label-cap text-ink-soft">Reward</div>
        <div className="mt-1 [font-family:var(--font-brand)] text-lg font-semibold text-ink">{rate}</div>
        <div className="mt-1 text-xs text-ink-soft">{note}</div>
      </div>
      <div className="mt-4 text-center">
        <span className="digital-badge">coming soon</span>
      </div>
      <span aria-hidden className="terminal absolute bottom-2 left-3 text-[8px] tracking-[0.15em] text-[var(--color-bs-accent)] opacity-80">{serial(no)}</span>
      <span aria-hidden className="terminal absolute bottom-2 right-3 text-[9px] text-ink-soft opacity-60">{pad(no)}</span>
    </article>
  );
}

function ContractCard({
  b,
  bl,
  match,
  featured,
}: {
  b: Bounty;
  bl: { text: string; seal: boolean; variant: "cyan" | "amber" | "magenta" };
  match?: boolean;
  featured?: boolean;
}) {
  const live = isFlagship(b);
  const reward = live
    ? FLAGSHIP.rateLabelCompact
    : b.payout_type === "per_1k_views"
      ? formatPerViewRate(b.reward_cash_cents, b.currency)
      : b.reward_cash_cents > 0
        ? `${money(b.reward_cash_cents, b.currency)} per approved delivery`
        : b.reward_points > 0
          ? `${b.reward_points} pts per clip`
          : "Reward set on delivery";

  const glowClass =
    bl.variant === "cyan"
      ? "holo-glow"
      : bl.variant === "amber"
        ? "holo-glow-amber"
        : "holo-glow";

  const badgeClass =
    bl.variant === "cyan"
      ? "digital-badge"
      : bl.variant === "amber"
        ? "digital-badge-amber"
        : "digital-badge-magenta";

  const dotClass =
    bl.variant === "cyan"
      ? "status-dot"
      : bl.variant === "amber"
        ? "status-dot-amber"
        : "status-dot-magenta";

  return (
    <article className={`contract contract-nail ${glowClass} group relative cursor-pointer hover:-translate-y-1 hover:rotate-0`}>
      {bl.seal ? (
        <span className="wax-seal">Fulfilled</span>
      ) : featured ? (
        <span className="wax-seal">Featured</span>
      ) : match ? (
        <span className="wax-seal">for you</span>
      ) : null}
      <span className="water-stain" style={{ top: 40, left: -20, width: 120, height: 80 }} />
      <span className="water-stain" style={{ bottom: 20, right: 10, width: 90, height: 60 }} />

      <div className="mb-3 border-b border-[var(--paper-dark)] pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--wax-red)]">Contract</span>
          <span className="terminal text-[9px] tracking-[0.15em] text-[var(--color-bs-accent)]">
            {serial(b.contract_no, featured)}
          </span>
        </div>
        {(b as any).purse_cents > 0 ? (
          <span className="label-cap silver">
            Purse: <Money cents={(b as any).purse_cents} currency={b.currency} />
            {(b as any).paid_out_cents > 0 ? (
              <> · <Money cents={(b as any).paid_out_cents} currency={b.currency} /> paid out</>
            ) : null}
          </span>
        ) : (
          <span className="text-xs italic text-ink-soft">purse dry</span>
        )}
      </div>

      <h3 className="[font-family:var(--font-brand)] text-2xl font-semibold leading-snug text-ink">{b.title}</h3>
      {b.artist_song ? (
        <p className="mt-1 font-body italic text-ink-soft">for “{b.artist_song}”</p>
      ) : (
        <p className="mt-1 font-body italic text-ink-soft">sound: {b.sound_name}</p>
      )}

      <p className="mt-4 line-clamp-4 font-body leading-relaxed text-ink-soft">{b.description}</p>

      <div className="mt-5 border-t border-[var(--paper-dark)] pt-3">
        <div className="label-cap text-ink-soft">Reward</div>
        <div className="mt-1 [font-family:var(--font-brand)] text-lg font-semibold text-ink">{reward}</div>
        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-ink-soft">
          <span>{b.platform_target}</span>
          {b.deadline ? (
            <span>by {new Date(b.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
          ) : (
            <span>no deadline set</span>
          )}
          {b.max_submissions ? <span>cap · {b.max_submissions}</span> : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <span className={dotClass} />
        <span className={`${badgeClass} text-center`}>{bl.text}</span>
      </div>

      {/* Serial lower-left in green (like a note's second serial), numeral lower-right */}
      <span aria-hidden className="terminal absolute bottom-2 left-3 text-[8px] tracking-[0.15em] text-[var(--color-bs-accent)] opacity-80">
        {serial(b.contract_no, featured)}
      </span>
      <span aria-hidden className="terminal absolute bottom-2 right-3 text-[9px] text-ink-soft opacity-60">{pad(b.contract_no)}</span>
    </article>
  );
}


// Loader appears only after 240ms so fast responses never flash it
// (pattern from Instatic's spotlight skeletons); visual is BsLoading.
function DelayedLoading() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 240);
    return () => clearTimeout(t);
  }, []);
  if (!show) return <div className="py-20" />;
  return <BsLoading label="loading contracts" variant="card" />;
}
