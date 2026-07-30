#!/usr/bin/env python3
"""Fail CI when app code selects a column no migration defines.

The board went dark when listPublicBounties selected featured_until before
the migration adding it reached production. Migrations can lag a deploy,
but a select naming a column that NO migration creates can never succeed.
"""
import glob
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent.parent

sql = "\n".join(
    pathlib.Path(p).read_text()
    for p in sorted(glob.glob(str(root / "supabase/migrations/*.sql")))
)

NON_COLUMNS = {"primary", "constraint", "foreign", "unique", "check", "like"}


def defined_columns(table: str) -> set[str]:
    cols: set[str] = set()
    create = re.search(
        rf"CREATE TABLE (?:IF NOT EXISTS )?public\.{table}\s*\((.*?)\);",
        sql,
        re.S | re.I,
    )
    if create:
        for line in create.group(1).splitlines():
            m = re.match(r'\s*"?([a-z_]+)"?\s+\w+', line)
            if m and m.group(1) not in NON_COLUMNS:
                cols.add(m.group(1))
    for alter in re.finditer(
        rf"ALTER TABLE (?:ONLY )?public\.{table}\b[^;]*;", sql, re.S | re.I
    ):
        for m in re.finditer(
            r'ADD COLUMN (?:IF NOT EXISTS )?"?([a-z_]+)"?', alter.group(0), re.I
        ):
            cols.add(m.group(1))
    return cols


failed = False
checked = 0
for src_path in glob.glob(str(root / "src/**/*.ts*"), recursive=True):
    text = pathlib.Path(src_path).read_text()
    consts = dict(re.findall(r'const ([A-Z_]+_COLS) =\s*"([^"]+)"', text))
    for m in re.finditer(
        r'\.from\("([a-z_]+)"\)\s*\.select\(\s*(?:"([^"*]+)"|([A-Z_]+_COLS))',
        text,
        re.S,
    ):
        table, literal, const_name = m.groups()
        raw = literal if literal is not None else consts.get(const_name or "")
        if not raw:
            continue
        # Drop PostgREST embeds — alias:fk(col,col) selects columns of the
        # joined table, not this one.
        while re.search(r"[a-z_!:]+\([^()]*\)", raw):
            raw = re.sub(r"[a-z_!:]+\([^()]*\)", "", raw)
        table_cols = defined_columns(table)
        if not table_cols:
            continue  # table not defined via these migrations (e.g. auth schema)
        selected = {
            c.strip().split(":")[-1].split("(")[0]
            for c in raw.split(",")
            if c.strip() and "(" not in c.strip().split(":")[-1][:1]
        }
        selected = {c for c in selected if re.fullmatch(r"[a-z_]+", c)}
        missing = sorted(selected - table_cols)
        checked += 1
        rel = pathlib.Path(src_path).relative_to(root)
        if missing:
            failed = True
            print(f"FAIL  {rel}: select on '{table}' names undefined columns: {missing}")

print(f"schema-drift: {checked} selects checked")
sys.exit(1 if failed else 0)
