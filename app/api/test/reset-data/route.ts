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

/**
 * GET /api/test/reset-data — opening the endpoint in a browser would otherwise show a bare 405.
 * Serves a small help page whose button performs the real POST; GET itself never changes data.
 */
export function GET() {
  return new Response(HELP_PAGE, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const HELP_PAGE = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>POST /api/test/reset-data · OmniMarket Hub</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a;
         font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 34rem; margin: 1rem; padding: 2rem; background: #fff; border-radius: 12px;
         box-shadow: 0 1px 2px rgb(0 0 0 / .06); outline: 1px solid #e2e8f0; }
  h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
  code, pre { font-family: ui-monospace, Consolas, monospace; font-size: .85rem; }
  pre { background: #f1f5f9; padding: .75rem; border-radius: 8px; overflow-x: auto; }
  button { background: #4f46e5; color: #fff; border: 0; border-radius: 8px; padding: .6rem 1rem; font: inherit;
           font-weight: 600; cursor: pointer; }
  button:disabled { background: #a5b4fc; cursor: wait; }
  .muted { color: #64748b; }
</style>
</head>
<body>
<main>
  <h1>Endpoint de auditoría: <code>POST /api/test/reset-data</code></h1>
  <p>Restablece la base de datos al conjunto de prueba determinista (500 pedidos, semilla 42).
     Este endpoint se invoca con <strong>POST</strong>; al abrirlo en el navegador se muestra esta ayuda.</p>
  <pre id="curl">curl -X POST /api/test/reset-data</pre>
  <p><button id="run" type="button">Ejecutar POST ahora</button></p>
  <pre id="out" class="muted">Respuesta: (aún no ejecutado)</pre>
</main>
<script>
  const run = document.getElementById("run"), out = document.getElementById("out");
  document.getElementById("curl").textContent = "curl -X POST " + location.origin + location.pathname;
  run.addEventListener("click", async () => {
    run.disabled = true;
    out.textContent = "Ejecutando…";
    const started = performance.now();
    try {
      const res = await fetch(location.pathname, { method: "POST" });
      out.textContent = "HTTP " + res.status + " · " + Math.round(performance.now() - started) + " ms\\n" + await res.text();
    } catch (error) {
      out.textContent = "Error: " + error;
    } finally {
      run.disabled = false;
    }
  });
</script>
</body>
</html>`;
