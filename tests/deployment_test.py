import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class VpsDeploymentContract(unittest.TestCase):
    def test_container_is_pinned_unprivileged_and_healthchecked(self):
        dockerfile = (ROOT / "Dockerfile").read_text(encoding="utf-8")
        self.assertRegex(dockerfile, r"FROM nginxinc/nginx-unprivileged:\d+\.\d+\.\d+-alpine")
        self.assertIn("HEALTHCHECK", dockerfile)
        self.assertIn("/healthz", dockerfile)
        self.assertNotIn("COPY . ", dockerfile)

    def test_nginx_has_security_cache_and_compression(self):
        config = (ROOT / "deploy" / "nginx.conf").read_text(encoding="utf-8")
        headers = (ROOT / "deploy" / "security-headers.conf").read_text(encoding="utf-8")
        for expected in (
            "listen 8080",
            "gzip on",
            "Content-Security-Policy",
            "X-Content-Type-Options",
            "Referrer-Policy",
            "Permissions-Policy",
            "Cache-Control",
            "location = /healthz",
        ):
            self.assertIn(expected, config + headers)
        self.assertGreaterEqual(
            config.count("include /etc/nginx/snippets/security-headers.conf;"),
            4,
        )

    def test_compose_drops_privileges_and_defines_health(self):
        compose = (ROOT / "compose.yml").read_text(encoding="utf-8")
        for expected in ("read_only: true", "no-new-privileges:true", "cap_drop:", "healthcheck:"):
            self.assertIn(expected, compose)

    def test_tmpfs_entries_are_not_unquoted_flow_sequences(self):
        compose = (ROOT / "compose.yml").read_text(encoding="utf-8")
        self.assertNotRegex(compose, r"tmpfs:\s*\[[^\"']*?,")

    def test_production_overlay_has_automatic_tls_proxy(self):
        overlay = (ROOT / "compose.prod.yml").read_text(encoding="utf-8")
        caddy = (ROOT / "deploy" / "Caddyfile").read_text(encoding="utf-8")
        self.assertIn("caddy:", overlay)
        self.assertIn("DEVLIB_DOMAIN", caddy)
        self.assertIn("reverse_proxy devlib:8080", caddy)

    def test_agent_surface_is_reachable_without_credentials(self):
        caddy = (ROOT / "deploy" / "Caddyfile").read_text(encoding="utf-8")
        overlay = (ROOT / "compose.prod.yml").read_text(encoding="utf-8")
        example = (ROOT / ".env.vps.example").read_text(encoding="utf-8")
        self.assertNotIn("basic_auth", caddy)
        self.assertIn("reverse_proxy agent:8000", caddy)
        # A senha deixou de existir: nenhum arquivo pode voltar a exigi-la no boot.
        for source in (caddy, overlay, example):
            self.assertNotIn("DEVLIB_MCP_PASSWORD_HASH", source)

    def test_agent_surface_answers_cross_origin_callers(self):
        caddy = (ROOT / "deploy" / "Caddyfile").read_text(encoding="utf-8")
        self.assertIn('Access-Control-Allow-Origin "*"', caddy)
        self.assertIn("Access-Control-Allow-Headers", caddy)
        self.assertIn("Mcp-Session-Id", caddy)
        self.assertIn("method OPTIONS", caddy)
        self.assertIn("respond @preflight 204", caddy)
        self.assertIn("path /mcp* /api/* /llms.txt", caddy)
        # Fora de um route o Caddy ordena `respond` depois de `handle`, e o preflight
        # chega ao upstream como OPTIONS: 405 em vez de 204, quebrando clientes web.
        self.assertIn("route {", caddy)
        self.assertLess(caddy.index("respond @preflight"), caddy.index("handle /mcp*"))
        self.assertLess(caddy.index("route {"), caddy.index("respond @preflight"))

    def test_open_endpoint_is_rate_limited_per_client(self):
        server = (ROOT / "agent" / "server.py").read_text(encoding="utf-8")
        self.assertIn("class RateLimiter", server)
        self.assertIn("status_code=429", server)
        self.assertIn("Retry-After", server)
        self.assertIn("x-forwarded-for", server)
        self.assertIn("DEVLIB_RATE_LIMIT", server)

    def test_operations_runbook_covers_deploy_and_rollback(self):
        runbook = (ROOT / "deploy" / "VPS.md").read_text(encoding="utf-8").casefold()
        for term in ("pré-requisitos", "deploy", "healthcheck", "logs", "rollback", "backup"):
            self.assertIn(term, runbook)


if __name__ == "__main__":
    unittest.main(verbosity=2)
