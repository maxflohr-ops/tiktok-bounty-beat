import { isStaff } from "@/lib/authz.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyAsync } from "@/lib/notify.server";
import { claimContractSchema } from "@/lib/claim-validation";

const TIKTOK_URL = /^https?:\/\/((www|vm|vt|m)\.)?tiktok\.com\/.+/i;
const CLIP_URL = /^https?:\/\/.+/i;

async function fetchOembed(url: string) {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": "Mozilla/5.0 TheBoard/1.0" }, signal: AbortSignal.timeout(8000) },
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

async function fetchVideoHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// TAKE THE CONTRACT — create a claim row, no URL yet.
export const claimContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => claimContractSchema.parse(d))
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
      paypal_email: data.paypal_email,
      status: "claimed",
      tiktok_video_url: null,
    });
    if (error) {
      if (error.code === "23505") throw new Error("You've already taken this contract.");
      throw new Error(error.message);
    }
    notifyAsync({
      event: "claim.created",
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: data.bounty_id,
      details: {
        tiktok_handle: data.tiktok_handle,
        paypal_email: data.paypal_email,
        editor_id: context.userId,
      },
    });
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
      .select(
        "id,editor_id,status,tiktok_handle,bounty_id,bounties:bounty_id(platform_target,tiktok_sound_url,sound_name)",
      )
      .eq("id", data.submission_id)
      .single();
    if (se || !sub) throw new Error("Claim not found.");
    if (sub.editor_id !== context.userId) throw new Error("Not your claim.");
    if (sub.status !== "claimed" && sub.status !== "rejected")
      throw new Error("This claim already has delivered proof.");

    const bounty = (sub as unknown as {
      bounties: { platform_target: string; tiktok_sound_url: string | null; sound_name: string };
    }).bounties;
    const { parseMusicId, handleFromAuthorUrl, musicIdInHtml } = await import("@/lib/tiktok-verify");

    const isTikTok = bounty?.platform_target === "tiktok" && TIKTOK_URL.test(data.clip_url);
    const oembed = isTikTok ? await fetchOembed(data.clip_url) : null;

    // Author: the unique handle lives in author_url; author_name is a display nickname.
    const author =
      handleFromAuthorUrl(oembed?.author_url) ??
      (oembed?.author_name || "").replace(/^@/, "").toLowerCase();

    // Clippers run multiple accounts. Never block on the posting account:
    // linked accounts auto-verify; a new account is auto-linked as
    // 'unverified' and the delivery is flagged for review instead.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let accountTrusted: boolean | null = null; // null = author unknown
    if (oembed && author) {
      const { data: accounts } = await context.supabase
        .from("tiktok_accounts")
        .select("handle,status")
        .eq("user_id", context.userId);
      const known = (accounts ?? []).find((a) => a.handle === author);
      accountTrusted = known ? known.status === "trusted" : author === sub.tiktok_handle;
      if (!known) {
        await supabaseAdmin
          .from("tiktok_accounts")
          .upsert(
            { user_id: context.userId, handle: author, status: author === sub.tiktok_handle ? "trusted" : "unverified" },
            { onConflict: "user_id,handle", ignoreDuplicates: true },
          );
      }
    }

    // Sound: compare the contract's music ID against the video page's music data.
    const wantMusicId = isTikTok ? parseMusicId(bounty?.tiktok_sound_url) : null;
    let soundOk: boolean | null = null;
    if (wantMusicId) {
      const html = await fetchVideoHtml(data.clip_url);
      soundOk = html ? musicIdInHtml(html, wantMusicId) : null;
    }
    // No hard block on sound: TikTok remaps audio often enough that a
    // mismatch is a review flag, not a rejection. The campaign hashtag in
    // the caption is an alternate signal.
    const hasTag = /#bountysounds/i.test(oembed?.title ?? "");

    const soundSignal = soundOk === true || (soundOk === null && hasTag);
    const passed = Boolean(oembed && accountTrusted && soundSignal);
    const soundNote =
      soundOk === true
        ? "using the contract's sound"
        : soundOk === false
          ? `sound looks different from the contract's (TikTok sometimes remaps audio) — confirm manually${hasTag ? "; #bountysounds tag present" : ""}`
          : hasTag
            ? "#bountysounds tag in caption"
            : wantMusicId
              ? "sound not auto-verified (manual confirm)"
              : "no sound link on contract (manual confirm)";
    const notes = !isTikTok
      ? "Non-TikTok delivery — will be verified manually."
      : !oembed
        ? "Could not verify with TikTok (URL may be private, removed, or blocked)."
        : accountTrusted
          ? `Posted from linked account @${author}, ${soundNote}.`
          : `First delivery from @${author} — account auto-linked, verify it's theirs. Also: ${soundNote}.`;

    const { error } = await context.supabase
      .from("submissions")
      .update({
        tiktok_video_url: data.clip_url,
        // record the account that actually posted, not just the one claimed
        ...(author ? { tiktok_handle: author } : {}),
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
    notifyAsync({
      event: "proof.delivered",
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: data.submission_id,
      details: {
        clip_url: data.clip_url,
        auto_check_passed: passed,
        auto_check_notes: notes,
        oembed_author: oembed?.author_name ?? null,
      },
    });
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
    notifyAsync({
      event: "views.updated",
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: data.submission_id,
      details: { view_count: data.view_count },
    });
    return { ok: true };
  });

// Staff: verify (or correct) a submission's view count. This value — not the editor's
// self-reported view_count — is what per-view payouts are computed from.
export const verifyViewCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      submission_id: z.string().uuid(),
      verified_view_count: z.number().int().min(0).max(2_000_000_000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("submissions")
      .update({ verified_view_count: data.verified_view_count })
      .eq("id", data.submission_id);
    if (error) throw new Error(error.message);
    notifyAsync({
      event: "views.verified",
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: data.submission_id,
      details: { verified_view_count: data.verified_view_count },
    });
    return { ok: true };
  });

const SUB_COLS =
  "id,bounty_id,editor_id,tiktok_video_url,tiktok_handle,paypal_email,oembed_title,oembed_author,oembed_thumbnail,auto_check_passed,auto_check_notes,status,awarded_points,awarded_cash_cents,paid_cash_cents,stripe_transfer_id,view_count,review_notes,claimed_at,submitted_at,reviewed_at,paid_at,created_at";

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
      .select("id,editor_id,status,view_count,verified_view_count,tiktok_handle,bounties:bounty_id(payout_type,reward_cash_cents)")
      .eq("id", data.id)
      .single();
    if (se || !sub) throw new Error("Not found.");
    const cur = sub.status as string;
    if (cur !== "submitted" && cur !== "in_review" && cur !== "pending")
      throw new Error("This claim is not awaiting review.");

    const bounty = (sub as unknown as { bounties: { payout_type: string; reward_cash_cents: number } }).bounties;
    let computedCash = data.awarded_cash_cents;
    if (data.decision === "approved" && bounty) {
      if (bounty.payout_type === "per_1k_views") {
        const verified = (sub as { verified_view_count: number | null }).verified_view_count;
        if (verified === null || verified === undefined) {
          throw new Error("Verify the view count (staff) before approving a per-view payout.");
        }
        computedCash = Math.floor(verified / 100000) * bounty.reward_cash_cents;
      } else {
        computedCash = data.awarded_cash_cents || bounty.reward_cash_cents;
      }
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

    if (data.decision === "approved" && (sub as { tiktok_handle: string | null }).tiktok_handle) {
      // An approved delivery proves the account is really theirs.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("tiktok_accounts")
        .update({ status: "trusted" })
        .eq("user_id", sub.editor_id)
        .eq("handle", (sub as { tiktok_handle: string }).tiktok_handle);
    }

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
    notifyAsync({
      event: `review.${data.decision}`,
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: data.id,
      details: {
        decision: data.decision,
        awarded_points: data.decision === "approved" ? data.awarded_points : 0,
        awarded_cash_cents: data.decision === "approved" ? computedCash : 0,
        review_notes: data.review_notes || null,
      },
    });
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
    notifyAsync({
      event: "payment.marked_paid",
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: data.id,
    });
    return { ok: true };
  });
