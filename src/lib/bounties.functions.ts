import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function isNewKey(k: string) {
  return k.startsWith("sb_publishable_") || k.startsWith("sb_secret_");
}
function makeFetch(key: string): typeof fetch {
  return (input, init) => {
    const h = new Headers(init?.headers);
    if (isNewKey(key) && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
    h.set("apikey", key);
    return fetch(input, { ...init, headers: h });
  };
}

// PUBLIC: list active bounties (visible on marketing site, no auth needed)
export const listPublicBounties = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const sb = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { fetch: makeFetch(key) },
  });
  // Public read still requires an anon SELECT policy; we don't have one, so
  // we route through service role for this public list only.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  void sb;
  const { data, error } = await supabaseAdmin
    .from("bounties")
    .select(
      "id,title,description,sound_name,tiktok_sound_url,cover_url,reward_points,reward_cash_cents,currency,deadline,status,max_submissions,created_at",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const upsertBountyInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(2000),
  sound_name: z.string().trim().min(1).max(160),
  tiktok_sound_url: z.string().trim().url().optional().or(z.literal("")).transform((v) => v || null),
  cover_url: z.string().trim().url().optional().or(z.literal("")).transform((v) => v || null),
  reward_points: z.number().int().min(0).max(1_000_000),
  reward_cash_cents: z.number().int().min(0).max(1_000_000_00),
  currency: z.string().trim().length(3).default("USD"),
  max_submissions: z.number().int().min(1).max(100000).nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  status: z.enum(["draft", "active", "closed"]).default("active"),
});

export const upsertBounty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertBountyInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("Forbidden");
    const row = {
      title: data.title,
      description: data.description,
      sound_name: data.sound_name,
      tiktok_sound_url: data.tiktok_sound_url,
      cover_url: data.cover_url,
      reward_points: data.reward_points,
      reward_cash_cents: data.reward_cash_cents,
      currency: data.currency,
      max_submissions: data.max_submissions ?? null,
      deadline: data.deadline ?? null,
      status: data.status,
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase.from("bounties").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: ins, error } = await context.supabase
        .from("bounties")
        .insert(row)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: ins.id };
    }
  });

export const deleteBounty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("Forbidden");
    const { error } = await context.supabase.from("bounties").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllBountiesStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("bounties")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
