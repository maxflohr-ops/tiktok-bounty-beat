import { isStaff } from "@/lib/authz.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyAsync } from "@/lib/notify.server";
import { claimContractSchema } from "@/lib/claim-validation";

const TIKTOK_URL = /^https?:\/\/((www|vm|vt|m)\.)?tiktok\.com\/.+/i;

// Best-effort status email to an editor. Never blocks or throws.
function notifyEditorAsync(editorId: string, title: string, body: string) {
  void (async () => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin.auth.admin.getUserById(editorId);
      const email = data?.user?.email;
      if (!email) return;
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("editor-status", email, {
        templateData: { title, body },
        idempotencyKey: `${editorId}:${title}:${Date.now()}`,
      });
    } catch (err) {
      console.warn("[notifyEditor] skipped:", (err as Error)?.message ?? err);
    }
  })();
}
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
      .select("id,status,max_submissions,max_clips_per_editor")
      .eq("id", data.bounty_id)
      .single();
    if (berr || !bounty) throw new Error("Contract not found.");
    if (bounty.status === "expired" || bounty.status === "fulfilled" || bounty.status === "closed")
      throw new Error("This contract is no longer taking claims.");

    // Payout rail required up front: PayPal on the claim, or a wallet on file.
    if (!data.paypal_email) {
      const { data: prof } = await context.supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", context.userId)
        .single();
      if (!prof?.wallet_address)
        throw new Error("Add a PayPal email here, or connect a USDC wallet on your dashboard first.");
    }

    const clips = data.clips ?? 1;
    const perEditorMax = (bounty as { max_clips_per_editor?: number }).max_clips_per_editor ?? 15;
    const { count: mineCount } = await context.supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("bounty_id", data.bounty_id)
      .eq("editor_id", context.userId);
    if ((mineCount ?? 0) + clips > perEditorMax)
      throw new Error(`This contract allows ${perEditorMax} clip${perEditorMax === 1 ? "" : "s"} per editor — you already hold ${mineCount ?? 0}.`);

    // Enforce the contract-wide cap across all editors.
    if (bounty.max_submissions) {
      const { count } = await context.supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("bounty_id", data.bounty_id);
      if ((count ?? 0) + clips > bounty.max_submissions)
        throw new Error("This contract has reached its cap.");
    }

    const rows = Array.from({ length: clips }, () => ({
      bounty_id: data.bounty_id,
      editor_id: context.userId,
      tiktok_handle: data.tiktok_handle,
      paypal_email: data.paypal_email ?? null,
      status: "claimed" as const,
      tiktok_video_url: null,
    }));
    const { error } = await context.supabase.from("submissions").insert(rows);
    if (error) {
      if (error.code === "23505") throw new Error("You've already taken this contract.");
      // (multi-clip: the old one-claim-per-editor unique index is gone)
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
        "id,editor_id,status,tiktok_handle,bounty_id,counting_ends_at,bounties:bounty_id(platform_target,tiktok_sound_url,sound_name,hashtags,counting_days)",
      )
      .eq("id", data.submission_id)
      .single();
    if (se || !sub) throw new Error("Claim not found.");
    if (sub.editor_id !== context.userId) throw new Error("Not your claim.");
    // claimed/rejected → first or re-delivery; submitted → the editor may
    // replace a wrong link while it's still in review.
    if (sub.status !== "claimed" && sub.status !== "rejected" && sub.status !== "submitted")
      throw new Error("This claim has been reviewed — the clip can no longer be changed.");

    const bounty = (sub as unknown as {
      bounties: { platform_target: string; tiktok_sound_url: string | null; sound_name: string; hashtags?: string[] | null; counting_days?: number | null };
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
    // mismatch is a review flag, not a rejection. The site hashtag or any
    // campaign hashtag in the caption is an alternate signal.
    const caption = oembed?.title ?? "";
    const campaignTags = (bounty?.hashtags ?? []).filter(Boolean);
    const matchedTags = campaignTags.filter((t) => new RegExp(`#${t}\\b`, "i").test(caption));
    const hasTag = /#bountysounds/i.test(caption) || matchedTags.length > 0;

    const soundSignal = soundOk === true || (soundOk === null && hasTag);
    const passed = Boolean(oembed && accountTrusted && soundSignal);
    const soundNote =
      soundOk === true
        ? "using the contract's sound"
        : soundOk === false
          ? `sound looks different from the contract's (TikTok sometimes remaps audio) — confirm manually${hasTag ? `; campaign tag present (${matchedTags.length > 0 ? matchedTags.map((t) => `#${t}`).join(" ") : "#bountysounds"})` : ""}`
          : hasTag
            ? `campaign tag in caption (${matchedTags.length > 0 ? matchedTags.map((t) => `#${t}`).join(" ") : "#bountysounds"})`
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
        // The counting window opens on first delivery and never resets —
        // replacing a wrong link keeps the original clock.
        ...((sub as { counting_ends_at?: string | null }).counting_ends_at
          ? {}
          : {
              counting_ends_at: new Date(
                Date.now() + (bounty?.counting_days ?? 14) * 86400000,
              ).toISOString(),
            }),
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
    const { data: after } = await context.supabase
      .from("submissions")
      .select("counting_ends_at")
      .eq("id", data.submission_id)
      .single();
    return { ok: true, auto_check_passed: passed, counting_ends_at: after?.counting_ends_at ?? null };
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
  "id,bounty_id,editor_id,tiktok_video_url,tiktok_handle,paypal_email,oembed_title,oembed_author,oembed_thumbnail,auto_check_passed,auto_check_notes,status,awarded_points,awarded_cash_cents,paid_cash_cents,stripe_transfer_id,view_count,review_notes,claimed_at,submitted_at,reviewed_at,paid_at,created_at,counting_ends_at";

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
        // Proportional: rate is cents per 100k, paid pro-rata down to the view.
        computedCash = Math.floor((verified * bounty.reward_cash_cents) / 100000);
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
    notifyEditorAsync(
      (sub as { editor_id: string }).editor_id,
      data.decision === "approved" ? "Clip approved" : "Clip needs another pass",
      data.decision === "approved"
        ? "Your clip was approved — payout follows at the close of its counting window."
        : `Your delivery was sent back${data.review_notes ? `: ${data.review_notes}` : ""}. You can deliver a new link on the contract page.`,
    );
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

// Lifetime payout total (cents) above which US tax info (W-9) is required
// before any further payout can be marked. Adjustable here.
export const TAX_THRESHOLD_CENTS = 15000; // $150

// NOTE: markPaid is for manual/offline ledger entries only.
// For Stripe Connect payouts, use `stripePayout`/`payoutEditor` in stripe.functions.ts.
export const markPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("submissions")
      .select("editor_id,awarded_cash_cents,paid_cash_cents")
      .eq("id", data.id)
      .single();
    if (target) {
      const thisPayout = target.paid_cash_cents || target.awarded_cash_cents || 0;
      const { data: paidRows } = await supabaseAdmin
        .from("submissions")
        .select("paid_cash_cents")
        .eq("editor_id", target.editor_id)
        .gt("paid_cash_cents", 0);
      const lifetime = (paidRows ?? []).reduce((t, r) => t + (r.paid_cash_cents ?? 0), 0) + thisPayout;
      if (lifetime > TAX_THRESHOLD_CENTS) {
        const { data: tax } = await supabaseAdmin
          .from("tax_profiles")
          .select("user_id")
          .eq("user_id", target.editor_id)
          .maybeSingle();
        if (!tax)
          throw new Error(
            `This editor's lifetime payouts pass $${(TAX_THRESHOLD_CENTS / 100).toFixed(0)} — they must submit tax info on their dashboard before this payout.`,
          );
      }
    }

    const { error } = await context.supabase
      .from("submissions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        // Record the amount: leaderboards, per-campaign paid totals, tax
        // lifetime sums, and purse-coverage checks all read paid_cash_cents.
        ...(target && !target.paid_cash_cents && target.awarded_cash_cents
          ? { paid_cash_cents: target.awarded_cash_cents }
          : {}),
      })
      .eq("id", data.id)
      .eq("status", "approved");
    if (error) throw new Error(error.message);
    // Tell the editor their money moved (best-effort).
    if (target) notifyEditorAsync(target.editor_id, "Payout sent", "Your bounty payout was sent to your payout method on file.");
    notifyAsync({
      event: "payment.marked_paid",
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: data.id,
    });
    return { ok: true };
  });
