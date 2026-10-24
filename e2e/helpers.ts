import { expect, test as base, type APIRequestContext, type Locator, type Page } from "@playwright/test";

/**
 * Every E2E test fails if the browser logs a console error or throws an
 * uncaught exception, enforcing the "render without console errors" criterion.
 */
export const test = base.extend<{ allowedConsoleErrors: RegExp[]; consoleErrors: string[] }>({
  // Tests that simulate server failures opt in to the matching "Failed to load resource" log.
  allowedConsoleErrors: [[], { option: true }],
  consoleErrors: [
    async ({ page, allowedConsoleErrors }, use) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        if (allowedConsoleErrors.some((pattern) => pattern.test(msg.text()))) return;
        errors.push(msg.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "Errores en la consola del navegador").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Restores the deterministic dataset through the public audit endpoint. */
export async function resetData(request: APIRequestContext) {
  const res = await request.post("/api/test/reset-data", { data: { count: 500 } });
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toMatchObject({ ok: true, orders: 500 });
}

/** Signs in with the E2E-only credentials provider (never registered in production). */
export async function login(page: Page) {
  await page.goto("/login");
  await page.getByTestId("e2e-login").click();
  await page.waitForURL("**/dashboard");
}

/** dnd-kit listens to real pointer movement, so the drag is performed step by step. */
export async function dragTo(page: Page, source: Locator, target: Locator) {
  // boundingBox() does not auto-wait: make sure both elements are rendered and that
  // React has hydrated the board (dnd-kit listeners only exist after hydration).
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();
  await expect(page.getByTestId("kanban-board")).toHaveAttribute("data-hydrated", "true");

  const s = (await source.boundingBox())!;
  const t = (await target.boundingBox())!;
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.mouse.down();
  await page.mouse.move(s.x + s.width / 2 + 15, s.y + s.height / 2, { steps: 5 });
  await page.mouse.move(t.x + t.width / 2, t.y + 80, { steps: 20 });
  await page.mouse.up();
}

/** Current status of an order as reported by the public audit endpoint. */
export async function statusOf(request: APIRequestContext, code: string): Promise<string> {
  const res = await request.get(`/api/test/kanban-status?code=${code}`);
  return (await res.json()).status;
}
