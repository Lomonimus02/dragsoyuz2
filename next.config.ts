import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Отключаем встроенный 308-редирект Next.js по trailing slash.
  // Всеми редиректами (301) управляет наш middleware.
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: process.cwd(),
  },
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
