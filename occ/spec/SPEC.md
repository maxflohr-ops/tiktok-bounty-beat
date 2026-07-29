# Open Clipping Contract — Specification

**Version 0.1 · Draft · Unstable**

## 1. Scope

This document specifies a JSON representation of a *clipping contract*: an offer of payment for short-form video derived from a supplied asset.

It specifies **what a contract says**. It does not specify how contracts are hosted, discovered, claimed, escrowed, or paid. Those are implementation concerns and deliberately out of scope.

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described in RFC 2119.

## 2. Terms

| Term | Meaning |
| --- | --- |
| **Funder** | The party offering payment. |
| **Editor** | The party producing clips. |
| **Asset** | The source material to be cut. |
| **Claim** | An editor's declaration of intent to deliver against a contract. |
| **Delivery** | A submitted clip with accompanying proof. |
| **Approval** | The funder's acceptance of a delivery, triggering payment. |

## 3. Contract object

A contract is a JSON object. Required fields are marked ✓.

### 3.1 Identity

| Field | Type | ✓ | Notes |
| --- | --- | --- | --- |
| `occ_version` | string | ✓ | Spec version, e.g. `"0.1"` |
| `contract_id` | string | ✓ | Unique within the issuing platform |
| `title` | string | ✓ | Human-readable, ≤ 120 chars |
| `brief` | string | | Instructions, do's and don'ts |

### 3.2 Asset

| Field | Type | ✓ | Notes |
| --- | --- | --- | --- |
| `asset.url` | string (URI) | ✓ | Where the source lives |
| `asset.type` | enum | ✓ | `audio` · `video` · `image_set` · `other` |
| `asset.attribution` | string | | Required credit, if any |

### 3.3 Platforms

`platforms` — array of enum, ✓, min 1 item.

Permitted: `tiktok` · `reels` · `shorts` · `x` · `other`

An editor MAY deliver to any listed platform unless the brief narrows it.

### 3.4 Reward

All monetary amounts in a contract — `reward.rate`, `reward.floor`, `reward.cap`, `budget.total`, `budget.paid_out` — are **integers in the currency's minor unit** (cents for USD, per ISO 4217). `2000` with `"currency": "USD"` means $20.00. JSON numbers are floats in most parsers, and money that depends on the parser is a dispute waiting to happen.

`reward.type` ✓ — one of:

**`per_clip`** · A flat amount per approved clip. `rate` is the amount. Predictable cost, predictable volume.

**`per_100k_views`** · Payment scales with verified views. `rate` is the amount per 100,000 views. Implementations SHOULD define rounding; the spec does not.

**`flat`** · A single prize for a defined outcome — best clip, first to a threshold. The condition MUST be stated in `brief`.

| Field | Type | ✓ | Notes |
| --- | --- | --- | --- |
| `reward.type` | enum | ✓ | As above |
| `reward.rate` | integer | ✓ | Minor units, non-negative |
| `reward.currency` | string | ✓ | ISO 4217, e.g. `"USD"` |
| `reward.floor` | integer | | Guaranteed minimum per approved clip, minor units |
| `reward.cap` | integer | | Maximum payable to one editor, minor units |

`reward.floor` combined with `per_100k_views` expresses the hybrid structure most editors prefer: certainty underneath, upside above. `floor` MUST NOT be used with `per_clip` or `flat` — the rate already is the guaranteed amount there, and a second number would only invite disagreement about which one governs.

### 3.5 Budget

| Field | Type | ✓ | Notes |
| --- | --- | --- | --- |
| `budget.total` | integer | ✓ | Ceiling on total payout, minor units |
| `budget.funded` | boolean | ✓ | Whether money is actually committed |
| `budget.escrow` | boolean | | Whether funds are held by a third party |
| `budget.paid_out` | integer | | Released to date, minor units |

**`funded` is the single most consequential field in the spec.** An unfunded contract is an advertisement. Implementations SHOULD display funded and unfunded contracts distinguishably, and SHOULD NOT allow an unfunded contract to be claimed without the editor being shown its status.

### 3.6 Timing

| Field | Type | ✓ | Notes |
| --- | --- | --- | --- |
| `posted` | string (date) | ✓ | ISO 8601 |
| `deadline` | string (date) | ✓ | Last day for delivery |
| `review_window_hours` | integer | | Funder time to approve after delivery |

A contract without a deadline cannot expire, and a contract that cannot expire cannot return unspent funds. `deadline` is therefore required.

### 3.7 Proof

`proof.requires` ✓ — array of enum, min 1 item.

| Value | Meaning |
| --- | --- |
| `live_url` | Public link to the posted clip |
| `view_count` | Platform-reported views |
| `screenshot` | Image evidence — weakest form, discouraged alone |
| `analytics_export` | Creator-side analytics file |

| Field | Type | ✓ | Notes |
| --- | --- | --- | --- |
| `proof.requires` | array | ✓ | As above |
| `proof.verified_after_hours` | integer | | Age before a view count is treated as settled |
| `proof.min_retention_days` | integer | | How long the clip must stay live |

`min_retention_days` exists because a clip deleted after payout is a refund problem, and the contract should say so before the money moves.

### 3.8 Status

`status` ✓ — one of `draft` · `open` · `closed` · `settled` · `expired` · `cancelled`

| Value | Meaning |
| --- | --- |
| `draft` | Not yet accepting claims |
| `open` | Accepting claims and deliveries |
| `closed` | No longer accepting claims or deliveries; settlement pending |
| `settled` | Every approved delivery has been paid |
| `expired` | Deadline passed |
| `cancelled` | Withdrawn by the funder |

These are states of the **contract**, not of any editor's claim. A contract with active claims is still `open` if another editor could claim it. The lifecycle of an individual claim — claimed, delivered, in review, approved — is platform behavior and out of scope (§1); the optional counters in §3.9 are the contract-level view of it.

### 3.9 Optional counters

`claims`, `delivered`, `approved` — non-negative integers. Useful for aggregation; not authoritative.

## 4. Validation

A contract is valid if it conforms to `contract.schema.json`. Additionally:

- `deadline` MUST be on or after `posted`.
- If `reward.cap` is present it MUST be ≤ `budget.total`.
- If `budget.paid_out` is present it MUST be ≤ `budget.total`.
- If `budget.escrow` is `true`, `budget.funded` MUST also be `true`.

## 5. Extensions

Implementations MAY add fields under an `x_` prefix. Consumers MUST ignore unrecognized `x_` fields rather than reject the contract.

## 6. Changelog

**0.1** — Initial draft. Extracted from the Bounty Sounds contract ledger.

Amended while unstable (still 0.1): monetary amounts are integers in minor units rather than decimal numbers; `status` trimmed to contract-scoped states (`claimed` and `in_review` removed, `closed` added); `reward.floor` restricted to `per_100k_views`; `x_` extension fields permitted inside nested objects.
