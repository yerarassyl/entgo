import { expect, test } from "@playwright/test";

const widths = [320, 375, 390, 768, 1024, 1440];

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  const octet = 20 + Math.floor(Math.random() * 200);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${octet}` });
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/(dashboard|admin)$/),
    page.locator('form button:not([type="button"])').click(),
  ]);
}

async function expectNoOverflow(page: import("@playwright/test").Page) {
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
}

test.describe("visual regression and responsive safety", () => {
  for (const width of widths) {
    test(`public layouts at ${width}px`, async ({ page }) => {
      test.skip(test.info().project.name.includes("mobile"));
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });

      await page.goto("/");
      await expectNoOverflow(page);
      await expect(page).toHaveScreenshot(`home-${width}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.015,
      });

      await page.goto("/privacy");
      await expectNoOverflow(page);
      await expect(page).toHaveScreenshot(`privacy-${width}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.015,
      });

      await page.evaluate(() => localStorage.removeItem("entgo-onboarding"));
      await page.goto("/register");
      await expect(page).toHaveURL(/\/register$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Создай аккаунт");
      await expectNoOverflow(page);
      await expect(page).toHaveScreenshot(`register-${width}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.015,
      });
    });
  }

  for (const width of [390, 1440]) {
    test(`authenticated layouts at ${width}px`, async ({ page }) => {
      test.skip(test.info().project.name.includes("mobile"));
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await login(page, "premium@entgo.local", "PremiumDemo2026!");

      for (const [name, route] of [
        ["dashboard", "/dashboard"],
        ["tests", "/tests"],
        ["plan", "/plan"],
        ["study", "/study/cmq81w2y9001nes60qome1ovf"],
        ["results", "/results?attempt=cmq8bxhh200dhesiw4jye0o9u"],
        ["settings", "/settings"],
      ] as const) {
        await page.goto(route);
        await expectNoOverflow(page);
        await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
          animations: "disabled",
          maxDiffPixelRatio: 0.02,
        });
      }
    });

    test(`superadmin layout at ${width}px`, async ({ page }) => {
      test.skip(test.info().project.name.includes("mobile"));
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await login(page, "admin@entgo.local", "AdminDemo2026!");
      await expectNoOverflow(page);
      await expect(page).toHaveScreenshot(`admin-${width}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});

test("mobile app controls remain usable from 320 to 430px", async ({ page }) => {
  test.skip(test.info().project.name.includes("mobile"));
  await login(page, "premium@entgo.local", "PremiumDemo2026!");
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/dashboard", "/tests", "/plan", "/study/cmq81w2y90020es60p58zpcxh", "/settings"]) {
      await page.goto(route);
      await expectNoOverflow(page);
      const undersized = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("a,button")]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.height < 40;
          })
          .length,
      );
      expect(undersized).toBe(0);
      await expect(page.locator("[data-mobile-bottom-nav]")).toBeVisible();
    }
  }
});

test("repeated topic sessions expose distinct learning stages", async ({ page }) => {
  test.skip(test.info().project.name.includes("mobile"));
  await login(page, "premium@entgo.local", "PremiumDemo2026!");
  const routes = [
    "/study/cmq81w2y9001nes60qome1ovf",
    "/study/cmq81w2y9001qes607v22jomc",
    "/study/cmq81w2y9001tes60xxj3xlpq",
  ];
  const stages: string[] = [];
  for (const route of routes) {
    await page.goto(route);
    stages.push(await page.getByText(/Цель этапа:/).innerText());
  }
  expect(new Set(stages).size).toBe(3);
});
