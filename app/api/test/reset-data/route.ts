import { prisma } from "@/lib/prisma";
import { resetSchema } from "@/lib/schemas";
import { buildSeedOrders } from "@/lib/seed-data";
import { badRequest, json, readJson, serverTiming } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/test/reset-data  body (optional): { "count": 500 }
 * Public audit endpoint: restores the deterministic dataset (seed 42) so E2E runs are repeatable.
 */
export async function POST(req: Request) {
  const startedAt = performance.now();

  const parsed = resetSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error, "El parámetro count debe ser un entero entre 100 y 1000");

  const [, created] = await prisma.$transaction([
    prisma.order.deleteMany(),
    prisma.order.createMany({ data: buildSeedOrders(parsed.data.count) }),
  ]);

  return json(
    { ok: true, orders: created.count },
    { headers: { "Server-Timing": serverTiming(startedAt) } },
  );
}
