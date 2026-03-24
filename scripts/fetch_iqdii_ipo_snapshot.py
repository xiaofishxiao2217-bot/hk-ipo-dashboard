#!/usr/bin/env python3
import json
import pathlib
import subprocess
import sys
from datetime import datetime


BASE_URL = "http://ft.iqdii.com/Ctrl/eIPOHnd/r=c?dataType=table&pagesize={pagesize}&pageindex={pageindex}"
PAGE_SIZE = 50


def fetch_page(pageindex: int) -> dict:
    cmd = [
        "curl",
        "-sS",
        "-X",
        "POST",
        BASE_URL.format(pagesize=PAGE_SIZE, pageindex=pageindex),
        "-d",
        "meth=GETIPOLIST",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def parse_pageinfo(pageinfo: str) -> tuple[int, int, int]:
    total, pages, current = pageinfo.split("-")
    return int(total), int(pages), int(current)


def build_snapshot() -> dict:
    first_page = fetch_page(1)
    total, pages, _ = parse_pageinfo(first_page["pageinfo"])
    records = list(first_page.get("data", []))

    for pageindex in range(2, pages + 1):
        page = fetch_page(pageindex)
        records.extend(page.get("data", []))

    return {
        "generatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": "iqdii",
        "total": total,
        "records": records,
    }


def write_snapshot(snapshot: dict, target: pathlib.Path) -> None:
    payload = "window.iqdiiIpoSnapshot = " + json.dumps(snapshot, ensure_ascii=False, indent=2) + ";\n"
    target.write_text(payload, encoding="utf-8")


def main() -> int:
    root = pathlib.Path(__file__).resolve().parents[1]
    target = root / "ipo-live.js"

    try:
        snapshot = build_snapshot()
    except subprocess.CalledProcessError as exc:
        print(exc.stderr or exc.stdout or str(exc), file=sys.stderr)
        return 1
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1

    write_snapshot(snapshot, target)
    print(f"Wrote {len(snapshot['records'])} IPO records to {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
