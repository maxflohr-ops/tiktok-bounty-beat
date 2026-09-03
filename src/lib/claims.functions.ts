// Staff tools for bridge claims (copula clips). The sweep rule from the
// side-build doc: only status='approved' claims are ever paid — copula's
// human moderation is the fraud gate, and this file never bypasses it.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isStaff } from "@/lib/authz.server";

export const listBridgeClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bounty_claims")
      .select(
        "id,bounty_id,copula_user_id,copula_clip_id,clip_url,status,verified_views,paid_cents,created_at,updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const payInput = z.object({
  claim_id: z.string().uuid(),
  verified_views: z.number().int().min(0),
});

// Pays one approved claim: rate comes from the contract (cents per 100k
// verified views), the purse must cover it, and copula gets notified after.
export const payBridgeClaim = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => payInput.parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: claim, error: ce } = await supabaseAdmin
      .from("bounty_claims")
      .select("id,bounty_id,copula_clip_id,status")
      .eq("id", data.claim_id)
      .single();
    if (ce || !claim) throw new Error("Claim not found.");
    if (claim.status !== "approved") throw new Error("Only approved claims can be paid.");

    const { data: bounty, error: be } = await supabaseAdmin
      .from("bounties")
      .select("id,reward_cash_cents,payout_type,funded_cash_cents")
      .eq("id", claim.bounty_id)
      .single();
    if (be || !bounty) throw new Error("Contract not found.");

    const paidCents =
      bounty.payout_type === "per_1k_views"
        ? Math.floor((data.verified_views * bounty.reward_cash_cents) / 100000)
        : bounty.reward_cash_cents;
    if (paidCents <= 0) throw new Error("Nothing to pay at that view count.");

    // The purse is shared with site-native submissions, so count both sides.
    const [{ data: claimRows }, { data: subRows }] = await Promise.all([
      supabaseAdmin
        .from("bounty_claims")
        .select("paid_cents")
        .eq("bounty_id", bounty.id)
        .gt("paid_cents", 0),
      supabaseAdmin
        .from("submissions")
        .select("paid_cash_cents")
        .eq("bounty_id", bounty.id)
        .gt("paid_cash_cents", 0),
    ]);
    const alreadyPaid =
      (claimRows ?? []).reduce((s, r) => s + r.paid_cents, 0) +
      (subRows ?? []).reduce((s, r) => s + (r.paid_cash_cents ?? 0), 0);
    if (alreadyPaid + paidCents > bounty.funded_cash_cents) {
      throw new Error("The purse can't cover this payout. Top it up first.");
    }

    // paying → paid, so a crash mid-flight is visible rather than silent.
    const { error: ue } = await supabaseAdmin
      .from("bounty_claims")
      .update({ status: "paying", verified_views: data.verified_views, paid_cents: paidCents })
      .eq("id", claim.id)
      .eq("status", "approved");
    if (ue) throw new Error(ue.message);

    const { error: pe } = await supabaseAdmin
      .from("bounty_claims")
      .update({ status: "paid" })
      .eq("id", claim.id);
    if (pe) throw new Error(pe.message);

    const { notifyCopulaPayout } = await import("@/lib/copula.server");
    const notified = await notifyCopulaPayout({
      copulaClipId: claim.copula_clip_id ?? "",
      verifiedViews: data.verified_views,
      paidCents,
      idempotencyKey: claim.id,
    });

    return { paid_cents: paidCents, copula_notified: notified };
  });
