// Shared payment-rail interface (WO-7). Every rail adapter (Whop, Stripe
// Connect) implements this; `payout_approvals.rail` (added in WO-2) selects
// which adapter runs. All amounts are integer cents — a rail converts to its
// provider's format only at its own API boundary.

/** The clipper being onboarded onto a rail's payout side. */
export interface RailUser {
  /** Bounty Sounds profile id (profiles.id / auth user id). */
  id: string;
  /** Display handle used when the rail needs an account title. */
  handle: string;
  email?: string | null;
}

export interface OnboardResult {
  /** Rail-side account id (Whop biz_… / Stripe acct_…). */
  railAccountId: string;
  /** Hosted KYC/onboarding URL to send the user to, if the rail uses one. */
  onboardingUrl?: string;
}

/** A purse to be funded (WO-4). */
export interface PurseFunding {
  /** bounties.id */
  purseId: string;
  amountCents: number;
  currency: string;
}

export interface FundPurseResult {
  /** Hosted checkout URL, when the rail funds via checkout. */
  checkoutUrl?: string;
  /** Rail-side payment/session id to persist. */
  railPaymentId?: string;
}

/** A verified, payout-ready delivery whose money is being moved (WO-5). */
export interface CaptureTransfer {
  /** Our payout row id — the idempotency key derives from this, never reuse it. */
  id: string;
  bountyId: string;
  clipId: string;
  /** Destination account on the rail (Whop biz_… / Stripe acct_…). */
  railAccountId: string;
  amountCents: number;
  currency: string;
}

/** A rail payout (balance → bank/card) for an already-transferred amount. */
export interface PayoutRequest {
  /** Our payout row id — the idempotency key derives from this. */
  id: string;
  railAccountId: string;
  railPayoutMethodId: string;
  amountCents: number;
  currency: string;
}

/** Result of a money move. `dry` means DRY_RUN wrote intent only. */
export interface MoneyMoveResult {
  /** Rail-side id to persist (transfer/payout id; `dry_…` in dry-run). */
  id: string;
  /** Rail-side status as returned (e.g. processing | succeeded | failed). */
  status?: string;
  dry: boolean;
  /** True when this call replayed an already-recorded outcome (idempotent no-op). */
  replayed: boolean;
}

export interface Rail {
  onboard(user: RailUser): Promise<OnboardResult>;
  fundPurse(purse: PurseFunding): Promise<FundPurseResult>;
  transfer(capture: CaptureTransfer): Promise<MoneyMoveResult>;
  payout(payout: PayoutRequest): Promise<MoneyMoveResult>;
}

// ---------------------------------------------------------------------------
// Outbox: every money move is recorded as an intent before it executes, keyed
// by an idempotency key derived from our row id. Until WO-2 lands the
// `whop_outbox` table, the only store is the in-memory one used by dry runs
// and tests; the Supabase-backed store replaces it in WO-2.

export type OutboxStatus = "dry" | "sent" | "ok" | "failed";

export interface OutboxRow {
  kind: string; // topup | transfer | payout | bounty_create
  refTable: string;
  refId: string;
  idempotencyKey: string;
  request: unknown;
  response?: unknown;
  status: OutboxStatus;
  createdAt: string;
  sentAt?: string;
}

export interface OutboxStore {
  /** Returns the existing row for this key, or null if none. */
  find(idempotencyKey: string): Promise<OutboxRow | null>;
  /** Inserts the intent row. Must fail (or return the existing row) on a duplicate key. */
  insert(row: OutboxRow): Promise<void>;
  update(idempotencyKey: string, patch: Partial<OutboxRow>): Promise<void>;
}

/** In-memory outbox — dry runs and tests only. Not durable, not shared. */
export function createMemoryOutbox(): OutboxStore & { rows: OutboxRow[] } {
  const rows: OutboxRow[] = [];
  return {
    rows,
    async find(key) {
      return rows.find((r) => r.idempotencyKey === key) ?? null;
    },
    async insert(row) {
      if (rows.some((r) => r.idempotencyKey === row.idempotencyKey)) {
        throw new Error(`duplicate idempotency key: ${row.idempotencyKey}`);
      }
      rows.push(row);
    },
    async update(key, patch) {
      const row = rows.find((r) => r.idempotencyKey === key);
      if (row) Object.assign(row, patch);
    },
  };
}
