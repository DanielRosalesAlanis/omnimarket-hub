import { expect, login, test } from "./helpers";

test.describe("Flujo de autenticación", () => {
  test("redirige rutas privadas a /login cuando no hay sesión", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar con GitHub" })).toBeVisible();
  });

  test("permite entrar con sesión simulada y cerrar sesión", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();

    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // The session is gone: private routes redirect again.
    await page.goto("/kanban");
    await expect(page).toHaveURL(/\/login$/);
  });
});
