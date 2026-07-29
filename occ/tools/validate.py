#!/usr/bin/env python3
"""Validate every example contract against the OCC schema."""
import json, glob, sys, pathlib
from jsonschema import Draft202012Validator, FormatChecker

root = pathlib.Path(__file__).resolve().parent.parent
schema = json.loads((root / "spec/contract.schema.json").read_text())
Draft202012Validator.check_schema(schema)
validator = Draft202012Validator(schema, format_checker=FormatChecker())

failed = False
for path in sorted(glob.glob(str(root / "examples/*.json"))):
    contract = json.loads(pathlib.Path(path).read_text())
    errors = sorted(validator.iter_errors(contract), key=lambda e: list(e.path))
    name = pathlib.Path(path).name
    if errors:
        failed = True
        print(f"FAIL  {name}")
        for e in errors:
            print(f"      {list(e.path)}: {e.message}")
    else:
        print(f"ok    {name}")

sys.exit(1 if failed else 0)
