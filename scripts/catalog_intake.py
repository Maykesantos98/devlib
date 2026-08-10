"""Queue large URL batches before catalog enrichment and publication."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "catalog.json"
QUEUE_PATH = ROOT / "data" / "catalog-intake.json"
HTTPS_URL_RE = re.compile(r"https://[^\s<>()\[\]{}]+")


class IntakeError(ValueError):
    pass


def normalize_url(value: str) -> str:
    value = value.strip().rstrip(".,;)")
    parsed = urlsplit(value)
    if parsed.scheme != "https" or not parsed.netloc:
        raise IntakeError(f"URL inválida ou sem HTTPS: {value}")
    return urlunsplit(("https", parsed.netloc.casefold(), parsed.path.rstrip("/"), parsed.query, ""))


def collect_urls(text: str, existing: set[str]) -> list[str]:
    candidates = HTTPS_URL_RE.findall(text)
    insecure = re.findall(r"http://[^\s<>()\[\]{}]+", text)
    normalized_existing = {normalize_url(url) for url in existing}
    accepted: list[str] = []
    rejected = [f"HTTPS obrigatório: {url}" for url in insecure]
    seen: set[str] = set()
    for candidate in candidates:
        url = normalize_url(candidate)
        if url in seen:
            continue
        seen.add(url)
        if url in normalized_existing:
            rejected.append(f"Já catalogada ou enfileirada: {url}")
        else:
            accepted.append(url)
    if not candidates and not insecure:
        rejected.append("Nenhuma URL encontrada.")
    if rejected:
        raise IntakeError("\n".join(rejected))
    return accepted


def load_json(path: Path, fallback: object) -> object:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else fallback


def main() -> None:
    parser = argparse.ArgumentParser(description="Fila de entrada de repositórios DEVLIB")
    parser.add_argument("source", type=Path, help="Arquivo de texto com URLs HTTPS")
    args = parser.parse_args()
    catalog = load_json(CATALOG_PATH, {"items": []})
    queue = load_json(QUEUE_PATH, {"schemaVersion": 1, "items": []})
    existing = {item["url"] for item in catalog["items"]} | {item["url"] for item in queue["items"]}
    urls = collect_urls(args.source.read_text(encoding="utf-8"), existing)
    queue["items"].extend({"url": url, "status": "pending"} for url in urls)
    QUEUE_PATH.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"intake ok: {len(urls)} novas URLs; {len(queue['items'])} pendentes")


if __name__ == "__main__":
    main()
