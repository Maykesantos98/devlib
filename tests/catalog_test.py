import json
import unittest
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "catalog.json"


class CatalogData(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    def test_catalog_has_expected_schema_and_total(self):
        self.assertEqual(self.catalog["schemaVersion"], 1)
        self.assertEqual(len(self.catalog["items"]), 154)
        required = {"name", "url", "description", "category", "kinds", "tone", "tags"}
        for item in self.catalog["items"]:
            self.assertTrue(required.issubset(item), item.get("name", "item sem nome"))
            self.assertTrue(item["url"].startswith("https://"), item["url"])
            self.assertTrue(item["name"].strip())
            self.assertTrue(item["description"].strip())

    def test_names_and_urls_are_unique(self):
        names = [item["name"].casefold() for item in self.catalog["items"]]
        urls = [item["url"].rstrip("/").casefold() for item in self.catalog["items"]]
        self.assertEqual(len(names), len(set(names)))
        self.assertEqual(len(urls), len(set(urls)))

    def test_gsap_is_available_in_interface_catalog(self):
        matches = [item for item in self.catalog["items"] if item["name"] == "GSAP"]
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["url"], "https://gsap.com/")
        self.assertEqual(matches[0]["category"], "interface")

    def test_repository_batch_is_curated_without_project_duplicates(self):
        expected = {
            "Strix": "https://github.com/usestrix/strix",
            "Grill Me": "https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me",
            "Three.js": "https://threejs.org/",
            "Anime.js": "https://animejs.com/",
            "Motion": "https://motion.dev/",
            "Book to Skill": "https://github.com/virgiliojr94/book-to-skill",
            "Design DNA": "https://github.com/zanwei/design-dna",
            "Motion Design Skill": "https://github.com/lottiefiles/motion-design-skill",
        }
        found = {item["name"]: item["url"] for item in self.catalog["items"] if item["name"] in expected}
        self.assertEqual(found, expected)

    def test_platform_and_agent_batch_is_curated_without_duplicates(self):
        expected = {
            "GitHub Spec Kit": "https://github.com/github/spec-kit",
            "Claude SEO": "https://claude-seo.md/",
            "Shannon": "https://github.com/KeygraphHQ/shannon",
            "Huashu Design": "https://github.com/alchaincyf/huashu-design",
            "Taste Skill": "https://www.tasteskill.dev/",
            "Coolify": "https://coolify.io/",
            "OpenHands": "https://www.openhands.dev/",
            "Maxun": "https://github.com/getmaxun/maxun",
            "Open WebUI": "https://github.com/open-webui/open-webui",
            "Browser Use": "https://github.com/browser-use/browser-use",
            "Langflow": "https://www.langflow.org/",
            "Stirling PDF": "https://github.com/Stirling-Tools/Stirling-PDF",
            "Crawl4AI": "https://github.com/unclecode/crawl4AI",
            "Dify": "https://dify.ai/",
            "WAHA": "https://waha.devlike.pro/",
        }
        found = {item["name"]: item["url"] for item in self.catalog["items"] if item["name"] in expected}
        self.assertEqual(found, expected)

    def test_declared_category_counts_match_items(self):
        actual = Counter(item["category"] for item in self.catalog["items"])
        self.assertEqual(actual, Counter(self.catalog["categoryCounts"]))

    def test_generated_html_is_in_sync(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("<!-- CATALOG:GENERATED:START -->", html)
        self.assertIn("<!-- CATALOG:GENERATED:END -->", html)
        self.assertEqual(html.count('class="card-title"'), 154)
        for item in self.catalog["items"]:
            self.assertIn(f'>{item["name"]}</h3>', html)
            self.assertIn(f'href="{item["url"]}"', html)


if __name__ == "__main__":
    unittest.main(verbosity=2)
