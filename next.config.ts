import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // next/image may only optimize our own files: the demo photos in public/images and uploads served by app/media.
  // `search: ""` rejects query strings, so nobody can request endless variants of these URLs.
  images: { localPatterns: [{ pathname: "/images/**", search: "" }, { pathname: "/media/**", search: "" }] },
  cacheComponents: true,
  partialPrefetching: true,
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
