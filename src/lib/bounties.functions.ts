import { isStaff } from "@/lib/authz.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BOUNTY_COLS =
  "id,contract_no,title,description,sound_name,tiktok_sound_url,cover_url,artist_song,source_assets_url,reward_points,reward_cash_cents,currency,payout_type,platform_target,max_submissions,deadline,status,created_at,funded_cash_cents,featured_until,hashtags,rules";
// Columns safe to expose publicly (excludes funded_cash_cents and any Stripe identifiers).
const PUBLIC_BOUNTY_COLS =
  "id,contract_no,title,description,sound_name,tiktok_sound_url,cover_url,artist_song,source_assets_url,reward_points,reward_cash_cents,currency,payout_type,platform_target,max_submissions,deadline,status,created_at,featured_until,hashtags,rules";

// Public: all bounties (any status) — the board never deletes, expired stays visible.
export const listPublicBounties = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: bounties, error } = await supabaseAdmin
    .from("bounties")
    .select(PUBLIC_BOUNTY_COLS)
    .neq("status", "draft")
    .order("contract_no", { ascending: false });
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
  platform_target: z.enum(["tiktok", "reels", "shorts"]).default("tiktok"),
  max_submissions: z.number().int().min(1).max(100000).nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  featured_until: z.string().datetime().nullable().optional(),
  // Stored lowercase without '#'; clippers see them as chips and the
  // delivery check counts them as a caption signal.
  hashtags: z
    .array(z.string().trim().regex(/^#?[A-Za-z0-9_]{2,40}$/))
    .max(10)
    .default([])
    .transform((arr) => [...new Set(arr.map((t) => t.replace(/^#/, "").toLowerCase()))]),
  rules: z.string().trim().max(2000).nullable().optional().transform((v) => v || null),
  status: z.enum(["draft", "active", "claimed", "in_review", "fulfilled", "expired", "closed"]).default("active"),
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
      deadline: data.deadline ?? null,
      featured_until: data.featured_until ?? null,
      hashtags: data.hashtags,
      rules: data.rules,
      status: data.status,
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
