import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fix monorepo lockfile detection — tell Next.js the root is this directory
  outputFileTracingRoot: path.join(import.meta.dirname, "./"),
};

export default nextConfig;
