import Link from "next/link";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        ← OmniMarket Hub
      </Link>
      <article className="mt-4 space-y-4 rounded-xl bg-white p-8 text-sm leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200 [&_h2]:pt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {children}
      </article>
    </main>
  );
}
