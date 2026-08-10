"""Grounded catalog operations shared by tests and the MCP server."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from agent.nvidia_intent import classify_intent

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "catalog.json"
STOPWORDS = {"a", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "o", "os", "para", "por", "que", "um", "uma"}
LAYER_RULES = {
    "frontend": ({"frontend", "front-end", "ui", "interface", "dashboard", "landing page", "site", "next.js", "react"}, ["Next.js", "frontend-design", "Square UI"]),
    "backend": ({"backend", "back-end", "api", "server", "servidor"}, ["Hono", "Fastify", "Supabase"]),
    "database": ({"database", "banco", "postgres", "postgresql", "sql", "dados"}, ["Supabase", "Drizzle ORM", "Prisma"]),
    "testing": ({"test", "tests", "teste", "testes", "e2e", "qualidade"}, ["Playwright", "Vitest", "Sentry"]),
    "security": ({"security", "seguranca", "auth", "autenticacao", "autorizacao", "rbac", "secrets", "appsec"}, ["Gitleaks", "OWASP Cheat Sheet Series", "Better Auth"]),
    "agents": ({"agent", "agents", "agente", "agentes", "ia", "ai", "llm"}, ["OpenAI Agents SDK", "Claude Code", "Continue.dev"]),
    "mcp": ({"mcp", "model context protocol"}, ["MCP Specification", "MCP Inspector", "Playwright MCP"]),
    "skills": ({"skill", "skills"}, ["skills.sh", "Superpowers", "everything-claude-code"]),
    "mobile": ({"mobile", "android", "ios", "expo", "react native"}, ["Expo", "React Native", "Capacitor"]),
    "devops": ({"deploy", "devops", "docker", "vps", "infra", "ci", "cd", "observabilidade"}, ["Renovate", "OpenTelemetry JS", "Grafana"]),
}

REQUIREMENT_RULES = {
    "multi_tenancy": ({"multi-tenant", "multitenant", "multi tenant"}, "isolamento entre clientes", {"backend", "database", "security"}),
    "queues": ({"fila", "filas", "queue", "queues", "assincrono"}, "processamento assíncrono", {"backend", "devops"}),
    "payments": ({"pagamento", "pagamentos", "assinatura", "recorrente", "billing", "checkout"}, "pagamentos e cobrança", {"backend", "security"}),
    "authorization": ({"rbac", "permissao", "permissoes", "autorizacao", "roles"}, "autorização por papéis", {"backend", "security"}),
    "audit": ({"auditoria", "audit", "trilha de auditoria"}, "trilha de auditoria", {"backend", "database", "security"}),
    "observability": ({"observabilidade", "metrics", "metricas", "tracing", "telemetria", "logs"}, "métricas, logs e tracing", {"devops"}),
    "offline": ({"offline", "offline-first"}, "operação sem conexão", {"mobile", "database"}),
    "sync": ({"sincronizacao", "sincronizar", "sync"}, "sincronização e resolução de conflitos", {"mobile", "backend", "database"}),
    "media": ({"foto", "fotos", "imagem", "imagens", "upload", "storage"}, "captura e armazenamento de mídia", {"mobile", "backend", "database"}),
    "maps": ({"mapa", "mapas", "geolocalizacao", "gps"}, "mapas e geolocalização", {"mobile"}),
    "authentication": ({"login", "auth", "autenticacao", "sso"}, "autenticação e sessões", {"backend", "security"}),
    "notifications": ({"notificacao", "notificacoes", "push"}, "notificações push", {"mobile", "backend"}),
    "cache": ({"redis", "cache"}, "cache e coordenação distribuída", {"backend", "devops"}),
    "reliability": ({"alta disponibilidade", "disaster recovery", "recuperacao de desastre", "idempotencia"}, "resiliência e recuperação", {"backend", "database", "devops"}),
}

ARCHITECTURE_ONLY = {"multi_tenancy", "queues", "payments", "authorization", "audit", "offline", "sync", "maps", "notifications", "reliability"}


def _catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def catalog_total() -> int:
    return len(_catalog()["items"])


def _plain(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return " ".join(re.findall(r"[a-z0-9+#.-]+", normalized.encode("ascii", "ignore").decode().lower()))


def _matches(normalized: str, signal: str) -> bool:
    wanted = _plain(signal)
    return bool(wanted and re.search(rf"(?<![a-z0-9]){re.escape(wanted)}(?![a-z0-9])", normalized))


def _detected_requirements(normalized: str) -> list[dict]:
    return [
        {"id": key, "label": label, "layers": sorted(layers)}
        for key, (signals, label, layers) in REQUIREMENT_RULES.items()
        if any(_matches(normalized, signal) for signal in signals)
    ]


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


def recommend_stack(project: str, limit: int = 10, use_ai: bool = True) -> dict:
    """Compose a project stack by requested architectural layers."""
    normalized = _plain(project)
    requirements = _detected_requirements(normalized)
    requested = [layer for layer, (signals, _) in LAYER_RULES.items() if any(_matches(normalized, signal) for signal in signals)]
    if any(_matches(normalized, signal) for signal in {"saas", "plataforma", "marketplace"}):
        requested.extend(layer for layer in ("frontend", "backend", "database", "testing", "security") if layer not in requested)
    if "mobile" in requested:
        requested.extend(layer for layer in ("backend", "database", "security") if layer not in requested)
    for requirement in requirements:
        requested.extend(layer for layer in requirement["layers"] if layer not in requested)
    for layer in classify_intent(project) if use_ai else []:
        if layer not in requested:
            requested.append(layer)
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
            related = [row["label"] for row in requirements if layer in row["layers"]]
            fallback = {
                "frontend": "interface, acessibilidade e experiência do usuário",
                "backend": "regras de negócio e APIs",
                "database": "persistência e evolução do modelo de dados",
                "testing": "regressões nos fluxos críticos",
                "security": "controles de segurança desde o início",
                "mobile": "entrega nativa para iOS e Android",
                "devops": "operação e evolução contínua",
                "agents": "orquestração de recursos inteligentes",
                "mcp": "integração padronizada com ferramentas",
                "skills": "fluxos reutilizáveis para agentes",
            }
            purpose = ", ".join(related[:2]) or fallback.get(layer, f"necessidades de {layer}")
            selected.append({**_public(choice), "layer": layer, "reason": f"{choice['name']} foi priorizado para {purpose}."})
    missing = [layer for layer in requested if layer not in {row["layer"] for row in selected}]
    selected_layers = {row["layer"] for row in selected}
    for requirement in requirements:
        requirement["coverage"] = "architecture_decision" if requirement["id"] in ARCHITECTURE_ONLY else (
            "covered" if set(requirement["layers"]) & selected_layers else "gap"
        )
    architecture_labels = [row["label"] for row in requirements if row["coverage"] == "architecture_decision"]
    tradeoffs = ["A seleção prioriza ferramentas consolidadas do catálogo; valide custo, operação e lock-in antes de fechar a arquitetura."]
    if "database" in requested:
        tradeoffs.append("Supabase acelera a entrega com Postgres gerenciado; infraestrutura própria oferece mais controle, mas aumenta a carga operacional.")
    if "mobile" in requested:
        tradeoffs.append("Expo reduz a complexidade de entrega mobile; requisitos nativos específicos podem exigir módulos próprios ou React Native sem managed workflow.")
    risks = []
    if architecture_labels:
        risks.append("Exigem desenho específico além da escolha de bibliotecas: " + ", ".join(architecture_labels) + ".")
    if "security" in requested:
        risks.append("Autenticação, autorização, secrets e auditoria precisam de threat model e testes; uma ferramenta isolada não garante segurança.")
    if "devops" in requested:
        risks.append("Defina SLOs, alertas, backups e procedimento de rollback antes da produção.")
    requirement_ids = {row["id"] for row in requirements}
    questions = []
    if "multi_tenancy" in requirement_ids:
        questions.append("O isolamento entre clientes será por linha, schema ou banco dedicado?")
    if "mobile" in requested:
        questions.append("Quais dados devem funcionar offline e como conflitos de sincronização serão resolvidos?")
    if "payments" in requirement_ids:
        questions.append("Quais países, moedas, impostos e eventos de cobrança precisam ser suportados?")
    if not questions:
        questions.append("Qual é a escala esperada, o prazo e a experiência da equipe com esta stack?")
    return {
        "schema_version": "2",
        "project": project,
        "intent": "project_stack",
        "summary": f"Arquitetura inicial com {len(selected)} escolhas em {len(selected_layers)} camadas, cobrindo {len(requirements)} requisitos explícitos.",
        "requested_layers": requested,
        "missing_layers": missing,
        "requirements": requirements,
        "tradeoffs": tradeoffs,
        "risks": risks,
        "next_questions": questions,
        "policy": "Somente itens existentes no catálogo DEVLIB; lacunas arquiteturais são declaradas, não inventadas.",
        "recommendations": selected,
    }


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
