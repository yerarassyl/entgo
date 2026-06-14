import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Ваш пароль").fill(password);
  await Promise.all([
    page.waitForURL(/\/(dashboard|admin)$/),
    page.getByRole("button", { name: "Продолжить", exact: true }).click(),
  ]);
}

test("landing and registration match the product specification", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Получи желаемый балл с первой попытки" })).toBeVisible();
  await expect(page.getByText("Почему большинство не могут поднять свой балл на ЕНТ")).toBeVisible();
  await expect(page.getByText("+12 баллов")).toBeVisible();
  await expect(page.getByText("130+ на ЕНТ?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Поддержка" })).toHaveCount(0);

  await page.addInitScript(() => {
    localStorage.setItem(
      "entgo-onboarding",
      JSON.stringify({
        score: 120,
        date: ["1–2 месяца"],
        subjects: ["Математика"],
        time: ["30–45 минут"],
        method: ["Самостоятельно"],
      }),
    );
  });
  await page.goto("/register");
  await expect(page.getByRole("button", { name: "Не хочу отвечать: город" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Не хочу отвечать: школа" })).toBeVisible();
  await expect(page.getByText("Дата ЕНТ")).toBeVisible();
});

test("premium plan, statistics and AI expose goal-oriented UX", async ({ page }) => {
  await login(page, "premium@entgo.local", "PremiumDemo2026!");
  await page.goto("/plan");
  await expect(page.getByText("Сегодня ты ближе к цели")).toBeVisible();
  await expect(page.getByText("Текущий прогноз")).toBeVisible();
  await expect(page.getByText("Шанс поступления")).toBeVisible();
  await expect(page.getByRole("button", { name: /Спросить у ИИ|Открыть AI-репетитора/ })).toBeVisible();

  await page.goto("/statistics");
  await expect(page.getByText("до цели осталось")).toBeVisible();
  await expect(page.getByText("Через месяц")).toBeVisible();
  await expect(page.getByText("балла за неделю")).toBeVisible();
  await expect(page.getByText("балла за месяц")).toBeVisible();
});

test("admin and superadmin permissions stay separate", async ({ browser }) => {
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, "content-admin@entgo.local", "ContentAdmin2026!");
  await expect(adminPage).toHaveURL(/\/admin$/);
  await expect(adminPage.getByText("Контент-админ · ограниченный доступ")).toBeVisible();
  await expect(adminPage.getByText("Пользователи, роли и подписки")).toHaveCount(0);
  await expect(adminPage.getByRole("button", { name: "Выйти" })).toBeVisible();
  await adminContext.close();

  const superContext = await browser.newContext();
  const superPage = await superContext.newPage();
  await login(superPage, "admin@entgo.local", "AdminDemo2026!");
  await expect(superPage).toHaveURL(/\/admin$/);
  await expect(superPage.getByText("Пользователи, роли и подписки")).toBeVisible();
  await expect(superPage.getByText("Заявки на подарок 130+")).toBeVisible();
  await expect(superPage.getByText("Служба поддержки")).toBeVisible();
  await superContext.close();
});

for (const width of [320, 375, 390, 430]) {
  test(`mobile layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.viewport);
    await expect(page.getByRole("button", { name: "Поддержка" })).toHaveCount(0);
  });
}
