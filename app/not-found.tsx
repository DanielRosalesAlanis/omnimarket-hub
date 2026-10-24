import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Página no encontrada</h1>
      <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        Ir al resumen
      </Link>
    </main>
  );
}
