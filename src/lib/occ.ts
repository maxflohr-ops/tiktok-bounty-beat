// Map a public bounty row to an Open Clipping Contract (occ/spec/contract.schema.json).
// Pure module — no app imports — so it can be validated against the schema in isolation.

export type PublicBountyRow = {
  id: string;
  contract_no: number;
  title: string;
  description: string;
  sound_name: string;
  tiktok_sound_url: string | null;
  source_assets_url: string | null;
  cover_url: string | null;
  artist_song: string | null;
  reward_points: number;
  reward_cash_cents: number;
  currency: string;
  payout_type: "flat" | "per_1k_views";
  platform_target: "tiktok" | "reels" | "shorts";
  max_submissions: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  funded_cash_cents?: number | null;
  claims_count?: number;
  approved_count?: number;
};

// Board statuses are per-workflow; OCC statuses are contract-scoped (SPEC §3.8).
// "claimed" still accepts more editors on this board, so it maps to open.
const STATUS_MAP: Record<string, string> = {
  draft: "draft",
  active: "open",
  claimed: "open",
  in_review: "closed",
  fulfilled: "settled",
  expired: "expired",
  closed: "closed",
  cancelled: "cancelled",
};

const isoDate = (ts: string) => ts.slice(0, 10);

export function bountyToOcc(b: PublicBountyRow, origin: string): Record<string, unknown> | null {
  // OCC requires a deadline — a contract that cannot expire cannot return funds.
  if (!b.deadline) return null;
  const status = STATUS_MAP[b.status];
  if (!status || status === "draft") return null;

  const funded = (b.funded_cash_cents ?? 0) > 0;
  const perViews = b.payout_type === "per_1k_views";
  const boardUrl = `${origin}/bounty/${b.id}`;

  return {
    occ_version: "0.1",
    contract_id: `BS-${b.contract_no}`,
    title: b.title.slice(0, 120),
    brief: b.description,
    asset: {
      url: b.tiktok_sound_url ?? b.source_assets_url ?? boardUrl,
      type: "audio",
      ...(b.artist_song ? { attribution: `credit "${b.artist_song}"` } : {}),
    },
    platforms: [b.platform_target],
    reward: {
      // Board rates are cents per 1k views; OCC per_100k_views is cents per 100k.
      type: perViews ? "per_100k_views" : "flat",
      rate: perViews ? b.reward_cash_cents * 100 : b.reward_cash_cents,
      currency: (b.currency || "USD").toUpperCase(),
    },
    budget: {
      total: b.funded_cash_cents ?? 0,
      funded,
    },
    posted: isoDate(b.created_at),
    deadline: isoDate(b.deadline),
    proof: {
      requires: ["live_url", "view_count"],
      verified_after_hours: 72,
    },
    status,
    ...(b.claims_count != null ? { delivered: b.claims_count } : {}),
    ...(b.approved_count != null ? { approved: b.approved_count } : {}),
    x_board: {
      url: boardUrl,
      sound_name: b.sound_name,
      ...(b.cover_url ? { cover_url: b.cover_url } : {}),
      ...(b.max_submissions != null ? { max_submissions: b.max_submissions } : {}),
      ...(b.reward_points ? { reward_points: b.reward_points } : {}),
    },
  };
}
