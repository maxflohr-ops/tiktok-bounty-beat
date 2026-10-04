import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isStaff } from "@/lib/authz.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  coachReport,
  learnPlaybook,
  scoreCampaign,
  scoreClippers,
  type EngineBounty,
  type EngineSub,
} from "@/lib/engine";

const SUB_COLS =
  "id,bounty_id,editor_id,tiktok_handle,status,oembed_title,view_count,verified_view_count,like_count,comment_count,awarded_cash_cents,paid_cash_cents,auto_check_passed,claimed_at,submitted_at,reviewed_at,paid_at";
const BOUNTY_COLS =
  "id,contract_no,title,status,payout_type,reward_cash_cents,funded_cash_cents,deadline,created_at";

// Staff: the whole engine in one payload — a coach report per live campaign,
// board-wide clipper scores, and the board-wide playbook. Read-only.
export const getEngineReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isStaff(context.supabase, context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [subsQ, bountiesQ] = await Promise.all([
      supabaseAdmin.from("submissions").select(SUB_COLS).limit(5000),
      supabaseAdmin.from("bounties").select(BOUNTY_COLS),
    ]);
    if (subsQ.error) throw new Error(subsQ.error.message);
    if (bountiesQ.error) throw new Error(bountiesQ.error.message);
    const subs = (subsQ.data ?? []) as EngineSub[];
    const bounties = (bountiesQ.data ?? []) as EngineBounty[];
    const now = Date.now();

    // Live campaigns, plus anything that saw a delivery in the last 14 days.
    const recent = new Set(
      subs
        .filter((s) => s.submitted_at && now - new Date(s.submitted_at).getTime() < 14 * 86400000)
        .map((s) => s.bounty_id),
    );
    const reports = bounties
      .filter((b) => b.status === "active" || recent.has(b.id))
      .map((b) => coachReport(b, subs, now))
      .sort(
        (a, b) =>
          b.campaign.waiting_past_sla - a.campaign.waiting_past_sla ||
          b.this_week.deliveries - a.this_week.deliveries,
      );

    return {
      reports,
      clippers: scoreClippers(subs).slice(0, 100),
      playbook: learnPlaybook(subs),
      generated_at: new Date(now).toISOString(),
    };
  });

// Public: what's working on one bounty, for clippers deciding how to cut it.
// Aggregates only — no handles, no editor ids, no money.
export const getBountyPlaybook = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ bounty_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("submissions")
      .select(SUB_COLS)
      .eq("bounty_id", data.bounty_id)
      .limit(2000);
    if (error) return null;
    const subs = (rows ?? []) as EngineSub[];
    const pb = learnPlaybook(subs);
    const c = scoreCampaign(data.bounty_id, subs);
    return {
      sample: pb.sample,
      insights: pb.insights.slice(0, 4).map((i) => ({
        trait: i.trait,
        label: i.label,
        direction: i.direction,
        confidence: i.confidence,
        lift: i.lift,
        evidence: i.evidence,
      })),
      top_captions: pb.top.map((t) => ({ caption: t.caption, views: t.views })),
      review: {
        grade: c.grade,
        median_review_hours: c.median_review_hours,
        approval_rate: c.approval_rate,
      },
    };
  });
