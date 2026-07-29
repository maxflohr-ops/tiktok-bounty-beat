import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isStaff } from "@/lib/authz.server";
import { notifyAsync } from "@/lib/notify.server";

const DISPUTE_COLS =
  "id,submission_id,created_by,claimed_view_count,evidence_url,note,status,reviewer_id,reviewer_note,resolved_view_count,resolved_at,created_at,updated_at";

// Creator files a dispute against one of their own submissions
export const fileDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        submission_id: z.string().uuid(),
        claimed_view_count: z.number().int().min(0).max(2_000_000_000).optional(),
        evidence_url: z.string().trim().url().max(500).optional().or(z.literal("")),
        note: z.string().trim().min(5, "Tell us what happened.").max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: sub, error: se } = await context.supabase
      .from("submissions")
      .select("id,editor_id,status")
      .eq("id", data.submission_id)
      .single();
    if (se || !sub) throw new Error("Claim not found.");
    if (sub.editor_id !== context.userId) throw new Error("Not your claim.");
    if (sub.status === "claimed") throw new Error("Deliver proof before disputing view counts.");

    const { error } = await context.supabase.from("payout_disputes").insert({
      submission_id: data.submission_id,
      created_by: context.userId,
      claimed_view_count: data.claimed_view_count ?? null,
      evidence_url: data.evidence_url || null,
      note: data.note,
      status: "open",
    });
    if (error) {
      if (error.code === "23505")
        throw new Error("A dispute for this claim is already under review.");
      throw new Error(error.message);
    }
    notifyAsync({
      event: "dispute.filed",
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: data.submission_id,
      details: {
        claimed_view_count: data.claimed_view_count ?? null,
        evidence_url: data.evidence_url || null,
        note: data.note,
      },
    });
    return { ok: true };
  });

// Creator lists their own disputes (used on dashboard)
export const listMyDisputes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payout_disputes")
      .select(DISPUTE_COLS)
      .eq("created_by", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Staff — list all disputes with submission + editor context
export const listAllDisputesStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("payout_disputes")
      .select(
        `${DISPUTE_COLS}, submission:submissions(id,tiktok_video_url,tiktok_handle,view_count,status,awarded_cash_cents,bounty:bounties(id,contract_no,title,payout_type,reward_cash_cents,currency))`,
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const creatorIds = Array.from(new Set(rows.map((r) => r.created_by)));
    const map: Record<string, { display_name: string | null; tiktok_handle: string | null }> = {};
    if (creatorIds.length) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id,display_name,tiktok_handle")
        .in("id", creatorIds);
      for (const p of profs ?? [])
        map[p.id] = { display_name: p.display_name, tiktok_handle: p.tiktok_handle };
    }
    return rows.map((r) => ({ ...r, creator: map[r.created_by] ?? null }));
  });

// Staff — resolve or reject a dispute; optionally correct the submission view count
export const resolveDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["under_review", "resolved", "rejected"]),
        reviewer_note: z.string().trim().max(2000).optional().default(""),
        corrected_view_count: z.number().int().min(0).max(2_000_000_000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");

    const { data: disp, error: de } = await context.supabase
      .from("payout_disputes")
      .select("id,submission_id,status")
      .eq("id", data.id)
      .single();
    if (de || !disp) throw new Error("Dispute not found.");

    const patch: {
      status: "under_review" | "resolved" | "rejected";
      reviewer_id: string;
      reviewer_note: string | null;
      resolved_at?: string;
      resolved_view_count?: number;
    } = {
      status: data.decision,
      reviewer_id: context.userId,
      reviewer_note: data.reviewer_note || null,
    };
    if (data.decision === "resolved" || data.decision === "rejected") {
      patch.resolved_at = new Date().toISOString();
    }
    if (data.decision === "resolved" && data.corrected_view_count != null) {
      patch.resolved_view_count = data.corrected_view_count;
      const { error: ue } = await context.supabase
        .from("submissions")
        .update({ view_count: data.corrected_view_count })
        .eq("id", disp.submission_id);
      if (ue) throw new Error(ue.message);
    }

    const { error } = await context.supabase
      .from("payout_disputes")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    notifyAsync({
      event: `dispute.${data.decision}`,
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: data.id,
      details: {
        decision: data.decision,
        corrected_view_count: data.corrected_view_count ?? null,
        reviewer_note: data.reviewer_note || null,
      },
    });
    return { ok: true };
  });
