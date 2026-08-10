"""Deterministic product-quality evals for the Stack Advisor."""

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from agent.catalog_core import recommend_stack


CASES = [
    {
        "id": "landing-small-business",
        "prompt": "Landing page rápida e acessível para uma confeitaria, com SEO e formulário de contato",
        "layers": {"frontend", "testing", "security"},
        "forbidden": {"agents", "mobile"},
        "requirements": {"seo", "accessibility"},
        "min_recommendations": 3,
    },
    {
        "id": "saas-b2b",
        "prompt": "SaaS B2B multi-tenant com pagamentos recorrentes, RBAC, auditoria, filas, observabilidade e testes",
        "layers": {"frontend", "backend", "database", "testing", "security", "devops"},
        "forbidden": {"agents", "mobile"},
        "requirements": {"multi_tenancy", "payments", "authorization", "audit", "queues", "observability"},
        "min_recommendations": 6,
    },
    {
        "id": "field-mobile",
        "prompt": "App mobile offline-first para técnicos com fotos, mapas, login, sincronização e push",
        "layers": {"mobile", "backend", "database", "security"},
        "forbidden": {"agents"},
        "requirements": {"offline", "media", "maps", "authentication", "sync", "notifications"},
        "min_recommendations": 4,
    },
    {
        "id": "financial-api",
        "prompt": "API financeira com PostgreSQL, Redis, idempotência, alta disponibilidade, tracing, segurança e disaster recovery",
        "layers": {"backend", "database", "security", "devops"},
        "forbidden": {"agents", "mobile", "frontend"},
        "requirements": {"cache", "reliability", "observability"},
        "min_recommendations": 4,
    },
    {
        "id": "ecommerce",
        "prompt": "E-commerce com catálogo, busca, estoque, checkout, pagamentos, login, SEO e painel administrativo",
        "layers": {"frontend", "backend", "database", "testing", "security"},
        "forbidden": {"agents", "mobile"},
        "requirements": {"payments", "authentication", "search", "inventory", "seo"},
        "min_recommendations": 5,
    },
    {
        "id": "rag-assistant",
        "prompt": "Assistente de IA com RAG, embeddings, banco vetorial, API, autenticação, avaliações e observabilidade",
        "layers": {"agents", "backend", "database", "testing", "security", "devops"},
        "forbidden": {"mobile"},
        "requirements": {"rag", "vector_search", "authentication", "observability"},
        "min_recommendations": 6,
    },
    {
        "id": "realtime-collaboration",
        "prompt": "Editor colaborativo em tempo real com presença, conflitos, notificações, histórico e testes E2E",
        "layers": {"frontend", "backend", "database", "testing", "security"},
        "forbidden": {"agents", "mobile"},
        "requirements": {"realtime", "sync", "notifications", "audit"},
        "min_recommendations": 5,
    },
    {
        "id": "python-cli",
        "prompt": "CLI Python para automatizar backups, validar arquivos e enviar alertas; sem interface web",
        "layers": {"backend", "testing", "devops"},
        "forbidden": {"frontend", "agents", "mobile"},
        "requirements": {"automation", "reliability"},
        "min_recommendations": 3,
    },
    {
        "id": "admin-dashboard",
        "prompt": "Dashboard administrativo com RBAC, login, auditoria, PostgreSQL, exportação e testes",
        "layers": {"frontend", "backend", "database", "testing", "security"},
        "forbidden": {"agents", "mobile"},
        "requirements": {"authorization", "authentication", "audit", "exports"},
        "min_recommendations": 5,
    },
    {
        "id": "data-pipeline",
        "prompt": "Pipeline de dados agendado com ingestão, filas, retries, PostgreSQL, métricas, alertas e testes",
        "layers": {"backend", "database", "testing", "devops"},
        "forbidden": {"frontend", "agents", "mobile"},
        "requirements": {"data_pipeline", "queues", "retries", "observability"},
        "min_recommendations": 4,
    },
]


class AdvisorQualityEval(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        catalog = json.loads((ROOT / "data/catalog.json").read_text(encoding="utf-8"))
        cls.catalog_names = {item["name"] for item in catalog["items"]}

    def test_quality_matrix_scores_100_percent(self):
        failures = []
        for case in CASES:
            result = recommend_stack(case["prompt"], use_ai=False)
            layers = set(result["requested_layers"])
            requirements = {row["id"] for row in result["requirements"]}
            recommendations = result["recommendations"]
            checks = {
                "required_layers": case["layers"] <= layers,
                "forbidden_layers": not (case["forbidden"] & layers),
                "requirements": case["requirements"] <= requirements,
                "recommendation_count": len(recommendations) >= case["min_recommendations"],
                "grounded": all(row["name"] in self.catalog_names for row in recommendations),
                "specific_reasons": all("Cobre a camada" not in row["reason"] for row in recommendations),
                "decision_support": bool(result["tradeoffs"] and result["risks"] and result["next_questions"]),
                "no_missing_layers": not result["missing_layers"],
            }
            failed = [name for name, passed in checks.items() if not passed]
            if failed:
                failures.append(f"{case['id']}: {', '.join(failed)}")
        self.assertEqual([], failures, "\n" + "\n".join(failures))


if __name__ == "__main__":
    unittest.main(verbosity=2)
