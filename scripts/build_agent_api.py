"""Generate public, machine-readable DEVLIB API artifacts."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def render() -> dict[str, str]:
    source = json.loads((ROOT / "data/catalog.json").read_text(encoding="utf-8"))
    items = [{k: v for k, v in item.items() if k != "markup"} for item in source["items"]]
    catalog = {"schemaVersion": 1, "total": len(items), "categoryCounts": source["categoryCounts"], "items": items}
    categories = {"total": len(source["chapters"]), "categories": [{"id": c["id"], "count": source["categoryCounts"][c["id"]]} for c in source["chapters"]]}
    openapi = {"openapi": "3.1.0", "info": {"title": "DEVLIB Catalog API", "version": "1.0.0"}, "paths": {
        "/api/catalog.json": {"get": {"summary": "Catálogo completo para agentes", "responses": {"200": {"description": "133 recursos DEVLIB"}}}},
        "/api/categories.json": {"get": {"summary": "Categorias e totais", "responses": {"200": {"description": "Categorias"}}}},
        "/llms.txt": {"get": {"summary": "Instruções de descoberta para LLMs", "responses": {"200": {"description": "Guia"}}}},
        "/mcp": {"post": {"summary": "MCP Streamable HTTP", "responses": {"200": {"description": "Resposta MCP"}}}}
        ,"/api/ai/recommend": {"post": {"summary": "Recomenda stack fundamentada", "responses": {"200": {"description": "Stack por camadas"}, "400": {"description": "Entrada inválida"}}}}
        ,"/api/ai/search": {"get": {"summary": "Busca dinâmica no catálogo", "responses": {"200": {"description": "Resultados"}}}}
        ,"/api/ai/explain": {"get": {"summary": "Explica conceitos com fontes", "responses": {"200": {"description": "Explicação fundamentada"}}}}
    }}
    return {"api/catalog.json": json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", "api/categories.json": json.dumps(categories, ensure_ascii=False, indent=2) + "\n", "api/openapi.json": json.dumps(openapi, ensure_ascii=False, indent=2) + "\n"}


def main() -> None:
    import sys
    files = render()
    if "--check" in sys.argv:
        stale = [name for name, content in files.items() if not (ROOT / name).exists() or (ROOT / name).read_text(encoding="utf-8") != content]
        if stale:
            raise SystemExit("API desatualizada: " + ", ".join(stale))
        print("Agent API: synchronized")
        return
    for name, content in files.items():
        path = ROOT / name
        path.parent.mkdir(exist_ok=True)
        path.write_text(content, encoding="utf-8")
    print("Agent API: generated")


if __name__ == "__main__":
    main()
