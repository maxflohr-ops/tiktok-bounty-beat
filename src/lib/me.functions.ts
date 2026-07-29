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
        .select("id,display_name,tiktok_handle,avatar_url,points,wallet_address,signup_logged_at")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase.from("tiktok_accounts").select("handle,status").eq("user_id", context.userId).order("created_at"),
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
  .inputValidator((d: unknown) =>
    z.object({ handle: z.string().trim().max(60) }).parse(d),
  )
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
