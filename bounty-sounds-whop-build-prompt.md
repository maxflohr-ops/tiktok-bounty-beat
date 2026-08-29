# bounty-sounds-whop-build-prompt.md

Source of truth: Notion page "🔌 Whop Build — Claude Code kit (prompt + rail adapter)", Part A.
Repo: `maxflohr-ops/tiktok-bounty-beat`. Do NOT deploy. Max publishes manually.

## 0. Read before you write

1. Read the existing Supabase schema (bounties, purses, clips, captures, payouts, metrics snapshots) and the Replit verification worker contract. Do not rename, drop, or re-key any existing table. You are adding a shell and a rail, not rebuilding the ledger.
2. Read `https://docs.whop.com/llms.txt` and then, in order: `/developer/guides/authentication.md`, `/developer/guides/iframe.md`, `/developer/guides/app-views.md`, `/developer/guides/dev-proxy.md`, `/developer/guides/webhooks.md`, `/developer/platforms/enroll-connected-accounts.md`, `/developer/platforms/manual-payouts.md`, `/developer/platforms/collect-payments-for-connected-accounts.md`, `/developer/platforms/add-funds-to-your-balance.md`, `/api-reference/bounties/create-bounty.md`, `/developer/api/idempotency.md`, `/developer/guides/sandbox.md`. Treat the docs and the Whop MCP servers (`https://docs.whop.com/mcp`, `https://mcp.whop.com/mcp`) as the source of truth. Pin `Api-Version-Date` to the latest dated version in the OpenAPI spec. Do not infer endpoint behavior from marketing pages.
3. Report the file map and the schema you found before writing any code. Wait for confirmation between work orders.

## 1. Non-negotiables

- **Vocabulary law.** bounty (the contract) · purse (the money, posted) · seized (editor claims it, editor-facing only) · verified (the worker has approved the delivery for payment) · captured (the delivery is paid and finalized) · dry (no purse behind it) · void (rejected). "funded" and "pot" never appear in code, copy, comments, or table names. Whop's "reward pool" maps to purse. A row is never called `captured` before the payment rail reaches the prompt-defined success condition.
- **Supabase is the source of truth.** Whop never decides who gets paid. Whop moves money when Supabase says `captured`. The Replit worker's capture/payout rows remain the only trigger.
- **Integer cents everywhere in our tables.** Convert to Whop's decimal `amount` only at the API boundary. Round down, never up.
- **`DRY_RUN=true` by default.** Every Whop call that moves money (topup, transfer, payout, bounty create) is behind a single `moveMoney()` gate. In dry run it writes the intended call to `whop_outbox` with status `dry` and returns a synthetic id prefixed `dry_`. Flipping to live is an env change plus a code review, not a code change.
- **Idempotency.** Every money call sends an idempotency key derived from our row id (`capture:<uuid>`, `purse:<uuid>`, `payout:<uuid>`). Store the key and the Whop response id on the row. A retry with the same key must be a no-op.
- **Two API keys, never one.** App API key (user identity, experience scoping, notifications). Account API key for the Bounty Sounds platform account (money). Both server-side only. Nothing money-related is ever callable from the iframe.
- **TanStack server-boundary law.** TanStack Start route loaders are isomorphic and may run in the browser during navigation. Never verify Whop tokens, read server secrets, instantiate the money client, or mutate ledger state directly in a loader. Put those operations behind `createServerFn` or a server-only API route/module and call that boundary from the route. No `WHOP_*_API_KEY`, webhook secret, platform account id, or account client may enter a client bundle.
- **Whop sees events, not scoring.** The verification provider, dedupe logic, and rejection grounds never leave our backend. Whop gets: purse posted, clip captured, payout sent.

## 2. Architecture

One codebase, **TanStack Start on Vite**. `/` is the web shell. `/whop/*` is the Whop shell (iframe; the Whop iOS app renders the same iframe, so this IS the v1 mobile app). Same components, different auth boundary and layout chrome. Both read/write Supabase (ledger of truth), which the Replit verification worker also writes. A server-only Whop rails adapter (topup · transfer · payout) talks to the Whop platform account. Clippers = connected accounts (KYC + payout method on Whop). Funders = pay via Whop checkout into the purse.

Local topology is fixed: TanStack/Vite listens on `5173`; Whop standalone dev proxy listens on `3000` and forwards to `5173`. Test the Whop shell through `3000`, never by opening `5173` directly when validating iframe auth. Use a TanStack Start release containing the reverse-proxy virtual-module fix (do not use the broken `1.167.17+` range prior to the fix); keep related TanStack Start packages on a compatible lockfile and commit that lockfile.

## 3. Work orders (do in order, confirm between each)

Before **every** WO, query the current Whop MCP/OpenAPI and print this contract:

```
Docs say:
- exact endpoint / SDK method
- auth credential required
- required request fields
- response/id field we will persist
- webhook/event names relied on
- idempotency behavior
- iframe/browser restrictions, if any

Implementation will do:
- exact server-only module or createServerFn boundary
- exact Supabase rows/columns read or written
- exact failure and retry behavior

Unresolved:
- anything not explicitly documented
```

If `Unresolved` contains anything that affects auth, money movement, settlement, KYC, payouts, webhook verification, or iframe behavior, **do not guess and do not implement that part**. Report it and wait for a decision or updated docs.

### WO-1 — Whop app shell (`/whop/*`)

- Add `@whop/sdk`, `@whop/react`, `@whop/iframe`.
- Route group `/whop/experiences/$experienceId` (experience view) and `/whop/dashboard/$companyId` (funder view). Configure App Views per docs.
- Server middleware: read the Whop user token per `/developer/guides/authentication.md`, verify it, resolve `whop_user_id`, check access level. No token → 401, not a redirect to web login.
- Mount `WhopIframeSdkProvider` in the `/whop` root layout only. Web routes never import it. Treat the iframe SDK as browser-only (`window.postMessage`); do not instantiate or call it during SSR.
- Wire the dev proxy so local dev replicates production iframe + auth. Required scripts:

```json
{
  "scripts": {
    "dev:app": "vite dev --port 5173",
    "dev:whop": "whop-proxy --standalone --upstreamPort=5173 --proxyPort=3000"
  }
}
```

If this repo uses a framework-specific TanStack Start dev command instead of raw `vite dev`, preserve that command but force port `5173`; the Whop proxy must remain on `3000` forwarding to `5173`.

- Layout: no top nav (Whop provides chrome). Ledger card, bounty list, seize/submit flow, "my captures" — reuse existing components. Respect Frosted UI spacing.
- `openExternalUrl` for anything that leaves Whop (official sound links, TikTok/Reels submissions).

Deliverable: app loads inside a Whop experience with the dev proxy, shows the same bounties as bountysounds.com, and a clipper can seize and submit a clip URL that lands in the same `clips` table.

Acceptance path must be demonstrated as: **browser → Whop proxy `:3000` → TanStack Start `:5173` → server-only auth/data boundary → Supabase/Whop**. For auth testing, opening `:5173` directly does not count as a pass. Show one request where the proxy-injected Whop token reaches the server boundary, is verified there, and the resulting user id is returned to the route without exposing the token or API keys to the browser.

### WO-2 — Identity crossover

Migration (additive only):

```sql
alter table users add column whop_user_id text unique;
alter table users add column whop_account_id text unique;      -- connected account (clipper payout side)
alter table users add column whop_kyc_status text default 'none'; -- none | pending | approved | rejected
alter table users add column whop_payout_method_id text;
alter table purses add column whop_payment_id text;              -- funder's checkout payment
alter table purses add column whop_bounty_id text;               -- only if mirrored (off by default)
alter table payouts add column whop_transfer_id text;
alter table payouts add column whop_payout_id text;
alter table payouts add column rail text default 'whop';          -- whop | stripe_connect
create table whop_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null,           -- topup | transfer | payout | bounty_create
  ref_table text not null, ref_id uuid not null,
  idempotency_key text unique not null,
  request jsonb not null, response jsonb,
  status text not null default 'dry', -- dry | sent | ok | failed
  created_at timestamptz default now(), sent_at timestamptz
);
create table whop_webhook_events (
  id text primary key,          -- Whop webhook-id, for dedupe
  type text not null, payload jsonb not null,
  received_at timestamptz default now(), processed_at timestamptz
);
```

(Repo mapping note: this codebase has no literal `users`/`purses`/`payouts` tables. The confirmed mapping is `users` → `profiles`, `purses` → `bounties`/`bounty_payments`, `payouts` → `payout_approvals`. Columns are added additively to those tables; worker-owned tables are never touched.)

Linking rule: first time a Whop user opens the app, upsert `users` by `whop_user_id`. Do not silently merge accounts from an unverified or merely matching email. If Whop supplies a verified email and it matches an existing web user, require an explicit server-side linking rule/check before attaching the Whop identity; otherwise keep the identity unlinked and surface a safe account-link flow. Same verified clipper should ultimately resolve to one row everywhere, but identity collision must fail closed rather than auto-merge.

### WO-3 — Clipper payout onboarding (connected accounts)

- Do **not** force payout onboarding at first seize. A clipper may seize and submit without KYC so the earning flow stays low-friction. Start connected-account/KYC onboarding from a "Get paid" / "Verify to capture" action, or automatically when the worker has verified a submission and payment readiness is required. Create the connected account under the platform (`companies.create` with `parent_company_id`) only at that boundary and store `whop_account_id`.
- KYC: `accountLinks.create({ use_case: "account_onboarding", return_url, refresh_url })` → `openExternalUrl` inside Whop, plain redirect on web. Webhook `verification.succeeded` / `identity_profile.updated` → update `whop_kyc_status`.
- Payout method: mount `PayoutsSession` + `PayoutMethodElement`. Webhook `payout_method.created` → store `whop_payout_method_id` when `is_default`.
- `whop_kyc_status != 'approved'` can seize and submit, and the worker may verify the submission, but the payout rail cannot finalize it as `captured`. Copy: "Verify to capture."

### WO-4 — Purse funding (funder side)

- **Web (default):** Whop checkout for an inline plan equal to purse amount; metadata `{ purse_id }`. Webhook `payment.succeeded` → mark purse `posted`, store `whop_payment_id`. Funds sit in the platform balance.
- **Bounty Sounds iOS policy (must be re-verified before implementation).** Our current product rule is to block purse posting inside the Whop iOS app below USD 700 and render "Post this purse on desktop" with a copy-link button. Treat this as a Bounty Sounds business rule, not as a permanent Whop technical invariant. Before implementing WO-4, re-check the current Whop MCP/OpenAPI/iOS guidance for purchase constraints, fees, and supported flows. If the current docs conflict with this rule, report the conflict under `Unresolved` and wait rather than hard-coding stale platform assumptions.
- Mirror to Whop native bounties: **OFF.** `MIRROR_WHOP_BOUNTIES=false`. Their API has no approve/deny endpoint, so our worker cannot settle it. View-based purses ($ per 1k verified views) are not expressible there anyway.

### WO-5 — Verified → reserve → pay → capture (the only money path)

Trigger: the Replit verification worker has approved the delivery for payment using the existing worker-owned state/row contract. Do **not** reinterpret an already-`captured` row as payment-ready. If the current schema lacks a distinct pre-payment state, first report the exact existing worker states and propose the smallest additive mapping (`verified` / `payout_pending` / equivalent) without renaming or re-keying worker tables. `captured` remains the terminal Bounty Sounds meaning: delivered, paid, finalized.

Per payout, use a recoverable state machine; do not pretend Supabase and Whop share one atomic transaction:

1. Acquire the same advisory/run-lock pattern used by the worker and lock the relevant payout/purse rows. Assert the payout is payment-ready and not already finalized.
2. Assert `whop_kyc_status = 'approved'` and `whop_payout_method_id` set. Else mark `blocked:kyc`, notify the clipper if the current Whop docs support the intended notification call, and do not reserve money permanently.
3. Assert the purse has enough unreserved money. Atomically reserve `amount_cents` in Supabase (or create an equivalent payout reservation row) before calling Whop. The available balance exposed to new payouts must exclude active reservations. If insufficient, mark `blocked:dry` and never overdraw.
4. Write/confirm the `whop_outbox` intent with a unique idempotency key derived from our row id. Then call `transfers.create` platform → connected account using the current documented ledger-transfer shape. Persist the transfer id. A retry must detect the existing outbox/transfer result and never re-transfer.
5. Call `payouts.create` only if the current docs confirm it is required for the intended settlement flow. Persist the payout id and its intermediate status. If transfer succeeds but payout creation fails, keep the reservation attached to the payout, mark a recoverable `transfer_only`/equivalent state, never repeat the transfer, and surface the supported withdrawal/recovery path from current docs.
6. Only after the prompt-defined Whop success condition is met, finalize Supabase: consume the reservation, decrement purse spendable balance exactly once, mark the payout finalized, and then transition the delivery to `captured`. If external settlement is asynchronous, use a non-terminal `sent`/`processing` state until the authoritative webhook confirms success; do not call it `captured` early.
7. On terminal failure before any Whop transfer, release the reservation. On ambiguous network failure, do **not** release or retry blindly; reconcile by idempotency key / Whop response lookup / webhook evidence first.

Cadence: scheduled job (Replit scheduled deployment, same advisory run lock pattern as the verification worker). Not on request. Not on webhook. Webhooks reconcile rail state; they do not originate a Bounty Sounds capture.

### WO-6 — Webhooks

One endpoint `/api/whop/webhooks`. Verify signature. Dedupe on webhook id via `whop_webhook_events`. Handle: `payment.succeeded`, `payment.failed`, `refund.created`, `dispute.created`, `verification.succeeded`, `identity_profile.updated`, `payout_method.created`, `payout_account.status_updated`, `ledger_account.funds_available`. Unknown: store and 200. A dispute on a purse payment freezes the purse (`status = 'frozen'`) and blocks all payouts from it.

### WO-7 — Stripe Connect adapter (kept, not used)

Refactor existing Stripe Connect payout code behind the same `Rail` interface as the Whop adapter: `onboard(user)`, `fundPurse(purse)`, `transfer(capture)`, `payout(payout)`. `payouts.rail` selects. Default `whop`.

## 4. Env

```
WHOP_APP_ID=
WHOP_APP_API_KEY=            # server only
WHOP_ACCOUNT_API_KEY=        # server only, platform account
WHOP_PLATFORM_ACCOUNT_ID=biz_...
WHOP_WEBHOOK_SECRET=
WHOP_API_VERSION_DATE=       # pin from spec
VITE_WHOP_APP_ID=            # public app id only; iframe SDK/client bundle
DRY_RUN=true
MIRROR_WHOP_BOUNTIES=false
PLATFORM_COVERS_PAYOUT_FEES=true
```

Build against the sandbox base URL first. Live keys never enter the repo.

## 5. Go-live gate (Max flips, not the agent)

- [ ] `dev:app` is fixed to 5173 and `dev:whop` is fixed to proxy 3000 → 5173.
- [ ] Browser → `:3000` → `:5173` → server boundary path proven; direct `:5173` is not used as the Whop auth acceptance test.
- [ ] Bundle/env inspection proves no `WHOP_APP_API_KEY`, `WHOP_ACCOUNT_API_KEY`, `WHOP_WEBHOOK_SECRET`, or `WHOP_PLATFORM_ACCOUNT_ID` ships client-side.
- [ ] Each implemented WO has a checked-in or captured `Docs say / Implementation will do / Unresolved` contract based on the current Whop MCP/OpenAPI.
- [ ] Web shell and Whop shell show identical bounty lists from one query.
- [ ] One clipper linked across web and Whop with a single `users` row.
- [ ] KYC + payout method completed by a real BR or PH clipper in sandbox.
- [ ] One purse posted via Whop checkout on web; iOS block verified in the Whop app.
- [ ] One dry-run **verified → reserve → pay → capture** flow proves: reservation created once, `whop_outbox` contains the intended transfer/payout with correct cents→decimal and idempotency keys, retries do not double-reserve or double-transfer, and `captured` is not set until the terminal success condition.
- [ ] Webhook dedupe proven by replaying a delivery.
- [ ] Then, and only then, `DRY_RUN=false` for a $5 purse with Max as funder and a known clipper as recipient.

## 6. Do not

- No Whop money call in a client component, route loader, or the iframe.
- No server secret or Whop token verification directly in a TanStack route loader; loaders call a `createServerFn`/server-only boundary.
- Do not use `NEXT_PUBLIC_*` env names in this Vite/TanStack app. Only the non-secret App ID may use `VITE_WHOP_APP_ID`; every key/secret remains unprefixed and server-only.
- Whop status never decides Bounty Sounds business truth by itself. Supabase owns bounty/purse/workflow truth, while verified Whop rail events are allowed to reconcile payment execution state. A Whop success event may complete an already-authorized Bounty Sounds payout, but may never invent a verification/capture decision the worker did not authorize.
- Do not touch the Replit worker's tables or capture logic.
- Do not deploy, publish to the Whop App Store, or promote an App Build.
