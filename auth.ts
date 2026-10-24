import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";

const providers: Provider[] = [Google, GitHub];

/**
 * Session simulation for automated E2E runs. It is only registered when the
 * flag is set explicitly AND the code is not running as a Vercel production
 * deployment, so it can never be used against the public URL.
 */
export const isE2E =
  process.env.E2E_TEST_MODE === "true" && process.env.VERCEL_ENV !== "production";

if (isE2E) {
  providers.push(
    Credentials({
      id: "e2e",
      name: "E2E",
      credentials: {},
      authorize: async () => ({ id: "e2e-user", name: "Tester E2E", email: "e2e@omnimarket.test" }),
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
});
