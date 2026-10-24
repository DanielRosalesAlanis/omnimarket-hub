"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <h1 className="text-lg font-semibold">No se pudieron cargar los datos</h1>
      <p className="mt-2 text-sm text-slate-500">Ocurrió un problema al consultar el servidor. Intenta de nuevo.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Reintentar
      </button>
    </div>
  );
}
