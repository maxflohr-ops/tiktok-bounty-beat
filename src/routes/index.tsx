import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties } from "@/lib/bounties.functions";
import { leaderboard } from "@/lib/me.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Money } from "@/components/Money";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "THE BOARD — clipping contracts posted daily" },
      {
        name: "description",
        content:
          "A harbor notice board of clipping bounties for video editors. Take a contract, deliver proof, be paid in crowns.",
      },
      { property: "og:title", content: "THE BOARD — clipping contracts posted daily" },
      {
        property: "og:description",
        content: "A harbor notice board of clipping bounties for video editors. Take a contract, deliver proof, be paid in crowns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type Bounty = Awaited<ReturnType<typeof listPublicBounties>>[number];

function pad(n: number) {
  return n.toString().padStart(3, "0");
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
function bottomLine(b: Bounty) {
  const overridden = isExpired(b);
  if (overridden === "expired") return { text: "expired", seal: false };
  if (overridden === "fulfilled" || b.status === "fulfilled") return { text: "fulfilled", seal: true };
  if (b.max_submissions && b.claims_count > 0)
    return { text: `claimed ${b.claims_count} of ${b.max_submissions}`, seal: false };
  if (b.claims_count > 0) return { text: `claimed ${b.claims_count}`, seal: false };
  return { text: "open", seal: false };
}

function HomePage() {
  const listFn = useServerFn(listPublicBounties);
  const boardFn = useServerFn(leaderboard);
  const { data: bounties = [], isLoading } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
  });
  const { data: top = [] } = useQuery({ queryKey: ["leaderboard"], queryFn: () => boardFn() });

  const [platform, setPlatform] = useState<"all" | "tiktok" | "reels" | "shorts">("all");
  const [payout, setPayout] = useState<"all" | "flat" | "per_1k_views">("all");
  const [status, setStatus] = useState<"open" | "all">("open");

  const rotations = useMemo(
    () => bounties.map((_, i) => ((Math.sin(i * 1.618) * 1.5).toFixed(2))),
    [bounties],
  );

  const filtered = bounties.filter((b) => {
    if (platform !== "all" && b.platform_target !== platform) return false;
    if (payout !== "all" && b.payout_type !== payout) return false;
    if (status === "open") {
      const done = isExpired(b);
      if (done === "expired") return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="container-board py-6">
        <div className="board-frame p-6 md:p-12">
          {/* Header */}
          <div className="mb-8 text-center md:mb-12">
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
              <span className="label-cap text-bone-soft">Notices posted this season</span>
              <div className="h-px w-20 bg-gradient-to-l from-transparent via-[var(--gold)] to-transparent" />
            </div>
            <h1 className="mt-4 font-display text-3xl leading-tight text-bone md:text-5xl">
              Contracts for those who can cut.
            </h1>
            <p className="script-note mt-3 text-xl text-silver-glow">
              Take one down. Deliver proof.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-bone-soft">
              The board is where the harbor's clipping work is posted. Any editor of standing may take a contract; those who deliver are paid in crowns.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4 md:mb-10">
            <FilterGroup
              label="Platform"
              options={[
                { v: "all", l: "All" },
                { v: "tiktok", l: "TikTok" },
                { v: "reels", l: "Reels" },
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
          </div>

          {/* Board grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--gold)] border-t-transparent" />
              <p className="script-note mt-4 text-lg text-bone-soft">Consulting the ledger…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="script-note text-3xl text-bone-soft">No contracts posted.</p>
              <p className="mt-2 text-bone-soft">The harbor is quiet. Check back at the next tide.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((b, i) => {
                const bl = bottomLine(b);
                const dim = isExpired(b) === "expired";
                return (
                  <li
                    key={b.id}
                    className={dim ? "opacity-60 transition" : "transition"}
                    style={{ transform: `rotate(${rotations[i] ?? 0}deg)` }}
                  >
                    <Link
                      to="/bounty/$id"
                      params={{ id: b.id }}
                      className="block focus:outline-none"
                    >
                      <ContractCard b={b} bl={bl} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Roster */}
          {top.length > 0 ? (
            <div className="mt-16">
              <div className="mx-auto max-w-md border border-[var(--iron)] bg-[var(--wall-2)]/50 p-6">
                <div className="label-cap text-center text-silver">Roster of clippers</div>
                <ol className="mt-4 divide-y divide-[var(--border)]">
                  {top.map((p, i) => (
                    <li key={i} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-3 text-bone">
                        <span className="w-4 tabular-nums text-gold">{pad(i + 1)}</span>
                        <span className="font-body italic">{p.display_name || "unnamed editor"}</span>
                        {p.tiktok_handle ? (
                          <span className="text-bone-soft">@{p.tiktok_handle}</span>
                        ) : null}
                      </span>
                      <span className="silver label-cap">{p.points} pts</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}

          {/* Footer branding */}
          <div className="mt-12 text-center opacity-60">
            <div className="inline-block border-t border-[var(--iron)] p-4">
              <p className="label-cap text-bone-soft">By proclamation of the Harbormaster</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--iron)]">
        <div className="container-board flex flex-col items-center gap-1 py-8 text-center text-xs text-bone-soft">
          <span className="script-note text-lg text-silver-glow">The board assumes no liability for what answers.</span>
          <span>© {new Date().getFullYear()} · posted by the harbormaster</span>
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
      <span className="label-cap text-bone-soft">{label}</span>
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

function ContractCard({
  b,
  bl,
}: {
  b: Bounty;
  bl: { text: string; seal: boolean };
}) {
  const reward =
    b.payout_type === "per_1k_views"
      ? `${money(b.reward_cash_cents, b.currency) ?? "—"} per 100,000 views`
      : b.reward_cash_cents > 0
        ? `${money(b.reward_cash_cents, b.currency)} per approved clip`
        : b.reward_points > 0
          ? `${b.reward_points} pts per clip`
          : "Crowns awarded on delivery";

  return (
    <article className="contract contract-nail group relative cursor-pointer hover:-translate-y-1 hover:rotate-0">
      {bl.seal ? <span className="wax-seal">Fulfilled</span> : null}
      <span className="water-stain" style={{ top: 40, left: -20, width: 120, height: 80 }} />
      <span className="water-stain" style={{ bottom: 20, right: 10, width: 90, height: 60 }} />

      <div className="mb-3 border-b border-[var(--paper-dark)] pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--wax-red)]">Contract</span>
          <span className="label-cap text-ink-soft">No. {pad(b.contract_no)}</span>
        </div>
        {(b as any).funded_cash_cents > 0 ? (
          <span className="label-cap silver">
            Pot: <Money cents={(b as any).funded_cash_cents} currency={b.currency} />
          </span>
        ) : (
          <span className="text-xs italic text-ink-soft">pot empty</span>
        )}
      </div>

      <h3 className="font-display text-2xl leading-tight text-ink">{b.title}</h3>
      {b.artist_song ? (
        <p className="mt-1 font-body italic text-ink-soft">for “{b.artist_song}”</p>
      ) : (
        <p className="mt-1 font-body italic text-ink-soft">sound: {b.sound_name}</p>
      )}

      <p className="mt-4 line-clamp-4 font-body italic leading-relaxed text-ink-soft">{b.description}</p>

      <div className="mt-5 border-t border-[var(--paper-dark)] pt-3">
        <div className="label-cap text-ink-soft">Reward</div>
        <div className="mt-1 font-display text-lg text-ink">{reward}</div>
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

      <p className="script-note mt-4 text-center text-base text-ink-soft">{bl.text}</p>
    </article>
  );
}
