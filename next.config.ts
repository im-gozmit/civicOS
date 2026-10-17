import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The dev server blocks unknown hosts by default. Quick tunnels (used so Meta and your phone can
  // reach localhost) get a random *.trycloudflare.com name, so allow that family in development.
  allowedDevOrigins: ["*.trycloudflare.com"],
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
