import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class StaticProductionContract(unittest.TestCase):
    def test_agent_hub_documents_api_and_supported_clients(self):
        hub = (ROOT / "integracoes.html").read_text(encoding="utf-8")
        self.assertIn("Claude Code", hub)
        self.assertIn("Codex", hub)
        self.assertIn("/api/catalog.json", hub)
        self.assertIn("/mcp", hub)
        self.assertIn("data-copy", hub)
        self.assertIn('href="integracoes.html"', (ROOT / "index.html").read_text(encoding="utf-8"))

    def test_home_hero_uses_product_focused_message(self):
        home = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("A stack certa", home)
        self.assertIn("para cada ideia.", home)
        self.assertNotIn("que</span> <span class=\"word\">viram produto", home)

    @classmethod
    def setUpClass(cls):
        cls.pages = {
            name: (ROOT / name).read_text(encoding="utf-8")
            for name in ("index.html", "jogos.html")
        }

    def test_runtime_resources_are_local_and_deferred(self):
        for name, markup in self.pages.items():
            styles = re.findall(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"', markup)
            scripts = re.findall(r"<script\s+([^>]+)></script>", markup)
            self.assertTrue(styles, name)
            self.assertTrue(all(not value.startswith("http") for value in styles), name)
            for attributes in scripts:
                source = re.search(r'src="([^"]+)"', attributes)
                if source:
                    self.assertFalse(source.group(1).startswith("http"), (name, source.group(1)))
                    self.assertIn("defer", attributes, (name, source.group(1)))

    def test_pages_define_static_content_security_policy(self):
        for name, markup in self.pages.items():
            match = re.search(
                r'<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"',
                markup,
            )
            self.assertIsNotNone(match, name)
            policy = match.group(1)
            for directive in ("default-src 'self'", "object-src 'none'", "base-uri 'self'"):
                self.assertIn(directive, policy, name)

    def test_catalog_exposes_structured_collection_metadata(self):
        markup = self.pages["index.html"]
        self.assertIn('itemscope itemtype="https://schema.org/CollectionPage"', markup)
        self.assertIn('itemprop="numberOfItems" content="133"', markup)
        self.assertIn('itemprop="name" content="DEVLIB"', markup)

    def test_images_reserve_layout_space(self):
        for name, markup in self.pages.items():
            for image in re.findall(r"<img\b[^>]+>", markup):
                self.assertRegex(image, r'\bwidth="\d+"', (name, image))
                self.assertRegex(image, r'\bheight="\d+"', (name, image))

    def test_internal_fragments_resolve(self):
        for name, markup in self.pages.items():
            ids = set(re.findall(r'\bid="([^"]+)"', markup))
            for fragment in re.findall(r'href="#([^"]+)"', markup):
                self.assertIn(fragment, ids, (name, fragment))

    def test_external_tabs_are_isolated(self):
        for name, markup in self.pages.items():
            external_tabs = re.findall(r'<a\b[^>]*href="https://[^"]+"[^>]*target="_blank"[^>]*>', markup)
            for anchor in external_tabs:
                rel = re.search(r'rel="([^"]+)"', anchor)
                self.assertIsNotNone(rel, (name, anchor))
                tokens = set(rel.group(1).split())
                self.assertTrue({"noopener", "noreferrer"}.issubset(tokens), (name, anchor))

    def test_quality_pipeline_covers_all_local_checks(self):
        workflow = (ROOT / ".github" / "workflows" / "quality.yml").read_text(encoding="utf-8")
        for command in (
            "python scripts/catalog_tool.py check",
            "python tests/catalog_test.py",
            "python tests/production_test.py",
            "python tests/deployment_test.py",
            "python tests/site.spec.py",
        ):
            self.assertIn(command, workflow)
        self.assertTrue((ROOT / "scripts" / "check_links.py").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
