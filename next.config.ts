import type { NextConfig } from "next";

// Cache Components is intentionally disabled: the audit endpoints rely on
// `export const dynamic = "force-dynamic"` and the dashboard layout calls
// `await auth()` on every request, which is the classic dynamic rendering model.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
