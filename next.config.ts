import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home directory makes Next infer the wrong
  // workspace root. Pin Turbopack's root to this project directory.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
