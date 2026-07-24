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
          "A harbor notice board of clipping bounties for video editors. Take a contract, deliver proof, be paid in silver.",
      },
      { property: "og:title", content: "THE BOARD — clipping contracts posted daily" },
      {
        property: "og:description",
        content: "A harbor notice board of clipping bounties for video editors. Take a contract, deliver proof, be paid in silver.",
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
  return { text: "unfulfilled", seal: false };
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

      {/* Manifest / hero */}
      <section className="container-board pt-6 pb-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="label-cap text-silver">Notices posted this season</div>
          <h1 className="mt-3 font-display text-4xl leading-tight text-bone md:text-6xl">
            Contracts for those<br />who can cut.
          </h1>
          <p className="script-note mt-4 text-2xl text-silver-glow">— take one down. deliver proof. —</p>
          <p className="mx-auto mt-4 max-w-xl text-bone-soft italic">
            The board is where the harbor's clipping work is posted. Any editor of standing may take
            a contract; those who deliver are paid in silver.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 border-y border-border/60 py-4 text-bone-soft">
          <FilterGroup
            label="platform"
            options={[
              { v: "all", l: "all" },
              { v: "tiktok", l: "tiktok" },
              { v: "reels", l: "reels" },
              { v: "shorts", l: "shorts" },
            ]}
            value={platform}
            onChange={(v) => setPlatform(v as typeof platform)}
          />
          <FilterGroup
            label="reward"
            options={[
              { v: "all", l: "any" },
              { v: "flat", l: "per clip" },
              { v: "per_1k_views", l: "per 1k views" },
            ]}
            value={payout}
            onChange={(v) => setPayout(v as typeof payout)}
          />
          <FilterGroup
            label="status"
            options={[
              { v: "open", l: "open only" },
              { v: "all", l: "show all" },
            ]}
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
          />
        </div>
      </section>

      {/* Board */}
      <section className="container-board pb-16">
        {isLoading ? (
          <p className="script-note mt-16 text-center text-2xl text-silver-glow">consulting the ledger…</p>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="script-note text-3xl text-silver-glow">no contracts posted. the harbor is quiet.</p>
            <p className="mt-3 italic text-bone-soft">(check back at the next tide.)</p>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-20">
            <div className="mx-auto max-w-md rounded border border-border/60 p-6">
              <div className="label-cap text-center text-silver">Roster of clippers</div>
              <ol className="mt-4 divide-y divide-border/40">
                {top.map((p, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="flex items-center gap-3 text-bone">
                      <span className="w-4 tabular-nums text-silver">{pad(i + 1)}</span>
                      <span className="italic">{p.display_name || "unnamed editor"}</span>
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
      </section>

      <footer className="border-t border-border/60">
        <div className="container-board flex flex-col items-center gap-1 py-8 text-center text-xs text-bone-soft">
          <span className="script-note text-lg text-silver-glow">the board assumes no liability for what answers.</span>
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
      <span className="label-cap text-silver">{label}</span>
      <div className="flex divide-x divide-border/60 border border-border/60">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`label-cap px-3 py-2 transition ${
              value === o.v ? "bg-bone/10 text-bone" : "text-bone-soft hover:text-bone"
            }`}
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
      ? `${money(b.reward_cash_cents, b.currency) ?? "—"} per 1,000 views`
      : b.reward_cash_cents > 0
        ? `${money(b.reward_cash_cents, b.currency)} per approved clip`
        : b.reward_points > 0
          ? `${b.reward_points} pts per clip`
          : "silver awarded on delivery";

  return (
    <article className="contract contract-nail relative">
      {bl.seal ? <span className="wax-seal">FULFILLED</span> : null}
      <span className="water-stain" style={{ top: 40, left: -20, width: 120, height: 80 }} />
      <span className="water-stain" style={{ bottom: 20, right: 10, width: 90, height: 60 }} />

      <div className="rule-double" />
      <div className="mt-2 flex items-center justify-between">
        <span className="label-cap">C O N T R A C T</span>
        <span className="label-cap">No. {pad(b.contract_no)}</span>
      </div>
      <div className="mt-1 flex justify-end">
        {(b as any).funded_cash_cents > 0 ? (
          <span className="label-cap silver">
            Pot: <Money cents={(b as any).funded_cash_cents} currency={b.currency} />
          </span>
        ) : (
          <span className="label-cap text-ink-soft/70">pot empty</span>
        )}
      </div>

      <h3 className="mt-4 font-display text-2xl leading-tight text-ink">{b.title}</h3>
      {b.artist_song ? (
        <p className="mt-1 italic text-ink-soft">for &ldquo;{b.artist_song}&rdquo;</p>
      ) : (
        <p className="mt-1 italic text-ink-soft">sound: {b.sound_name}</p>
      )}

      <p className="mt-4 line-clamp-4 italic leading-relaxed">{b.description}</p>

      <div className="mt-5 border-t border-ink/25 pt-3">
        <div className="label-cap silver">R E W A R D</div>
        <div className="mt-1 font-display text-lg silver">{reward}</div>
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

      <div className="rule-dbl-b mt-4" />
      <p className="script-note mt-2 text-center text-lg">{bl.text}</p>
    </article>
  );
}
