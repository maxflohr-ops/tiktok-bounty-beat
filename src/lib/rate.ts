// reward_cash_cents for payout_type 'per_1k_views' is cents per 100,000
// verified views; payouts are proportional (see submissions/claims payout
// math). Display prefers the per-5,000 form when it lands on whole dollars —
// "$5 per 5,000 views" reads better than "$100 per 100,000 views".
export function formatPerViewRate(centsPer100k: number, currency = "USD", compact = false): string {
  const money = (c: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(c / 100);
  if (centsPer100k >= 2000 && centsPer100k % 2000 === 0) {
    return `${money(centsPer100k / 20)}${compact ? " / 5k views" : " per 5,000 views"}`;
  }
  return `${money(centsPer100k)}${compact ? " / 100k views" : " per 100,000 views"}`;
}
