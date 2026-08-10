"""Optional NVIDIA NIM intent classifier with strict output validation."""

import json
import os
import urllib.request

ALLOWED_LAYERS = {"frontend", "backend", "database", "testing", "security", "agents", "mcp", "skills", "mobile", "devops"}


def _request(payload: bytes, api_key: str) -> str:
    request = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=6) as response:
        result = json.load(response)
    return result["choices"][0]["message"]["content"]


def classify_intent(project: str, api_key: str | None = None) -> list[str]:
    """Return only allowlisted architecture layers; failure means local fallback."""
    key = api_key if api_key is not None else os.getenv("NVIDIA_API_KEY", "")
    if not key:
        return []
    body = {"model": os.getenv("NVIDIA_MODEL", "meta/llama-3.1-8b-instruct"), "temperature": 0, "max_tokens": 100, "messages": [
        {"role": "system", "content": "Classifique o projeto. Responda SOMENTE JSON: {\"layers\":[...]}. Valores permitidos: frontend, backend, database, testing, security, agents, mcp, skills, mobile, devops."},
        {"role": "user", "content": project[:2000]},
    ]}
    try:
        content = _request(json.dumps(body).encode("utf-8"), key)
        parsed = json.loads(content.strip().removeprefix("```json").removesuffix("```").strip())
        return [layer for layer in parsed.get("layers", []) if layer in ALLOWED_LAYERS]
    except (OSError, TimeoutError, ValueError, KeyError, TypeError):
        return []
