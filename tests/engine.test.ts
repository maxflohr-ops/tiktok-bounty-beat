import { describe, expect, it } from "vitest";

import {
  coachReport,
  hoursWaiting,
  orderReviewQueue,
  learnPlaybook,
  scoreCampaign,
  scoreClippers,
  suggestRate,
  traitsOf,
  type EngineBounty,
  type EngineSub,
} from "../src/lib/engine";

const NOW = Date.parse("2026-10-04T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW - d * 86400000).toISOString();

let seq = 0;
function sub(p: Partial<EngineSub>): EngineSub {
  seq += 1;
  return {
    id: `s${seq}`,
    bounty_id: "b1",
    editor_id: "e1",
    tiktok_handle: "clipper",
    status: "approved",
    oembed_title: "a clip",
    view_count: 1000,
    verified_view_count: null,
    like_count: null,
    comment_count: null,
    awarded_cash_cents: 0,
    paid_cash_cents: 0,
    auto_check_passed: true,
    claimed_at: daysAgo(3),
    submitted_at: daysAgo(2),
    reviewed_at: daysAgo(1.5),
    paid_at: null,
    ...p,
  };
}

const perView: EngineBounty = {
  id: "b1",
  contract_no: 1,
  title: "biting bullets",
  status: "active",
  payout_type: "per_1k_views",
  reward_cash_cents: 10000, // $1 per 1k
  funded_cash_cents: 250000,
  deadline: daysAgo(-10),
  created_at: daysAgo(10),
};

describe("hook traits", () => {
  it("tags explainable traits from the caption", () => {
    expect(traitsOf("POV: Vice City at 3am")).toEqual(
      expect.arrayContaining(["pov", "short_caption"]),
    );
    expect(traitsOf("they dropped the GTA 6 trailer on NETFLIX?")).toContain("question");
    expect(traitsOf("this song was made for this trailer and nobody told them")).toContain(
      "bold_claim",
    );
    expect(traitsOf("wait for the drop @ridgeclub #bitingbullets")).toEqual(
      expect.arrayContaining(["payoff", "tags_artist"]),
    );
    expect(traitsOf(null)).toEqual([]);
  });
});

describe("playbook", () => {
  it("finds a winning hook and shows its work", () => {
    const subs = [
      ...[9000, 12000, 15000, 11000, 10000].map((v) =>
        sub({ oembed_title: "POV: Vice City at 3am", view_count: v }),
      ),
      ...[1000, 2000, 1500, 800, 1200].map((v) =>
        sub({ oembed_title: "gta 6 edit", view_count: v }),
      ),
    ];
    const pb = learnPlaybook(subs);
    const pov = pb.insights.find((i) => i.trait === "pov")!;
    expect(pov.direction).toBe("use");
    expect(pov.median_with).toBe(11000);
    expect(pov.median_without).toBe(1200);
    expect(pov.confidence).toBe("emerging");
    expect(pov.evidence).toMatch(/5 clips with it/);
    expect(pb.top[0].views).toBe(15000);
  });

  it("says nothing on too little evidence", () => {
    expect(learnPlaybook([sub({ oembed_title: "POV: x", view_count: 9000 })]).insights).toEqual([]);
  });
});

describe("rate pacing", () => {
  it("suggests a raise when the purse will sit unspent", () => {
    const subs = [1, 2, 3].map(() => sub({ status: "approved", awarded_cash_cents: 1000 }));
    const r = suggestRate(perView, subs, NOW);
    expect(r.action).toBe("raise");
    expect(r.suggested_rate_cents).toBe(15000); // capped at +50%
    expect(r.why.join(" ")).toMatch(/Under-pacing/);
  });

  it("suggests lowering when the purse runs dry early", () => {
    const subs = [1, 2, 3, 4].map(() => sub({ status: "approved", awarded_cash_cents: 50000 }));
    const r = suggestRate(perView, subs, NOW);
    expect(r.action).toBe("lower");
    expect(r.suggested_rate_cents).toBeLessThan(10000);
  });

  it("refuses to move a rate on thin data", () => {
    expect(suggestRate(perView, [sub({})], NOW).action).toBe("insufficient_data");
  });

  it("counts unreviewed per-view clips as pending liability", () => {
    const r = suggestRate(
      perView,
      [sub({ status: "submitted", view_count: 50000, reviewed_at: null })],
      NOW,
    );
    expect(r.pending_cents).toBe(5000);
  });
});

describe("curation", () => {
  it("fast-tracks a clean, high-view clipper and watches a weak one", () => {
    const subs = [
      ...[1, 2, 3, 4].map(() => sub({ editor_id: "star", view_count: 50000 })),
      ...[1, 2, 3, 4].map(() =>
        sub({ editor_id: "weak", status: "rejected", view_count: 100, auto_check_passed: false }),
      ),
    ];
    const scores = scoreClippers(subs);
    expect(scores[0].editor_id).toBe("star");
    expect(scores[0].tier).toBe("fast_track");
    expect(scores.find((s) => s.editor_id === "weak")!.tier).toBe("watch");
  });

  it("flags a campaign that leaves clips waiting past the 48h SLA", () => {
    const subs = [
      sub({}),
      sub({}),
      sub({ status: "submitted", submitted_at: daysAgo(3), reviewed_at: null }),
    ];
    const c = scoreCampaign("b1", subs, NOW);
    expect(c.waiting_past_sla).toBe(1);
    expect(c.detail.join(" ")).toMatch(/waiting past 48h/);
  });
});

describe("coach report", () => {
  it("leads with the SLA when clips are waiting", () => {
    const subs = [
      sub({ submitted_at: daysAgo(1), reviewed_at: daysAgo(0.5) }),
      sub({ status: "submitted", submitted_at: daysAgo(4), reviewed_at: null }),
      sub({ submitted_at: daysAgo(9), reviewed_at: daysAgo(8) }),
    ];
    const r = coachReport(perView, subs, NOW);
    expect(r.this_week.deliveries).toBe(2);
    expect(r.last_week.deliveries).toBe(1);
    expect(r.next_move).toMatch(/waiting past 48h/);
    expect(r.text).toContain("Next move:");
  });
});

describe("review queue", () => {
  it("puts late clips first, then fast-track, then oldest", () => {
    const tiers = new Map([["star", "fast_track" as const]]);
    const rows = [
      { id: "fresh", editor_id: "anyone", submitted_at: daysAgo(0.2), claimed_at: null },
      { id: "star", editor_id: "star", submitted_at: daysAgo(0.1), claimed_at: null },
      { id: "late", editor_id: "anyone", submitted_at: daysAgo(3), claimed_at: null },
      { id: "older", editor_id: "anyone", submitted_at: daysAgo(1), claimed_at: null },
    ];
    expect(orderReviewQueue(rows, tiers, NOW).map((r) => r.id)).toEqual([
      "late",
      "star",
      "older",
      "fresh",
    ]);
    expect(Math.round(hoursWaiting(rows[2], NOW))).toBe(72);
  });
});
