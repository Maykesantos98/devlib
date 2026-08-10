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
    "frontend": ({"frontend", "front-end", "ui", "interface", "dashboard", "landing page", "site", "next.js", "react"}, ["Next.js", "Tailwind CSS", "shadcn/ui"]),
    "backend": ({"backend", "back-end", "api", "server", "servidor"}, ["Hono", "Fastify", "Supabase"]),
    "database": ({"database", "banco", "postgres", "postgresql", "sql", "dados"}, ["Supabase", "Drizzle ORM", "Prisma"]),
    "testing": ({"test", "tests", "teste", "testes", "e2e", "qualidade", "avaliacao", "avaliacoes"}, ["Playwright", "Vitest", "Sentry"]),
    "security": ({"security", "seguranca", "auth", "autenticacao", "autorizacao", "rbac", "secrets", "appsec"}, ["Better Auth", "Gitleaks", "OWASP Cheat Sheet Series"]),
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
    "audit": ({"auditoria", "audit", "trilha de auditoria", "historico"}, "trilha de auditoria", {"backend", "database", "security"}),
    "observability": ({"observabilidade", "metrics", "metricas", "tracing", "telemetria", "logs"}, "métricas, logs e tracing", {"devops"}),
    "offline": ({"offline", "offline-first"}, "operação sem conexão", {"mobile", "database"}),
    "sync": ({"sincronizacao", "sincronizar", "sync", "conflito", "conflitos"}, "sincronização e resolução de conflitos", {"backend", "database"}),
    "media": ({"foto", "fotos", "imagem", "imagens", "upload", "storage"}, "captura e armazenamento de mídia", {"mobile", "backend", "database"}),
    "maps": ({"mapa", "mapas", "geolocalizacao", "gps"}, "mapas e geolocalização", {"mobile"}),
    "authentication": ({"login", "auth", "autenticacao", "sso"}, "autenticação e sessões", {"backend", "security"}),
    "notifications": ({"notificacao", "notificacoes", "push"}, "notificações", {"backend"}),
    "cache": ({"redis", "cache"}, "cache e coordenação distribuída", {"backend", "devops"}),
    "reliability": ({"alta disponibilidade", "disaster recovery", "recuperacao de desastre", "idempotencia", "backup", "backups"}, "resiliência e recuperação", {"backend", "database", "devops"}),
    "seo": ({"seo", "buscadores", "search engine optimization"}, "descoberta orgânica e metadados", {"frontend"}),
    "accessibility": ({"acessibilidade", "acessivel", "wcag", "a11y"}, "acessibilidade da interface", {"frontend", "testing"}),
    "search": ({"busca", "pesquisa", "search"}, "busca e indexação", {"frontend", "backend", "database"}),
    "inventory": ({"estoque", "inventario", "inventory"}, "consistência de estoque", {"backend", "database"}),
    "rag": ({"rag", "retrieval augmented generation"}, "recuperação aumentada por geração", {"agents", "backend", "database"}),
    "vector_search": ({"vetorial", "vector", "embeddings", "embedding"}, "busca vetorial e embeddings", {"agents", "database"}),
    "realtime": ({"tempo real", "realtime", "websocket", "presenca"}, "colaboração em tempo real", {"frontend", "backend", "database", "security"}),
    "automation": ({"automatizar", "automacao", "agendado", "scheduler", "cron"}, "automação operacional", {"backend", "devops"}),
    "exports": ({"exportacao", "exportar", "csv", "relatorio"}, "exportação de dados", {"backend", "database"}),
    "data_pipeline": ({"pipeline de dados", "ingestao", "etl", "elt"}, "pipeline e ingestão de dados", {"backend", "database", "devops"}),
    "retries": ({"retry", "retries", "retentativa", "retentativas"}, "retentativas e tolerância a falhas", {"backend", "devops"}),
}

ARCHITECTURE_ONLY = {
    "multi_tenancy", "queues", "payments", "authorization", "audit", "offline", "sync", "maps",
    "notifications", "reliability", "seo", "accessibility", "search", "inventory", "rag",
    "vector_search", "realtime", "automation", "exports", "data_pipeline", "retries",
}

PRODUCT_PROFILES = (
    ({"landing page", "site institucional", "portfolio"}, ("frontend", "testing", "security")),
    ({"e-commerce", "ecommerce", "loja virtual"}, ("frontend", "backend", "database", "testing", "security")),
    ({"saas", "plataforma", "marketplace"}, ("frontend", "backend", "database", "testing", "security")),
    ({"cli", "linha de comando"}, ("backend", "testing", "devops")),
)

LAYER_ROLES = {
    "frontend": ("framework da aplicação e renderização", "estilização responsiva e design system"),
    "backend": ("API, validação e regras de negócio", "alternativa de servidor para serviços especializados"),
    "database": ("PostgreSQL gerenciado e serviços de dados", "schema tipado, consultas e migrations"),
    "testing": ("testes E2E dos fluxos críticos", "testes unitários e de integração"),
    "security": ("autenticação, sessões e controle de acesso", "detecção de segredos no repositório e CI"),
    "agents": ("orquestração do agente e tool calling", "assistência no fluxo de desenvolvimento"),
    "mcp": ("contrato de integração MCP", "validação e depuração do servidor MCP"),
    "skills": ("descoberta de capacidades reutilizáveis", "workflow complementar para agentes"),
    "mobile": ("aplicação iOS e Android", "camada e componentes nativos compartilhados"),
    "devops": ("automação de dependências e entrega", "observabilidade de produção"),
}

IMPLEMENTATION_ORDER = {
    "database": "Modele entidades, constraints, índices, migrations e políticas de acesso.",
    "backend": "Defina contratos da API, validação, erros, autenticação e regras de negócio.",
    "frontend": "Implemente os fluxos prioritários, estados de loading/erro/vazio e acessibilidade.",
    "mobile": "Implemente navegação, armazenamento seguro e sincronização com a API.",
    "agents": "Defina tools, limites, saída estruturada, avaliações e fallback determinístico.",
    "mcp": "Exponha tools pequenas, validadas, autenticadas e observáveis.",
    "skills": "Versione instruções, exemplos e critérios de aceitação.",
    "security": "Execute threat model, secret scanning e testes de autorização antes de publicar.",
    "testing": "Cubra regras com testes unitários e os caminhos críticos com E2E.",
    "devops": "Automatize build, migrações, health checks, observabilidade e rollback.",
}


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
    for signals, layers in PRODUCT_PROFILES:
        if any(_matches(normalized, signal) for signal in signals):
            requested.extend(layer for layer in layers if layer not in requested)
    if "mobile" in requested:
        requested.extend(layer for layer in ("backend", "database", "security") if layer not in requested)
    for requirement in requirements:
        requested.extend(layer for layer in requirement["layers"] if layer not in requested)
    if any(_matches(normalized, phrase) for phrase in {"sem interface web", "sem frontend", "sem interface grafica"}):
        requested = [layer for layer in requested if layer != "frontend"]
    for layer in classify_intent(project) if use_ai else []:
        if layer not in requested:
            requested.append(layer)
    if "database" in requested and "backend" not in requested:
        requested.insert(requested.index("database"), "backend")
    if not requested:
        requested = ["frontend", "backend", "testing", "security"]
    catalog = {item["name"].lower(): item for item in _catalog()["items"]}
    selected, used = [], set()
    layer_candidates = {}
    for layer in requested:
        signals, preferred = LAYER_RULES[layer]
        candidates = [catalog[name.lower()] for name in preferred if name.lower() in catalog]
        candidates += [item for item in search_catalog(" ".join(signals), limit=30) if item["name"] not in {x["name"] for x in candidates}]
        layer_candidates[layer] = [item for item in candidates if item["url"].startswith("https://github.com/")]
    for index in range(2):
        for layer in requested:
            if len(selected) >= limit:
                break
            choice = next((item for item in layer_candidates[layer][index:] if item["name"] not in used), None)
            if not choice:
                continue
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
            roles = LAYER_ROLES.get(layer, (f"base da camada {layer}", f"suporte da camada {layer}"))
            role = roles[min(index, len(roles) - 1)]
            adoption = "principal" if index == 0 else "complementar"
            selected.append({
                **_public(choice),
                "layer": layer,
                "role": role,
                "adoption": adoption,
                "reason": f"Use {choice['name']} como escolha {adoption} para {role}; atende {purpose}.",
            })
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
    alternatives = {}
    for layer in requested:
        _, preferred = LAYER_RULES[layer]
        rows = [_public(catalog[name.lower()]) for name in preferred if name.lower() in catalog and name not in used]
        if rows:
            alternatives[layer] = rows[:2]
    architecture = [
        {
            "layer": layer,
            "decision": next((row["name"] for row in selected if row["layer"] == layer and row["adoption"] == "principal"), "Decisão pendente"),
            "responsibility": LAYER_ROLES.get(layer, (f"Responsabilidades de {layer}",))[0],
        }
        for layer in requested
    ]
    implementation_steps = [
        {"order": index + 1, "layer": layer, "action": IMPLEMENTATION_ORDER[layer]}
        for index, layer in enumerate(IMPLEMENTATION_ORDER)
        if layer in requested
    ]
    explicit = f"{len(requirements)} requisitos explícitos" if requirements else "as premissas técnicas iniciais; detalhe funcionalidades para uma análise ainda mais precisa"
    return {
        "schema_version": "2",
        "project": project,
        "intent": "project_stack",
        "summary": f"Blueprint com {len(selected)} repositórios verificados em {len(selected_layers)} camadas, cobrindo {explicit}.",
        "requested_layers": requested,
        "missing_layers": missing,
        "requirements": requirements,
        "tradeoffs": tradeoffs,
        "risks": risks,
        "next_questions": questions,
        "architecture": architecture,
        "implementation_steps": implementation_steps,
        "alternatives": alternatives,
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
