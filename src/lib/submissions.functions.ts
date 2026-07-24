import { isStaff } from "@/lib/authz.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TIKTOK_URL = /^https?:\/\/((www|vm|vt|m)\.)?tiktok\.com\/.+/i;
const CLIP_URL = /^https?:\/\/.+/i;

async function fetchOembed(url: string) {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": "Mozilla/5.0 TheBoard/1.0" } },
    );
    if (!res.ok) return null;
    return (await res.json()) as {
      title?: string;
      author_name?: string;
      author_url?: string;
      thumbnail_url?: string;
    };
  } catch {
    return null;
  }
}

// TAKE THE CONTRACT — create a claim row, no URL yet.
export const claimContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        bounty_id: z.string().uuid(),
        tiktok_handle: z
          .string()
          .trim()
          .min(2)
          .max(60)
          .transform((v) => v.replace(/^@/, "").toLowerCase()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: bounty, error: berr } = await context.supabase
      .from("bounties")
      .select("id,status,max_submissions")
      .eq("id", data.bounty_id)
      .single();
    if (berr || !bounty) throw new Error("Contract not found.");
    if (bounty.status === "expired" || bounty.status === "fulfilled" || bounty.status === "closed")
      throw new Error("This contract is no longer taking claims.");

    // Enforce max claims
    if (bounty.max_submissions) {
      const { count } = await context.supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("bounty_id", data.bounty_id);
      if ((count ?? 0) >= bounty.max_submissions)
        throw new Error("This contract has reached its cap.");
    }

    const { error } = await context.supabase.from("submissions").insert({
      bounty_id: data.bounty_id,
      editor_id: context.userId,
      tiktok_handle: data.tiktok_handle,
      status: "claimed",
      tiktok_video_url: null,
    });
    if (error) {
      if (error.code === "23505") throw new Error("You've already taken this contract.");
      throw new Error(error.message);
    }
    return { ok: true };
  });

// DELIVER PROOF — attach video URL, run oembed check, set status='submitted'.
export const deliverProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        submission_id: z.string().uuid(),
        clip_url: z.string().trim().url().regex(CLIP_URL).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: sub, error: se } = await context.supabase
      .from("submissions")
      .select("id,editor_id,status,tiktok_handle,bounty_id,bounties:bounty_id(platform_target)")
      .eq("id", data.submission_id)
      .single();
    if (se || !sub) throw new Error("Claim not found.");
    if (sub.editor_id !== context.userId) throw new Error("Not your claim.");
    if (sub.status !== "claimed" && sub.status !== "rejected")
      throw new Error("This claim already has delivered proof.");

    const platform = (sub as unknown as { bounties: { platform_target: string } }).bounties
      ?.platform_target;
    const isTikTok = platform === "tiktok" && TIKTOK_URL.test(data.clip_url);
    const oembed = isTikTok ? await fetchOembed(data.clip_url) : null;
    const author = (oembed?.author_name || "").replace(/^@/, "").toLowerCase();
    const handleMatches = author && author === sub.tiktok_handle;
    const passed = Boolean(oembed && handleMatches);
    const notes = !isTikTok
      ? "Non-TikTok delivery — a harbormaster will verify by eye."
      : !oembed
        ? "Could not verify with TikTok (URL may be private, removed, or blocked)."
        : !handleMatches
          ? `TikTok reports the author as @${author || "unknown"} — does not match @${sub.tiktok_handle}.`
          : "Public TikTok video posted by the claimed handle. Awaiting sound confirmation.";

    const { error } = await context.supabase
      .from("submissions")
      .update({
        tiktok_video_url: data.clip_url,
        oembed_title: oembed?.title ?? null,
        oembed_author: oembed?.author_name ?? null,
        oembed_thumbnail: oembed?.thumbnail_url ?? null,
        auto_check_passed: passed,
        auto_check_notes: notes,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", data.submission_id);
    if (error) throw new Error(error.message);
    return { ok: true, auto_check_passed: passed };
  });

export const updateViewCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ submission_id: z.string().uuid(), view_count: z.number().int().min(0).max(2_000_000_000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: sub } = await context.supabase
      .from("submissions")
      .select("editor_id")
      .eq("id", data.submission_id)
      .single();
    if (!sub || sub.editor_id !== context.userId) throw new Error("Not your claim.");
    const { error } = await context.supabase
      .from("submissions")
      .update({ view_count: data.view_count })
      .eq("id", data.submission_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SUB_COLS =
  "id,bounty_id,editor_id,tiktok_video_url,tiktok_handle,oembed_title,oembed_author,oembed_thumbnail,auto_check_passed,auto_check_notes,status,awarded_points,awarded_cash_cents,paid_cash_cents,stripe_transfer_id,view_count,review_notes,claimed_at,submitted_at,reviewed_at,paid_at,created_at";

export const listMyClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("submissions")
      .select(
        `${SUB_COLS}, bounty:bounties(id,contract_no,title,sound_name,artist_song,reward_points,reward_cash_cents,currency,payout_type,platform_target,deadline,status)`,
      )
      .eq("editor_id", context.userId)
      .order("claimed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAllSubmissionsStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("submissions")
      .select(
        `${SUB_COLS}, bounty:bounties(id,contract_no,title,sound_name,reward_points,reward_cash_cents,currency,payout_type)`,
      )
      .order("claimed_at", { ascending: false })
      .limit(400);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const editorIds = Array.from(new Set(rows.map((r) => r.editor_id)));
    const map: Record<string, { display_name: string | null; tiktok_handle: string | null }> = {};
    if (editorIds.length) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id,display_name,tiktok_handle")
        .in("id", editorIds);
      for (const p of profs ?? []) map[p.id] = { display_name: p.display_name, tiktok_handle: p.tiktok_handle };
    }
    return rows.map((r) => ({ ...r, editor: map[r.editor_id] ?? null }));
  });

export const reviewSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        awarded_points: z.number().int().min(0).max(1_000_000).default(0),
        awarded_cash_cents: z.number().int().min(0).max(1_000_000_00).default(0),
        review_notes: z.string().trim().max(1000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");

    const { data: sub, error: se } = await context.supabase
      .from("submissions")
      .select("id,editor_id,status,view_count,bounties:bounty_id(payout_type,reward_cash_cents)")
      .eq("id", data.id)
      .single();
    if (se || !sub) throw new Error("Not found.");
    const cur = sub.status as string;
    if (cur !== "submitted" && cur !== "in_review" && cur !== "pending")
      throw new Error("This claim is not awaiting review.");

    const bounty = (sub as unknown as { bounties: { payout_type: string; reward_cash_cents: number } }).bounties;
    let computedCash = data.awarded_cash_cents;
    if (data.decision === "approved" && bounty) {
      computedCash =
        bounty.payout_type === "per_1k_views"
          ? Math.floor((sub.view_count || 0) / 1000) * bounty.reward_cash_cents
          : (data.awarded_cash_cents || bounty.reward_cash_cents);
    }

    const { error: ue } = await context.supabase
      .from("submissions")
      .update({
        status: data.decision,
        awarded_points: data.decision === "approved" ? data.awarded_points : 0,
        awarded_cash_cents: data.decision === "approved" ? computedCash : 0,
        review_notes: data.review_notes || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (ue) throw new Error(ue.message);

    if (data.decision === "approved" && data.awarded_points > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("points")
        .eq("id", sub.editor_id)
        .single();
      const current = prof?.points ?? 0;
      await supabaseAdmin
        .from("profiles")
        .update({ points: current + data.awarded_points })
        .eq("id", sub.editor_id);
    }
    return { ok: true };
  });

// NOTE: markPaid is for manual/offline ledger entries only.
// For Stripe Connect payouts, use `stripePayout`/`payoutEditor` in stripe.functions.ts.
export const markPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("submissions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("status", "approved");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
