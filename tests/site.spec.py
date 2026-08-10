import unittest

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:8099"


class DevlibJourneys(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def open_page(self, path="/", width=1440, height=900, reduced_motion="no-preference"):
        context = self.browser.new_context(
            viewport={"width": width, "height": height},
            reduced_motion=reduced_motion,
        )
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(f"{BASE_URL}{path}", wait_until="networkidle")
        return context, page, errors

    def test_home_has_complete_metadata_and_no_runtime_errors(self):
        context, page, errors = self.open_page()
        try:
            self.assertEqual(page.locator('link[rel="canonical"]').count(), 1)
            self.assertEqual(page.locator('meta[property="og:image"]').count(), 1)
            self.assertEqual(errors, [])
        finally:
            context.close()

    def test_search_reports_results_and_can_be_cleared(self):
        context, page, errors = self.open_page()
        try:
            search = page.get_by_role("searchbox", name="Buscar no acervo")
            search.fill("shadcn")
            page.wait_for_timeout(250)
            self.assertRegex(page.locator("#visibleCount").inner_text(), r"^[1-9]")
            self.assertTrue(page.get_by_role("button", name="Limpar busca").is_visible())
            page.get_by_role("button", name="Limpar busca").click()
            self.assertEqual(search.input_value(), "")
            self.assertEqual(errors, [])
        finally:
            context.close()

    def test_mobile_navigation_is_operable(self):
        context, page, errors = self.open_page(width=390, height=844)
        try:
            menu = page.get_by_role("button", name="Abrir menu")
            self.assertTrue(menu.is_visible())
            menu.click()
            self.assertTrue(page.locator(".nav-menu").is_visible())
            self.assertEqual(menu.get_attribute("aria-expanded"), "true")
            page.keyboard.press("Escape")
            self.assertEqual(menu.get_attribute("aria-expanded"), "false")
            self.assertEqual(errors, [])
        finally:
            context.close()

    def test_gsap_is_progressive_and_reduced_motion_is_respected(self):
        context, page, errors = self.open_page(reduced_motion="reduce")
        try:
            self.assertTrue(page.locator("html").get_attribute("class") is not None)
            self.assertTrue(page.locator("html").evaluate("el => el.classList.contains('reduced-motion')"))
            self.assertEqual(page.locator(".card").first.evaluate("el => getComputedStyle(el).opacity"), "1")
            self.assertEqual(errors, [])
        finally:
            context.close()

    def test_arcade_and_catalog_links_are_reachable(self):
        context, page, errors = self.open_page("/jogos.html")
        try:
            self.assertEqual(page.locator("h1").count(), 1)
            page.get_by_role("link", name="Voltar ao DEVLIB").click()
            page.wait_for_load_state("networkidle")
            self.assertIn("DEVLIB", page.title())
            self.assertEqual(errors, [])
        finally:
            context.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
