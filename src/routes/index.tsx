import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties } from "@/lib/bounties.functions";
import { leaderboard } from "@/lib/me.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Music, Coins, Trophy, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sound Bounties — TikTok edits, real rewards" },
      {
        name: "description",
        content:
          "Pick up a bounty, post a TikTok edit with the sound, earn points and payouts.",
      },
      { property: "og:title", content: "Sound Bounties" },
      {
        property: "og:description",
        content: "TikTok bounty board for editors and UGC creators.",
      },
    ],
  }),
  component: HomePage,
});

function money(cents: number, currency = "USD") {
  if (!cents) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

function HomePage() {
  const listFn = useServerFn(listPublicBounties);
  const boardFn = useServerFn(leaderboard);
  const { data: bounties = [], isLoading } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
  });
  const { data: top = [] } = useQuery({ queryKey: ["leaderboard"], queryFn: () => boardFn() });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border bg-surface">
        <div className="container-editorial grid gap-10 py-16 md:grid-cols-[1.4fr_1fr] md:py-24">
          <div>
            <span className="chip mb-5">Now open · TikTok editors</span>
            <h1 className="font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
              Edit to the sound.
              <br />
              <span className="text-[color:var(--accent-brand)]">Get paid</span> for the vibe.
            </h1>
            <p className="mt-5 max-w-lg text-base text-ink-soft">
              Pick up an open bounty, post your TikTok edit using the sound, and earn points and
              cash payouts once it's approved.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#bounties"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Browse bounties <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-surface"
              >
                Sign in as an editor
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
              <div>
                <dt className="text-ink-soft">Open</dt>
                <dd className="font-display text-2xl">{bounties.length}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Editors</dt>
                <dd className="font-display text-2xl">{top.length}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Reward</dt>
                <dd className="font-display text-2xl">$ + pts</dd>
              </div>
            </dl>
          </div>

          {/* Leaderboard card */}
          <aside className="rounded-2xl border border-border bg-background p-6">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[color:var(--accent-brand)]" />
              <h2 className="font-display text-xl">Top editors</h2>
            </div>
            {top.length === 0 ? (
              <p className="text-sm text-ink-soft">Be the first on the board.</p>
            ) : (
              <ol className="divide-y divide-border">
                {top.map((p, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="flex items-center gap-3">
                      <span className="w-4 text-ink-soft tabular-nums">{i + 1}</span>
                      <span>{p.display_name || "Editor"}</span>
                      {p.tiktok_handle ? (
                        <span className="text-ink-soft">@{p.tiktok_handle}</span>
                      ) : null}
                    </span>
                    <span className="chip">{p.points} pts</span>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      </section>

      {/* Bounties grid */}
      <section id="bounties" className="container-editorial py-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Open bounties</h2>
            <p className="mt-1 text-ink-soft">Claim one, post it, get points.</p>
          </div>
        </div>
        {isLoading ? (
          <p className="text-ink-soft">Loading…</p>
        ) : bounties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="font-display text-xl">No bounties open yet.</p>
            <p className="mt-2 text-sm text-ink-soft">Check back soon.</p>
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bounties.map((b) => (
              <li
                key={b.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:border-ink/40"
              >
                {b.cover_url ? (
                  <img src={b.cover_url} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-surface">
                    <Music className="h-8 w-8 text-ink-soft" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-ink-soft">
                    <Music className="h-3.5 w-3.5" />
                    <span className="truncate">{b.sound_name}</span>
                  </div>
                  <h3 className="mt-2 font-display text-xl leading-tight">{b.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{b.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {b.reward_points > 0 ? (
                      <span className="chip">
                        <Trophy className="h-3 w-3" />
                        {b.reward_points} pts
                      </span>
                    ) : null}
                    {b.reward_cash_cents > 0 ? (
                      <span className="chip-brand">
                        <Coins className="h-3 w-3" />
                        {money(b.reward_cash_cents, b.currency)}
                      </span>
                    ) : null}
                    {b.deadline ? (
                      <span className="chip">
                        <Clock className="h-3 w-3" />
                        {new Date(b.deadline).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-5 pt-4 border-t border-border">
                    <Link
                      to="/bounty/$id"
                      params={{ id: b.id }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-[color:var(--accent-brand)]"
                    >
                      View bounty <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="border-t border-border">
        <div className="container-editorial flex flex-wrap items-center justify-between gap-3 py-8 text-xs text-ink-soft">
          <span>© {new Date().getFullYear()} Sound Bounties</span>
          <span>Made for TikTok editors and UGC creators.</span>
        </div>
      </footer>
    </div>
  );
}
