// Dry-run smoke for the Whop rail. Run with:  bun run rail:dry
// Never moves money: DRY_RUN is forced true no matter what the env says.
// Shows, for one simulated verified delivery: the intended outbox row, the
// idempotency key, the request payload, the synthetic response, and the local
// state transitions — including that `captured` is NOT reached in dry-run.

import { createMemoryOutbox } from "./rail";
import { centsToWhopAmount, createWhopRail, isSandbox } from "./whop-rail";

process.env.DRY_RUN = "true"; // hard floor for this script

const outbox = createMemoryOutbox();
const rail = createWhopRail(outbox);

// Simulated payout-ready delivery (worker-verified, KYC approved, purse covers it).
const capture = {
  id: "11111111-1111-4111-8111-111111111111", // payout_approvals.id in real flow
  bountyId: "22222222-2222-4222-8222-222222222222",
  clipId: "33333333-3333-4333-8333-333333333333",
  railAccountId: "biz_clipper_example",
  amountCents: 1299,
  currency: "usd",
};

const states: string[] = ["payout-ready (worker verified, approval granted)"];
function transition(s: string) {
  states.push(s);
  console.log(`  state → ${s}`);
}

console.log("=== Whop rail dry-run ===");
console.log({
  DRY_RUN: true,
  SANDBOX: isSandbox(),
  amount_cents: capture.amountCents,
  whop_amount: centsToWhopAmount(capture.amountCents),
});

console.log("\n[1] reserve purse amount in Supabase (simulated — WO-5 does this for real)");
transition("purse-reserved (1299 cents held; spendable balance excludes it)");

console.log("\n[2] transfer intent → outbox → dry execute");
const t1 = await rail.transfer(capture);
transition(`outbox-intent-written (transfer, key capture:${capture.id})`);
transition(`dry-executed (synthetic id ${t1.id})`);

console.log("\n[3] retry the same transfer — must be a no-op replay, never a second move");
const t2 = await rail.transfer(capture);
console.log(
  `  retry returned id=${t2.id} replayed=${t2.replayed} (outbox rows: ${outbox.rows.length})`,
);

console.log("\n[4] payout intent → outbox → dry execute");
const p1 = await rail.payout({
  id: capture.id,
  railAccountId: capture.railAccountId,
  railPayoutMethodId: "potk_example",
  amountCents: capture.amountCents,
  currency: "usd",
});
transition(`payout-intent-written (key payout:${capture.id}, synthetic id ${p1.id})`);

console.log("\n[5] finalization withheld: dry-run never satisfies the Whop success");
console.log("    condition, so the reservation is NOT consumed and the delivery");
console.log("    is NOT marked captured.");
transition("NOT captured — reservation still held, awaiting real rail success");

console.log("\n--- outbox rows (what whop_outbox would contain) ---");
for (const row of outbox.rows) {
  console.log(JSON.stringify(row, null, 2));
}

console.log("\n--- state transition log ---");
states.forEach((s, i) => console.log(`  ${i}. ${s}`));

const ok =
  outbox.rows.length === 2 &&
  outbox.rows.every((r) => r.status === "dry") &&
  t2.replayed === true &&
  t1.id.startsWith("dry_") &&
  p1.id.startsWith("dry_");
console.log(`\nresult: ${ok ? "PASS" : "FAIL"} (2 dry outbox rows, retry replayed, no live call)`);
if (!ok) process.exit(1);
