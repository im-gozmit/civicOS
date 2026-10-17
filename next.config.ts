import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The dev server blocks unknown hosts by default. Quick tunnels (used so Meta and your phone can
  // reach localhost) get a random *.trycloudflare.com name, so allow that family in development.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Loaded at runtime instead of being bundled (the local development database ships WebAssembly).
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  // The map used to be its own page; it now lives on the home page.
  async redirects() {
    return [{ source: "/map", destination: "/#map", permanent: true }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
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
