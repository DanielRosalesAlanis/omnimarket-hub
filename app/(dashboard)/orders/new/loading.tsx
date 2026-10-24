import { Skeleton } from "@/components/Skeleton";

export default function NewOrderLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-6" aria-busy="true" aria-label="Cargando formulario">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <Skeleton className="h-14 w-full" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <Skeleton className="ml-auto h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}
