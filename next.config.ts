import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Always anchor Turbopack to this app folder (not a parent workspace lockfile).
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  outputFileTracingRoot: appRoot,
};

export default nextConfig;
