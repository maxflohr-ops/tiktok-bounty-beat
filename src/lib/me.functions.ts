import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id,display_name,tiktok_handle,avatar_url,points")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    return {
      userId: context.userId,
      profile,
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
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        tiktok_handle: data.tiktok_handle,
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
