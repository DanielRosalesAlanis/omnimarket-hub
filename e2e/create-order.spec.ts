import { expect, login, resetData, test } from "./helpers";

test("Flujo de creación: registra un pedido y aparece en la tabla", async ({ page, request }) => {
  await resetData(request);
  await login(page);

  const customer = `Cliente E2E ${Date.now()}`;

  await page.goto("/orders/new");
  await page.getByLabel("Cliente").fill(customer);
  await page.getByLabel("Total (MXN)").fill("1500");
  await page.getByLabel("Costo (MXN)").fill("900");
  await page.getByRole("button", { name: "Guardar pedido" }).click();

  await page.waitForURL(/\/orders$/);
  await expect(page.getByText("Pedido creado")).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: customer });
  await expect(row).toBeVisible();
  await expect(row).toContainText("$1,500.00");
  await expect(row).toContainText("Pendiente");
});
