# Contributing

The spec is v0.1 and unstable. That's an invitation, not a warning.

## What's most useful right now

**Field disagreements.** If you've run clipping campaigns and a field here doesn't match how the work actually goes, that's the highest-value issue you can open. Say what broke and what you did instead.

**The open questions in the README.** Escrow attestation, view verification, rights and usage, partial delivery, editor standing. Five genuinely unresolved problems. Rights and usage is where most real disputes live and where v0.1 is thinnest.

**Implementations.** If you build against OCC, open an issue and it goes in the README. Two independent implementations is the bar for calling anything v1.

## Proposing a change

1. Open an issue first. Describe the situation the current spec handles badly — the case, not just the field.
2. If there's agreement on the problem, open a PR touching `spec/SPEC.md` and `spec/contract.schema.json` together. They must not drift.
3. Add or update an example if the change affects the contract shape.
4. Run the validator.

```bash
pip install "jsonschema[format-nongpl]"
python3 tools/validate.py
```

## Principles

**Describe, don't prescribe.** The spec says what a contract *says*. It doesn't say how a platform must behave. Every time we've been tempted to specify enforcement, it's been the wrong call.

**Required fields cost something.** Each one is a thing every implementer must produce. A field earns `required` by preventing a real failure — `deadline` is required because a contract that can't expire can't return money.

**Prefer plain over clever.** Someone reads this at 1am trying to figure out why a payout didn't fire.

**Optional fields are free, required ones aren't.** When in doubt, optional.

## Governance

Informal for now. Maintained by [Bounty Sounds](https://bountysounds.com), which implements it. If adoption spreads beyond one implementation, governance moves out — a standard controlled by one vendor isn't a standard.
