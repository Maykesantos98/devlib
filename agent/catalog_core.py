"""Grounded catalog operations shared by tests and the MCP server."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "catalog.json"
STOPWORDS = {"a", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "o", "os", "para", "por", "que", "um", "uma"}
LAYER_RULES = {
    "frontend": ({"frontend", "front-end", "ui", "interface", "dashboard", "next.js", "react"}, ["Next.js", "frontend-design", "Square UI"]),
    "backend": ({"backend", "back-end", "api", "server", "servidor"}, ["Hono", "Fastify", "Supabase"]),
    "database": ({"database", "banco", "postgres", "postgresql", "sql", "dados"}, ["Supabase", "Drizzle ORM", "Prisma"]),
    "testing": ({"test", "tests", "teste", "testes", "e2e", "qualidade"}, ["Playwright", "Vitest", "Sentry"]),
    "security": ({"security", "seguranca", "seguran", "auth", "secrets", "appsec"}, ["Gitleaks", "OWASP Cheat Sheet Series", "Better Auth"]),
    "agents": ({"agent", "agents", "agente", "agentes", "ia", "ai"}, ["OpenAI Agents SDK", "Claude Code", "Continue.dev"]),
    "mcp": ({"mcp", "model context protocol"}, ["MCP Specification", "MCP Inspector", "Playwright MCP"]),
    "skills": ({"skill", "skills"}, ["skills.sh", "Superpowers", "everything-claude-code"]),
    "mobile": ({"mobile", "android", "ios", "expo", "react native"}, ["Expo", "React Native", "Capacitor"]),
    "devops": ({"deploy", "devops", "docker", "vps", "infra", "ci", "cd"}, ["Docker", "GitHub Actions", "Coolify"]),
}


def _catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def _plain(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return " ".join(re.findall(r"[a-z0-9+#.-]+", normalized.encode("ascii", "ignore").decode().lower()))


def _public(item: dict) -> dict:
    return {key: value for key, value in item.items() if key != "markup"}


def search_catalog(query: str, category: str | None = None, limit: int = 10) -> list[dict]:
    """Rank catalog entries by matching name, tags, kinds and description."""
    terms = set(_plain(query).split()) - STOPWORDS
    scored = []
    for item in _catalog()["items"]:
        if category and item["category"] != category:
            continue
        name = set(_plain(item["name"]).split())
        tags = set(_plain(" ".join(item.get("tags", []) + item.get("kinds", []))).split())
        description = set(_plain(item["description"]).split())
        score = sum(10 for term in terms if term in name)
        score += sum(5 for term in terms if term in tags)
        score += sum(1 for term in terms if term in description)
        if terms & {"postgres", "postgresql"} and item["name"] in {"Supabase", "Drizzle ORM", "Prisma"}:
            score += 25
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
    """Compose a project stack by requested architectural layers."""
    normalized = _plain(project)
    requested = [layer for layer, (signals, _) in LAYER_RULES.items() if any(signal in normalized for signal in signals)]
    if "database" in requested and "backend" not in requested:
        requested.insert(requested.index("database"), "backend")
    if not requested:
        requested = ["frontend", "backend", "testing", "security"]
    catalog = {item["name"].lower(): item for item in _catalog()["items"]}
    selected, used = [], set()
    for layer in requested:
        signals, preferred = LAYER_RULES[layer]
        candidates = [catalog[name.lower()] for name in preferred if name.lower() in catalog]
        candidates += [item for item in search_catalog(" ".join(signals), limit=30) if item["name"] not in {x["name"] for x in candidates}]
        choice = next((item for item in candidates if item["name"] not in used), None)
        if choice and len(selected) < limit:
            used.add(choice["name"])
            selected.append({**_public(choice), "layer": layer, "reason": f"Cobre a camada {layer} solicitada no projeto."})
    missing = [layer for layer in requested if layer not in {row["layer"] for row in selected}]
    return {"project": project, "intent": "project_stack", "requested_layers": requested, "missing_layers": missing, "policy": "Somente itens existentes no catálogo DEVLIB.", "recommendations": selected}


def explain_concept(question: str) -> dict:
    """Explain known catalog concepts and attach only catalog-backed sources."""
    normalized = _plain(question)
    if "mcp" in normalized or "model context protocol" in normalized:
        names = ["MCP Specification", "MCP Registry", "MCP Inspector"]
        concept = "mcp"
        answer = "MCP (Model Context Protocol) é um protocolo aberto que conecta agentes de IA a ferramentas, dados e serviços por uma interface padronizada."
    elif "skill" in normalized:
        names = ["skills.sh", "Superpowers", "everything-claude-code"]
        concept = "skills"
        answer = "Skills são instruções reutilizáveis que especializam agentes em tarefas e fluxos. O skills.sh é o catálogo indicado para descobri-las."
    else:
        return {"concept": "unknown", "answer": "Não há uma explicação curada para esse conceito; consulte a busca do catálogo.", "sources": search_catalog(question, limit=3)}
    sources = [get_library(name) for name in names]
    return {"concept": concept, "answer": answer, "sources": [source for source in sources if source]}
