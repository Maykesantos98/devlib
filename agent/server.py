"""Remote DEVLIB MCP server (Streamable HTTP).

Sem `from __future__ import annotations`: o FastMCP inspeciona as anotações dos tools
em tempo de execução com `issubclass`, e anotações adiadas viram string e quebram o boot.
"""

import os
import time
from collections import defaultdict, deque

import uvicorn
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from agent.catalog_core import catalog_total, explain_concept, get_library, list_categories, recommend_stack, search_catalog
from agent.rest_api import ApiInputError, explain_payload, recommend_payload, search_payload

PORT = int(os.getenv("PORT", "8000"))

mcp = FastMCP(
    "DEVLIB",
    instructions="Consulte o catálogo antes de escolher dependências. Nunca invente itens ausentes.",
    host="0.0.0.0",
    port=PORT,
    json_response=True,
    stateless_http=True,
    # O catálogo é público e somente leitura, e o container só recebe tráfego do Caddy,
    # que já vincula o site ao domínio publicado — a validação de Host aqui seria redundante.
    # A proteção de DNS rebinding defende um servidor que o atacante não alcança sozinho;
    # como este é público, ela só bloquearia clientes MCP de navegador, que enviam Origin
    # próprio e não são cobertos pelo wildcard de porta aceito pelo SDK.
    transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False),
)


@mcp.tool()
def search_devlib(query: str, category: str | None = None, limit: int = 10) -> list[dict]:
    """Busca ferramentas reais do catálogo DEVLIB por necessidade e categoria."""
    return search_catalog(query, category, limit)


@mcp.tool()
def inspect_library(name: str) -> dict | None:
    """Retorna os metadados e URL de uma biblioteca do catálogo."""
    return get_library(name)


@mcp.tool()
def catalog_categories() -> list[dict]:
    """Lista todas as categorias disponíveis e suas quantidades."""
    return list_categories()


@mcp.tool()
def recommend_project_stack(project_description: str, limit: int = 10) -> dict:
    """Monta uma seleção explicada usando exclusivamente o catálogo DEVLIB."""
    return recommend_stack(project_description, limit)


@mcp.tool()
def explain_dev_concept(question: str) -> dict:
    """Explica MCP, skills e outros conceitos usando fontes existentes no DEVLIB."""
    return explain_concept(question)


class RateLimiter:
    """Janela deslizante por IP, já que o endpoint é aberto e não tem credencial.

    O Caddy padrão não traz módulo de rate limit, então o controle fica no ASGI.
    """

    # O health check fica de fora: um monitor que recebesse 429 reportaria queda falsa,
    # e a rota só devolve uma contagem já carregada em memória.
    exempt_paths = ("/v1/healthz",)

    def __init__(self, app, limit: int, window: float, costly_limit: int, costly_paths: tuple[str, ...]) -> None:
        self.app = app
        self.limit = limit
        self.window = window
        self.costly_limit = costly_limit
        self.costly_paths = costly_paths
        self.hits: dict[tuple[str, bool], deque[float]] = defaultdict(deque)
        self.swept = 0.0

    @staticmethod
    def client(scope) -> str:
        for raw_name, raw_value in scope.get("headers", ()):
            if raw_name == b"x-forwarded-for":
                # O Caddy anexa o peer real ao final; o que vem antes é enviado pelo
                # cliente e pode ser forjado, então só a última entrada é confiável.
                return raw_value.decode("latin-1").rsplit(",", 1)[-1].strip()
        client = scope.get("client")
        return client[0] if client else "unknown"

    def sweep(self, now: float) -> None:
        if now - self.swept < self.window:
            return
        self.swept = now
        for key in [key for key, seen in self.hits.items() if not seen or now - seen[-1] > self.window]:
            del self.hits[key]

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        path = scope.get("path", "")
        if path in self.exempt_paths:
            await self.app(scope, receive, send)
            return
        costly = path.startswith(self.costly_paths)
        limit = self.costly_limit if costly else self.limit
        now = time.monotonic()
        seen = self.hits[(self.client(scope), costly)]
        while seen and now - seen[0] > self.window:
            seen.popleft()
        if len(seen) >= limit:
            retry = max(1, int(self.window - (now - seen[0])) + 1)
            response = JSONResponse(
                {"error": f"Limite de {limit} requisições por {int(self.window)}s excedido."},
                status_code=429,
                headers={"Retry-After": str(retry), "Access-Control-Allow-Origin": "*"},
            )
            await response(scope, receive, send)
            return
        seen.append(now)
        self.sweep(now)
        await self.app(scope, receive, send)


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "catalog": catalog_total()})


async def recommend(request: Request) -> JSONResponse:
    try:
        if int(request.headers.get("content-length", "0") or 0) > 4096:
            raise ApiInputError("Corpo excede 4 KiB.")
        return JSONResponse(recommend_payload(await request.json()))
    except ApiInputError as error:
        return JSONResponse({"error": str(error)}, status_code=400)
    except Exception:
        return JSONResponse({"error": "JSON inválido."}, status_code=400)


async def search(request: Request) -> JSONResponse:
    try:
        return JSONResponse(search_payload(request.query_params.get("q", ""), int(request.query_params.get("limit", "10"))))
    except (ApiInputError, ValueError) as error:
        return JSONResponse({"error": str(error)}, status_code=400)


async def explain(request: Request) -> JSONResponse:
    try:
        return JSONResponse(explain_payload(request.query_params.get("q", "")))
    except ApiInputError as error:
        return JSONResponse({"error": str(error)}, status_code=400)


def build_app():
    app = mcp.streamable_http_app()
    app.routes.extend([
        Route("/v1/healthz", health),
        Route("/v1/recommend", recommend, methods=["POST"]),
        Route("/v1/search", search),
        Route("/v1/explain", explain),
    ])
    return RateLimiter(
        app,
        limit=int(os.getenv("DEVLIB_RATE_LIMIT", "120")),
        window=float(os.getenv("DEVLIB_RATE_WINDOW", "60")),
        costly_limit=int(os.getenv("DEVLIB_RATE_LIMIT_RECOMMEND", "20")),
        costly_paths=("/v1/recommend",),
    )


if __name__ == "__main__":
    uvicorn.run(build_app(), host="0.0.0.0", port=PORT, log_level="info")
