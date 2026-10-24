# OmniMarket — Operations Hub

Dashboard de analítica e-commerce: KPIs de ventas, tabla de pedidos con edición en lote y tablero Kanban con Drag & Drop y persistencia optimista.

- **Producción:** https://omnimarket-hub.vercel.app
- **Repositorio:** https://github.com/DanielRosalesAlanis/omnimarket-hub
- **Endpoints de auditoría:** `/api/test/analytics` · `/api/test/reset-data` · `/api/test/kanban-status`

[![CI](https://github.com/DanielRosalesAlanis/omnimarket-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/DanielRosalesAlanis/omnimarket-hub/actions/workflows/ci.yml)

| Resumen | Kanban |
| --- | --- |
| ![Resumen](docs/screenshots/dashboard.png) | ![Kanban](docs/screenshots/kanban.png) |
| **Pedidos (edición en lote)** | **Pedidos en móvil** |
| ![Pedidos](docs/screenshots/orders.png) | ![Pedidos en móvil](docs/screenshots/orders-mobile.png) |

---

## Stack

| Pieza | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 |
| Base de datos | PostgreSQL en Supabase (us-east-1) · Prisma 6 |
| Autenticación | Auth.js v5 (OAuth 2.0: Google y GitHub) · sesiones JWT |
| Drag & Drop | @dnd-kit/core |
| UI | sonner (toasts) · skeletons propios con Tailwind |
| Validación | Zod 4 |
| Pruebas | Vitest (unitarias) · Playwright (E2E, Chromium) |
| CI/CD | GitHub Actions → Vercel CLI (región `iad1`) |

## Cómo se cumple la rúbrica

| Módulo | Implementación | Archivos |
| --- | --- | --- |
| **Arquitectura Next.js (25 %)** | App Router con grupo de rutas `(dashboard)` protegido por un layout de servidor; TypeScript estricto; Tailwind. Una guarda E2E hace fallar cualquier prueba si el navegador registra errores de consola. | [`app/`](app), [`app/(dashboard)/layout.tsx`](app/(dashboard)/layout.tsx), [`e2e/helpers.ts`](e2e/helpers.ts) |
| **Endpoints de auditoría (25 %)** | Tres rutas públicas `force-dynamic` con `Cache-Control: no-store`. Las consultas de analytics corren en paralelo (`Promise.all`) y la respuesta incluye `Server-Timing`. Índices en `(status, position)` y `createdAt`. | [`app/api/test/`](app/api/test), [`prisma/schema.prisma`](prisma/schema.prisma) |
| **Drag & Drop y CRUD (20 %)** | Kanban con dnd-kit (puntero, táctil y teclado) y edición en lote. Ambos aplican el cambio de forma optimista, muestran un toast de éxito y **revierten** si la API falla. Alta de pedidos con validación Zod en cliente y servidor. | [`components/KanbanBoard.tsx`](components/KanbanBoard.tsx), [`components/OrdersTable.tsx`](components/OrdersTable.tsx), [`components/NewOrderForm.tsx`](components/NewOrderForm.tsx), [`app/api/orders/`](app/api/orders) |
| **Pruebas y CI/CD (15 %)** | 19 pruebas unitarias y 7 E2E (los 3 flujos obligatorios más edición en lote y reversión ante errores). El job `deploy` depende de `test`: si alguna prueba falla, no se despliega. | [`tests/unit/`](tests/unit), [`e2e/`](e2e), [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| **Producción (15 %)** | Vercel con SSL automático. El despliegue automático por Git está desactivado (`vercel.json`): solo GitHub Actions publica, y solo con el pipeline en verde. | [`vercel.json`](vercel.json) |

**Experiencia de carga:** cada ruta con datos tiene su `loading.tsx` con skeletons (sin spinners), y las filas o tarjetas que se están guardando pulsan mientras se confirma el cambio.

## Endpoints de auditoría

Son públicos a propósito para que el evaluador pueda usarlos sin iniciar sesión. Las rutas que modifican datos desde la app (`/api/orders*`) sí exigen sesión y responden `401` sin ella.

### `GET /api/test/analytics?page=1&limit=50`

Métricas de ventas y pedidos paginados (`page` ≥ 1, `limit` entre 1 y 100). Si los parámetros no son válidos responde `400` con el detalle (`issues`).

```bash
curl -s -w "\n%{http_code} %{time_total}s\n" "https://omnimarket-hub.vercel.app/api/test/analytics?page=1&limit=2"
```

```json
{
  "page": 1, "limit": 2, "total": 500, "totalPages": 250,
  "summary": {
    "revenueCents": 127430308,
    "averageTicketCents": 254861,
    "grossMarginPct": 39.33,
    "ordersByStatus": { "PENDING": 125, "PROCESSING": 125, "SHIPPED": 125, "DELIVERED": 125 }
  },
  "data": [
    { "id": "cm…", "code": "ORD-0500", "customer": "Andrés Gómez", "status": "DELIVERED",
      "totalCents": 117534, "costCents": 55499, "createdAt": "2026-05-26T13:00:00.000Z", "marginPct": 52.78 }
  ]
}
```

Headers: `Cache-Control: no-store` y `Server-Timing: app;dur=<ms>`. Todos los importes están en **centavos MXN**.

### `POST /api/test/reset-data`

Restablece la base a un conjunto determinista (PRNG mulberry32, semilla 42). `ORD-0001` siempre existe en estado `PENDING` y `position: 0`. El body es opcional: `{ "count": 100–1000 }` (500 por defecto).

```bash
curl -s -X POST https://omnimarket-hub.vercel.app/api/test/reset-data
# {"ok":true,"orders":500}
```

### `GET /api/test/kanban-status`

```bash
curl -s "https://omnimarket-hub.vercel.app/api/test/kanban-status?code=ORD-0001"   # también acepta ?id=<id>
# {"id":"cm…","code":"ORD-0001","status":"SHIPPED","position":-1,"updatedAt":"2026-…"}

curl -s https://omnimarket-hub.vercel.app/api/test/kanban-status
# {"columns":{"PENDING":125,"PROCESSING":125,"SHIPPED":125,"DELIVERED":125}}
```

Si el pedido no existe responde `404`.

## Ejecutar en local

Requisitos: Node 22+ y Docker (o una base de Supabase).

```bash
cp .env.example .env          # completar AUTH_SECRET (npx auth secret) y las credenciales OAuth
docker compose up -d          # Postgres 16 local, igual que en CI
# con Docker, en .env: DATABASE_URL y DIRECT_URL = postgresql://postgres:postgres@localhost:5432/omnimarket
npm install
npx prisma db push
npm run db:seed               # "Seed completado: 500 pedidos"
npm run dev                   # http://localhost:3000
```

| Comando | Qué hace |
| --- | --- |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run build && npm run test:e2e` | Build de producción y pruebas E2E (Playwright) |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |

## Pruebas

**Unitarias (19)** — [`tests/unit/`](tests/unit): cálculo financiero (ticket promedio, margen bruto, margen %), formateo de moneda MXN, esquemas Zod (paginación, alta de pedido, edición en lote), lógica de filtrado y determinismo de los datos semilla.

**E2E (7)** — [`e2e/`](e2e):

1. **Autenticación** ([`auth.spec.ts`](e2e/auth.spec.ts)): una ruta privada redirige a `/login`; con la sesión simulada se entra al Resumen y "Salir" cierra la sesión.
2. **Creación** ([`create-order.spec.ts`](e2e/create-order.spec.ts)): se registra un pedido y aparece en la tabla.
3. **Drag & Drop** ([`kanban.spec.ts`](e2e/kanban.spec.ts)): se arrastra `ORD-0001` de Pendiente a Enviado y se comprueban la columna, el toast, el endpoint de auditoría y que el cambio sigue tras recargar.
4. **Extra** ([`optimistic-updates.spec.ts`](e2e/optimistic-updates.spec.ts)): edición en lote persistida, y reversión del lote y del Kanban cuando la API responde `500`.

**Simulación de sesión:** el proveedor `Credentials` con id `e2e` (botón "Entrar como tester") solo se registra cuando `E2E_TEST_MODE=true` **y** `VERCEL_ENV` no es `production`. En la URL pública no existe: el único acceso es OAuth 2.0.

## CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- **`test`** (en cada PR y en cada push a `main`): Postgres 16 como servicio → `npm ci` → lint → pruebas unitarias → `prisma db push` + seed → build → E2E. Si falla, sube el reporte de Playwright como artefacto.
- **`deploy`** (solo en push a `main`, con `needs: test`): `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`.

Con la regla de protección de `main` ("Require status checks to pass" → `test`), ningún cambio llega a producción con pruebas en rojo.

## Decisiones técnicas

- **Dinero en centavos** (`Int`) para evitar errores de coma flotante. Se formatea con `Intl.NumberFormat("es-MX", { currency: "MXN" })`.
- **Protección de rutas en un layout de servidor** (`await auth()` + `redirect`) en lugar de `middleware`/`proxy`.
- **Cache Components desactivado** en `next.config.ts`: las rutas de auditoría usan `dynamic = "force-dynamic"` y el panel siempre se renderiza por petición.
- **Kanban:** una tarjeta movida queda al inicio de su nueva columna (`position` = mínimo − 1), así que sigue visible después de recargar aunque el tablero muestre solo 15 tarjetas por columna. `DndContext` tiene un `id` fijo para evitar diferencias de hidratación.
- **Prisma `binaryTargets`** incluye `rhel-openssl-3.0.x` porque el build de producción se hace en GitHub Actions (Ubuntu), pero las funciones corren en Vercel.
- **Fechas formateadas en el servidor** (zona `America/Mexico_City`) para que el HTML del servidor y la hidratación coincidan siempre.

## Estructura

```
app/
  (dashboard)/        layout protegido + dashboard, orders, kanban (cada uno con loading.tsx)
  api/test/           endpoints públicos de auditoría
  api/orders/         alta, cambio de estado y edición en lote (con sesión)
  login/              OAuth (Google, GitHub)
components/           KanbanBoard, OrdersTable, NewOrderForm, Skeleton, …
lib/                  prisma, schemas (Zod), finance, currency, filters, seed-data
prisma/               schema.prisma y seed.ts
tests/unit/           Vitest
e2e/                  Playwright
```
