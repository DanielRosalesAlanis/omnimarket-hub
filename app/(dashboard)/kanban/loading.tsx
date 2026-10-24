import { Skeleton } from "@/components/Skeleton";

export default function KanbanLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando tablero">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, column) => (
          <div key={column} className="space-y-3 rounded-xl bg-slate-100 p-3 ring-1 ring-slate-200">
            <div className="flex items-center justify-between px-1 py-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            {Array.from({ length: 5 }, (_, card) => (
              <div key={card} className="space-y-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
