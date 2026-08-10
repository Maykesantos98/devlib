"""Contract tests for the public Stack Advisor REST surface."""

import asyncio
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from agent.rest_api import ApiInputError, recommend_payload
from agent.server import RateLimiter


def drive(limiter, path="/mcp", forwarded=None, calls=1):
    """Roda o middleware como ASGI puro e devolve o status de cada chamada."""
    headers = [(b"host", b"devlib.example")]
    if forwarded is not None:
        headers.append((b"x-forwarded-for", forwarded.encode()))
    statuses = []

    async def downstream(scope, receive, send):
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b"{}"})

    async def run():
        for _ in range(calls):
            captured = {}

            async def send(message):
                if message["type"] == "http.response.start":
                    captured["status"] = message["status"]
                    captured["headers"] = message["headers"]
                elif message["type"] == "http.response.body":
                    captured.setdefault("body", b"")
                    captured["body"] += message.get("body", b"")

            limiter.app = downstream
            await limiter({"type": "http", "path": path, "headers": headers, "client": ("10.0.0.9", 1)}, None, send)
            statuses.append(captured)

    asyncio.run(run())
    return statuses


class RateLimiterTest(unittest.TestCase):
    def limiter(self, limit=3, costly_limit=2):
        return RateLimiter(None, limit=limit, window=60.0, costly_limit=costly_limit, costly_paths=("/v1/recommend",))

    def test_requests_under_the_limit_reach_the_application(self):
        results = drive(self.limiter(), calls=3)
        self.assertEqual([200, 200, 200], [row["status"] for row in results])

    def test_excess_requests_get_429_with_retry_after_and_cors(self):
        blocked = drive(self.limiter(), calls=4)[-1]
        self.assertEqual(429, blocked["status"])
        headers = {name.decode().lower(): value.decode() for name, value in blocked["headers"]}
        self.assertIn("retry-after", headers)
        self.assertEqual("*", headers["access-control-allow-origin"])
        self.assertIn("error", json.loads(blocked["body"]))

    def test_costly_endpoint_has_its_own_stricter_budget(self):
        limiter = self.limiter()
        self.assertEqual([200, 200, 429], [row["status"] for row in drive(limiter, path="/v1/recommend", calls=3)])
        # O orçamento apertado do /v1/recommend não pode consumir o das rotas baratas.
        self.assertEqual([200, 200, 200], [row["status"] for row in drive(limiter, path="/mcp", calls=3)])

    def test_health_check_never_gets_throttled(self):
        limiter = self.limiter(limit=1)
        statuses = [row["status"] for row in drive(limiter, path="/v1/healthz", calls=5)]
        self.assertEqual([200] * 5, statuses)

    def test_client_identity_uses_the_proxy_appended_address_not_the_forged_one(self):
        limiter = self.limiter()
        # O Caddy anexa o peer real ao final; a primeira entrada é enviada pelo cliente.
        drive(limiter, forwarded="1.1.1.1, 203.0.113.7", calls=3)
        # Trocar apenas a parte forjada não deve renovar o orçamento do mesmo IP real.
        self.assertEqual(429, drive(limiter, forwarded="2.2.2.2, 203.0.113.7")[0]["status"])
        self.assertEqual(200, drive(limiter, forwarded="1.1.1.1, 198.51.100.4")[0]["status"])


class RestApiTest(unittest.TestCase):
    def test_recommendation_is_grounded_and_layered(self):
        result = recommend_payload({"project": "SaaS Next.js com Postgres, testes e segurança"})
        self.assertEqual("local", result["engine"])
        self.assertTrue(result["recommendations"])
        self.assertTrue(all(row["name"] and row["url"].startswith("https://") for row in result["recommendations"]))
        self.assertEqual("2", result["schema_version"])
        self.assertTrue(result["summary"])
        self.assertIn("requirements", result)
        self.assertIn("tradeoffs", result)
        self.assertIn("risks", result)
        self.assertIn("next_questions", result)

    def test_request_rejects_empty_oversized_and_unknown_fields(self):
        for payload in ({}, {"project": ""}, {"project": "x" * 2001}, {"project": "site", "token": "secret"}):
            with self.subTest(payload=list(payload)):
                with self.assertRaises(ApiInputError):
                    recommend_payload(payload)


if __name__ == "__main__":
    unittest.main()
