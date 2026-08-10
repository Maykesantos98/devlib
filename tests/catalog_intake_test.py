import unittest

from scripts.catalog_intake import IntakeError, collect_urls


class CatalogIntakeTest(unittest.TestCase):
    def test_collects_unique_https_urls_and_normalizes_trailing_slash(self):
        urls = collect_urls(
            "https://github.com/example/new/\nhttps://github.com/example/new\n",
            {"https://github.com/example/already"},
        )
        self.assertEqual(urls, ["https://github.com/example/new"])

    def test_rejects_invalid_and_existing_urls(self):
        with self.assertRaises(IntakeError):
            collect_urls(
                "http://insecure.example\nhttps://github.com/example/already",
                {"https://github.com/example/already"},
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
