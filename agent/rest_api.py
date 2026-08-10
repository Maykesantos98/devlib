"""Validated public REST facade for the grounded DEVLIB engine."""

from __future__ import annotations

import os

from agent.catalog_core import explain_concept, recommend_stack, search_catalog


class ApiInputError(ValueError):
    pass


def _project(payload: object) -> str:
    if not isinstance(payload, dict) or set(payload) != {"project"}:
        raise ApiInputError("Envie somente o campo 'project'.")
    project = payload.get("project")
    if not isinstance(project, str) or not project.strip() or len(project) > 2000:
        raise ApiInputError("'project' deve conter entre 1 e 2000 caracteres.")
    return project.strip()


def recommend_payload(payload: object) -> dict:
    project = _project(payload)
    use_ai = os.getenv("NVIDIA_PUBLIC_ENABLED", "false").lower() == "true"
    return {"engine": "nvidia+local" if use_ai and os.getenv("NVIDIA_API_KEY") else "local", **recommend_stack(project, limit=10, use_ai=use_ai)}


def search_payload(query: str, limit: int = 10) -> dict:
    query = query.strip()
    if not query or len(query) > 300:
        raise ApiInputError("A busca deve conter entre 1 e 300 caracteres.")
    return {"query": query, "results": search_catalog(query, limit=max(1, min(limit, 20)))}


def explain_payload(question: str) -> dict:
    question = question.strip()
    if not question or len(question) > 500:
        raise ApiInputError("A pergunta deve conter entre 1 e 500 caracteres.")
    return explain_concept(question)
