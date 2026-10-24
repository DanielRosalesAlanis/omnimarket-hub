import { NextResponse } from "next/server";
import type { z } from "zod";
import { auth } from "@/auth";

/** JSON response that is never cached by browsers, proxies or the Vercel edge. */
export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(data, { ...init, headers });
}

export function badRequest(error: z.ZodError, message = "Solicitud inválida") {
  return json({ error: message, issues: error.issues }, { status: 400 });
}

export function notFound(message = "No encontrado") {
  return json({ error: message }, { status: 404 });
}

/** Returns a 401 response when there is no session, or null when the caller is authenticated. */
export async function requireSession() {
  const session = await auth();
  return session?.user ? null : json({ error: "No autenticado" }, { status: 401 });
}

/** Reads a JSON body, falling back to an empty object for empty or malformed payloads. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return (await req.json()) ?? {};
  } catch {
    return {};
  }
}

export function serverTiming(startedAt: number) {
  return `app;dur=${(performance.now() - startedAt).toFixed(1)}`;
}
