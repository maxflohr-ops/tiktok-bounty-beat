import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { BsLoading } from "@/components/bs";
import { getEngineReport } from "@/lib/engine.functions";
import { formatPerViewRate } from "@/lib/rate";
import type { CoachReport, Insight } from "@/lib/engine";
import { DeskFrame, Pill } from "./DeskFrame";
import { compact, usd } from "./format";

// The self-improvement engine on the desk. Read-only by construction: it
// reads submissions and bounties, and every number it shows can be traced
// to the rows behind it. Rate moves are suggestions you apply in Contracts.

const rateLabel = (r: CoachReport, cents: number) =>
  r.payout_type === "per_1k_views" ? formatPerViewRate(cents) : `${usd(cents)} per clip`;

const gradeTone = (g: string) =>
  g === "A" ? "good" : g === "B" ? "quiet" : g === "—" ? "quiet" : g === "C" ? "warn" : "bad";
const paceTone = { raise: "warn", lower: "bad", hold: "good", insufficient_data: "quiet" } as const;

export function EnginePanel() {
  const fn = useServerFn(getEngineReport);
  const { data, isLoading, error } = useQuery({ queryKey: ["engine"], queryFn: () => fn() });

  if (isLoading) return <BsLoading label="reading the board" />;
  if (error || !data)
    return (
      <p className="text-sm text-red-700">
        {error instanceof Error ? error.message : "Engine unavailable."}
      </p>
    );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-bone">The engine</h2>
        <p className="script-note text-lg text-bone-soft">
          It suggests. You decide. It never touches money.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="label-cap silver">Weekly coach · one per live campaign</h3>
        {data.reports.length === 0 ? (
          <p className="text-sm text-bone-soft">No live campaigns.</p>
        ) : (
          data.reports.map((r) => <CoachCard key={r.bounty_id} r={r} />)
        )}
      </section>

      <DeskFrame>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="label-cap silver">Board playbook</h3>
          <span className="text-xs text-bone-soft">
            learned from {data.playbook.sample} captioned clips
          </span>
        </div>
        <InsightList insights={data.playbook.insights} />
      </DeskFrame>

      <DeskFrame>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="label-cap silver">Clipper curation</h3>
          <span className="text-xs text-bone-soft">
            fast-track ≥ 75 with 3+ decisions · watch &lt; 40
          </span>
        </div>
        <ul className="mt-3 divide-y divide-[var(--border)]">
          {data.clippers.slice(0, 40).map((c) => (
            <li key={c.editor_id} className="py-2 text-sm">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                  <span className="w-40 truncate text-bone">
                    {c.handle ? `@${c.handle.replace(/^@/, "")}` : c.editor_id.slice(0, 8)}
                  </span>
                  <span className="h-2 w-32 rounded-full bg-[var(--wall-2)]">
                    <span
                      className="block h-2 rounded-full bg-[#1d1d1f]"
                      style={{ width: `${c.score}%` }}
                    />
                  </span>
                  <span className="w-8 tabular-nums">{c.score}</span>
                  <Pill
                    tone={c.tier === "fast_track" ? "good" : c.tier === "watch" ? "bad" : "quiet"}
                  >
                    {c.tier.replace("_", "-")}
                  </Pill>
                  <span className="text-xs text-bone-soft">
                    {c.approved}/{c.decided} approved · median {compact(c.median_views)} views
                  </span>
                </summary>
                <ul className="mt-2 grid gap-1 pl-4 text-xs text-bone-soft sm:grid-cols-2">
                  {c.parts.map((p) => (
                    <li key={p.label}>
                      {p.label}:{" "}
                      <span className="tabular-nums text-bone">
                        {p.points}/{p.max}
                      </span>{" "}
                      — {p.detail}
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
          {data.clippers.length === 0 ? (
            <li className="py-4 text-sm text-bone-soft">No clippers yet.</li>
          ) : null}
        </ul>
      </DeskFrame>
    </div>
  );
}

function CoachCard({ r }: { r: CoachReport }) {
  const p = r.pacing;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(r.text);
      toast.success("Report copied.");
    } catch {
      toast.error("Couldn't copy. Select the text instead.");
    }
  };
  return (
    <DeskFrame>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="label-cap silver mr-2">
            No. {String(r.contract_no).padStart(3, "0")}
          </span>
          <span className="text-bone">{r.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={gradeTone(r.campaign.grade)}>grade {r.campaign.grade}</Pill>
          <button type="button" onClick={copy} className="ink-btn px-3 py-1 text-xs">
            <Copy className="h-3.5 w-3.5" /> copy report
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Deliveries" now={r.this_week.deliveries} prev={r.last_week.deliveries} />
        <Stat label="Approved" now={r.this_week.approved} prev={r.last_week.approved} />
        <Stat label="Views" now={r.this_week.views} prev={r.last_week.views} fmt={compact} />
        <Stat
          label="Awarded"
          now={r.this_week.awarded_cents}
          prev={r.last_week.awarded_cents}
          fmt={usd}
        />
      </div>

      <p className="mt-4 rounded-lg border border-[var(--ink)] px-3 py-2 text-sm text-bone">
        <span className="label-cap mr-2">Next move</span>
        {r.next_move}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="label-cap text-bone-soft">Rate pacing</h4>
            <Pill tone={paceTone[p.action]}>{p.action.replace("_", " ")}</Pill>
          </div>
          <p className="mt-1 text-sm text-bone">
            {rateLabel(r, p.current_rate_cents)}
            {p.suggested_rate_cents ? (
              <>
                {" "}
                → <strong>{rateLabel(r, p.suggested_rate_cents)}</strong>
              </>
            ) : null}
          </p>
          <details className="mt-1 text-xs text-bone-soft">
            <summary className="cursor-pointer">show the math</summary>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {p.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            {p.suggested_rate_cents ? (
              <p className="mt-2">
                Apply it yourself in Contracts. The engine doesn't edit contracts.
              </p>
            ) : null}
          </details>
        </div>
        <div>
          <h4 className="label-cap text-bone-soft">Review promise</h4>
          <ul className="mt-1 space-y-1 text-xs text-bone-soft">
            {r.campaign.detail.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          {r.best_clip ? (
            <p className="mt-2 text-xs text-bone-soft">
              Best clip this week:{" "}
              <span className="text-bone">{compact(r.best_clip.views)} views</span> — “
              {r.best_clip.caption}”
            </p>
          ) : null}
        </div>
      </div>

      {r.playbook.insights.length ? (
        <div className="mt-4">
          <h4 className="label-cap text-bone-soft">What's working on this campaign</h4>
          <InsightList insights={r.playbook.insights.slice(0, 3)} />
        </div>
      ) : null}
    </DeskFrame>
  );
}

function Stat({
  label,
  now,
  prev,
  fmt = (n: number) => String(n),
}: {
  label: string;
  now: number;
  prev: number;
  fmt?: (n: number) => string;
}) {
  const d = prev === 0 ? null : Math.round(((now - prev) / prev) * 100);
  return (
    <div className="rounded-xl bg-white/60 p-3">
      <p className="label-cap text-bone-soft">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-bone">{fmt(now)}</p>
      <p className="text-[11px] text-bone-soft">
        last week {fmt(prev)}
        {d !== null ? ` · ${d >= 0 ? "+" : ""}${d}%` : ""}
      </p>
    </div>
  );
}

function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0)
    return (
      <p className="mt-2 text-sm text-bone-soft">
        Not enough evidence yet. The engine needs 3+ clips on each side of a pattern before it says
        anything.
      </p>
    );
  return (
    <ul className="mt-2 space-y-2">
      {insights.map((i) => (
        <li key={i.trait} className="text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={i.direction === "use" ? "good" : "bad"}>{i.direction}</Pill>
            <span className="text-bone">{i.label}</span>
            <span className="tabular-nums text-bone-soft">{i.lift}×</span>
            <Pill tone="quiet">{i.confidence}</Pill>
          </div>
          <p className="mt-0.5 text-xs text-bone-soft">{i.evidence}</p>
        </li>
      ))}
    </ul>
  );
}
