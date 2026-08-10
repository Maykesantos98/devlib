"""Contract tests for the public AI API and grounded recommendation engine."""

import json
import sys
import unittest
from unittest.mock import patch
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from agent.catalog_core import explain_concept, get_library, list_categories, recommend_stack, search_catalog
from agent.nvidia_intent import classify_intent


class AgentCatalogTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = json.loads((ROOT / "data/catalog.json").read_text(encoding="utf-8"))
        cls.public = json.loads((ROOT / "api/catalog.json").read_text(encoding="utf-8"))
        cls.names = {item["name"] for item in cls.source["items"]}

    def test_public_api_contains_every_item_without_html_markup(self):
        self.assertEqual(173, len(self.public["items"]))
        self.assertTrue(all("markup" not in item for item in self.public["items"]))

    def test_search_and_lookup_are_grounded(self):
        results = search_catalog("agentes MCP", limit=8)
        self.assertTrue(results)
        self.assertTrue(all(item["name"] in self.names for item in results))
        self.assertEqual(results[0]["name"], get_library(results[0]["name"])["name"])

    def test_recommendation_only_uses_catalog_and_explains_choices(self):
        result = recommend_stack("SaaS com agentes, Next.js, Postgres e segurança", limit=10)
        self.assertTrue(result["recommendations"])
        self.assertTrue(all(row["name"] in self.names and row["reason"] for row in result["recommendations"]))

    def test_fullstack_recommendation_covers_requested_layers_without_noise(self):
        result = recommend_stack("SaaS Next.js com agentes, PostgreSQL, testes e segurança", limit=10)
        layers = {row["layer"] for row in result["recommendations"]}
        self.assertTrue({"frontend", "backend", "database", "testing", "security", "agents"}.issubset(layers))
        self.assertNotIn("AgenticTrading", {row["name"] for row in result["recommendations"]})
        self.assertNotIn("Ali Imam Components", [row["name"] for row in result["recommendations"][:3]])
        self.assertEqual([], result["missing_layers"])

    def test_fullstack_blueprint_is_deep_actionable_and_links_repositories(self):
        result = recommend_stack("Quero criar uma plataforma web completa", limit=15)
        recommendations = result["recommendations"]
        frontend = [row for row in recommendations if row["layer"] == "frontend"]

        self.assertGreaterEqual(len(recommendations), 10)
        self.assertGreaterEqual(len(frontend), 2)
        self.assertTrue(all(row["url"].startswith("https://github.com/") for row in recommendations))
        self.assertTrue(all(row["role"] and row["reason"] and row["adoption"] in {"principal", "complementar"} for row in recommendations))
        self.assertTrue(result["architecture"])
        self.assertTrue(result["implementation_steps"])
        self.assertTrue(result["alternatives"])
        self.assertIn("frontend", result["alternatives"])

    def test_devops_uses_catalog_operations_tools_not_generic_directory(self):
        result = recommend_stack("preciso de DevOps, CI e observabilidade", limit=5)
        names = {row["name"] for row in result["recommendations"]}
        self.assertNotIn("free-for-dev", names)
        self.assertTrue(names & {"Renovate", "OpenTelemetry JS", "Grafana"})

    def test_plain_business_words_do_not_trigger_ai_agents(self):
        result = recommend_stack("Quero uma landing page simples para uma confeitaria")
        self.assertNotIn("agents", result["requested_layers"])
        self.assertNotIn("Claude Code", {row["name"] for row in result["recommendations"]})
        self.assertIn("frontend", result["requested_layers"])

    def test_complex_saas_analysis_covers_explicit_requirements_and_tradeoffs(self):
        result = recommend_stack(
            "SaaS B2B multi-tenant com Next.js, PostgreSQL, filas, pagamentos "
            "recorrentes, RBAC, auditoria, observabilidade, testes e deploy na VPS"
        )
        requirements = {row["id"]: row for row in result["requirements"]}
        for requirement in {"multi_tenancy", "queues", "payments", "authorization", "audit", "observability"}:
            self.assertIn(requirement, requirements)
        self.assertIn("security", result["requested_layers"])
        self.assertTrue(result["summary"])
        self.assertTrue(result["tradeoffs"])
        self.assertTrue(result["risks"])
        self.assertTrue(result["next_questions"])
        self.assertTrue(all(row["reason"] != f'Cobre a camada {row["layer"]} solicitada no projeto.' for row in result["recommendations"]))

    def test_mobile_offline_project_gets_supporting_architecture_not_one_card(self):
        result = recommend_stack(
            "Aplicativo mobile offline-first para técnicos de campo, com sincronização, "
            "fotos, mapas, autenticação e notificações push"
        )
        self.assertTrue({"mobile", "backend", "database", "security"}.issubset(result["requested_layers"]))
        requirement_ids = {row["id"] for row in result["requirements"]}
        self.assertTrue({"offline", "sync", "media", "maps", "authentication", "notifications"}.issubset(requirement_ids))
        self.assertGreaterEqual(len(result["recommendations"]), 4)

    def test_concepts_are_explained_with_grounded_sources(self):
        mcp = explain_concept("o que é MCP")
        self.assertEqual("mcp", mcp["concept"])
        self.assertIn("Model Context Protocol", mcp["answer"])
        self.assertTrue(all(source["name"] in self.names for source in mcp["sources"]))
        skills = explain_concept("onde encontro skills para agentes")
        self.assertEqual("skills", skills["concept"])
        self.assertEqual("skills.sh", skills["sources"][0]["name"])

    def test_search_ignores_portuguese_stopwords_and_uses_exact_tokens(self):
        names = [row["name"] for row in search_catalog("backend API PostgreSQL", limit=5)]
        self.assertIn("Supabase", names[:3])
        self.assertNotIn("MediaPipe", names)

    def test_nvidia_intent_is_optional_validated_and_has_local_fallback(self):
        self.assertEqual([], classify_intent("um SaaS", api_key=""))
        with patch("agent.nvidia_intent._request", return_value='{"layers":["frontend","database","invalid"]}'):
            self.assertEqual(["frontend", "database"], classify_intent("um SaaS", api_key="test"))
        with patch("agent.nvidia_intent._request", side_effect=TimeoutError):
            self.assertEqual([], classify_intent("um SaaS", api_key="test"))

    def test_categories_and_openapi_contract(self):
        self.assertEqual(173, sum(row["count"] for row in list_categories()))
        spec = json.loads((ROOT / "api/openapi.json").read_text(encoding="utf-8"))
        self.assertEqual("3.1.0", spec["openapi"])
        self.assertIn("/api/catalog.json", spec["paths"])

    def test_agent_discovery_files_exist(self):
        llms = (ROOT / "llms.txt").read_text(encoding="utf-8")
        self.assertIn("/api/catalog.json", llms)
        self.assertIn("/mcp", llms)


if __name__ == "__main__":
    unittest.main()
