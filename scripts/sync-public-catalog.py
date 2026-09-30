"""Append a verified public catalog.db snapshot to the Git seed files.

Only catalog.db is read. qiuzhao.db is deliberately outside this workflow, so
personal application progress cannot be copied into Git.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
from pathlib import Path


def compact(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", required=True, type=Path)
    parser.add_argument("--additions", required=True, type=Path)
    parser.add_argument("--metadata", required=True, type=Path)
    return parser.parse_args()


def existing_names(metadata_text: str) -> set[str]:
    encoded = re.findall(
        r'(?m)^  \[\r?\n    ("(?:[^"\\]|\\.)*"),\r?\n    \{',
        metadata_text,
    )
    encoded += re.findall(
        r'(?m)^  \[("(?:[^"\\]|\\.)*"),\{',
        metadata_text,
    )
    return {json.loads(value) for value in encoded}


def main() -> None:
    args = parse_args()
    additions_text = args.additions.read_text(encoding="utf-8")
    metadata_text = args.metadata.read_text(encoding="utf-8")
    known = existing_names(metadata_text)
    if not known:
        raise RuntimeError("could not parse existing catalog metadata")

    connection = sqlite3.connect(args.db)
    try:
        if connection.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise RuntimeError("catalog.db integrity_check failed")
        records = connection.execute(
            "SELECT id, name, row_json, ownership, first_seen, channel, evidence "
            "FROM companies ORDER BY sequence"
        ).fetchall()
        aliases = {
            company_id: [
                display
                for (display,) in connection.execute(
                    "SELECT display FROM aliases WHERE company_id=? ORDER BY key",
                    (company_id,),
                )
                if display != name
            ]
            for company_id, name, *_ in records
        }
    finally:
        connection.close()

    private_patterns = (
        re.compile(r"\b1[3-9]\d{9}\b"),
        re.compile(r"[A-Za-z0-9._%+-]+@uni\.sydney\.edu\.au", re.IGNORECASE),
        re.compile(r"(?:街|路|巷)\d+号(?:\d+号楼)?"),
    )
    new_rows: list[list[str]] = []
    new_metadata: list[list[object]] = []

    for company_id, name, row_json, ownership, first_seen, channel, evidence in records:
        if name in known:
            continue
        if any(pattern.search(row_json) for pattern in private_patterns):
            raise RuntimeError(f"private profile text detected in public catalog row: {name}")
        row = json.loads(row_json)
        new_rows.append(row)
        new_metadata.append(
            [
                name,
                {
                    "ownership": ownership,
                    "aliases": aliases[company_id],
                    "firstSeenDate": first_seen,
                    "channel": channel,
                    "channelEvidence": evidence,
                },
            ]
        )

    if not new_rows:
        print("catalog already up to date")
        return

    additions_end = additions_text.rfind("];")
    if additions_end < 0:
        raise RuntimeError("catalog additions terminator not found")
    previous_row_end = additions_text.rfind("]", 0, additions_end)
    additions_text = (
        additions_text[: previous_row_end + 1]
        + ","
        + additions_text[previous_row_end + 1 :]
    )
    additions_end += 1
    row_block = "\n  // Synced from the verified public catalog; personal progress remains local.\n"
    row_block += "".join(f"  {compact(row)},\n" for row in new_rows)
    additions_text = additions_text[:additions_end] + row_block + additions_text[additions_end:]

    metadata_end = metadata_text.rfind("]);")
    if metadata_end < 0:
        raise RuntimeError("catalog metadata terminator not found")
    previous_meta_end = metadata_text.rfind("]", 0, metadata_end)
    metadata_text = (
        metadata_text[: previous_meta_end + 1]
        + ","
        + metadata_text[previous_meta_end + 1 :]
    )
    metadata_end += 1
    meta_block = "\n  // Synced public metadata; no application status is included.\n"
    meta_block += "".join(f"  {compact(entry)},\n" for entry in new_metadata)
    metadata_text = metadata_text[:metadata_end] + meta_block + metadata_text[metadata_end:]

    args.additions.write_text(additions_text, encoding="utf-8", newline="\n")
    args.metadata.write_text(metadata_text, encoding="utf-8", newline="\n")
    print(
        json.dumps(
            {
                "existing_companies": len(known),
                "companies_appended": len(new_rows),
                "result_companies": len(known) + len(new_rows),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
