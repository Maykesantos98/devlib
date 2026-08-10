"""Remote DEVLIB MCP server (Streamable HTTP)."""

import os
import uvicorn
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from agent.catalog_core import catalog_total, explain_concept, get_library, list_categories, recommend_stack, search_catalog
from agent.rest_api import ApiInputError, explain_payload, recommend_payload, search_payload

domain = os.getenv("DEVLIB_DOMAIN", "localhost")
mcp = FastMCP(
    "DEVLIB",
    instructions="Consulte o catálogo antes de escolher dependências. Nunca invente itens ausentes.",
    host="0.0.0.0",
    port=int(os.getenv("PORT", "8000")),
    json_response=True,
    stateless_http=True,
    transport_security=TransportSecuritySettings(
        allowed_hosts=[domain, f"{domain}:443", "localhost", "localhost:*", "127.0.0.1:*"],
        allowed_origins=[f"https://{domain}"],
    ),
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


if __name__ == "__main__":
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

    app = mcp.streamable_http_app()
    app.routes.extend([
        Route("/v1/healthz", health),
        Route("/v1/recommend", recommend, methods=["POST"]),
        Route("/v1/search", search),
        Route("/v1/explain", explain),
    ])
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")), log_level="info")
