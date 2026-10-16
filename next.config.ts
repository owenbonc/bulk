import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Every file under public/images is already a resized JPEG, so serve it directly instead of
    // optimising on demand (which left blank frames on each navigation).
    unoptimized: true,
  },
  turbopack: {
    rules: {
      // There is no PostCSS config, so this loader is what compiles Tailwind in app/globals.css.
      // CSS modules are left to Turbopack's built-in CSS module handling.
      "*.css": {
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
