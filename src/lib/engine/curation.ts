import { APPROVED, DELIVERED, HOUR, median, viewsOf, type EngineSub } from "./types";

// Two-way curation. Clippers are scored on what they deliver; campaigns are
// scored on how they treat clippers (review speed, approval, payout). Great
// clippers get fast-tracked; slow campaigns get flagged before clippers leave.

export const REVIEW_SLA_HOURS = 48;

export type ClipperScore = {
  editor_id: string;
  handle: string | null;
  score: number; // 0–100
  tier: "fast_track" | "standard" | "watch" | "new";
  decided: number;
  approved: number;
  median_views: number;
  parts: { label: string; points: number; max: number; detail: string }[];
};

export function scoreClippers(subs: EngineSub[]): ClipperScore[] {
  const byEditor = new Map<string, EngineSub[]>();
  for (const s of subs) byEditor.set(s.editor_id, [...(byEditor.get(s.editor_id) ?? []), s]);

  // Views are ranked against other clippers, not an absolute bar, so the
  // score stays meaningful on a small board.
  const medians = new Map<string, number>();
  for (const [id, rows] of byEditor)
    medians.set(id, median(rows.filter((s) => DELIVERED.has(s.status)).map(viewsOf)));
  const sortedMedians = [...medians.values()].sort((a, b) => a - b);
  const pct = (v: number) =>
    sortedMedians.length <= 1
      ? 0.5
      : sortedMedians.filter((x) => x < v).length / (sortedMedians.length - 1);

  const out: ClipperScore[] = [];
  for (const [editor_id, rows] of byEditor) {
    const claims = rows.length;
    const delivered = rows.filter((s) => s.submitted_at).length;
    const approved = rows.filter((s) => APPROVED.has(s.status)).length;
    const rejected = rows.filter((s) => s.status === "rejected").length;
    const decided = approved + rejected;
    const autoOk = rows.filter((s) => s.submitted_at && s.auto_check_passed).length;
    const mv = medians.get(editor_id) ?? 0;

    // Smoothed approval (2 approvals / 2 rejections of prior) so one lucky
    // clip doesn't read as a perfect record.
    const approval = (approved + 2) / (decided + 4);
    const parts = [
      {
        label: "Approval",
        points: Math.round(approval * 40),
        max: 40,
        detail: `${approved}/${decided} approved`,
      },
      {
        label: "Views",
        points: Math.round(pct(mv) * 35),
        max: 35,
        detail: `median ${mv.toLocaleString()} views`,
      },
      {
        label: "Clean delivery",
        points: delivered ? Math.round((autoOk / delivered) * 15) : 0,
        max: 15,
        detail: `${autoOk}/${delivered} passed the auto-check`,
      },
      {
        label: "Follow-through",
        points: claims ? Math.round((delivered / claims) * 10) : 0,
        max: 10,
        detail: `${delivered}/${claims} claims delivered`,
      },
    ];
    const score = parts.reduce((a, p) => a + p.points, 0);
    const tier: ClipperScore["tier"] =
      decided < 3
        ? "new"
        : score >= 75 && rejected <= 1
          ? "fast_track"
          : score < 40
            ? "watch"
            : "standard";
    const handle = rows.find((s) => s.tiktok_handle)?.tiktok_handle ?? null;
    out.push({ editor_id, handle, score, tier, decided, approved, median_views: mv, parts });
  }
  return out.sort((a, b) => b.score - a.score);
}

export type CampaignScore = {
  bounty_id: string;
  grade: "A" | "B" | "C" | "D" | "—";
  approval_rate: number | null;
  median_review_hours: number | null;
  sla_breaches: number; // reviewed late, or still waiting past the SLA
  waiting_past_sla: number;
  paid_rate: number | null; // paid / approved
  detail: string[];
};

export function scoreCampaign(
  bountyId: string,
  allSubs: EngineSub[],
  now = Date.now(),
): CampaignScore {
  const subs = allSubs.filter((s) => s.bounty_id === bountyId && s.submitted_at);
  const reviewed = subs.filter((s) => s.reviewed_at);
  const hours = reviewed.map(
    (s) => (new Date(s.reviewed_at!).getTime() - new Date(s.submitted_at!).getTime()) / HOUR,
  );
  const lateReviewed = hours.filter((h) => h > REVIEW_SLA_HOURS).length;
  const waiting = subs.filter(
    (s) =>
      !s.reviewed_at &&
      (s.status === "submitted" || s.status === "pending") &&
      (now - new Date(s.submitted_at!).getTime()) / HOUR > REVIEW_SLA_HOURS,
  ).length;
  const approved = subs.filter((s) => APPROVED.has(s.status)).length;
  const rejected = subs.filter((s) => s.status === "rejected").length;
  const paid = subs.filter((s) => s.status === "paid").length;
  const approvalRate = approved + rejected ? approved / (approved + rejected) : null;
  const paidRate = approved ? paid / approved : null;
  const mh = hours.length ? Math.round(median(hours.map((h) => Math.round(h * 10))) / 10) : null;

  if (subs.length < 3)
    return {
      bounty_id: bountyId,
      grade: "—",
      approval_rate: approvalRate,
      median_review_hours: mh,
      sla_breaches: lateReviewed + waiting,
      waiting_past_sla: waiting,
      paid_rate: paidRate,
      detail: [`${subs.length} deliveries so far — grading starts at 3.`],
    };

  let pts = 0;
  if (mh !== null) pts += mh <= 24 ? 3 : mh <= REVIEW_SLA_HOURS ? 2 : 0;
  if (approvalRate !== null) pts += approvalRate >= 0.7 ? 2 : approvalRate >= 0.4 ? 1 : 0;
  if (paidRate !== null) pts += paidRate >= 0.8 ? 2 : paidRate >= 0.5 ? 1 : 0;
  pts -= Math.min(3, lateReviewed + waiting);
  const grade = pts >= 6 ? "A" : pts >= 4 ? "B" : pts >= 2 ? "C" : "D";
  const pctS = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);
  return {
    bounty_id: bountyId,
    grade,
    approval_rate: approvalRate,
    median_review_hours: mh,
    sla_breaches: lateReviewed + waiting,
    waiting_past_sla: waiting,
    paid_rate: paidRate,
    detail: [
      `Median review ${mh === null ? "—" : `${mh}h`} (SLA ${REVIEW_SLA_HOURS}h).`,
      `${pctS(approvalRate)} approved, ${pctS(paidRate)} of approvals paid.`,
      lateReviewed + waiting
        ? `${lateReviewed} reviewed late, ${waiting} waiting past ${REVIEW_SLA_HOURS}h now.`
        : "No SLA breaches.",
    ],
  };
}
