"""Contract tests for the public Stack Advisor REST surface."""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from agent.rest_api import ApiInputError, recommend_payload


class RestApiTest(unittest.TestCase):
    def test_recommendation_is_grounded_and_layered(self):
        result = recommend_payload({"project": "SaaS Next.js com Postgres, testes e segurança"})
        self.assertEqual("local", result["engine"])
        self.assertTrue(result["recommendations"])
        self.assertTrue(all(row["name"] and row["url"].startswith("https://") for row in result["recommendations"]))

    def test_request_rejects_empty_oversized_and_unknown_fields(self):
        for payload in ({}, {"project": ""}, {"project": "x" * 2001}, {"project": "site", "token": "secret"}):
            with self.subTest(payload=list(payload)):
                with self.assertRaises(ApiInputError):
                    recommend_payload(payload)


if __name__ == "__main__":
    unittest.main()
