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

test("Los campos solo aceptan datos válidos y la API rechaza lo demás", async ({ page }) => {
  await login(page);
  await page.goto("/orders/new");

  // Typing is sanitized: no signs, letters, exponents, extra decimals or markup.
  await page.getByLabel("Total (MXN)").pressSequentially("-1e2.345x");
  await expect(page.getByLabel("Total (MXN)")).toHaveValue("12.34");
  await page.getByLabel("Cliente").pressSequentially("<b>Ana</b>");
  await expect(page.getByLabel("Cliente")).toHaveValue("bAnab");

  // Cost greater than total is blocked before reaching the server.
  await page.getByLabel("Costo (MXN)").fill("50");
  await page.getByRole("button", { name: "Guardar pedido" }).click();
  await expect(page.getByText("El costo no puede superar el total")).toBeVisible();

  // Bypassing the form: the server validates on its own (same session cookies).
  for (const data of [
    { customer: "Ana López", total: "-5", cost: "0" },
    { customer: "Ana López", total: "1e3", cost: "0" },
    { customer: "<script>alert(1)</script>", total: "10", cost: "1" },
  ]) {
    const res = await page.request.post("/api/orders", { data });
    expect(res.status(), JSON.stringify(data)).toBe(400);
  }
});
