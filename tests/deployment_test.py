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

    def test_production_overlay_has_automatic_tls_proxy(self):
        overlay = (ROOT / "compose.prod.yml").read_text(encoding="utf-8")
        caddy = (ROOT / "deploy" / "Caddyfile").read_text(encoding="utf-8")
        self.assertIn("caddy:", overlay)
        self.assertIn("DEVLIB_DOMAIN", caddy)
        self.assertIn("reverse_proxy devlib:8080", caddy)

    def test_operations_runbook_covers_deploy_and_rollback(self):
        runbook = (ROOT / "deploy" / "VPS.md").read_text(encoding="utf-8").casefold()
        for term in ("pré-requisitos", "deploy", "healthcheck", "logs", "rollback", "backup"):
            self.assertIn(term, runbook)


if __name__ == "__main__":
    unittest.main(verbosity=2)
