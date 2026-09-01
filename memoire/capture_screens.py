"""Captures d'écran de SALT VIP pour le mémoire."""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).parent / "figures"
OUT.mkdir(exist_ok=True)
BASE = "http://localhost:8443"

ADMIN_PAGES = [
    ("/admin/reservation", "fig04_admin_reservation.png"),
    ("/admin/checking", "fig05_checking.png"),
    ("/admin/planning", "fig06_planning.png"),
    ("/admin/registre", "fig07_registre.png"),
    ("/admin/supervision", "fig08_supervision.png"),
    ("/admin/exports", "fig09_exports.png"),
    ("/admin/analytics", "fig10_analytics.png"),
    ("/admin/systeme", "fig11_administration.png"),
]


def login(page, email, password):
    page.goto(f"{BASE}/connexion", wait_until="load")
    page.wait_for_timeout(400)
    page.fill('input[type="email"]', email)
    page.fill('input[type="password"]', password)
    page.click('button[type="submit"]')
    page.wait_for_timeout(1200)


def shot(page, name, full=True):
    path = OUT / name
    page.screenshot(path=str(path), full_page=full)
    print("OK", path.name, flush=True)


def main():
    with sync_playwright() as p:
        browser = None
        for channel in ("msedge", "chrome", None):
            try:
                if channel:
                    browser = p.chromium.launch(channel=channel, headless=True)
                    print("Navigateur :", channel, flush=True)
                else:
                    browser = p.chromium.launch(headless=True)
                    print("Navigateur : chromium", flush=True)
                break
            except Exception as e:
                print("Échec", channel, e)
        if browser is None:
            raise RuntimeError("Aucun navigateur Playwright disponible")
        context = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1.25)
        page = context.new_page()

        page.goto(f"{BASE}/connexion", wait_until="domcontentloaded")
        page.wait_for_timeout(500)
        shot(page, "fig03_connexion.png", full=True)

        login(page, "admin@salt.tg", "SaltAdmin2026")
        for url, name in ADMIN_PAGES:
            page.goto(f"{BASE}{url}", wait_until="domcontentloaded")
            page.wait_for_timeout(700)
            shot(page, name, full=True)

        context.close()

        # Hôtesse
        ctx2 = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1.25)
        p2 = ctx2.new_page()
        login(p2, "akosua@salt.tg", "SaltHostess2026")
        p2.goto(f"{BASE}/admin/reservation", wait_until="domcontentloaded")
        p2.wait_for_timeout(700)
        shot(p2, "fig12_hotesse_reservation.png")
        p2.goto(f"{BASE}/admin/checking", wait_until="domcontentloaded")
        p2.wait_for_timeout(500)
        shot(p2, "fig13_hotesse_nav.png")
        ctx2.close()

        # Protocole
        ctx3 = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1.25)
        p3 = ctx3.new_page()
        login(p3, "afia@gouv.tg", "SaltProto2026")
        p3.wait_for_timeout(700)
        shot(p3, "fig14_protocole_reservation.png")
        p3.goto(f"{BASE}/mes-reservations", wait_until="domcontentloaded")
        p3.wait_for_timeout(600)
        shot(p3, "fig15_protocole_demandes.png")
        ctx3.close()

        # Mobile
        ctx4 = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
        )
        p4 = ctx4.new_page()
        login(p4, "admin@salt.tg", "SaltAdmin2026")
        p4.wait_for_timeout(800)
        shot(p4, "fig16_mobile_admin.png", full=False)
        ctx4.close()

        ctx5 = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
        )
        p5 = ctx5.new_page()
        login(p5, "afia@gouv.tg", "SaltProto2026")
        p5.wait_for_timeout(800)
        shot(p5, "fig17_mobile_protocole.png", full=False)
        ctx5.close()

        browser.close()
        print("Captures terminées.")


if __name__ == "__main__":
    main()
