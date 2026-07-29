import { createServerFn } from "@tanstack/react-start";
import { isStaff } from "@/lib/authz.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Staff-only backend analytics: totals, pipeline, money, 30-day activity, and
// a per-person roster of everyone interacting with the app. All aggregation
// happens server-side via supabaseAdmin; the client receives one payload.
export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const staff = await isStaff(context.supabase, context.userId);
    if (!staff) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profilesQ, subsQ, bountiesQ, listingsQ, disputesQ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,display_name,tiktok_handle,points,created_at"),
      supabaseAdmin
        .from("submissions")
        .select(
          "id,bounty_id,editor_id,status,view_count,verified_view_count,awarded_cash_cents,paid_cash_cents,tiktok_handle,claimed_at,submitted_at,paid_at,created_at,auto_check_passed",
        ),
      supabaseAdmin
        .from("bounties")
        .select("id,contract_no,title,status,funded_cash_cents,reward_cash_cents,payout_type,deadline,created_at"),
      supabaseAdmin.from("sound_listings").select("id,status,amount_cents,created_at"),
      supabaseAdmin.from("payout_disputes").select("id,status,created_at"),
    ]);

    const profiles = profilesQ.data ?? [];
    const subs = subsQ.data ?? [];
    const bounties = bountiesQ.data ?? [];
    const listings = listingsQ.data ?? [];
    const disputes = disputesQ.data ?? [];

    // Auth roster: emails + last sign-in (staff-only data, page through).
    const authUsers: { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[] = [];
    try {
      for (let page = 1; page <= 5; page++) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
        if (error || !data?.users?.length) break;
        for (const u of data.users)
          authUsers.push({
            id: u.id,
            email: u.email ?? null,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at ?? null,
          });
        if (data.users.length < 200) break;
      }
    } catch {
      // roster still renders from profiles without emails
    }

    const countBy = (rows: { status: string }[]) => {
      const m: Record<string, number> = {};
      for (const r of rows) m[r.status] = (m[r.status] ?? 0) + 1;
      return m;
    };

    const sum = (xs: (number | null | undefined)[]) => xs.reduce((a: number, b) => a + (b ?? 0), 0);

    // Per-person aggregates
    const byEditor = new Map<string, { claims: number; delivered: number; approved: number; views: number; earned: number; paid: number }>();
    for (const s of subs) {
      const e = byEditor.get(s.editor_id) ?? { claims: 0, delivered: 0, approved: 0, views: 0, earned: 0, paid: 0 };
      e.claims += 1;
      if (s.submitted_at) e.delivered += 1;
      if (s.status === "approved" || s.status === "paid") e.approved += 1;
      e.views += s.verified_view_count ?? s.view_count ?? 0;
      e.earned += s.awarded_cash_cents ?? 0;
      e.paid += s.paid_cash_cents ?? 0;
      byEditor.set(s.editor_id, e);
    }
    const authById = new Map(authUsers.map((u) => [u.id, u]));
    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const personIds = new Set<string>([...profiles.map((p) => p.id), ...authUsers.map((u) => u.id)]);
    const people = [...personIds]
      .map((id) => {
        const p = profileById.get(id);
        const a = authById.get(id);
        const e = byEditor.get(id);
        return {
          id,
          name: p?.display_name ?? null,
          handle: p?.tiktok_handle ?? null,
          email: a?.email ?? null,
          joined: a?.created_at ?? p?.created_at ?? null,
          last_seen: a?.last_sign_in_at ?? null,
          points: p?.points ?? 0,
          claims: e?.claims ?? 0,
          delivered: e?.delivered ?? 0,
          approved: e?.approved ?? 0,
          views: e?.views ?? 0,
          earned_cents: e?.earned ?? 0,
          paid_cents: e?.paid ?? 0,
        };
      })
      .sort((x, y) => y.earned_cents - x.earned_cents || y.claims - x.claims || (y.last_seen ?? "").localeCompare(x.last_seen ?? ""));

    // 30-day activity (UTC days)
    const days: { day: string; claims: number; deliveries: number }[] = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      days.push({ day: d, claims: 0, deliveries: 0 });
    }
    const dayIndex = new Map(days.map((d, i) => [d.day, i]));
    for (const s of subs) {
      const c = (s.claimed_at ?? s.created_at ?? "").slice(0, 10);
      if (dayIndex.has(c)) days[dayIndex.get(c)!].claims += 1;
      const del = (s.submitted_at ?? "").slice(0, 10);
      if (del && dayIndex.has(del)) days[dayIndex.get(del)!].deliveries += 1;
    }

    // Recent activity feed
    const bountyTitle = new Map(bounties.map((b) => [b.id, `#${String(b.contract_no).padStart(3, "0")} ${b.title}`]));
    const recent = subs
      .map((s) => {
        const t = s.paid_at ?? s.submitted_at ?? s.claimed_at ?? s.created_at;
        const kind = s.paid_at ? "paid" : s.submitted_at ? "delivered" : "claimed";
        return { at: t, kind, handle: s.tiktok_handle, bounty: bountyTitle.get(s.bounty_id) ?? "contract", status: s.status };
      })
      .filter((r) => r.at)
      .sort((a, b) => (b.at as string).localeCompare(a.at as string))
      .slice(0, 12);

    return {
      totals: {
        users: personIds.size,
        editors_active: byEditor.size,
        bounties: bounties.length,
        bounties_by_status: countBy(bounties),
        submissions: subs.length,
        submissions_by_status: countBy(subs),
        auto_check_passed: subs.filter((s) => s.auto_check_passed).length,
        views_verified: sum(subs.map((s) => s.verified_view_count)),
        views_reported: sum(subs.map((s) => s.view_count)),
        funded_cents: sum(bounties.map((b) => b.funded_cash_cents)),
        awarded_cents: sum(subs.map((s) => s.awarded_cash_cents)),
        paid_cents: sum(subs.map((s) => s.paid_cash_cents)),
        listings: listings.length,
        listing_revenue_cents: sum(listings.filter((l) => l.status !== "pending_payment").map((l) => l.amount_cents)),
        disputes_open: disputes.filter((d) => d.status === "open").length,
      },
      people,
      days,
      recent,
      generated_at: new Date().toISOString(),
    };
  });
