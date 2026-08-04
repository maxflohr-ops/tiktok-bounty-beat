import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isStaff } from "@/lib/authz.server";
import { notifyAsync } from "@/lib/notify.server";

// Public-safe columns only — never funded_cash_cents or Stripe identifiers.
const TEASER_COLS =
  "id,contract_no,title,sound_name,artist_song,reward_points,reward_cash_cents,currency,payout_type,platform_target,deadline,status,visibility,access_mode,rules,cover_url";
const PRIVATE_BOUNTY_COLS =
  "id,contract_no,title,description,sound_name,tiktok_sound_url,cover_url,artist_song,source_assets_url,reward_points,reward_cash_cents,currency,payout_type,platform_target,max_submissions,deadline,status,created_at,featured_until,featured_plus,hashtags,rules,counting_days,max_clips_per_editor,visibility,access_mode";

const idInput = z.object({ bounty_id: z.string().uuid() });

// Locked-state teaser for a private campaign: title, reward, and a rules
// snippet. Safe for signed-out visitors.
export const getBountyTeaser = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: b, error } = await supabaseAdmin
      .from("bounties")
      .select(TEASER_COLS)
      .eq("id", data.bounty_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!b) return null;
    const rules = (b as { rules: string | null }).rules;
    return {
      ...b,
      rules: rules ? `${rules.slice(0, 240)}${rules.length > 240 ? "…" : ""}` : null,
    };
  });

// The caller's access row for one campaign (null when they have none).
export const getMyBountyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("bounty_access")
      .select("id,bounty_id,status,message,tiktok_handle,created_at,decided_at")
      .eq("bounty_id", data.bounty_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });

const applyInput = z.object({
  bounty_id: z.string().uuid(),
  message: z.string().trim().min(10, "Tell them a little about your work").max(1000),
  tiktok_handle: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .transform((v) => v.replace(/^@/, "").toLowerCase()),
});

export const applyToBounty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => applyInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: b } = await context.supabase
      .from("bounties")
      .select("id,title,visibility,access_mode")
      .eq("id", data.bounty_id)
      .maybeSingle();
    if (!b) throw new Error("Contract not found.");
    if (b.visibility !== "private" || b.access_mode !== "apply")
      throw new Error("This campaign is not taking applications.");

    const { error } = await context.supabase.from("bounty_access").insert({
      bounty_id: data.bounty_id,
      user_id: context.userId,
      status: "applied",
      message: data.message,
      tiktok_handle: data.tiktok_handle,
    });
    if (error) {
      if (error.code === "23505") throw new Error("You've already applied to this campaign.");
      throw new Error(error.message);
    }

    notifyAsync({
      event: "campaign.application",
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: b.title,
      details: { bounty_id: data.bounty_id, tiktok_handle: data.tiktok_handle, message: data.message },
    });
    return { ok: true, status: "applied" as const };
  });

// Private campaigns the signed-in viewer has been let into.
export const listMyPrivateBounties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("bounty_access")
      .select("bounty_id,status")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    if (list.length === 0) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bounties, error: be } = await supabaseAdmin
      .from("bounties")
      .select(PRIVATE_BOUNTY_COLS)
      .in("id", list.map((r) => r.bounty_id))
      .neq("status", "draft");
    if (be) throw new Error(be.message);
    const statusBy = new Map(list.map((r) => [r.bounty_id, r.status]));
    return (bounties ?? []).map((b) => ({
      ...b,
      access_status: statusBy.get((b as { id: string }).id) ?? null,
      claims_count: 0,
      approved_count: 0,
      paid_out_cents: 0,
    }));
  });

/* ------------------------------ staff tools ------------------------------ */

export const listBountyAccessStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isStaff(context.supabase, context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bounty_access")
      .select("id,bounty_id,user_id,status,message,tiktok_handle,invited_email,created_at,decided_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    // Attach display names so staff see a person, not a UUID.
    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
    let names = new Map<string, string>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id,display_name,tiktok_handle")
        .in("id", ids);
      names = new Map((profs ?? []).map((p) => [p.id, p.display_name ?? p.tiktok_handle ?? p.id]));
    }
    return rows.map((r) => ({ ...r, display_name: r.user_id ? names.get(r.user_id) ?? null : null }));
  });

async function emailCreator(userId: string | null, email: string | null, title: string, body: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let to = email;
    if (!to && userId) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
      to = data?.user?.email ?? null;
    }
    if (!to) return;
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    await sendTemplateEmail("editor-status", to, {
      templateData: { title, body },
      idempotencyKey: `access:${userId ?? to}:${title}:${Date.now()}`,
    });
  } catch (err) {
    console.warn("[access.email] skipped:", (err as Error)?.message ?? err);
  }
}

export const decideBountyApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), decision: z.enum(["approved", "rejected"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context.supabase, context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("bounty_access")
      .update({ status: data.decision, decided_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("id,user_id,invited_email,bounty_id")
      .single();
    if (error) throw new Error(error.message);

    const { data: b } = await supabaseAdmin.from("bounties").select("title").eq("id", row.bounty_id).maybeSingle();
    const bountyTitle = b?.title ?? "a private campaign";
    void emailCreator(
      row.user_id,
      row.invited_email,
      data.decision === "approved" ? "You're in — private campaign approved" : "Application not accepted",
      data.decision === "approved"
        ? `You've been approved for “${bountyTitle}”. Head back to the contract page to claim your clip slots.`
        : `Your application for “${bountyTitle}” wasn't accepted this time. Plenty of other contracts on the Bounty Board.`,
    );
    notifyAsync({
      event: `campaign.application.${data.decision}`,
      actor: context.userId,
      reference: bountyTitle,
      details: { access_id: row.id, bounty_id: row.bounty_id, user_id: row.user_id },
    });
    return { ok: true };
  });

export const inviteToBounty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        bounty_id: z.string().uuid(),
        email: z.string().trim().email("Enter a valid email").max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context.supabase, context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Match an existing account by email so the invite binds to their user id.
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const match = (userList?.users ?? []).find(
      (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
    );

    if (match) {
      const { data: existing } = await supabaseAdmin
        .from("bounty_access")
        .select("id,status")
        .eq("bounty_id", data.bounty_id)
        .eq("user_id", match.id)
        .maybeSingle();
      if (existing) {
        await supabaseAdmin
          .from("bounty_access")
          .update({ status: "invited", invited_email: data.email, decided_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        const { error } = await supabaseAdmin.from("bounty_access").insert({
          bounty_id: data.bounty_id,
          user_id: match.id,
          invited_email: data.email,
          status: "invited",
        });
        if (error) throw new Error(error.message);
      }
    } else {
      const { error } = await supabaseAdmin.from("bounty_access").insert({
        bounty_id: data.bounty_id,
        user_id: null,
        invited_email: data.email,
        status: "invited",
      });
      if (error) throw new Error(error.message);
    }

    const { data: b } = await supabaseAdmin.from("bounties").select("title").eq("id", data.bounty_id).maybeSingle();
    const bountyTitle = b?.title ?? "a private campaign";
    void emailCreator(
      match?.id ?? null,
      data.email,
      "You've been invited to a private campaign",
      `You're invited to clip “${bountyTitle}” on Bounty Sounds. Sign in and open the contract to claim your slots.`,
    );
    notifyAsync({
      event: "campaign.invite",
      actor: context.userId,
      reference: bountyTitle,
      details: { bounty_id: data.bounty_id, email: data.email, existing_user: Boolean(match) },
    });
    return { ok: true, existing_user: Boolean(match) };
  });
