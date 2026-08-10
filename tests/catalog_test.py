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
        self.assertEqual(len(self.catalog["items"]), 134)
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

    def test_declared_category_counts_match_items(self):
        actual = Counter(item["category"] for item in self.catalog["items"])
        self.assertEqual(actual, Counter(self.catalog["categoryCounts"]))

    def test_generated_html_is_in_sync(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("<!-- CATALOG:GENERATED:START -->", html)
        self.assertIn("<!-- CATALOG:GENERATED:END -->", html)
        self.assertEqual(html.count('class="card-title"'), 134)
        for item in self.catalog["items"]:
            self.assertIn(f'>{item["name"]}</h3>', html)
            self.assertIn(f'href="{item["url"]}"', html)


if __name__ == "__main__":
    unittest.main(verbosity=2)
