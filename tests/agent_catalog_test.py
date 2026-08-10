"""Contract tests for the public AI API and grounded recommendation engine."""

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from agent.catalog_core import get_library, list_categories, recommend_stack, search_catalog


class AgentCatalogTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = json.loads((ROOT / "data/catalog.json").read_text(encoding="utf-8"))
        cls.public = json.loads((ROOT / "api/catalog.json").read_text(encoding="utf-8"))
        cls.names = {item["name"] for item in cls.source["items"]}

    def test_public_api_contains_every_item_without_html_markup(self):
        self.assertEqual(133, len(self.public["items"]))
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

    def test_categories_and_openapi_contract(self):
        self.assertEqual(133, sum(row["count"] for row in list_categories()))
        spec = json.loads((ROOT / "api/openapi.json").read_text(encoding="utf-8"))
        self.assertEqual("3.1.0", spec["openapi"])
        self.assertIn("/api/catalog.json", spec["paths"])

    def test_agent_discovery_files_exist(self):
        llms = (ROOT / "llms.txt").read_text(encoding="utf-8")
        self.assertIn("/api/catalog.json", llms)
        self.assertIn("/mcp", llms)


if __name__ == "__main__":
    unittest.main()
