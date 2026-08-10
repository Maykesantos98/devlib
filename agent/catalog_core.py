"""Grounded catalog operations shared by tests and the MCP server."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "catalog.json"


def _catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def _plain(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return " ".join(re.findall(r"[a-z0-9+#.-]+", normalized.encode("ascii", "ignore").decode().lower()))


def _public(item: dict) -> dict:
    return {key: value for key, value in item.items() if key != "markup"}


def search_catalog(query: str, category: str | None = None, limit: int = 10) -> list[dict]:
    """Rank catalog entries by matching name, tags, kinds and description."""
    terms = set(_plain(query).split())
    scored = []
    for item in _catalog()["items"]:
        if category and item["category"] != category:
            continue
        name = _plain(item["name"])
        tags = _plain(" ".join(item.get("tags", []) + item.get("kinds", [])))
        description = _plain(item["description"])
        score = sum(8 for term in terms if term in name)
        score += sum(4 for term in terms if term in tags)
        score += sum(1 for term in terms if term in description)
        if not terms or score:
            scored.append((score, item["name"].lower(), _public(item)))
    scored.sort(key=lambda row: (-row[0], row[1]))
    return [row[2] for row in scored[: max(1, min(limit, 50))]]


def get_library(name: str) -> dict | None:
    wanted = _plain(name)
    for item in _catalog()["items"]:
        if _plain(item["name"]) == wanted:
            return _public(item)
    matches = search_catalog(name, limit=1)
    return matches[0] if matches else None


def list_categories() -> list[dict]:
    data = _catalog()
    return [{"id": chapter["id"], "count": data["categoryCounts"][chapter["id"]]} for chapter in data["chapters"]]


def recommend_stack(project: str, limit: int = 10) -> dict:
    """Recommend only existing catalog entries and state the evidence used."""
    matches = search_catalog(project, limit=min(limit * 3, 50))
    selected = []
    seen_categories = set()
    for item in matches:
        if len(selected) >= limit:
            break
        if item["category"] not in seen_categories or len(selected) < max(3, limit // 2):
            evidence = [token for token in item.get("tags", []) + item.get("kinds", []) if _plain(token) in _plain(project)]
            selected.append({**item, "reason": f"Compatível por categoria {item['category']}" + (f" e sinais: {', '.join(evidence[:3])}" if evidence else ".")})
            seen_categories.add(item["category"])
    return {"project": project, "policy": "Somente itens existentes no catálogo DEVLIB.", "recommendations": selected}
