"""Validate catalog URLs and optionally create a live HTTP audit report."""

from __future__ import annotations

import argparse
import json
import ssl
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "catalog.json"
REPORT = ROOT / "reports" / "link-audit.json"


def load_urls() -> list[str]:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    urls = [item["url"] for item in data["items"]]
    invalid = [url for url in urls if urlparse(url).scheme != "https" or not urlparse(url).netloc]
    if invalid:
        raise SystemExit(f"invalid catalog URLs: {invalid}")
    normalized = [url.rstrip("/").casefold() for url in urls]
    if len(normalized) != len(set(normalized)):
        raise SystemExit("duplicate catalog URLs")
    return urls


def probe(url: str, timeout: float) -> dict:
    headers = {"User-Agent": "DEVLIB-Link-Audit/1.0 (+https://github.com/Maykesantos98/devlib)"}
    request = urllib.request.Request(url, method="HEAD", headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout, context=ssl.create_default_context()) as response:
            return {"url": url, "status": response.status, "result": "reachable", "finalUrl": response.url}
    except urllib.error.HTTPError as error:
        if error.code not in {401, 403, 429}:
            try:
                fallback = urllib.request.Request(url, method="GET", headers={**headers, "Range": "bytes=0-1023"})
                with urllib.request.urlopen(fallback, timeout=timeout, context=ssl.create_default_context()) as response:
                    return {"url": url, "status": response.status, "result": "reachable", "finalUrl": response.url}
            except urllib.error.HTTPError as get_error:
                result = "blocked" if get_error.code in {401, 403, 429} else "http-error"
                return {"url": url, "status": get_error.code, "result": result, "finalUrl": get_error.url}
            except Exception as get_error:
                return {"url": url, "status": None, "result": "network-error", "error": type(get_error).__name__}
        return {"url": url, "status": error.code, "result": "blocked", "finalUrl": error.url}
    except Exception as error:  # Network/DNS/TLS failures belong in the report.
        return {"url": url, "status": None, "result": "network-error", "error": type(error).__name__}


def external_audit(urls: list[str], timeout: float, workers: int) -> None:
    results = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(probe, url, timeout): url for url in urls}
        for future in as_completed(futures):
            results.append(future.result())
    results.sort(key=lambda item: item["url"].casefold())
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "total": len(results),
        "summary": {
            result: sum(item["result"] == result for item in results)
            for result in ("reachable", "blocked", "http-error", "network-error")
        },
        "results": results,
    }
    REPORT.parent.mkdir(exist_ok=True)
    REPORT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload["summary"], ensure_ascii=False))
    print(f"report: {REPORT}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--external", action="store_true", help="Probe every URL and write reports/link-audit.json")
    parser.add_argument("--timeout", type=float, default=8.0)
    parser.add_argument("--workers", type=int, default=12)
    args = parser.parse_args()
    urls = load_urls()
    print(f"catalog links ok: {len(urls)} unique HTTPS URLs")
    if args.external:
        external_audit(urls, args.timeout, args.workers)


if __name__ == "__main__":
    main()
