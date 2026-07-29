#!/usr/bin/env python3
"""Validate every example contract against the OCC schema."""
import json, glob, sys, pathlib
from jsonschema import Draft202012Validator, FormatChecker

root = pathlib.Path(__file__).resolve().parent.parent
schema = json.loads((root / "spec/contract.schema.json").read_text())
Draft202012Validator.check_schema(schema)
validator = Draft202012Validator(schema, format_checker=FormatChecker())


def spec_rule_errors(c):
    """SPEC.md §4 rules that JSON Schema cannot express."""
    errs = []
    if "posted" in c and "deadline" in c and c["deadline"] < c["posted"]:
        errs.append(f"['deadline']: {c['deadline']!r} is before posted {c['posted']!r}")
    total = c.get("budget", {}).get("total")
    cap = c.get("reward", {}).get("cap")
    paid_out = c.get("budget", {}).get("paid_out")
    if total is not None and cap is not None and cap > total:
        errs.append(f"['reward', 'cap']: {cap} exceeds budget.total {total}")
    if total is not None and paid_out is not None and paid_out > total:
        errs.append(f"['budget', 'paid_out']: {paid_out} exceeds budget.total {total}")
    return errs


failed = False
for path in sorted(glob.glob(str(root / "examples/*.json"))):
    contract = json.loads(pathlib.Path(path).read_text())
    errors = sorted(validator.iter_errors(contract), key=lambda e: list(e.path))
    name = pathlib.Path(path).name
    messages = [f"{list(e.path)}: {e.message}" for e in errors] + spec_rule_errors(contract)
    if messages:
        failed = True
        print(f"FAIL  {name}")
        for m in messages:
            print(f"      {m}")
    else:
        print(f"ok    {name}")

sys.exit(1 if failed else 0)
