import { dragTo, expect, login, resetData, statusOf, test } from "./helpers";

test.describe("Edición en lote y reversión optimista", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetData(request);
    await login(page);
  });

  test("actualiza varios pedidos a la vez y persiste", async ({ page, request }) => {
    await page.goto("/orders");
    await page.getByLabel("Seleccionar ORD-0499").check();
    await page.getByLabel("Seleccionar ORD-0498").check();
    await page.getByLabel("Mover a").selectOption("PENDING");
    await page.getByRole("button", { name: "Actualizar seleccionados (2)" }).click();

    await expect(page.getByText("2 pedidos actualizados")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "ORD-0499" })).toContainText("Pendiente");
    await expect.poll(() => statusOf(request, "ORD-0499")).toBe("PENDING");
    await expect.poll(() => statusOf(request, "ORD-0498")).toBe("PENDING");
  });

  test.describe("con el servidor fallando", () => {
    test.use({ allowedConsoleErrors: [/status of 500/] });

    test("revierte la edición en lote si la API falla", async ({ page, request }) => {
      await page.route("**/api/orders/bulk", (route) => route.fulfill({ status: 500, body: "{}" }));
      await page.goto("/orders");

      const row = page.getByRole("row").filter({ hasText: "ORD-0499" });
      await expect(row).toContainText("Enviado");
      await page.getByLabel("Seleccionar ORD-0499").check();
      await page.getByLabel("Mover a").selectOption("DELIVERED");
      await page.getByRole("button", { name: "Actualizar seleccionados (1)" }).click();

      await expect(page.getByText("Falló la edición en lote. Cambios revertidos.")).toBeVisible();
      await expect(row).toContainText("Enviado");
      expect(await statusOf(request, "ORD-0499")).toBe("SHIPPED");
    });

    test("revierte el movimiento del Kanban si la API falla", async ({ page, request }) => {
      await page.route("**/api/orders/*/status", (route) => route.fulfill({ status: 500, body: "{}" }));
      await page.goto("/kanban");

      await dragTo(page, page.getByTestId("card-ORD-0001"), page.getByTestId("column-DELIVERED"));

      await expect(page.getByText("No se pudo mover ORD-0001. Cambio revertido.")).toBeVisible();
      await expect(page.getByTestId("column-PENDING").getByTestId("card-ORD-0001")).toBeVisible();
      expect(await statusOf(request, "ORD-0001")).toBe("PENDING");
    });
  });
});
