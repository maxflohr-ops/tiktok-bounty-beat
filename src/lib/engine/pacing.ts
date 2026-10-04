import { APPROVED, DAY, DELIVERED, viewsOf, type EngineBounty, type EngineSub } from "./types";

// Budget pacing: is this purse going to be spent well by the deadline?
// The engine only ever SUGGESTS a rate. It never writes to bounties and never
// touches money — staff apply a suggestion by editing the contract themselves.

export type RateSuggestion = {
  bounty_id: string;
  action: "raise" | "lower" | "hold" | "insufficient_data";
  current_rate_cents: number;
  suggested_rate_cents: number | null;
  budget_cents: number;
  spent_cents: number; // awarded on approved/paid clips
  pending_cents: number; // what delivered-but-unreviewed clips would cost today
  committed_cents: number;
  projected_cents: number; // committed + current burn carried to the deadline
  days_elapsed: number;
  days_left: number;
  deliveries_7d: number;
  why: string[];
};

const NO_DEADLINE_HORIZON_DAYS = 14;

function pendingCost(b: EngineBounty, subs: EngineSub[]) {
  const waiting = subs.filter(
    (s) => DELIVERED.has(s.status) && !APPROVED.has(s.status) && s.status !== "rejected",
  );
  if (b.payout_type === "per_1k_views")
    return waiting.reduce((a, s) => a + Math.floor((viewsOf(s) * b.reward_cash_cents) / 100000), 0);
  return waiting.length * b.reward_cash_cents;
}

// Rates move in steps a person would actually pick: $0.10 per 1k on per-view
// contracts (1,000 cents per 100k), $5 on flat ones.
function roundRate(b: EngineBounty, cents: number) {
  const step = b.payout_type === "per_1k_views" ? (cents >= 2000 ? 1000 : 100) : 500;
  return Math.max(step, Math.round(cents / step) * step);
}

const money = (c: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(c / 100);

export function suggestRate(
  b: EngineBounty,
  allSubs: EngineSub[],
  now = Date.now(),
): RateSuggestion {
  const subs = allSubs.filter((s) => s.bounty_id === b.id);
  const spent = subs
    .filter((s) => APPROVED.has(s.status))
    .reduce((a, s) => a + (s.awarded_cash_cents ?? 0), 0);
  const pending = pendingCost(b, subs);
  const committed = spent + pending;
  const start = new Date(b.created_at).getTime();
  const daysElapsed = Math.max(1, (now - start) / DAY);
  const daysLeft = b.deadline
    ? Math.max(0, (new Date(b.deadline).getTime() - now) / DAY)
    : NO_DEADLINE_HORIZON_DAYS;
  const burnPerDay = committed / daysElapsed;
  const projected = Math.round(committed + burnPerDay * daysLeft);
  const deliveries7d = subs.filter(
    (s) => s.submitted_at && now - new Date(s.submitted_at).getTime() <= 7 * DAY,
  ).length;
  const delivered = subs.filter((s) => s.submitted_at).length;
  const budget = b.funded_cash_cents;

  const base = {
    bounty_id: b.id,
    current_rate_cents: b.reward_cash_cents,
    budget_cents: budget,
    spent_cents: spent,
    pending_cents: pending,
    committed_cents: committed,
    projected_cents: projected,
    days_elapsed: Math.round(daysElapsed * 10) / 10,
    days_left: Math.round(daysLeft * 10) / 10,
    deliveries_7d: deliveries7d,
  };
  const why: string[] = [
    `Purse ${money(budget)}. Spent ${money(spent)}, ${money(pending)} more waiting in review.`,
    `Burning ${money(Math.round(burnPerDay))}/day over ${base.days_elapsed} days; ${b.deadline ? `${base.days_left} days to the deadline` : `no deadline, so the engine looks ${NO_DEADLINE_HORIZON_DAYS} days ahead`}.`,
    `At this pace the purse ends at ${money(projected)} committed (${budget ? Math.round((projected / budget) * 100) : 0}%).`,
  ];

  if (budget <= 0 || b.reward_cash_cents <= 0)
    return {
      ...base,
      action: "insufficient_data",
      suggested_rate_cents: null,
      why: ["No funded purse or rate on this contract yet."],
    };
  if (b.status !== "active")
    return {
      ...base,
      action: "hold",
      suggested_rate_cents: null,
      why: [`Contract is ${b.status}; pacing only applies to open contracts.`],
    };
  if (delivered < 3 || daysElapsed < 2)
    return {
      ...base,
      action: "insufficient_data",
      suggested_rate_cents: null,
      why: [
        ...why,
        `Only ${delivered} deliveries in ${base.days_elapsed} days. Too early to move the rate.`,
      ],
    };

  if (projected > budget * 1.1) {
    const next = roundRate(b, b.reward_cash_cents * (budget / projected));
    if (next < b.reward_cash_cents)
      return {
        ...base,
        action: "lower",
        suggested_rate_cents: next,
        why: [
          ...why,
          `Over-pacing: the purse runs dry before the deadline. A rate of ${money(next)} lands the spend on budget, or cap clips per editor instead.`,
        ],
      };
  }
  if (projected < budget * 0.6 && daysLeft >= 3) {
    const next = roundRate(b, b.reward_cash_cents * Math.min(1.5, budget / Math.max(projected, 1)));
    if (next > b.reward_cash_cents)
      return {
        ...base,
        action: "raise",
        suggested_rate_cents: next,
        why: [
          ...why,
          `Under-pacing: ${money(budget - projected)} would sit unspent. Raising to ${money(next)} (capped at +50%) buys more clippers while there's time.`,
        ],
      };
  }
  return {
    ...base,
    action: "hold",
    suggested_rate_cents: null,
    why: [...why, "On pace. Leave the rate alone."],
  };
}
