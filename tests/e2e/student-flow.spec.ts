import { expect, test } from "@playwright/test";

test("student can register, verify email and finish a test", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  await page.goto("/onboarding");
  await page.evaluate(() => {
    localStorage.setItem(
      "entgo-onboarding",
      JSON.stringify({
        score: 120,
        date: ["2–4 месяца"],
        subjects: ["Математика", "Физика"],
        time: ["30–45 минут"],
        method: ["Самостоятельно"],
      }),
    );
  });
  await page.goto("/register");
  await page.locator('input[name="name"]').fill("Тестовый Ученик");
  await page.locator('select[name="desiredUniversitySlug"]').selectOption("kbtu");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("StrongPass2026!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Создать аккаунт и начать" }).click();

  await page.waitForURL(/\/(verify-email|exam)/);
  if (new URL(page.url()).pathname === "/verify-email") {
    await expect(page.getByText("Почта подтверждена")).toBeVisible();
    await page.locator('a[href="/dashboard"]').click();
    await page.goto("/exam");
  }
  await expect(page.getByText("Вопрос 1 из", { exact: false })).toBeVisible();

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("answer-option").nth(0).click();
    if (index < 4) await page.getByTestId("next-question").click();
  }
  await page.getByTestId("finish-exam").click();
  await expect(page).toHaveURL(/\/results\?attempt=/);
  await expect(page.getByText("Объяснение каждого ответа")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Тестовый", { exact: false })).toBeVisible();
  await expect(page.getByText("План на сегодня", { exact: false })).toBeVisible();
});

test("public pages expose forecast, legal and recovery flows", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Получить персональный план" }).first()).toBeVisible();
  await expect(page.getByText("NU", { exact: true })).toHaveCount(0);
  await page.goto("/forgot-password");
  await expect(page.getByText("Вернём доступ")).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByText("Политика конфиденциальности")).toBeVisible();
});
