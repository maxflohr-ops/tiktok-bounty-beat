import { isStaff } from "@/lib/authz.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BOUNTY_COLS =
  "id,contract_no,title,description,sound_name,tiktok_sound_url,cover_url,artist_song,source_assets_url,reward_points,reward_cash_cents,currency,payout_type,platform_target,max_submissions,deadline,status,created_at,funded_cash_cents,featured_until,featured_plus,hashtags,rules,counting_days,max_clips_per_editor,visibility,access_mode";
// Columns safe to expose publicly (excludes funded_cash_cents and any Stripe identifiers).
const PUBLIC_BOUNTY_COLS =
  "id,contract_no,title,description,sound_name,tiktok_sound_url,cover_url,artist_song,source_assets_url,reward_points,reward_cash_cents,currency,payout_type,platform_target,max_submissions,deadline,status,created_at,featured_until,featured_plus,hashtags,rules,counting_days,max_clips_per_editor,visibility,access_mode";

// Columns present since the original schema — the fallback when the DB is
// mid-deploy and hasn't run the newest column migrations yet.
const PUBLIC_BOUNTY_COLS_BASE =
  "id,contract_no,title,description,sound_name,tiktok_sound_url,cover_url,artist_song,source_assets_url,reward_points,reward_cash_cents,currency,payout_type,platform_target,max_submissions,deadline,status,created_at";
const LATE_COLUMN_DEFAULTS = {
  featured_until: null,
  featured_plus: false,
  hashtags: [] as string[],
  rules: null,
  counting_days: 14,
  max_clips_per_editor: 15,
  visibility: "public",
  access_mode: null,
};

// Launch contracts, mirrored from their seed migrations. Lovable's publish
// has skipped git-synced migration files before, so the server also ensures
// each one exists - same idempotence key (the title), base columns only so
// the inserts work on any schema vintage. A seed whose posting window has
// closed is skipped (an empty board after the deadline is the truth), and a
// row that exists in ANY status is left alone - staff drafting sticks.
const LAUNCH_SEEDS = [
  {
    title: "Clip Ebril's Thursday Twitch stream",
    description:
      "Ebril goes live on Twitch every Thursday. Cut the stream's best moments into vertical clips and post them to TikTok — best reactions, best runs, best lines. Tiered payout: 1M verified views on TikTok pays $100, and a single video that hits 2.5M views captures $250. Views stack across your clips at the same rate. Keep Ebril's voice front and center. 9:16 only, subtitles encouraged. Clips from the live stream or its VOD both count.",
    sound_name: "Ebril — live on Twitch (Thursdays)",
    artist_song: "Ebril",
    source_assets_url: "https://twitch.tv/ebbionline",
    payout_type: "per_1k_views" as const,
    platform_target: "tiktok" as const,
    reward_cash_cents: 10000,
    reward_points: 100,
    max_submissions: 20,
    deadline: "2026-12-31T23:59:00Z",
    status: "active" as const,
    funded_cash_cents: 50000, // the $500 purse — covers the $250 single-video tier twice over
  },
  {
    title: "Clip Ebril — Anticipate Heartbreak",
    description:
      "Cut a TikTok on Ebril's \"Anticipate Heartbreak.\" Tiered payout: 1M verified views pays $100, and a single video that hits 2.5M views captures $250. Views stack across your clips at the same rate. 9:16 only, subtitles encouraged, use the official sound.",
    sound_name: "Ebril — Anticipate Heartbreak",
    artist_song: "Ebril",
    tiktok_sound_url: "https://www.tiktok.com/music/original-sound-7597916391358024503",
    payout_type: "per_1k_views" as const,
    platform_target: "tiktok" as const,
    reward_cash_cents: 10000, // $100 per 1M, same tier line as the stream bounty
    reward_points: 100,
    max_submissions: 20,
    deadline: "2026-12-31T23:59:00Z",
    status: "active" as const,
    funded_cash_cents: 50000, // the $500 purse
  },
  {
    title: "Clip Ridgeclub — Biting Bullets",
    description:
      'Cut a TikTok on Ridgeclub\'s "Biting Bullets." $2 per 100,000 verified views — a 5M-view video captures the full $100 purse, and views stack across your clips, so two 2.5M clips cash the same. 9:16 only, subtitles encouraged, use the sound.',
    sound_name: "Ridgeclub — Biting Bullets",
    artist_song: "Ridgeclub",
    tiktok_sound_url: "https://www.tiktok.com/music/original-sound-7653102138111052552",
    payout_type: "per_1k_views" as const,
    platform_target: "tiktok" as const,
    reward_cash_cents: 200, // $2 per 100k ≡ $100 per 5M views
    reward_points: 100,
    max_submissions: 20,
    deadline: "2026-09-08T23:59:00Z",
    status: "active" as const,
    funded_cash_cents: 10000, // the $100 purse
  },
];

async function ensureLaunchBounties(supabaseAdmin: any) {
  for (const seed of LAUNCH_SEEDS) {
    if (new Date(seed.deadline).getTime() < Date.now()) continue;
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("bounties")
      .select("id")
      .eq("title", seed.title)
      .maybeSingle();
    if (lookupError) {
      console.error("ensureLaunchBounties lookup failed:", lookupError.message);
      continue;
    }
    if (existing) continue;
    const { error: insertError } = await supabaseAdmin.from("bounties").insert(seed);
    if (insertError) console.error("ensureLaunchBounties insert failed:", seed.title, insertError.message);
  }
}

// Public: all bounties (any status) — the board never deletes, expired stays visible.
export const listPublicBounties = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await ensureLaunchBounties(supabaseAdmin);
  let { data: bounties, error } = await supabaseAdmin
    .from("bounties")
    .select(PUBLIC_BOUNTY_COLS)
    .neq("status", "draft")
    .eq("visibility", "public")
    .order("contract_no", { ascending: false });
  if (error && (/does not exist/i.test(error.message) || (error as any).code === "42703")) {
    // Migrations lag the deploy: serve the board from the base columns and
    // drop the visibility filter entirely (everything is public pre-migration)
    // rather than going dark.
    const retry = await supabaseAdmin
      .from("bounties")
      .select(PUBLIC_BOUNTY_COLS_BASE)
      .neq("status", "draft")
      .order("contract_no", { ascending: false });
    error = retry.error;
    bounties = (retry.data?.map((b) => ({ ...LATE_COLUMN_DEFAULTS, ...b })) ?? null) as typeof bounties;
  }
  if (error) throw new Error(error.message);
  const list = bounties ?? [];
  if (list.length === 0) return [];

  const ids = list.map((b) => b.id);
  const { data: claims } = await supabaseAdmin
    .from("submissions")
    .select("bounty_id,status,paid_cash_cents")
    .in("bounty_id", ids);
  const counts = new Map<string, { claims: number; approved: number; paid: number }>();
  for (const id of ids) counts.set(id, { claims: 0, approved: 0, paid: 0 });
  for (const c of claims ?? []) {
    const row = counts.get(c.bounty_id)!;
    row.claims += 1;
    if (c.status === "approved" || c.status === "paid") row.approved += 1;
    row.paid += c.paid_cash_cents ?? 0;
  }

  return list.map((b) => ({
    ...b,
    claims_count: counts.get(b.id)?.claims ?? 0,
    approved_count: counts.get(b.id)?.approved ?? 0,
    paid_out_cents: counts.get(b.id)?.paid ?? 0,
  }));
});

// Aggregates only — no per-bounty money figures leave the server. Feeds the
// ledger card (behind FLAGS.ledger; the UI also zero-guards on open_count).
export const boardLedger = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: open } = await supabaseAdmin
    .from("bounties")
    .select("id,funded_cash_cents,deadline")
    .eq("status", "active");
  const live = (open ?? []).filter(
    (b) => !b.deadline || new Date(b.deadline).getTime() > Date.now(),
  );
  const purses = live.map((b) => b.funded_cash_cents ?? 0);
  const { data: lastPaid } = await supabaseAdmin
    .from("submissions")
    .select("paid_cash_cents,paid_at")
    .eq("status", "paid")
    .gt("paid_cash_cents", 0)
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return {
    open_count: live.length,
    total_purse_cents: purses.reduce((a, b) => a + b, 0),
    largest_purse_cents: purses.length ? Math.max(...purses) : 0,
    last_capture: lastPaid
      ? { amount_cents: lastPaid.paid_cash_cents ?? 0, at: lastPaid.paid_at }
      : null,
  };
});

// Public: clips that captured their purse — posted in the window, verified,
// paid. No PII beyond the public TikTok handle. Powers the board's
// "Captured" wall; renders nothing until real payouts exist.
export const pastCaptures = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("submissions")
    .select(
      "id,tiktok_handle,tiktok_video_url,verified_view_count,paid_cash_cents,paid_at,bounties:bounty_id(title,contract_no)",
    )
    .eq("status", "paid")
    .gt("paid_cash_cents", 0)
    .not("tiktok_video_url", "is", null)
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(12);
  if (error) return [];
  return (data ?? []).map((s) => ({
    id: s.id,
    tiktok_handle: s.tiktok_handle,
    tiktok_video_url: s.tiktok_video_url,
    verified_view_count: s.verified_view_count,
    paid_cash_cents: s.paid_cash_cents,
    bounty_title: (s as unknown as { bounties: { title: string } | null }).bounties?.title ?? null,
    contract_no: (s as unknown as { bounties: { contract_no: number } | null }).bounties?.contract_no ?? null,
  }));
});

// Public: every delivered clip on a bounty - in review, counting, approved,
// or captured. Anyone clicking into a bounty sees what's already riding on
// it. Public TikTok handle + video link only; no payout PII.
export const listBountyClips = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ bounty_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("submissions")
      .select("id,tiktok_handle,tiktok_video_url,view_count,verified_view_count,status,counting_ends_at,submitted_at,paid_cash_cents")
      .eq("bounty_id", data.bounty_id)
      .in("status", ["submitted", "pending", "approved", "paid"])
      .not("tiktok_video_url", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(50);
    if (error) return [];
    return rows ?? [];
  });

const upsertBountyInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(2000),
  sound_name: z.string().trim().min(1).max(160),
  artist_song: z.string().trim().max(200).optional().transform((v) => v || null),
  tiktok_sound_url: z.string().trim().url().optional().or(z.literal("")).transform((v) => v || null),
  source_assets_url: z.string().trim().url().optional().or(z.literal("")).transform((v) => v || null),
  cover_url: z.string().trim().url().optional().or(z.literal("")).transform((v) => v || null),
  reward_points: z.number().int().min(0).max(1_000_000),
  reward_cash_cents: z.number().int().min(0).max(1_000_000_00),
  currency: z.string().trim().length(3).default("USD"),
  payout_type: z.enum(["flat", "per_1k_views"]).default("flat"),
  platform_target: z.enum(["tiktok", "shorts"]).default("tiktok"),
  max_submissions: z.number().int().min(1).max(100000).nullable().optional(),
  counting_days: z.number().int().min(1).max(90).default(14),
  max_clips_per_editor: z.number().int().min(1).max(50).default(15),
  deadline: z.string().datetime().nullable().optional(),
  featured_until: z.string().datetime().nullable().optional(),
  featured_plus: z.boolean().default(false),
  // Stored lowercase without '#'; clippers see them as chips and the
  // delivery check counts them as a caption signal.
  hashtags: z
    .array(z.string().trim().regex(/^#?[A-Za-z0-9_]{2,40}$/))
    .max(10)
    .default([])
    .transform((arr) => [...new Set(arr.map((t) => t.replace(/^#/, "").toLowerCase()))]),
  rules: z.string().trim().max(2000).nullable().optional().transform((v) => v || null),
  status: z.enum(["draft", "active", "claimed", "in_review", "fulfilled", "expired", "closed"]).default("active"),
  visibility: z.enum(["public", "private"]).default("public"),
  access_mode: z.enum(["invite", "apply"]).nullable().optional(),
});

export const upsertBounty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertBountyInput.parse(d))
  .handler(async ({ data, context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    const row = {
      title: data.title,
      description: data.description,
      sound_name: data.sound_name,
      artist_song: data.artist_song,
      tiktok_sound_url: data.tiktok_sound_url,
      source_assets_url: data.source_assets_url,
      cover_url: data.cover_url,
      reward_points: data.reward_points,
      reward_cash_cents: data.reward_cash_cents,
      currency: data.currency,
      payout_type: data.payout_type,
      platform_target: data.platform_target,
      max_submissions: data.max_submissions ?? null,
      counting_days: data.counting_days,
      max_clips_per_editor: data.max_clips_per_editor,
      deadline: data.deadline ?? null,
      featured_until: data.featured_until ?? null,
      featured_plus: data.featured_plus,
      hashtags: data.hashtags,
      rules: data.rules,
      status: data.status,
      visibility: data.visibility,
      access_mode:
        data.visibility === "private" ? (data.access_mode ?? "invite") : null,
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase.from("bounties").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await context.supabase
      .from("bounties")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deleteBounty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    const { error } = await context.supabase.from("bounties").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllBountiesStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    // Uses admin client: BOUNTY_COLS includes funded_cash_cents which is column-level
    // revoked from authenticated. Staff gate above authorizes the read.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bounties")
      .select(BOUNTY_COLS)
      .order("contract_no", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
