import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TIKTOK_URL = /^https?:\/\/((www|vm|vt|m)\.)?tiktok\.com\/.+/i;

async function fetchOembed(url: string) {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": "Mozilla/5.0 SoundBounties/1.0" } },
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

const submitInput = z.object({
  bounty_id: z.string().uuid(),
  tiktok_video_url: z.string().trim().url().regex(TIKTOK_URL, "Must be a TikTok URL").max(500),
  tiktok_handle: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .transform((v) => v.replace(/^@/, "").toLowerCase()),
});

export const submitEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitInput.parse(d))
  .handler(async ({ data, context }) => {
    // Bounty must exist + be active
    const { data: bounty, error: berr } = await context.supabase
      .from("bounties")
      .select("id,status,reward_points,reward_cash_cents,max_submissions")
      .eq("id", data.bounty_id)
      .single();
    if (berr || !bounty) throw new Error("Bounty not found");
    if (bounty.status !== "active") throw new Error("This bounty is no longer accepting entries.");

    // Enforce one submission per editor per bounty
    const { data: existing } = await context.supabase
      .from("submissions")
      .select("id,status")
      .eq("bounty_id", data.bounty_id)
      .eq("editor_id", context.userId)
      .maybeSingle();
    if (existing) throw new Error("You've already submitted an entry for this bounty.");

    const oembed = await fetchOembed(data.tiktok_video_url);
    const author = (oembed?.author_name || "").replace(/^@/, "").toLowerCase();
    const handleMatches = author && author === data.tiktok_handle;
    const passed = Boolean(oembed && handleMatches);
    const notes = !oembed
      ? "Could not verify the video with TikTok (URL may be private, removed, or blocked)."
      : !handleMatches
        ? `TikTok reports the author as @${author || "unknown"}, which does not match the handle you submitted.`
        : "URL is a real, public TikTok video posted by the submitted handle. A staff member will confirm the sound was used.";

    const { error } = await context.supabase.from("submissions").insert({
      bounty_id: data.bounty_id,
      editor_id: context.userId,
      tiktok_video_url: data.tiktok_video_url,
      tiktok_handle: data.tiktok_handle,
      oembed_title: oembed?.title ?? null,
      oembed_author: oembed?.author_name ?? null,
      oembed_thumbnail: oembed?.thumbnail_url ?? null,
      auto_check_passed: passed,
      auto_check_notes: notes,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true, auto_check_passed: passed };
  });

export const listMySubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("submissions")
      .select("*, bounty:bounties(id,title,sound_name,reward_points,reward_cash_cents,currency)")
      .eq("editor_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listPendingSubmissionsStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("submissions")
      .select(
        "*, bounty:bounties(id,title,sound_name,reward_points,reward_cash_cents,currency)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const editorIds = Array.from(new Set(rows.map((r) => r.editor_id)));
    const editorMap: Record<string, { display_name: string | null; tiktok_handle: string | null }> = {};
    if (editorIds.length > 0) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id,display_name,tiktok_handle")
        .in("id", editorIds);
      for (const p of profs ?? []) editorMap[p.id] = { display_name: p.display_name, tiktok_handle: p.tiktok_handle };
    }
    return rows.map((r) => ({ ...r, editor: editorMap[r.editor_id] ?? null }));
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
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("Forbidden");

    const { data: sub, error: se } = await context.supabase
      .from("submissions")
      .select("id,editor_id,status,awarded_points")
      .eq("id", data.id)
      .single();
    if (se || !sub) throw new Error("Submission not found");
    if (sub.status !== "pending") throw new Error("Already reviewed");

    const { error: ue } = await context.supabase
      .from("submissions")
      .update({
        status: data.decision,
        awarded_points: data.decision === "approved" ? data.awarded_points : 0,
        awarded_cash_cents: data.decision === "approved" ? data.awarded_cash_cents : 0,
        review_notes: data.review_notes || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (ue) throw new Error(ue.message);

    if (data.decision === "approved" && data.awarded_points > 0) {
      // Use admin client to increment points atomically-ish
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
