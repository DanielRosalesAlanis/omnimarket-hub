import { dragTo, expect, login, resetData, statusOf, test } from "./helpers";

test("Flujo Drag & Drop: mueve una tarjeta de Pendiente a Enviado y persiste", async ({ page, request }) => {
  await resetData(request);
  await login(page);
  await page.goto("/kanban");

  const pending = page.getByTestId("column-PENDING");
  const shipped = page.getByTestId("column-SHIPPED");
  const card = page.getByTestId("card-ORD-0001");

  await expect(pending.getByTestId("card-ORD-0001")).toBeVisible();

  await dragTo(page, card, shipped);

  // Optimistic UI: the card changes column immediately.
  await expect(shipped.getByTestId("card-ORD-0001")).toBeVisible();
  await expect(pending.getByTestId("card-ORD-0001")).toHaveCount(0);
  await expect(page.getByText("ORD-0001 movido a Enviado")).toBeVisible();

  // Persistence: the audit endpoint reflects the new status.
  await expect.poll(() => statusOf(request, "ORD-0001")).toBe("SHIPPED");

  await page.reload();
  await expect(shipped.getByTestId("card-ORD-0001")).toBeVisible();
});
