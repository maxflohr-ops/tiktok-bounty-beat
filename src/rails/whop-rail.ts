// Bounty Sounds — Whop rail adapter behind the shared Rail interface.
// Vocabulary: bounty · purse · seized · verified · captured · dry · void
//
// SERVER-ONLY. This module reads WHOP_ACCOUNT_API_KEY. Like stripe.server.ts,
// never import it from route files or *.functions.ts at top level — load it
// lazily inside a createServerFn handler or another server-only module. Env is
// read inside functions, never at module scope, so an accidental client-side
// import cannot leak anything at build time.
//
// Every money call goes through moveMoney(): the intent lands in the outbox
// with an idempotency key derived from our row id BEFORE any network call, and
// with DRY_RUN=true (the default) nothing is sent — the outbox row is written
// with status 'dry' and a synthetic `dry_…` id comes back.
//
// Docs (current as of 2026-08-29, docs.whop.com MCP):
// - POST /transfers: amount (decimal number), origin_id, destination_id,
//   currency, type 'ledger', body `idempotence_key` (retry-safe) + optional
//   `Idempotency-Key` header; response { id, status: processing|succeeded|failed }.
// - POST /payouts: exactly one of account_id/user_id, amount, currency,
//   payout_method_id (potk_…), platform_covers_fees; response { id, status }.
// - accountLinks.create({ company_id, use_case: 'account_onboarding',
//   return_url, refresh_url }) → { url } for hosted KYC.
// - Sandbox base URL: https://sandbox-api.whop.com/api/v1.

import { WhopClient } from "@whop/sdk";
import {
  type CaptureTransfer,
  type FundPurseResult,
  type MoneyMoveResult,
  type OnboardResult,
  type OutboxStore,
  type PayoutRequest,
  type PurseFunding,
  type Rail,
  type RailUser,
} from "./rail";

function env(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

export function isDryRun(): boolean {
  return env("DRY_RUN", "true") !== "false";
}

export function isSandbox(): boolean {
  return env("WHOP_SANDBOX", "true") !== "false";
}

let _client: WhopClient | undefined;

/** Money client (Account API key). Server-only; throws outside dry-run if unset. */
function getWhopAccountClient(): WhopClient {
  if (!_client) {
    const token = env("WHOP_ACCOUNT_API_KEY");
    if (!token) throw new Error("Missing WHOP_ACCOUNT_API_KEY environment variable.");
    _client = new WhopClient({
      token,
      baseUrl: isSandbox() ? "https://sandbox-api.whop.com/api/v1" : "https://api.whop.com/api/v1",
      apiVersionDate: env("WHOP_API_VERSION_DATE") || undefined,
    });
  }
  return _client;
}

function platformAccountId(): string {
  const id = env("WHOP_PLATFORM_ACCOUNT_ID");
  if (!id) {
    // Dry runs may build intents without env; the placeholder is unmistakable
    // in outbox rows. Live mode never proceeds without the real account id.
    if (isDryRun()) return "biz_DRY_RUN_PLACEHOLDER";
    throw new Error("Missing WHOP_PLATFORM_ACCOUNT_ID environment variable.");
  }
  return id;
}

// Integer cents → Whop decimal amount. Truncate toward zero — never round up.
// Divide only after flooring so 1299 → 12.99 and nothing ever gains a cent.
export function centsToWhopAmount(cents: number): number {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error(`amount must be non-negative integer cents, got ${cents}`);
  }
  return Math.floor(cents) / 100;
}

interface MoveMoneyArgs {
  kind: "topup" | "transfer" | "payout" | "bounty_create";
  refTable: string;
  refId: string;
  idempotencyKey: string;
  request: Record<string, unknown>;
  execute: () => Promise<{ id: string; status?: string }>;
}

// The single gate every money-moving Whop call passes through.
// Sequence: look up outbox by key (replay = no-op) → insert intent → dry-return
// or execute → persist response. An ambiguous failure leaves status 'sent' for
// reconciliation; it is never retried blindly by this function.
async function moveMoney(outbox: OutboxStore, args: MoveMoneyArgs): Promise<MoneyMoveResult> {
  const existing = await outbox.find(args.idempotencyKey);
  if (existing) {
    if (existing.status === "ok" && existing.response) {
      const res = existing.response as { id: string; status?: string };
      return { id: res.id, status: res.status, dry: false, replayed: true };
    }
    if (existing.status === "dry") {
      return { id: `dry_${args.kind}_${args.refId}`, dry: true, replayed: true };
    }
    // 'sent' (in flight or ambiguous) and 'failed' both need reconciliation,
    // not an automatic re-send: the Whop side may or may not have executed.
    throw new Error(
      `outbox row ${args.idempotencyKey} is '${existing.status}' — reconcile before retrying`,
    );
  }

  const dry = isDryRun();
  try {
    await outbox.insert({
      kind: args.kind,
      refTable: args.refTable,
      refId: args.refId,
      idempotencyKey: args.idempotencyKey,
      request: args.request,
      status: dry ? "dry" : "sent",
      createdAt: new Date().toISOString(),
      ...(dry ? {} : { sentAt: new Date().toISOString() }),
    });
  } catch {
    // A concurrent caller won the unique-key race; treat this call as a retry
    // of theirs. Ambiguity ('sent') still refuses per the rules above.
    const winner = await outbox.find(args.idempotencyKey);
    if (winner?.status === "ok" && winner.response) {
      const res = winner.response as { id: string; status?: string };
      return { id: res.id, status: res.status, dry: false, replayed: true };
    }
    if (winner?.status === "dry") {
      return { id: `dry_${args.kind}_${args.refId}`, dry: true, replayed: true };
    }
    throw new Error(
      `outbox row ${args.idempotencyKey} is '${winner?.status ?? "unknown"}' — reconcile before retrying`,
    );
  }

  if (dry) {
    return { id: `dry_${args.kind}_${args.refId}`, dry: true, replayed: false };
  }

  const res = await args.execute();
  await outbox.update(args.idempotencyKey, { status: "ok", response: res });
  return { id: res.id, status: res.status, dry: false, replayed: false };
}

export function createWhopRail(outbox: OutboxStore): Rail & {
  defaultPayoutMethod(whopAccountId: string): Promise<{ id: string } | null>;
} {
  return {
    // --- clipper side (WO-3 wires this to "Get paid" / "Verify to capture") ---
    async onboard(user: RailUser): Promise<OnboardResult> {
      const client = getWhopAccountClient();
      const company = await client.companies.create({
        parent_company_id: platformAccountId(),
        title: user.handle,
      });
      const link = await client.accountLinks.create({
        company_id: company.id,
        use_case: "account_onboarding",
        return_url: "https://www.bountysounds.com/dashboard?whop_onboarding=complete",
        refresh_url: "https://www.bountysounds.com/dashboard?whop_onboarding=refresh",
      });
      return { railAccountId: company.id, onboardingUrl: link.url ?? undefined };
    },

    async defaultPayoutMethod(whopAccountId: string) {
      const client = getWhopAccountClient();
      const page = await client.payoutMethods.listPayoutMethod({ company_id: whopAccountId });
      const method = page.data?.find((m) => m.is_default);
      return method ? { id: method.id } : null;
    },

    // --- funder side ---
    async fundPurse(_purse: PurseFunding): Promise<FundPurseResult> {
      // Whop purse funding is checkout-driven (WO-4): an inline plan equal to
      // the purse amount, settled by the payment.succeeded webhook — not a
      // direct API money-pull. Implemented in WO-4 against current docs.
      throw new Error("whop-rail.fundPurse: implemented in WO-4 (Whop checkout flow).");
    },

    // --- verified → reserve → pay → capture (WO-5 owns the state machine) ---
    async transfer(capture: CaptureTransfer): Promise<MoneyMoveResult> {
      const idempotencyKey = `capture:${capture.id}`;
      const request = {
        amount: centsToWhopAmount(capture.amountCents),
        currency: capture.currency.toLowerCase(),
        origin_id: platformAccountId(),
        destination_id: capture.railAccountId,
        type: "ledger" as const,
        idempotence_key: idempotencyKey,
        metadata: { bounty_id: capture.bountyId, clip_id: capture.clipId },
      };
      return moveMoney(outbox, {
        kind: "transfer",
        refTable: "payout_approvals",
        refId: capture.id,
        idempotencyKey,
        request,
        execute: async () => {
          const client = getWhopAccountClient();
          // Body idempotence_key AND the Idempotency-Key header, both derived
          // from our row id — either alone makes a retry safe per docs.
          const res = await client.transfers.create(request, { idempotencyKey });
          if (res.object !== "transfer") {
            throw new Error(`expected ledger transfer response, got ${res.object}`);
          }
          return { id: res.id, status: res.status };
        },
      });
    },

    async payout(p: PayoutRequest): Promise<MoneyMoveResult> {
      const idempotencyKey = `payout:${p.id}`;
      const request = {
        account_id: p.railAccountId,
        amount: centsToWhopAmount(p.amountCents),
        currency: p.currency.toLowerCase(),
        payout_method_id: p.railPayoutMethodId,
        platform_covers_fees: env("PLATFORM_COVERS_PAYOUT_FEES", "true") !== "false",
      };
      return moveMoney(outbox, {
        kind: "payout",
        refTable: "payout_approvals",
        refId: p.id,
        idempotencyKey,
        request,
        execute: async () => {
          const client = getWhopAccountClient();
          const res = await client.payouts.create(request, { idempotencyKey });
          return { id: res.id, status: res.status };
        },
      });
    },
  };
}
