import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isE2E, signIn } from "@/auth";

export const metadata: Metadata = { title: "Iniciar sesión" };

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Acceso denegado por el proveedor.",
  Configuration: "El proveedor de autenticación no está configurado correctamente.",
  OAuthAccountNotLinked: "Esta cuenta ya está asociada a otro proveedor.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { error } = await searchParams;
  const errorMessage =
    typeof error === "string" ? (ERROR_MESSAGES[error] ?? "No se pudo iniciar sesión. Intenta de nuevo.") : null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            OM
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">OmniMarket Hub</h1>
          <p className="mt-1 text-sm text-slate-500">Inicia sesión para acceder al panel de operaciones</p>
        </div>

        {errorMessage && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        )}

        <div className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button type="submit" className={buttonClass}>
              <GoogleIcon />
              Continuar con Google
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <button type="submit" className={buttonClass}>
              <GitHubIcon />
              Continuar con GitHub
            </button>
          </form>

          {isE2E && (
            <form
              action={async () => {
                "use server";
                await signIn("e2e", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                data-testid="e2e-login"
                className="w-full rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
              >
                Entrar como tester (solo CI)
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">Acceso exclusivo mediante OAuth 2.0</p>
        <p className="mt-2 text-center text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-slate-600">
            Privacidad
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-slate-600">
            Términos
          </Link>
        </p>
      </div>
    </main>
  );
}

const buttonClass =
  "flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-slate-900">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
