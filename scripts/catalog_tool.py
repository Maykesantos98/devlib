"""Bootstrap, render and validate DEVLIB's static catalog.

The JSON file is the editable source of truth. `build` materializes semantic
HTML so the catalog remains searchable and useful without JavaScript.
"""

from __future__ import annotations

import argparse
import html
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "index.html"
DATA_PATH = ROOT / "data" / "catalog.json"
START = "      <!-- CATALOG:GENERATED:START -->"
END = "      <!-- CATALOG:GENERATED:END -->"
ARTICLE_RE = re.compile(r"<article\b[^>]*\bclass=\"card[^\"]*\"[^>]*>.*?</article>", re.S)
CHAPTER_RE = re.compile(r'<div class="chapter-bar"\s+data-chapter="([^"]+)"', re.S)


def text_content(markup: str) -> str:
    value = re.sub(r"<[^>]+>", " ", markup)
    return " ".join(html.unescape(value).split())


def capture(pattern: str, markup: str, default: str = "") -> str:
    match = re.search(pattern, markup, re.S)
    return html.unescape(match.group(1)).strip() if match else default


def parse_item(markup: str, category: str) -> dict:
    opening = markup.split(">", 1)[0]
    classes = capture(r'class="([^"]+)"', opening).split()
    kinds = capture(r'data-kind="([^"]+)"', opening).split()
    tags_markup = capture(r'<div class="card-tags">(.*?)</div>', markup)
    tags = [text_content(value) for value in re.findall(r"<span>(.*?)</span>", tags_markup, re.S)]
    return {
        "name": text_content(capture(r'<h3 class="card-title">(.*?)</h3>', markup)),
        "url": capture(r'<a class="card-link" href="([^"]+)"', markup),
        "description": text_content(capture(r'<p class="card-body">(.*?)</p>', markup)),
        "category": category,
        "kinds": kinds,
        "tone": capture(r'data-tone="([^"]+)"', opening),
        "tags": tags,
        "layout": [value for value in classes if value != "card"],
        "markup": markup.strip(),
    }


def bootstrap() -> None:
    source = HTML_PATH.read_text(encoding="utf-8")
    region_start = source.index("      <!-- §01 KIT -->")
    region_end = source.index('      <div class="empty hidden"', region_start)
    region = source[region_start:region_end]
    chapter_matches = list(CHAPTER_RE.finditer(region))
    chapters = []
    items = []

    for index, match in enumerate(chapter_matches):
        segment_start = region.rfind("      <!--", 0, match.start())
        segment_end = chapter_matches[index + 1].start() if index + 1 < len(chapter_matches) else len(region)
        if index + 1 < len(chapter_matches):
            segment_end = region.rfind("      <!--", 0, segment_end)
        segment = region[segment_start:segment_end]
        bento_at = segment.index('      <div class="bento">')
        header_markup = segment[:bento_at].strip()
        category = match.group(1)
        chapter_items = [parse_item(value.group(0), category) for value in ARTICLE_RE.finditer(segment[bento_at:])]
        chapters.append({"id": category, "headerMarkup": header_markup})
        items.extend(chapter_items)

    payload = {
        "schemaVersion": 1,
        "categoryCounts": dict(Counter(item["category"] for item in items)),
        "chapters": chapters,
        "items": items,
    }
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    render(payload, source, region_start, region_end)


def generated_region(payload: dict) -> str:
    grouped = {chapter["id"]: [] for chapter in payload["chapters"]}
    for item in payload["items"]:
        grouped[item["category"]].append(item)

    chunks = [START]
    for chapter in payload["chapters"]:
        chunks.append(chapter["headerMarkup"])
        chunks.append('      <div class="bento">')
        for item in grouped[chapter["id"]]:
            chunks.append("        " + item["markup"].replace("\n", "\n        "))
        chunks.append("      </div>")
        chunks.append("")
    chunks.append(END)
    return "\n".join(chunks) + "\n\n"


def render(payload: dict, source: str | None = None, start: int | None = None, end: int | None = None) -> None:
    source = source if source is not None else HTML_PATH.read_text(encoding="utf-8")
    if start is None or end is None:
        start = source.index(START)
        end = source.index(END, start) + len(END)
        while end < len(source) and source[end] in "\r\n":
            end += 1
    HTML_PATH.write_text(source[:start] + generated_region(payload) + source[end:], encoding="utf-8")


def load() -> dict:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def check() -> None:
    payload = load()
    expected = generated_region(payload).strip()
    source = HTML_PATH.read_text(encoding="utf-8")
    actual = source[source.index(START):source.index(END) + len(END)].strip()
    if actual != expected:
        raise SystemExit("Catalog HTML is out of sync. Run: python scripts/catalog_tool.py build")
    if len(payload["items"]) != sum(payload["categoryCounts"].values()):
        raise SystemExit("categoryCounts does not match catalog items")
    print(f"catalog ok: {len(payload['items'])} items")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("bootstrap", "build", "check"))
    args = parser.parse_args()
    if args.command == "bootstrap":
        bootstrap()
    elif args.command == "build":
        render(load())
    else:
        check()


if __name__ == "__main__":
    main()
