"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** Server-formatted time of the data currently shown. */
  updatedAt: string;
  intervalMs?: number;
};

/** Re-fetches the server component data periodically while the tab is visible ("tiempo real"). */
export function LiveRefresh({ updatedAt, intervalMs = 15_000 }: Props) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    const timer = setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, intervalMs]);

  return (
    <div className="flex items-center gap-3 text-xs text-slate-500" aria-live="polite">
      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-600/20">
        <span aria-hidden className="size-2 animate-pulse rounded-full bg-emerald-500" />
        En vivo
      </span>
      <span>{isRefreshing ? "Actualizando…" : `Actualizado ${updatedAt}`}</span>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={isRefreshing}
        className="rounded-md px-2 py-1 font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
      >
        Actualizar
      </button>
    </div>
  );
}
