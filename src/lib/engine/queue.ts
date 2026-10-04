import { REVIEW_SLA_HOURS, type ClipperScore } from "./curation";
import { HOUR } from "./types";

// Review queue order: anything already past the 48h promise first (oldest
// first), then fast-track clippers, then everyone else oldest-first. A
// fast-track clipper never jumps a clip that's already late.

type Queued = { editor_id: string; submitted_at: string | null; claimed_at: string | null };

export function hoursWaiting(s: Queued, now = Date.now()): number {
  const t = s.submitted_at ?? s.claimed_at;
  return t ? Math.max(0, (now - new Date(t).getTime()) / HOUR) : 0;
}

export function orderReviewQueue<T extends Queued>(
  rows: T[],
  tiers: Map<string, ClipperScore["tier"]>,
  now = Date.now(),
): T[] {
  const rank = (s: T) => {
    if (hoursWaiting(s, now) > REVIEW_SLA_HOURS) return 0;
    return tiers.get(s.editor_id) === "fast_track" ? 1 : 2;
  };
  return [...rows].sort((a, b) => rank(a) - rank(b) || hoursWaiting(b, now) - hoursWaiting(a, now));
}
