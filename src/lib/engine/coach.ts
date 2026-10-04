import { learnPlaybook, type Playbook } from "./hooks";
import { scoreCampaign, type CampaignScore } from "./curation";
import { suggestRate, type RateSuggestion } from "./pacing";
import { APPROVED, DAY, viewsOf, type EngineBounty, type EngineSub } from "./types";

// The weekly coach report: one page per campaign, this week against last,
// ending in a single next move. Rendered on the desk and copyable as text so
// it can go straight to the artist's team.

export type WeekNumbers = {
  deliveries: number;
  approved: number;
  views: number;
  awarded_cents: number;
};

export type CoachReport = {
  bounty_id: string;
  title: string;
  contract_no: number;
  payout_type: EngineBounty["payout_type"];
  this_week: WeekNumbers;
  last_week: WeekNumbers;
  best_clip: { caption: string; views: number; handle: string | null } | null;
  playbook: Playbook;
  pacing: RateSuggestion;
  campaign: CampaignScore;
  next_move: string;
  text: string;
};

function week(subs: EngineSub[], from: number, to: number): WeekNumbers {
  const inW = subs.filter((s) => {
    const t = s.submitted_at ? new Date(s.submitted_at).getTime() : NaN;
    return t >= from && t < to;
  });
  return {
    deliveries: inW.length,
    approved: inW.filter((s) => APPROVED.has(s.status)).length,
    views: inW.reduce((a, s) => a + viewsOf(s), 0),
    awarded_cents: inW.reduce((a, s) => a + (s.awarded_cash_cents ?? 0), 0),
  };
}

const n = (x: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(x);
const usd = (c: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(c / 100);
const delta = (a: number, b: number) =>
  b === 0 ? (a ? "new" : "flat") : `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}%`;

function nextMove(r: Omit<CoachReport, "next_move" | "text">): string {
  if (r.campaign.waiting_past_sla > 0)
    return `Clear the ${r.campaign.waiting_past_sla} clip${r.campaign.waiting_past_sla === 1 ? "" : "s"} waiting past 48h first. Slow reviews cost more clippers than low rates.`;
  if (r.pacing.action === "raise" || r.pacing.action === "lower")
    return r.pacing.why[r.pacing.why.length - 1];
  const lesson = r.playbook.insights.find((i) => i.direction === "use" && i.confidence !== "early");
  if (lesson)
    return `Push the playbook: “${lesson.label}” is beating everything else (${lesson.lift}×). Put it in the brief.`;
  if (r.this_week.deliveries === 0)
    return "No deliveries this week. Recruit: send the opener to five prospects from the pipeline.";
  return "Hold steady. Rate, review speed and hooks are all in range.";
}

export function coachReport(b: EngineBounty, allSubs: EngineSub[], now = Date.now()): CoachReport {
  const subs = allSubs.filter((s) => s.bounty_id === b.id);
  const this_week = week(subs, now - 7 * DAY, now + 1);
  const last_week = week(subs, now - 14 * DAY, now - 7 * DAY);
  const weekSubs = subs.filter(
    (s) => s.submitted_at && now - new Date(s.submitted_at).getTime() <= 7 * DAY,
  );
  const best = [...weekSubs].sort((a, b2) => viewsOf(b2) - viewsOf(a))[0];
  const partial = {
    bounty_id: b.id,
    title: b.title,
    contract_no: b.contract_no,
    payout_type: b.payout_type,
    this_week,
    last_week,
    best_clip: best
      ? {
          caption: (best.oembed_title ?? "").slice(0, 160),
          views: viewsOf(best),
          handle: best.tiktok_handle,
        }
      : null,
    playbook: learnPlaybook(subs),
    pacing: suggestRate(b, subs, now),
    campaign: scoreCampaign(b.id, subs, now),
  };
  const next_move = nextMove(partial);
  const lines = [
    `#${String(b.contract_no).padStart(3, "0")} ${b.title} — week ending ${new Date(now).toISOString().slice(0, 10)}`,
    `Deliveries ${this_week.deliveries} (${delta(this_week.deliveries, last_week.deliveries)}) · Approved ${this_week.approved} · Views ${n(this_week.views)} (${delta(this_week.views, last_week.views)}) · Awarded ${usd(this_week.awarded_cents)}`,
    partial.best_clip
      ? `Best clip: ${n(partial.best_clip.views)} views — “${partial.best_clip.caption}”${partial.best_clip.handle ? ` (@${partial.best_clip.handle.replace(/^@/, "")})` : ""}`
      : "Best clip: none this week.",
    `Campaign grade ${partial.campaign.grade}: ${partial.campaign.detail.join(" ")}`,
    `Pacing: ${partial.pacing.action.replace("_", " ")}. ${partial.pacing.why.join(" ")}`,
    ...partial.playbook.insights
      .slice(0, 3)
      .map(
        (i) =>
          `Playbook (${i.confidence}): ${i.direction === "use" ? "Use" : "Avoid"} ${i.label}. ${i.evidence}`,
      ),
    `Next move: ${next_move}`,
  ];
  return { ...partial, next_move, text: lines.join("\n") };
}
