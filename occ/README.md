# Open Clipping Contract (OCC)

**A vendor-neutral specification for describing paid short-form clipping work.**

A clipping contract is a simple thing to describe and an easy thing to describe badly. Someone with an asset offers to pay editors to cut it into short-form video. What gets paid, for what, and on what proof — those four answers are the contract. Today every platform, Discord server, and spreadsheet answers them in a different shape, which means work can't move between them and nobody can compare two offers honestly.

OCC is one JSON object that answers them the same way every time.

```json
{
  "occ_version": "0.1",
  "contract_id": "BC-1",
  "title": "Loop cut bounty — instrumental",
  "asset": { "url": "https://example.com/track", "type": "audio" },
  "platforms": ["tiktok", "reels"],
  "reward": { "type": "per_100k_views", "rate": 2500, "currency": "USD" },
  "budget": { "total": 50000, "funded": true, "escrow": true },
  "posted": "2026-07-24",
  "deadline": "2026-08-08",
  "proof": { "requires": ["live_url", "view_count"], "verified_after_hours": 72 }
}
```

That's the whole idea.

## Why a standard and not a platform

Marketplaces don't win by owning the format. They win by owning the liquidity — the editors who show up and the funders who trust the payout. A shared contract format doesn't give that away; it makes the category legible enough for everyone in it to grow.

Concretely, a standard means:

- **An editor can compare two offers** without decoding two layouts.
- **A funder can post once** and syndicate to several boards.
- **Tooling becomes possible** — trackers, aggregators, escrow providers, analytics — because there's something stable to build against.
- **Disputes have a reference.** "Delivered" means whatever the contract says it means, in a field both sides agreed to before the work started.

## Status

**v0.1 — draft.** Unstable. Fields will change. Implemented in production by [Bounty Sounds](https://bountysounds.com), which is where the schema was pressure-tested, but the spec is deliberately not tied to it.

## What's here

| Path | What it is |
| --- | --- |
| [`spec/SPEC.md`](spec/SPEC.md) | The specification, in prose |
| [`spec/contract.schema.json`](spec/contract.schema.json) | JSON Schema for validation |
| [`examples/`](examples/) | Valid contracts covering each reward type |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to propose a change |

## Validate a contract

```bash
pip install "jsonschema[format-nongpl]"
python3 tools/validate.py
```

## Open questions

These are unresolved and genuinely open. Opinions welcome — especially from anyone who has run clipping campaigns and been burned.

1. **Escrow attestation.** `escrow: true` is currently a claim, not a proof. Should the spec define how a funder demonstrates funds are actually held, or is that deliberately out of scope?
2. **View-count verification.** Platform APIs disagree with each other and with what creators see. What counts as an authoritative number, and at what age?
3. **Rights and usage.** Who owns the clip after payout? Almost every real dispute lives here, and v0.1 doesn't touch it.
4. **Partial delivery.** A contract funded for twenty clips receives seven. Should the spec describe what happens to the remainder, or leave it to the platform?
5. **Editor standing.** Reputation is portable in principle and hard in practice. Worth specifying, or a trap?

## License

Spec text and schema: [CC BY 4.0](LICENSE). Use it, fork it, ship it commercially. Attribution appreciated, not enforced.
