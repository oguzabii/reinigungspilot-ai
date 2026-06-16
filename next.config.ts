import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home directory makes Next infer the wrong
  // workspace root. Pin Turbopack's root to this project directory.
  turbopack: {
    root: process.cwd(),
  },
  // nodemailer is a Node-only SMTP library (net/tls). Keep it out of the
  // Server Components bundle and load it via native require at runtime. It is
  // imported only in server-only outreach code, never on the client.
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
