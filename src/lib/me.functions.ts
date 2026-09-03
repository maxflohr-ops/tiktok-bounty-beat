import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyAsync } from "@/lib/notify.server";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: roles }, { data: tiktokAccounts }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select(
          "id,display_name,tiktok_handle,avatar_url,points,wallet_address,payout_preference,signup_logged_at",
        )
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase
        .from("tiktok_accounts")
        .select("handle,status")
        .eq("user_id", context.userId)
        .order("created_at"),
    ]);
    const roleSet = new Set((roles ?? []).map((r) => r.role));

    // First sign-in: log user.signup to the event stream exactly once.
    // The conditional update is the race guard - only the caller that flips
    // signup_logged_at from null sends the event.
    if (profile && !profile.signup_logged_at) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: marked } = await supabaseAdmin
          .from("profiles")
          .update({ signup_logged_at: new Date().toISOString() })
          .eq("id", context.userId)
          .is("signup_logged_at", null)
          .select("id");
        if (marked && marked.length > 0) {
          notifyAsync({
            event: "user.signup",
            actor: (context.claims as { email?: string })?.email ?? context.userId,
            reference: profile.display_name ?? profile.tiktok_handle ?? null,
            details: { user_id: context.userId },
          });
        }
      } catch {
        // logging must never break sign-in
      }
    }

    return {
      userId: context.userId,
      profile,
      tiktokAccounts: tiktokAccounts ?? [],
      roles: Array.from(roleSet),
      isStaff: roleSet.has("admin") || roleSet.has("manager"),
      isAdmin: roleSet.has("admin"),
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        display_name: z.string().trim().min(1).max(80).optional(),
        tiktok_handle: z
          .string()
          .trim()
          .max(60)
          .transform((v) => v.replace(/^@/, "").toLowerCase())
          .optional(),
        wallet_address: z
          .string()
          .trim()
          .regex(/^(0x[0-9a-fA-F]{40})?$/, "Enter a valid EVM address (0x…).")
          .transform((v) => v || null)
          .optional(),
        payout_preference: z.enum(["paypal", "usdc"]).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        tiktok_handle: data.tiktok_handle,
        ...(data.wallet_address !== undefined ? { wallet_address: data.wallet_address } : {}),
        ...(data.payout_preference !== undefined
          ? { payout_preference: data.payout_preference }
          : {}),
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const leaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("display_name,tiktok_handle,avatar_url,points")
    .order("points", { ascending: false })
    .limit(10);
  return data ?? [];
});

export const addTiktokAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ handle: z.string().trim().max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { tiktokHandleSchema } = await import("@/lib/claim-validation");
    const handle = tiktokHandleSchema.parse(data.handle);
    const { error } = await context.supabase
      .from("tiktok_accounts")
      .insert({ user_id: context.userId, handle, status: "unverified" });
    if (error) {
      if (error.code === "23505") throw new Error("That account is already linked.");
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const removeTiktokAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ handle: z.string().trim().max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tiktok_accounts")
      .delete()
      .eq("user_id", context.userId)
      .eq("handle", data.handle.toLowerCase().replace(/^@/, ""));
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public leaderboard: who got paid in the last 7 days, from real payout
// records (paid_cash_cents), not points.
export const weeklyPayouts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: subs } = await supabaseAdmin
    .from("submissions")
    .select("editor_id,paid_cash_cents,paid_at")
    .gte("paid_at", since)
    .gt("paid_cash_cents", 0);
  const byEditor = new Map<string, number>();
  for (const s of subs ?? [])
    byEditor.set(s.editor_id, (byEditor.get(s.editor_id) ?? 0) + (s.paid_cash_cents ?? 0));
  if (byEditor.size === 0) return [];
  const { data: profs } = await supabaseAdmin
    .from("profiles")
    .select("id,display_name,tiktok_handle")
    .in("id", [...byEditor.keys()]);
  const profById = new Map((profs ?? []).map((p) => [p.id, p]));
  return [...byEditor.entries()]
    .map(([id, cents]) => ({
      display_name: profById.get(id)?.display_name ?? null,
      tiktok_handle: profById.get(id)?.tiktok_handle ?? null,
      paid_cents: cents,
    }))
    .sort((a, b) => b.paid_cents - a.paid_cents)
    .slice(0, 10);
});

const attributionInput = z.object({
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  gclid: z.string().max(200).optional(),
  ttclid: z.string().max(200).optional(),
  referrer: z.string().max(300).optional(),
  landing: z.string().max(200).optional(),
  captured_at: z.string().max(40).optional(),
});

// First-touch ad attribution, logged once per user after sign-in. Lands in
// the event stream so signups in the Sheet can be tied back to the ad.
export const recordAttribution = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => attributionInput.parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { data: userData } = await context.supabase.auth.getUser();
    notifyAsync({
      event: "user.attribution",
      actor: userData?.user?.email ?? context.userId,
      reference: data.utm_source ?? data.referrer ?? "direct",
      details: data,
    });
    return { ok: true };
  });

// ---- Tax info (W-9 style), required past the lifetime payout threshold ----
// All access via service role: the client can submit but never read a TIN back.

const taxInput = z.object({
  legal_name: z.string().trim().min(2).max(160),
  address_line1: z.string().trim().min(2).max(200),
  address_line2: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  postal_code: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).default("US"),
  tin: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "Enter 9 digits, no dashes (SSN or EIN)."),
  tin_type: z.enum(["ssn", "ein"]).default("ssn"),
});

export const submitTaxInfo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => taxInput.parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("tax_profiles")
      .upsert(
        { user_id: context.userId, ...data, address_line2: data.address_line2 ?? null },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    notifyAsync({
      event: "tax.submitted",
      actor: context.userId,
      reference: data.legal_name,
      details: { tin_type: data.tin_type, country: data.country }, // never the TIN itself
    });
    return { ok: true };
  });

// Lifetime earnings + whether tax info is on file. TIN is never returned.
export const getTaxStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { TAX_THRESHOLD_CENTS } = await import("@/lib/submissions.functions");
    const [{ data: paidRows }, { data: tax }] = await Promise.all([
      supabaseAdmin
        .from("submissions")
        .select("paid_cash_cents")
        .eq("editor_id", context.userId)
        .gt("paid_cash_cents", 0),
      supabaseAdmin
        .from("tax_profiles")
        .select("legal_name,updated_at")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    const lifetime_cents = (paidRows ?? []).reduce((t, r) => t + (r.paid_cash_cents ?? 0), 0);
    return {
      lifetime_cents,
      threshold_cents: TAX_THRESHOLD_CENTS,
      required: lifetime_cents > TAX_THRESHOLD_CENTS,
      on_file: Boolean(tax),
      legal_name: tax?.legal_name ?? null,
    };
  });
