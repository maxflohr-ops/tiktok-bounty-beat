// The engine reads the same rows the desk already writes — no new tables, no
// writes of its own. Every function in src/lib/engine is pure so the math can
// be tested without a database and shown to staff exactly as computed.

export type EngineSub = {
  id: string;
  bounty_id: string;
  editor_id: string;
  tiktok_handle: string | null;
  status: string;
  oembed_title: string | null;
  view_count: number | null;
  verified_view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  awarded_cash_cents: number | null;
  paid_cash_cents: number | null;
  auto_check_passed: boolean | null;
  claimed_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
};

export type EngineBounty = {
  id: string;
  contract_no: number;
  title: string;
  status: string;
  payout_type: "flat" | "per_1k_views";
  // flat: cents per approved clip. per_1k_views: cents per 100,000 verified
  // views, paid pro-rata (see src/lib/rate.ts).
  reward_cash_cents: number;
  funded_cash_cents: number;
  deadline: string | null;
  created_at: string;
};

// Views the engine trusts: staff-verified first, self-reported as fallback.
export function viewsOf(s: Pick<EngineSub, "verified_view_count" | "view_count">): number {
  return s.verified_view_count ?? s.view_count ?? 0;
}

export const DELIVERED = new Set(["submitted", "pending", "approved", "rejected", "paid"]);
export const APPROVED = new Set(["approved", "paid"]);

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export const HOUR = 3_600_000;
export const DAY = 86_400_000;
