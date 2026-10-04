import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isStaff } from "@/lib/authz.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PROSPECT_SEED } from "@/lib/recruiting/prospects.seed";

import { FOUNDING_SEATS, STAGES } from "@/lib/recruiting/stages";

// Postgres "relation does not exist" — the migration hasn't been applied yet.
// The board says so plainly instead of erroring.
const missingTable = (e: { code?: string; message?: string } | null) =>
  !!e &&
  (e.code === "42P01" ||
    e.code === "PGRST205" ||
    /does not exist|schema cache/i.test(e.message ?? ""));

async function staffAdmin(context: { supabase: never; userId: string }) {
  if (!(await isStaff(context.supabase, context.userId))) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listProspects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await staffAdmin(context as never);
    const { data, error } = await db
      .from("recruit_prospects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (missingTable(error))
      return {
        ready: false as const,
        prospects: [],
        referrers: [],
        seedSize: PROSPECT_SEED.length,
      };
    if (error) throw new Error(error.message);

    // Referral leaderboard: who is bringing clippers in.
    const { data: refs } = await db.from("referrals").select("referrer_id,ref_code,created_at");
    const counts = new Map<string, { code: string; n: number; last: string }>();
    for (const r of refs ?? []) {
      const c = counts.get(r.referrer_id) ?? { code: r.ref_code, n: 0, last: r.created_at };
      c.n += 1;
      if (r.created_at > c.last) c.last = r.created_at;
      counts.set(r.referrer_id, c);
    }
    const referrers = [...counts.entries()]
      .map(([id, c]) => ({ referrer_id: id, ref_code: c.code, referred: c.n, last: c.last }))
      .sort((a, b) => b.referred - a.referred)
      .slice(0, 20);

    return {
      ready: true as const,
      prospects: data ?? [],
      referrers,
      seedSize: PROSPECT_SEED.length,
    };
  });

// Loads the researched seed list. New rows only — a prospect already on the
// board keeps its stage and notes.
export const importProspectSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await staffAdmin(context as never);
    const rows = PROSPECT_SEED.map((p) => ({
      slug: p.id,
      name: p.name,
      handle: p.handle,
      platform: p.platform,
      profile_url: p.profile_url,
      segment: p.segment,
      campaign: p.campaign,
      followers: p.followers,
      fit: p.fit,
      opener: p.opener,
      contact: p.contact || null,
      sources: p.sources,
      stage: "prospect",
      founding: false,
    }));
    const { data, error } = await db
      .from("recruit_prospects")
      .upsert(rows, { onConflict: "slug", ignoreDuplicates: true })
      .select("id");
    if (missingTable(error)) throw new Error("Apply the recruiting migration first.");
    if (error) throw new Error(error.message);
    return { added: data?.length ?? 0 };
  });

const updateInput = z.object({
  id: z.string().uuid(),
  stage: z.enum(STAGES).optional(),
  founding: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateProspect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateInput.parse(d))
  .handler(async ({ data, context }) => {
    const db = await staffAdmin(context as never);
    const { id, ...patch } = data;
    const update = {
      ...patch,
      ...(patch.stage ? { last_touch_at: new Date().toISOString() } : {}),
    };
    if (patch.founding) {
      const { count } = await db
        .from("recruit_prospects")
        .select("id", { count: "exact", head: true })
        .eq("founding", true)
        .neq("id", id);
      if ((count ?? 0) >= FOUNDING_SEATS)
        throw new Error(`All ${FOUNDING_SEATS} Founding Clipper seats are taken.`);
    }
    const { error } = await db.from("recruit_prospects").update(update).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// A signed-in clipper who arrived via ?ref=<handle>. First referral wins,
// self-referral is ignored, and nothing here moves money.
export const claimReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        ref: z
          .string()
          .trim()
          .regex(/^@?[A-Za-z0-9._]{2,40}$/),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.ref.replace(/^@/, "").toLowerCase();
    // ilike narrows the search; `_` is a LIKE wildcard, so confirm the exact
    // handle in code before crediting anyone.
    const { data: candidates } = await supabaseAdmin
      .from("profiles")
      .select("id,tiktok_handle")
      .or(`tiktok_handle.ilike.${code},tiktok_handle.ilike.@${code}`)
      .limit(10);
    const referrer = (candidates ?? []).find(
      (p) => (p.tiktok_handle ?? "").replace(/^@/, "").toLowerCase() === code,
    );
    if (!referrer || referrer.id === context.userId) return { credited: false };
    // Only brand-new accounts can be referred: a referral link can't claim
    // someone who was already on the board.
    const { data: me } = await supabaseAdmin
      .from("profiles")
      .select("created_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (me && Date.now() - new Date(me.created_at).getTime() > 7 * 86400000)
      return { credited: false };
    const { error } = await supabaseAdmin
      .from("referrals")
      .insert({ referrer_id: referrer.id, referred_id: context.userId, ref_code: code });
    if (error) return { credited: false };
    return { credited: true };
  });
