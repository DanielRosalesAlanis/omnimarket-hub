# OmniMarket — Operations Hub

Dashboard de analítica e-commerce en tiempo real: KPIs de ventas que se actualizan solos, CRUD completo de pedidos con paginación, búsqueda y operaciones en lote, y tablero Kanban con Drag & Drop y persistencia optimista.

- **Producción:** https://omnimarket-hub.vercel.app
- **Repositorio:** https://github.com/DanielRosalesAlanis/omnimarket-hub
- **Endpoints de auditoría:** `/api/test/analytics` · `/api/test/reset-data` · `/api/test/kanban-status`

[![CI](https://github.com/DanielRosalesAlanis/omnimarket-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/DanielRosalesAlanis/omnimarket-hub/actions/workflows/ci.yml)

| Resumen (en vivo) | Kanban |
| --- | --- |
| ![Resumen](docs/screenshots/dashboard.png) | ![Kanban](docs/screenshots/kanban.png) |
| **Pedidos: paginación, búsqueda, edición y eliminación en lote** | **Editar pedido** |
| ![Pedidos](docs/screenshots/orders.png) | ![Editar pedido](docs/screenshots/edit-order.png) |

---

## Auto-auditoría de lineamientos

Cada requisito del documento oficial, con su estado y cómo verificarlo.

### 1. Matriz de evaluación

| Módulo | Criterio | Métrica | Estado | Cómo verificarlo |
| --- | --- | --- | --- | --- |
| Arquitectura (25 %) | Next.js 14+, App Router, TypeScript, Tailwind | Sin errores de consola | ✅ Next.js 16 · App Router · TS estricto · Tailwind 4 | DevTools → Console en cada página. Además, cada prueba E2E **falla automáticamente** si el navegador registra un error ([`e2e/helpers.ts`](e2e/helpers.ts)) |
| Endpoints (25 %) | `/api/test/*` habilitados | Respuesta paginada < 300 ms | ✅ Servidor ≈ 40 ms (header `Server-Timing`) | DevTools → Network → Timing, o `curl` (ver [Endpoints](#endpoints-de-auditoría)) |
| Drag & Drop y CRUD (20 %) | Kanban interactivo y Bulk Update | Persistencia optimista inmediata | ✅ Kanban + CRUD completo (crear, leer con paginación, editar, eliminar) + edición y eliminación en lote | Arrastrar una tarjeta → `GET /api/test/kanban-status` muestra el pedido movido en `recent[0]` |
| Pruebas y CI/CD (15 %) | 10 unitarias + 3 E2E + Actions | Pipeline en verde | ✅ **40 unitarias + 14 E2E** | Badge de CI arriba · pestaña [Actions](https://github.com/DanielRosalesAlanis/omnimarket-hub/actions) |
| Producción (15 %) | URL pública en Vercel | Disponibilidad y SSL | ✅ HTTPS con HSTS, región `iad1` | https://omnimarket-hub.vercel.app |

### 2. Endpoints de prueba

| Endpoint | Estado | Evidencia |
| --- | --- | --- |
| `GET /api/test/analytics?page=1&limit=50` | ✅ | Métricas (ventas, ticket promedio, margen, pedidos por estado) + página de pedidos. Consultas en paralelo e índices |
| `POST /api/test/reset-data` | ✅ | Restablece 500 pedidos deterministas (semilla 42); lo usan las pruebas E2E antes de cada flujo |
| `GET /api/test/kanban-status` | ✅ | `?code=ORD-0001` da el estado de un pedido; sin parámetros, conteo por columna y los últimos pedidos movidos |

### 3. Rendimiento y autenticación

| Requisito | Estado | Evidencia |
| --- | --- | --- |
| Latencia SLA de backend < 300 ms | ✅ | `Server-Timing: app;dur≈40` en cada respuesta de analytics |
| OAuth 2.0 exclusivo: Google y GitHub | ✅ | `/login` solo ofrece Google y GitHub. El acceso de pruebas solo existe en CI y no se registra en producción (`/api/auth/providers` → `google`, `github`) |
| Kanban con mutación optimista | ✅ | La tarjeta cambia de columna al soltarla, antes de que responda el servidor |
| Bulk Update | ✅ | Pedidos → seleccionar varios → "Actualizar seleccionados" o "Eliminar seleccionados" |

### 4. UI/UX: Skeletons y Toast

| Requisito | Estado | Evidencia |
| --- | --- | --- |
| Skeletons en toda consulta asíncrona | ✅ | `loading.tsx` con skeleton en Resumen, Pedidos, Nuevo/Editar pedido y Kanban; la tabla muestra filas skeleton al paginar, buscar o filtrar |
| Skeletons en mutaciones | ✅ | Filas y tarjetas pulsan mientras se guardan; el formulario se vuelve skeleton al guardar. Sin spinners |
| Toast al cambiar el Kanban o editar en lote | ✅ | "ORD-0001 movido a Enviado", "2 pedidos actualizados", "2 pedidos eliminados", "Pedido creado" |
| Revertir el cambio optimista si hay error | ✅ | Probado en E2E simulando respuestas `500` (Kanban, edición en lote y eliminación) |

### 5. Pruebas y CI/CD

| Requisito | Estado | Evidencia |
| --- | --- | --- |
| ≥ 10 pruebas unitarias: cálculo financiero, moneda, esquemas Zod, filtrado | ✅ 40 | [`tests/unit/`](tests/unit) |
| Flujo E2E 1: autenticación (redirección y sesión simulada) | ✅ | [`e2e/auth.spec.ts`](e2e/auth.spec.ts) |
| Flujo E2E 2: creación de pedido y reflejo en la tabla | ✅ | [`e2e/create-order.spec.ts`](e2e/create-order.spec.ts) |
| Flujo E2E 3: Drag & Drop y cambio de columna | ✅ | [`e2e/kanban.spec.ts`](e2e/kanban.spec.ts) |
| `ci.yml` que bloquea despliegues en Vercel si fallan las pruebas | ✅ | El job `deploy` tiene `needs: test`. **Evidencia real:** en el [run #9](https://github.com/DanielRosalesAlanis/omnimarket-hub/actions/runs/40074672053) falló una prueba E2E y el despliegue se omitió automáticamente |

### 6. Dictamen final

| Condición | Estado |
| --- | --- |
| Desplegado en un servidor de producción accesible | ✅ https://omnimarket-hub.vercel.app |
| Pipeline de CI/CD activo | ✅ Cada PR y cada push a `main` ejecutan lint, unitarias, build y E2E |
| Endpoints de auditoría respondiendo | ✅ Los tres son públicos y no requieren sesión |

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

## Funcionalidades

- **Resumen en vivo:** ventas totales, ticket promedio, margen bruto y pedidos, ventas por estado y pedidos recientes. Se actualiza solo cada 15 s mientras la pestaña está visible ([`components/LiveRefresh.tsx`](components/LiveRefresh.tsx)).
- **Pedidos (CRUD completo):**
  - **Crear:** formulario validado en cliente y servidor.
  - **Leer:** paginación del lado del servidor (25 por página), búsqueda por código o cliente sobre todos los pedidos y filtro por estado, todo en la URL.
  - **Editar:** cliente, total y costo.
  - **Eliminar:** con confirmación.
  - **En lote:** cambio de estado y eliminación de varios pedidos a la vez.
  
  Las mutaciones son optimistas, con toast de éxito y reversión ante errores ([`components/OrdersTable.tsx`](components/OrdersTable.tsx), [`components/OrderForm.tsx`](components/OrderForm.tsx)).
- **Kanban:** Drag & Drop entre columnas con dnd-kit (puntero, táctil y teclado), actualización optimista, toast y reversión ([`components/KanbanBoard.tsx`](components/KanbanBoard.tsx)).

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

Si se abre en el navegador (`GET`), muestra una página de ayuda con un botón que ejecuta el `POST`. El `GET` nunca modifica datos.

### `GET /api/test/kanban-status`

```bash
curl -s "https://omnimarket-hub.vercel.app/api/test/kanban-status?code=ORD-0001"   # también acepta ?id=<id>
# {"id":"cm…","code":"ORD-0001","status":"SHIPPED","position":-1,"updatedAt":"2026-…"}

curl -s https://omnimarket-hub.vercel.app/api/test/kanban-status
# {"columns":{"PENDING":124,"PROCESSING":125,"SHIPPED":126,"DELIVERED":125},
#  "recent":[{"code":"ORD-0001","status":"SHIPPED","position":-1,"updatedAt":"2026-…"}, …]}
```

`recent` lista los 5 pedidos modificados más recientemente: tras un Drag & Drop, el pedido movido aparece primero. Si el pedido consultado no existe responde `404`.

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

**Unitarias (40)** — [`tests/unit/`](tests/unit):
- Cálculo financiero: ticket promedio, margen bruto y margen %.
- Formato de moneda MXN.
- Esquemas Zod: paginación, alta y edición de pedido, montos y nombres inválidos, edición y eliminación en lote, parámetros de la tabla.
- Paginación.
- Limpieza de campos al teclear.
- Lógica de filtrado.
- Determinismo de los datos semilla.

**E2E (14)** — [`e2e/`](e2e):

1. **Autenticación** ([`auth.spec.ts`](e2e/auth.spec.ts)): una ruta privada redirige a `/login`; con la sesión simulada se entra al Resumen, y "Salir" cierra la sesión.
2. **Creación** ([`create-order.spec.ts`](e2e/create-order.spec.ts)): se registra un pedido y aparece en la tabla.
3. **Drag & Drop** ([`kanban.spec.ts`](e2e/kanban.spec.ts)): se arrastra `ORD-0001` de Pendiente a Enviado y se comprueban la columna, el toast, el endpoint de auditoría y que el cambio sigue tras recargar.
4. **CRUD** ([`crud.spec.ts`](e2e/crud.spec.ts)):
   - Editar un pedido y eliminarlo con confirmación.
   - Eliminación en lote.
   - Paginación y búsqueda en el servidor.
   - Reversión de la eliminación cuando la API falla.
   - Resumen en vivo.
5. **Edición en lote y reversiones** ([`optimistic-updates.spec.ts`](e2e/optimistic-updates.spec.ts)): edición en lote persistida, y reversión del lote y del Kanban cuando la API responde `500`.
6. **Validación de entradas** ([`create-order.spec.ts`](e2e/create-order.spec.ts)): los campos limpian al teclear signos, letras, exponentes, decimales de más y etiquetas HTML, y la API responde `400` aunque se envíen esos datos saltándose el formulario.

## Seguridad

- **Validación en dos capas:** al teclear ([`lib/input.ts`](lib/input.ts)) y, de forma obligatoria, en el servidor con Zod ([`lib/schemas.ts`](lib/schemas.ts)).
  - Montos: solo decimales positivos con máximo 2 decimales (se rechazan `-5`, `1e3`, `0x10`).
  - Nombres: solo letras, números, espacios y `. , ' & -`.
- **Nada sensible llega al navegador:** el JavaScript público está minificado, no se publican source maps y no contiene secretos (BD, `AUTH_SECRET`, OAuth) ni código de Prisma. Se auditó descargando todos los bundles de producción.
- **Headers de seguridad** en todas las respuestas: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Permissions-Policy` ([`next.config.ts`](next.config.ts)).
- **Sesiones** en cookie JWT cifrada (`httpOnly`). Todas las mutaciones (crear, editar, mover, eliminar) exigen sesión y responden `401` sin ella.
- **Simulación de sesión:** el proveedor `Credentials` con id `e2e` (botón "Entrar como tester") solo se registra cuando `E2E_TEST_MODE=true` **y** `VERCEL_ENV` no es `production`. En la URL pública no existe: el único acceso es OAuth 2.0.

## CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- **`test`** (en cada PR y en cada push a `main`): Postgres 16 como servicio → `npm ci` → lint → pruebas unitarias → `prisma db push` + seed → build → E2E. Si falla, sube el reporte de Playwright como artefacto.
- **`deploy`** (solo en push a `main`, con `needs: test`): `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`.

El despliegue automático por Git de Vercel está desactivado (`vercel.json`): solo GitHub Actions publica, y solo con las pruebas en verde. La regla de protección de `main` exige el check `test`. Un cron diario de Vercel consulta la base para que el plan gratuito de Supabase no la pause por inactividad.

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
  (dashboard)/        layout protegido + dashboard, orders (lista, nuevo, editar), kanban; cada uno con loading.tsx
  api/test/           endpoints públicos de auditoría
  api/orders/         crear, editar, eliminar, mover y operaciones en lote (con sesión)
  login/              OAuth (Google, GitHub)
components/           KanbanBoard, OrdersTable, OrderForm, ConfirmDialog, LiveRefresh, Skeleton, …
lib/                  prisma, schemas (Zod), finance, currency, filters, pagination, input, seed-data
prisma/               schema.prisma y seed.ts
tests/unit/           Vitest
e2e/                  Playwright
```
