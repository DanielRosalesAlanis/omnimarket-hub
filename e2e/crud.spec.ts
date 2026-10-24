import { expect, login, resetData, test } from "./helpers";

test.describe("CRUD de pedidos", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetData(request);
    await login(page);
  });

  test("edita un pedido y el cambio se refleja en la tabla", async ({ page }) => {
    await page.goto("/orders");
    await page.getByRole("link", { name: "Editar ORD-0500" }).click();
    await page.waitForURL(/\/orders\/[^/]+\/edit$/);

    await expect(page.getByRole("heading", { name: "Editar ORD-0500" })).toBeVisible();
    await expect(page.getByLabel("Cliente")).toHaveValue("Andrés Gómez");

    await page.getByLabel("Cliente").fill("Cliente Editado E2E");
    await page.getByLabel("Total (MXN)").fill("2000");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await page.waitForURL(/\/orders$/);
    await expect(page.getByText("ORD-0500 actualizado")).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: "ORD-0500" });
    await expect(row).toContainText("Cliente Editado E2E");
    await expect(row).toContainText("$2,000.00");
  });

  test("elimina un pedido con confirmación", async ({ page, request }) => {
    await page.goto("/orders");
    await page.getByRole("button", { name: "Eliminar ORD-0500" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByText("ORD-0500 eliminado")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "ORD-0500" })).toHaveCount(0);
    expect((await request.get("/api/test/kanban-status?code=ORD-0500")).status()).toBe(404);
  });

  test("elimina varios pedidos en lote", async ({ page, request }) => {
    await page.goto("/orders");
    await page.getByLabel("Seleccionar ORD-0499").check();
    await page.getByLabel("Seleccionar ORD-0498").check();
    await page.getByRole("button", { name: "Eliminar seleccionados (2)" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByText("2 pedidos eliminados")).toBeVisible();
    for (const code of ["ORD-0499", "ORD-0498"]) {
      expect((await request.get(`/api/test/kanban-status?code=${code}`)).status()).toBe(404);
    }
  });

  test("pagina y busca en todos los pedidos", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByText("Página 1 de 20")).toBeVisible();

    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.waitForURL(/page=2/);
    await expect(page.getByText("Página 2 de 20")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "ORD-0475" })).toBeVisible();

    // ORD-0001 is on the last page; the search goes to the server.
    await page.getByLabel("Buscar pedidos").fill("ORD-0001");
    await page.waitForURL(/q=ORD-0001/);
    await expect(page.getByRole("row").filter({ hasText: "ORD-0001" })).toBeVisible();
    await expect(page.getByText("Página 1 de 1")).toBeVisible();
  });

  test.describe("con el servidor fallando", () => {
    test.use({ allowedConsoleErrors: [/status of 500/] });

    test("revierte la eliminación si la API falla", async ({ page, request }) => {
      await page.route("**/api/orders/*", (route) =>
        route.request().method() === "DELETE" ? route.fulfill({ status: 500, body: "{}" }) : route.continue(),
      );
      await page.goto("/orders");
      await page.getByRole("button", { name: "Eliminar ORD-0500" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();

      await expect(page.getByText("No se pudo eliminar ORD-0500. Cambio revertido.")).toBeVisible();
      await expect(page.getByRole("row").filter({ hasText: "ORD-0500" })).toBeVisible();
      expect((await request.get("/api/test/kanban-status?code=ORD-0500")).status()).toBe(200);
    });
  });
});

test("El resumen se actualiza en vivo", async ({ page }) => {
  await login(page);
  await expect(page.getByText("En vivo")).toBeVisible();
  await page.getByRole("button", { name: "Actualizar" }).click();
  await expect(page.getByText(/Actualizado \d/)).toBeVisible();
});
