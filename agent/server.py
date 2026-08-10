"""Remote DEVLIB MCP server (Streamable HTTP)."""

import os
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from agent.catalog_core import explain_concept, get_library, list_categories, recommend_stack, search_catalog

domain = os.getenv("DEVLIB_DOMAIN", "localhost")
mcp = FastMCP(
    "DEVLIB",
    instructions="Consulte o catálogo antes de escolher dependências. Nunca invente itens ausentes.",
    host="0.0.0.0",
    port=int(os.getenv("PORT", "8000")),
    json_response=True,
    stateless_http=True,
    transport_security=TransportSecuritySettings(
        allowed_hosts=[domain, f"{domain}:443", "localhost", "127.0.0.1:8000"],
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
    mcp.run(transport="streamable-http")
